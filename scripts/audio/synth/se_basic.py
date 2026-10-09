"""#36: プレイヤー・ヒット・敵・UI の SE（すべて合成、モノラル）。

方針: 物理モデル風。金属は非調和モードの減衰正弦 + 接触ノイズ、打撃は周波数が落ちる低域 + ノイズ、
風切りは掃引バンドパスのノイズ、布は帯域ノイズ + ゆらぎ、うめきは声帯音源 + フォルマント。
"""

import numpy as np

from dsp import (
    SR,
    bell,
    bp,
    crackle,
    env_exp,
    env_hann,
    fade,
    formants,
    glottal,
    hp,
    lp,
    metal_hit,
    mix,
    modal,
    pink,
    pitch_curve,
    reverb,
    soft_clip,
    svf_bandpass,
    swish,
    thump,
    tt,
    white,
)
from registry import sound

G = "se"
GU = "ui"


def _noise_burst(rng, dur, lo, hi, decay, attack=0.0008):
    dur = max(dur, 5 * decay)
    n = int(dur * SR)
    return fade(bp(white(n, rng), lo, hi) * env_exp(n, attack, decay), 0.0, dur * 0.3)


def _pad(x, dur):
    out = np.zeros(int(dur * SR))
    out[: len(x)] = x[: len(out)]
    return out


# ============ プレイヤー ============


def _light_swing(rng, dur, f0, f1):
    return swish(dur, f0, f1, rng, q=3.2, peak_at=0.5, power=1.1, body_lp=500)


for _i, (_d, _f0, _f1) in enumerate([(0.26, 900, 3400), (0.24, 1100, 3800), (0.28, 800, 3000)], 1):

    def _mk(_d=_d, _f0=_f0, _f1=_f1):
        def fn(rng):
            return fade(_light_swing(rng, _d, _f0, _f1), 0.003, 0.03)

        return fn

    sound(f"sfx.player.sword-light{_i}", "se", 80, G)(_mk())

for _i, (_d, _f0, _f1) in enumerate([(0.46, 350, 1900), (0.5, 300, 1600)], 1):

    def _mk(_d=_d, _f0=_f0, _f1=_f1):
        def fn(rng):
            w = swish(_d, _f0, _f1, rng, q=2.4, peak_at=0.55, power=1.3, body_lp=400)
            low = lp(white(len(w), rng), 220) * env_hann(_d, 0.6, 1.5) * 0.8
            return fade(w + low, 0.004, 0.05)

        return fn

    sound(f"sfx.player.sword-heavy{_i}", "se", 80, G, lufs_offset=1.5)(_mk())


def _guard(rng, f0):
    metal = metal_hit(f0, 0.7, rng, brightness=0.82, damp=0.9)
    body = thump(190, 70, 0.14, 0.03) * 0.7  # 盾が受ける衝撃
    grit = _noise_burst(rng, 0.06, 1200, 7000, 0.012) * 0.6
    return fade(mix((metal, 1.0, 0), (body, 0.9, 0), (grit, 0.5, 0)), 0.0005, 0.08)


for _i, _f in enumerate([560, 650, 740], 1):

    def _mk(_f=_f):
        return lambda rng: _guard(rng, _f)

    sound(f"sfx.player.guard{_i}", "se", 90, G)(_mk())


@sound("sfx.player.guard-just", "se", 95, G, lufs_offset=1.0)
def _guard_just(rng):
    metal = metal_hit(1050, 1.2, rng, brightness=1.0, damp=1.8)
    # 澄んだ高域の余韻（ジャストの合図）。倍音ではなく非調和の高い部分音を長く
    shimmer = modal(
        [3150, 4720, 6380, 7900], [0.45, 0.35, 0.25, 0.18], [0.55, 0.45, 0.35, 0.28], 1.2, rng,
        detune=0.003,
    )
    shimmer *= np.clip(tt(1.2) / 0.004, 0, 1)
    body = thump(220, 80, 0.12, 0.025) * 0.6
    return fade(mix((metal, 1.0, 0), (shimmer, 0.7, 0), (body, 0.8, 0)), 0.0005, 0.15)


def _cloth(rng, dur, lo, hi, bursts):
    n = int(dur * SR)
    src = pink(n, rng)
    body = bp(src, lo, hi)
    # ゆらぎ（布のこすれの不規則な振幅変調）
    am = np.abs(lp(white(n, rng), 35)) * 6
    am = am / (am.max() + 1e-9)
    env = np.zeros(n)
    for c, w, a in bursts:
        x = (np.arange(n) / n - c) / w
        env += a * np.exp(-0.5 * x**2)
    return body * (0.35 + 0.65 * am) * env


@sound("sfx.player.roll1", "se", 60, G, lufs_offset=-1.5)
def _roll1(rng):
    c = _cloth(rng, 0.4, 500, 4500, [(0.25, 0.14, 1.0), (0.62, 0.1, 0.55)])
    land = thump(120, 62, 0.12, 0.03) * np.clip(tt(0.12) / 0.002, 0, 1)
    return fade(mix((c, 1.0, 0), (land, 0.18, 0.27)), 0.004, 0.05)


@sound("sfx.player.roll2", "se", 60, G, lufs_offset=-1.5)
def _roll2(rng):
    c = _cloth(rng, 0.44, 400, 3800, [(0.22, 0.12, 0.8), (0.5, 0.12, 1.0), (0.78, 0.08, 0.4)])
    land = thump(110, 58, 0.12, 0.03) * np.clip(tt(0.12) / 0.002, 0, 1)
    return fade(mix((c, 1.0, 0), (land, 0.16, 0.3)), 0.004, 0.05)


def _hurt(rng, f, dur):
    body = thump(f, 52, dur, 0.07)
    flesh = _noise_burst(rng, 0.1, 80, 1400, 0.035) * 1.1
    slice_ = swish(0.12, 3500, 7000, rng, q=1.2, peak_at=0.3) * 0.5
    tick = _noise_burst(rng, 0.03, 2500, 8000, 0.006) * 0.4
    return fade(mix((body, 0.9, 0.0), (flesh, 0.9, 0.0), (slice_, 0.7, 0.0), (tick, 0.7, 0.0)), 0.0008, 0.06)


sound("sfx.player.hurt1", "se", 92, G)(lambda rng: _hurt(rng, 150, 0.32))
sound("sfx.player.hurt2", "se", 92, G)(lambda rng: _hurt(rng, 125, 0.38))


@sound("sfx.player.heal-drink", "se", 70, G, lufs_offset=-2)
def _heal_drink(rng):
    n = int(1.0 * SR)
    out = np.zeros(n)
    # 液体の喉鳴り: 上昇する短い正弦（気泡）を不規則に重ねる
    for t0, f in [(0.08, 230), (0.31, 260), (0.52, 220), (0.76, 250)]:
        d = int(0.16 * SR)
        t = np.arange(d) / SR
        ff = f * (1 + 1.4 * (1 - np.exp(-t / 0.04)))
        ph = 2 * np.pi * np.cumsum(ff) / SR
        g = np.sin(ph) * np.sin(np.pi * t / t[-1]) ** 2
        s = int(t0 * SR)
        out[s : s + d] += g * 0.8
    for _ in range(18):
        d = int(rng.uniform(0.02, 0.05) * SR)
        t = np.arange(d) / SR
        f = rng.uniform(500, 1500)
        ff = f * (1 + 2.0 * t / t[-1])
        ph = 2 * np.pi * np.cumsum(ff) / SR
        s = int(rng.uniform(0.0, 0.9) * SR)
        out[s : s + d] += 0.18 * np.sin(ph) * np.sin(np.pi * t / t[-1])
    wet = lp(white(n, rng), 1200) * 0.08 * env_hann(1.0, 0.4)
    return fade(lp(out + wet, 3500, 1), 0.01, 0.1)


@sound("sfx.player.heal-glow", "se", 70, G, lufs_offset=-1)
def _heal_glow(rng):
    dur = 2.6
    t = tt(dur)
    out = np.zeros_like(t)
    for i, f in enumerate([880.0, 1174.7, 1318.5, 1760.0, 2349.3]):
        s = 0.07 * i
        tl = np.clip(t - s, 0, None)
        vib = 1 + 0.003 * np.sin(2 * np.pi * 5.5 * t + i)
        a = np.minimum(tl / 0.05, 1) * np.exp(-tl / (0.9 - 0.08 * i))
        out += (np.sin(2 * np.pi * f * vib * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * a * (0.7 ** i)
    out = reverb(out, 1.4, 0.4, rng, damp_hz=7000)
    return fade(out, 0.002, 0.2)


@sound("sfx.player.breathless", "se", 85, G, lufs_offset=-1)
def _breathless(rng):
    # 息切れ: 声ではなく空気の音。口の形（フォルマント）が 2 度開いて閉じる
    dur = 1.0
    n = int(dur * SR)
    src = white(n, rng)
    x = np.linspace(0, 1, n)
    voiced = formants(src, [(700, 250, 1.0), (1500, 400, 0.6), (3000, 800, 0.25)])
    env = env_hann(0.45, 0.35, 1.2)
    env2 = env_hann(0.5, 0.35, 1.2) * 0.8
    e = np.zeros(n)
    e[: len(env)] += env
    e[int(0.46 * SR) : int(0.46 * SR) + len(env2)] += env2
    rattle = lp(white(n, rng), 300) * np.abs(lp(white(n, rng), 30)) * 6
    return fade((voiced + 0.4 * rattle) * e, 0.02, 0.08)


# ============ ヒット ============


def _flesh(rng, f, dur, decay, body_lo, lufs=0.0):
    body = thump(f, f * 0.42, dur, decay)
    soft = _noise_burst(rng, 0.12, 60, body_lo, decay * 0.6)
    crack = _noise_burst(rng, 0.02, 800, 3200, 0.008) * 0.4
    return fade(mix((body, 1.0, 0), (soft, 1.0, 0), (crack, 1.0, 0)), 0.0006, 0.04)


sound("sfx.hit.flesh-light1", "se", 85, G)(lambda rng: _flesh(rng, 135, 0.22, 0.05, 1200))
sound("sfx.hit.flesh-light2", "se", 85, G)(lambda rng: _flesh(rng, 160, 0.2, 0.045, 1500))
sound("sfx.hit.flesh-heavy1", "se", 88, G, lufs_offset=2)(lambda rng: _flesh(rng, 100, 0.42, 0.11, 900))
sound("sfx.hit.flesh-heavy2", "se", 88, G, lufs_offset=2)(lambda rng: _flesh(rng, 88, 0.46, 0.13, 800))


def _armor(rng, f, ring, dur, thump_decay, damp):
    body = thump(f, f * 0.45, dur, thump_decay)
    clank = metal_hit(ring, dur, rng, brightness=0.55, damp=damp)
    tick = _noise_burst(rng, 0.03, 1800, 9000, 0.007)
    grit = crackle(dur, 30, rng, f=(2500, 7000), decay=0.003) * env_exp(int(dur * SR), 0.002, dur * 0.3)
    return fade(mix((body, 1.0, 0), (clank, 0.55, 0), (tick, 0.5, 0), (grit, 0.5, 0)), 0.0006, 0.06)


sound("sfx.hit.armor-light1", "se", 85, G)(lambda rng: _armor(rng, 180, 820, 0.36, 0.04, 0.3))
sound("sfx.hit.armor-light2", "se", 85, G)(lambda rng: _armor(rng, 200, 980, 0.34, 0.035, 0.28))
sound("sfx.hit.armor-heavy1", "se", 88, G, lufs_offset=2)(lambda rng: _armor(rng, 110, 480, 0.7, 0.09, 0.6))
sound("sfx.hit.armor-heavy2", "se", 88, G, lufs_offset=2)(lambda rng: _armor(rng, 95, 410, 0.75, 0.1, 0.65))


@sound("sfx.hit.defeat-collapse", "se", 80, G, lufs_offset=1)
def _defeat_collapse(rng):
    parts = [(thump(105, 38, 0.6, 0.16), 1.0, 0.0), (_noise_burst(rng, 0.3, 60, 900, 0.1), 0.7, 0.0)]
    # 鎧が崩れ落ちる: 大きさと間隔が減衰する金属片の打撃
    t = 0.04
    amp = 0.7
    while t < 1.0:
        f0 = rng.uniform(500, 1700)
        parts.append((metal_hit(f0, 0.3, rng, brightness=0.6, damp=0.3), amp, t))
        parts.append((thump(rng.uniform(100, 160), 55, 0.12, 0.03), amp * 0.7, t))
        t += rng.uniform(0.05, 0.16) * (1 + t * 1.6)
        amp *= 0.72
    return fade(mix(*parts, length=int(1.5 * SR)), 0.0006, 0.2)


@sound("sfx.hit.defeat-ash", "se", 80, G, lufs_offset=-1)
def _defeat_ash(rng):
    dur = 1.6
    n = int(dur * SR)
    puff = bp(pink(n, rng), 800, 7000) * env_exp(n, 0.03, 0.35)
    grains = crackle(dur, 140, rng, f=(2000, 8000), decay=0.003) * env_exp(n, 0.01, 0.6)
    low = thump(80, 40, 0.5, 0.12) * 0.6
    sh = lp(white(n, rng), 400) * env_exp(n, 0.05, 0.3) * 0.4
    return fade(mix((puff, 0.8, 0), (grains, 1.4, 0.03), (low, 0.8, 0), (sh, 1.0, 0)), 0.002, 0.25)


@sound("sfx.hit.guard-break", "se", 93, G, lufs_offset=2)
def _guard_break(rng):
    metal = metal_hit(330, 1.2, rng, brightness=1.1, damp=1.4)
    body = thump(170, 42, 0.5, 0.11) * 1.1
    shatter = crackle(0.7, 500, rng, f=(2500, 10000), decay=0.0025) * env_exp(int(0.7 * SR), 0.001, 0.2)
    crack = _noise_burst(rng, 0.08, 400, 6000, 0.02)
    return fade(mix((metal, 0.9, 0), (body, 1.0, 0), (shatter, 1.1, 0.01), (crack, 0.8, 0)), 0.0005, 0.2)


def _deflect(rng, f0):
    m = metal_hit(f0, 0.5, rng, brightness=0.95, damp=0.55)
    tick = _noise_burst(rng, 0.04, 3000, 11000, 0.006)
    body = thump(260, 110, 0.07, 0.015) * 0.4
    return fade(mix((m, 1.0, 0), (tick, 0.6, 0), (body, 1.0, 0)), 0.0004, 0.1)


sound("sfx.hit.shield-deflect1", "se", 90, G)(lambda rng: _deflect(rng, 1250))
sound("sfx.hit.shield-deflect2", "se", 90, G)(lambda rng: _deflect(rng, 1480))


# ============ 敵 ============


def _enemy_step(rng, base):
    # 革ブーツの接地 + 鎖帷子・小金具の擦れ
    land = thump(base, 70, 0.1, 0.022) * 0.7
    clinks = [
        (metal_hit(rng.uniform(2800, 4600), 0.12, rng, brightness=0.7, damp=0.12), rng.uniform(0.15, 0.3), s)
        for s in (0.0, 0.011, 0.024)
    ]
    scuff = _noise_burst(rng, 0.09, 1500, 6000, 0.03, 0.01) * 0.3
    return fade(mix((land, 1.0, 0), *clinks, (scuff, 1.0, 0.0), length=int(0.26 * SR)), 0.001, 0.05)


sound("sfx.enemy.step1", "se", 50, G, lufs_offset=-4)(lambda rng: _enemy_step(rng, 120))
sound("sfx.enemy.step2", "se", 50, G, lufs_offset=-4)(lambda rng: _enemy_step(rng, 105))


def _groan(rng, dur, f_pts, bank, drive, breath, reverb_wet=0.0):
    f0 = pitch_curve(dur, f_pts)
    src = glottal(f0, rng, jitter=0.02, tilt_hz=1500)
    n = len(src)
    # 母音の変化: 口が開いて閉じる（/o/ → /a/ → /o/）をフォルマント 1 の移動で表す
    voiced = formants(src, bank)
    air = formants(white(n, rng), [(f, bw * 1.5, g * 0.5) for f, bw, g in bank]) * breath
    e = env_hann(dur, 0.3, 0.9)
    x = soft_clip((voiced + air) * e * 3, drive)
    x = lp(x, 3500, 2)
    if reverb_wet:
        x = reverb(x, 0.5, reverb_wet, rng, tail=0.2)
    return fade(x, 0.02, 0.1)


@sound("sfx.enemy.notice", "se", 55, G, lufs_offset=0)
def _notice(rng):
    return _groan(
        rng, 1.2, [(0, 92), (0.25, 104), (0.7, 80), (1, 66)],
        [(430, 110, 1.0), (820, 130, 0.7), (2400, 300, 0.12)], 1.4, 0.5, 0.15,
    )


@sound("sfx.enemy.notice-minor", "se", 50, G, lufs_offset=-4)
def _notice_minor(rng):
    return _groan(
        rng, 0.55, [(0, 84), (0.5, 90), (1, 74)],
        [(400, 120, 1.0), (760, 140, 0.6), (2300, 300, 0.1)], 1.2, 0.6, 0.0,
    )


for _i, (_d, _f0, _f1) in enumerate([(0.34, 260, 1100), (0.38, 220, 950), (0.32, 300, 1250)], 1):

    def _mk(_d=_d, _f0=_f0, _f1=_f1):
        def fn(rng):
            w = swish(_d, _f0, _f1, rng, q=2.4, peak_at=0.5, power=1.2, body_lp=350)
            return fade(w, 0.004, 0.05)

        return fn

    sound(f"sfx.enemy.whoosh{_i}", "se", 50, G, lufs_offset=-1.5)(_mk())


@sound("sfx.enemy.shield-raise", "se", 50, G, lufs_offset=-1)
def _shield_raise(rng):
    scrape = swish(0.22, 500, 1800, rng, q=1.4, peak_at=0.7) * 0.6
    clank = metal_hit(760, 0.4, rng, brightness=0.6, damp=0.35)
    body = thump(150, 72, 0.14, 0.035)
    return fade(mix((scrape, 0.8, 0), (clank, 0.5, 0.2), (body, 0.9, 0.2), length=int(0.5 * SR)), 0.002, 0.08)


# ============ UI ============


def _note(freq, dur, rng, partials=(1.0, 2.0, 3.01), amps=(1.0, 0.35, 0.15), decay=0.25, attack=0.003):
    t = tt(dur)
    out = np.zeros_like(t)
    for k, (p, a) in enumerate(zip(partials, amps)):
        out += a * np.sin(2 * np.pi * freq * p * t + rng.uniform(0, 6.28)) * np.exp(-t / (decay / (1 + 0.8 * k)))
    return fade(out * np.clip(t / attack, 0, 1), 0.0, dur * 0.4)


@sound("ui.click", "ui", 80, GU, lufs_offset=-2)
def _ui_click(rng):
    n = int(0.09 * SR)
    wood = modal([1850, 3150, 4800], [1.0, 0.5, 0.25], [0.012, 0.008, 0.005], 0.09, rng, detune=0.002)
    tick = _noise_burst(rng, 0.09, 2000, 9000, 0.003) * 0.5
    return fade(wood + tick, 0.0003, 0.02)


@sound("ui.confirm", "ui", 80, GU)
def _ui_confirm(rng):
    a = _note(587.33, 0.7, rng, decay=0.28)
    b = _note(880.0, 0.7, rng, decay=0.34)
    return fade(mix((a, 0.8, 0), (b, 1.0, 0.075)), 0.001, 0.15)


@sound("ui.back", "ui", 80, GU, lufs_offset=-1)
def _ui_back(rng):
    a = _note(659.25, 0.5, rng, decay=0.16)
    b = _note(440.0, 0.5, rng, decay=0.22)
    return fade(mix((a, 0.8, 0), (b, 1.0, 0.06)), 0.001, 0.12)


@sound("ui.item-get", "ui", 80, GU)
def _ui_item(rng):
    notes = [(659.25, 0.0), (830.6, 0.085), (987.77, 0.17), (1318.5, 0.26)]
    parts = [(_note(f, 1.0, rng, decay=0.45), 0.8 ** i, s) for i, (f, s) in enumerate(notes)]
    x = mix(*parts, length=int(1.8 * SR))
    sh = hp(x, 3000)
    return fade(reverb(x + 0.4 * sh, 0.9, 0.3, rng, tail=0.3), 0.001, 0.25)


@sound("ui.bonfire-light", "ui", 85, GU, lufs_offset=-1, clicks_ok=True)
def _ui_bonfire_light(rng):
    dur = 2.4
    n = int(dur * SR)
    whoosh = svf_sweep(rng, 0.7, 180, 2600) * 1.0
    crack = fade(crackle(dur, 110, rng, f=(1200, 6500), decay=0.004) * env_exp(n, 0.1, 1.0), 0.0, 0.6)
    # 暖かい和音の膨らみ（D2 の基音と 5 度）
    t = tt(dur)
    swell = np.zeros(n)
    for f, a in [(73.4, 1.0), (110.0, 0.8), (146.8, 0.55), (220.0, 0.3)]:
        swell += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28))
    swell = fade(swell * np.minimum(t / 0.5, 1) * np.exp(-np.clip(t - 0.5, 0, None) / 1.1), 0.0, 0.8)
    return fade(mix((whoosh, 0.9, 0.0), (crack, 1.2, 0.2), (swell, 0.5, 0.0)), 0.003, 0.4)


def svf_sweep(rng, dur, f0, f1):
    n = int(dur * SR)
    x = np.linspace(0, 1, n)
    return svf_bandpass(pink(n, rng), f0 * (f1 / f0) ** x, 0.9) * env_hann(dur, 0.45, 1.0)


@sound("ui.bonfire-rest", "ui", 85, GU, lufs_offset=-2)
def _ui_bonfire_rest(rng):
    dur = 5.0
    t = tt(dur)
    pad = np.zeros_like(t)
    for f, a in [(146.8, 1.0), (220.0, 0.8), (293.7, 0.6), (349.2, 0.45), (440.0, 0.3)]:
        vib = 1 + 0.0015 * np.sin(2 * np.pi * 4.3 * t + rng.uniform(0, 6))
        pad += a * (np.sin(2 * np.pi * f * vib * t) + 0.25 * np.sin(4 * np.pi * f * t))
    pad = fade(pad * np.minimum(t / 0.9, 1) * np.exp(-np.clip(t - 0.9, 0, None) / 1.5), 0.0, 0.8)
    chime = _note(880.0, 2.0, rng, decay=0.9) * 0.18
    x = mix((pad, 0.3, 0), (chime, 1.0, 0.45))
    return fade(reverb(x, 1.6, 0.35, rng, damp_hz=4500, tail=0.4), 0.004, 0.4)


@sound("ui.died-bell", "ui", 90, GU, peak=0.7, lufs_offset=0)
def _ui_died_bell(rng):
    # 「倒れた」の鐘: 低く遠い鐘 1 打。ゆっくり減衰、深い残響
    b = bell(132.0, 7.0, rng, decay=3.4)
    x = reverb(b, 2.8, 0.35, rng, damp_hz=3500, tail=1.0)
    return fade(x, 0.001, 0.8)


@sound("ui.boss-bar", "ui", 85, GU, lufs_offset=0, clicks_ok=True)
def _ui_boss_bar(rng):
    dur = 2.0
    n = int(dur * SR)
    t = tt(dur)
    drone = lp(glottal(np.full(n, 55.0), rng, jitter=0.002, tilt_hz=600), 400) * np.minimum(t / 0.9, 1) ** 2
    drone = fade(drone, 0.0, 0.5)
    scrape = swish(0.9, 1500, 5200, rng, q=2.0, peak_at=0.95, power=0.8) * 0.5
    hit = metal_hit(196.0, 1.3, rng, brightness=0.7, damp=1.6) * 0.9
    body = thump(110, 36, 1.0, 0.25) * 1.3
    x = mix((drone, 0.5, 0), (scrape, 0.8, 0.05), (hit, 0.8, 0.9), (body, 1.0, 0.9))
    return fade(reverb(x, 1.2, 0.25, rng, tail=0.3), 0.01, 0.4)
