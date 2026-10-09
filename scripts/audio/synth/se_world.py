"""#37: 足音（4 素材 x 4）・環境音（6、ステレオ・ループ）・ボス SE（16）。すべて合成。

足音は材質ごとの共鳴（草: 葉擦れ、石: 板の共鳴 + かかとの打撃、木: 空洞の共鳴、地下: 石 + 反響）。
環境音は帯域分割ノイズのゆるい変調（風・火・灰）と、整数周期の正弦（霧の門のうなり）で作り、
ループ継ぎ目は等パワー・クロスフェード（ノイズ）または周期の整数化（正弦）で消す。
ボスは UBC の 2.2 倍拡大に合わせた低音の足音と、フォルマントを下げた咆哮。
"""

import numpy as np

from dsp import (
    SR,
    bell,
    bp,
    brown,
    crackle,
    env_exp,
    env_hann,
    fade,
    formants,
    glottal,
    hp,
    loopify,
    lp,
    metal_hit,
    mix,
    modal,
    pink,
    pitch_curve,
    reverb,
    slow_noise,
    soft_clip,
    swish,
    thump,
    tt,
    white,
)
from registry import sound

G = "se"
GA = "ambient"


def _nb(rng, dur, lo, hi, decay, attack=0.001):
    dur = max(dur, 5 * decay)
    n = int(dur * SR)
    return fade(bp(white(n, rng), lo, hi) * env_exp(n, attack, decay), 0.0, dur * 0.3)


# ============ 足音 ============


def _foot_grass(rng):
    j = rng.uniform(0.9, 1.15)
    rustle = bp(pink(int(0.3 * SR), rng), 300 * j, 4200 * j) * env_exp(int(0.3 * SR), 0.012, 0.055)
    blades = crackle(0.3, 90, rng, f=(2500, 9000), decay=0.002) * env_exp(int(0.3 * SR), 0.005, 0.07)
    land = thump(rng.uniform(95, 125), 52, 0.12, 0.03)
    return fade(mix((rustle, 0.9, 0), (blades, 1.0, 0.01), (land, 0.45, 0)), 0.002, 0.08)


def _foot_stone(rng):
    j = rng.uniform(0.9, 1.12)
    tick = _nb(rng, 0.03, 1500, 6500, 0.006, 0.0006)
    ring = modal([200 * j, 430 * j, 870 * j], [1.0, 0.45, 0.25], [0.06, 0.04, 0.025], 0.3, rng, detune=0.01)
    land = thump(rng.uniform(120, 150), 70, 0.1, 0.02)
    grit = crackle(0.2, 60, rng, f=(3000, 8000), decay=0.0015) * env_exp(int(0.2 * SR), 0.004, 0.04)
    return fade(mix((tick, 1.0, 0), (ring, 0.5, 0), (land, 0.6, 0), (grit, 0.5, 0.005)), 0.0006, 0.12)


def _foot_wood(rng):
    j = rng.uniform(0.92, 1.12)
    hollow = modal(
        [165 * j, 330 * j, 540 * j, 820 * j], [1.0, 0.75, 0.5, 0.3], [0.1, 0.07, 0.05, 0.03], 0.4, rng, detune=0.01
    )
    knock = _nb(rng, 0.04, 400, 2500, 0.01, 0.0008)
    land = thump(rng.uniform(100, 130), 60, 0.12, 0.03)
    return fade(mix((hollow, 0.55, 0), (knock, 0.9, 0), (land, 0.5, 0)), 0.0008, 0.15)


def _foot_crypt(rng):
    dry = _foot_stone(rng)
    return fade(reverb(dry, 1.7, 0.5, rng, damp_hz=3200, predelay=0.02, tail=1.6), 0.0006, 0.3)


for _mat, _fn, _off in [("grass", _foot_grass, -5), ("stone", _foot_stone, -4), ("wood", _foot_wood, -4.5), ("crypt", _foot_crypt, -5)]:
    for _v in range(1, 5):
        sound(f"sfx.footstep-{_mat}{_v}", "se", 30, G, lufs_offset=_off)(lambda rng, _fn=_fn: _fn(rng))


# ============ 環境音（ステレオ・ループ） ============


def _stereo(fn, rng_seed_fn):
    return np.stack([fn(0), fn(1)])


def _bands_mod(rng, n, bands, mod_hz, shared, floor=0.12, power=1.5):
    """帯域ごとに独立な緩い振幅変調をかけたノイズの和。"""
    out = np.zeros(n)
    for (lo, hi, amp), mh in zip(bands, mod_hz):
        m = slow_noise(n, rng, mh, floor) ** power
        m = 0.65 * shared + 0.35 * m
        out += amp * bp(pink(n, rng), lo, hi) * m
    return out


@sound("ambient.wind", "ambient", 10, GA, loop=(0.0, 24.0), bitrate=48)
def _wind(rng):
    n, xf = 24 * SR, 2 * SR
    tot = n + xf
    shared = slow_noise(tot, rng, 0.11, 0.2) ** 1.4
    chans = []
    for _ in range(2):
        w = _bands_mod(
            rng, tot, [(70, 280, 1.2), (280, 850, 1.0), (850, 2200, 0.55), (2200, 5200, 0.14)], [0.17, 0.2, 0.28, 0.35], shared
        )
        whistle = bp(white(tot, rng), 1250, 1480) * slow_noise(tot, rng, 0.07, 0.0) ** 3 * 0.9
        chans.append(loopify(hp(w + whistle, 25), n, xf))
    return np.stack(chans)


@sound("ambient.ash-leaves", "ambient", 10, GA, loop=(0.0, 20.0), bitrate=48, lufs_offset=-2)
def _ash_leaves(rng):
    n, xf = 20 * SR, 2 * SR
    tot = n + xf
    chans = []
    for _ in range(2):
        hiss = bp(pink(tot, rng), 2600, 9000) * slow_noise(tot, rng, 0.5, 0.04) ** 2.2
        rustle = crackle(tot / SR, 30, rng, f=(2200, 7500), decay=0.006) * slow_noise(tot, rng, 0.3, 0.1)
        body = bp(pink(tot, rng), 400, 1400) * slow_noise(tot, rng, 0.25, 0.0) ** 3 * 0.25
        chans.append(loopify(hp(hiss * 0.8 + rustle * 1.4 + body, 100), n, xf))
    return np.stack(chans)


@sound("ambient.bell-distant", "ambient", 10, GA, lufs_offset=3)
def _bell_distant(rng):
    # 遠い鐘: 高域が削れ、大きな空間で長く残る 1 打
    b = bell(174.6, 9.0, rng, decay=3.2)
    chans = []
    for _ in range(2):
        d = lp(b, 1700, 2)
        chans.append(fade(reverb(d, 4.0, 0.7, rng, damp_hz=2200, predelay=0.04, tail=2.0), 0.002, 1.5))
    return np.stack(chans)


@sound("ambient.fire", "ambient", 10, GA, loop=(0.0, 16.0), bitrate=48, lufs_offset=2, clicks_ok=True)
def _fire(rng):
    n, xf = 16 * SR, 2 * SR
    tot = n + xf
    roar = lp(brown(tot, rng), 420) * (0.45 + 0.55 * slow_noise(tot, rng, 0.6, 0.0))
    chans = []
    for _ in range(2):
        hiss = bp(pink(tot, rng), 1800, 7500) * 0.12 * slow_noise(tot, rng, 0.9, 0.2)
        cr = crackle(tot / SR, 16, rng, f=(900, 5500), decay=0.0035) * 0.7
        pops = crackle(tot / SR, 1.6, rng, f=(300, 2200), decay=0.012) * 0.8
        low = lp(white(tot, rng), 120) * 0.5
        chans.append(loopify(hp(roar * 1.6 + hiss + cr + pops + low, 30), n, xf))
    return np.stack(chans)


@sound("ambient.fog-gate", "ambient", 10, GA, loop=(0.0, 20.0), bitrate=64, lufs_offset=-1)
def _fog_gate(rng):
    # 霧の門のうなり: 周波数を 1/20Hz の格子に載せ、ループ長 20s で整数周期にする（継ぎ目なし）
    n = 20 * SR
    t = np.arange(n) / SR
    chans = []
    for ch in range(2):
        out = np.zeros(n)
        base = [(55.0, 1.0), (82.5, 0.7), (110.0, 0.8), (165.0, 0.45), (220.0, 0.3), (330.0, 0.14)]
        for f, a in base:
            for off in (-0.15, 0.0, 0.15 if ch == 0 else 0.25):
                ph = rng.uniform(0, 2 * np.pi)
                out += a * np.sin(2 * np.pi * (f + off) * t + ph)
        # 遅い呼吸（周期 10s / 5s の整数周期）
        lfo = 0.65 + 0.35 * np.sin(2 * np.pi * 0.1 * t + ch * 0.9) * np.sin(2 * np.pi * 0.05 * t + 0.4 + ch)
        out = out * lfo
        shimmer = np.zeros(n)
        for f in (1100.0, 1385.0, 1650.0):
            shimmer += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.15 + 0.05 * ch) * t))
        chans.append(out * 0.35 + shimmer * 0.012)
    noise = []
    tot = n + 2 * SR
    for _ in range(2):
        nz = bp(pink(tot, rng), 150, 650) * slow_noise(tot, rng, 0.2, 0.1)
        noise.append(loopify(nz, n, 2 * SR))
    return np.stack([chans[0] + 0.5 * noise[0], chans[1] + 0.5 * noise[1]])


@sound("ambient.crypt", "ambient", 10, GA, loop=(0.0, 24.0), bitrate=64, lufs_offset=-1)
def _crypt(rng):
    # 地下墓所の残響: 低い部屋鳴り + 長い残響の水滴。周期的に 3 連結してリバーブし、中央を切り出す（継ぎ目なし）
    n = 24 * SR
    xf = 2 * SR
    chans = []
    times = np.sort(rng.uniform(0.5, 23.5, 7))
    for ch in range(2):
        dry = np.zeros(n)
        for t0 in times:
            f = rng.uniform(1300, 2700)
            d = modal([f, f * 1.51, f * 2.3], [1.0, 0.4, 0.2], [0.03, 0.02, 0.012], 0.25, rng)
            s = int(t0 * SR)
            m = min(len(d), n - s)
            dry[s : s + m] += d[:m] * rng.uniform(0.5, 1.0) * 1.2
        tri = np.concatenate([dry, dry, dry])
        wet = reverb(tri, 4.5, 0.85, rng, damp_hz=2800, predelay=0.03, tail=1.0)[n : 2 * n]
        tot = n + xf
        bed = lp(brown(tot, rng), 260) * (0.5 + 0.5 * slow_noise(tot, rng, 0.15, 0.2)) * 0.45
        chans.append(wet + loopify(bed, n, xf))
    return np.stack(chans)


# ============ ボス SE ============

BOSS = dict(priority=70)


def _boss_step(rng, f):
    body = thump(f, f * 0.4, 0.9, 0.22)
    armor = metal_hit(rng.uniform(110, 200), 0.9, rng, brightness=0.5, damp=0.8) * 0.3
    dust = _nb(rng, 0.4, 60, 700, 0.1, 0.004)
    rattle = crackle(0.6, 40, rng, f=(1500, 6000), decay=0.004) * env_exp(int(0.6 * SR), 0.01, 0.15)
    x = mix((body, 1.0, 0), (armor, 0.7, 0), (dust, 0.9, 0), (rattle, 0.5, 0.01))
    return fade(reverb(x, 1.2, 0.25, rng, damp_hz=3000, tail=0.4), 0.002, 0.25)


for _i, _f in enumerate([66, 58, 52, 46], 1):
    sound(f"sfx.boss.step{_i}", "se", 70, G, lufs_offset=1)(lambda rng, _f=_f: _boss_step(rng, _f))


@sound("sfx.boss.roar", "se", 75, G, peak=0.99, lufs_offset=5)
def _boss_roar(rng):
    dur = 3.0
    n = int(dur * SR)
    t = tt(dur)
    f0 = pitch_curve(dur, [(0, 68), (0.12, 112), (0.45, 98), (0.8, 62), (1, 46)])
    src = glottal(f0, rng, jitter=0.035, tilt_hz=2600)
    bank = [(540, 150, 1.0), (930, 170, 0.8), (2100, 320, 0.3), (3300, 450, 0.15)]
    voiced = formants(src, bank)
    ph = 2 * np.pi * np.cumsum(f0 * 0.5) / SR
    sub = np.sin(ph) * 0.9
    growl = 0.55 + 0.45 * np.sin(2 * np.pi * 27 * t + 0.6 * np.sin(2 * np.pi * 3.1 * t))
    air = formants(white(n, rng), [(f, bw * 2, g * 0.35) for f, bw, g in bank])
    e = env_hann(dur, 0.3, 0.5) ** 0.6
    x = (voiced * growl + sub * 0.6 + air * 0.8) * e
    x = soft_clip(x * 2.2, 3.0)
    x = lp(x, 4200, 2)
    x = reverb(x, 1.8, 0.28, rng, damp_hz=3000, tail=0.6)
    return fade(x, 0.03, 0.4)


for _i, (_d, _f0, _f1) in enumerate([(0.75, 90, 760), (0.8, 80, 640), (0.7, 100, 880)], 1):

    def _mk(_d=_d, _f0=_f0, _f1=_f1):
        def fn(rng):
            w = swish(_d, _f0, _f1, rng, q=1.5, peak_at=0.62, power=1.4, body_lp=260)
            whump = lp(white(int(_d * SR), rng), 130) * env_hann(_d, 0.65, 1.8) * 1.4
            return fade(w + whump, 0.01, 0.12)

        return fn

    sound(f"sfx.boss.axe-swing{_i}", "se", 70, G, lufs_offset=1.5)(_mk())


def _slam(rng, f, ring):
    body = thump(f, 24, 1.4, 0.38) * 1.3
    crush = _nb(rng, 0.5, 50, 1200, 0.12, 0.001)
    clang = metal_hit(ring, 1.2, rng, brightness=0.55, damp=1.0) * 0.35
    debris = crackle(1.2, 110, rng, f=(800, 6000), decay=0.004) * env_exp(int(1.2 * SR), 0.01, 0.35)
    x = mix((body, 1.0, 0), (crush, 1.1, 0), (clang, 0.8, 0), (debris, 0.9, 0.02))
    return fade(reverb(x, 1.6, 0.3, rng, damp_hz=3200, tail=0.5), 0.0008, 0.3)


sound("sfx.boss.slam1", "se", 72, G, lufs_offset=3)(lambda rng: _slam(rng, 85, 120))
sound("sfx.boss.slam2", "se", 72, G, lufs_offset=3)(lambda rng: _slam(rng, 72, 95))


@sound("sfx.boss.ash-wave1", "se", 70, G, lufs_offset=1)
def _ash1(rng):
    # 地割れ: 低い裂ける音 + 岩の破片
    dur = 1.5
    n = int(dur * SR)
    tear = crackle(dur, 220, rng, f=(150, 3000), decay=0.006) * env_exp(n, 0.03, 0.5) * 2.5
    rumble = thump(62, 26, 1.2, 0.35) * 1.2
    grind = bp(pink(n, rng), 80, 700) * env_exp(n, 0.1, 0.45) * 0.9
    return fade(mix((tear, 1.0, 0), (rumble, 1.0, 0), (grind, 1.0, 0)), 0.002, 0.3)


@sound("sfx.boss.ash-wave2", "se", 70, G, lufs_offset=1)
def _ash2(rng):
    # 灰の棘が走る: 上昇する灰混じりの突風 + 粒
    dur = 0.95
    n = int(dur * SR)
    rush = swish(dur, 250, 2800, rng, q=0.8, peak_at=0.4, power=0.9, body_lp=500) * 1.2
    ash = bp(pink(n, rng), 2000, 9000) * env_exp(n, 0.04, 0.3) * 0.5
    grains = crackle(dur, 320, rng, f=(2500, 9000), decay=0.002) * env_exp(n, 0.02, 0.3)
    low = thump(75, 35, 0.6, 0.15) * 0.8
    return fade(mix((rush, 1.0, 0), (ash, 1.0, 0), (grains, 1.2, 0), (low, 1.0, 0)), 0.002, 0.25)


@sound("sfx.boss.ash-wave3", "se", 70, G, lufs_offset=-1)
def _ash3(rng):
    # 灰が降り積もる余韻
    dur = 2.2
    n = int(dur * SR)
    fall = bp(pink(n, rng), 900, 6500) * env_exp(n, 0.05, 0.7) * 0.8
    grains = crackle(dur, 90, rng, f=(2000, 8000), decay=0.003) * env_exp(n, 0.02, 0.8)
    low = lp(white(n, rng), 300) * env_exp(n, 0.05, 0.35) * 0.4
    return fade(mix((fall, 1.0, 0), (grains, 1.3, 0), (low, 1.0, 0)), 0.002, 0.5)


@sound("sfx.boss.enter", "se", 72, G, lufs_offset=0)
def _boss_enter(rng):
    # 入場: 兜を上げる金属の擦れ + 低いうなりの膨らみ + 鎧の重い一打
    dur = 3.2
    n = int(dur * SR)
    t = tt(dur)
    f0 = pitch_curve(dur, [(0, 49), (0.5, 52), (1, 49)])
    drone = lp(glottal(f0, rng, jitter=0.004, tilt_hz=700), 500) * np.minimum(t / 1.4, 1) ** 2
    drone = fade(drone, 0.0, 1.0)
    scrape = swish(0.9, 700, 2600, rng, q=2.4, peak_at=0.6, power=0.7) * 0.7
    hit = metal_hit(240, 1.4, rng, brightness=0.6, damp=1.6) * 0.7
    body = thump(95, 32, 1.0, 0.25) * 1.1
    x = mix((drone, 0.55, 0), (scrape, 0.8, 0.3), (hit, 0.8, 1.3), (body, 1.0, 1.3))
    return fade(reverb(x, 1.8, 0.35, rng, damp_hz=3200, tail=0.7), 0.01, 0.6)


@sound("sfx.boss.defeat", "se", 75, G, lufs_offset=2, clicks_ok=True)
def _boss_defeat(rng):
    parts = [(thump(72, 24, 1.8, 0.5) * 1.3, 1.0, 0.0), (_nb(rng, 0.8, 50, 900, 0.2, 0.002), 1.0, 0.0)]
    t, amp = 0.05, 0.9
    while t < 2.2:
        parts.append((metal_hit(rng.uniform(140, 700), 0.9, rng, brightness=0.45, damp=0.8), amp * 0.5, t))
        parts.append((thump(rng.uniform(60, 100), 30, 0.4, 0.1), amp * 0.9, t))
        t += rng.uniform(0.08, 0.2) * (1 + t * 1.4)
        amp *= 0.78
    n = int(3.0 * SR)
    puff = bp(pink(n, rng), 600, 5500) * env_exp(n, 0.1, 0.9) * 0.6
    parts.append((puff, 1.0, 0.1))
    parts.append((bell(88.0, 3.0, rng, decay=1.6) * 0.25, 1.0, 1.4))
    x = mix(*parts, length=int(4.0 * SR))
    return fade(reverb(x, 2.2, 0.4, rng, damp_hz=2800, tail=1.0), 0.002, 0.8)


@sound("sfx.boss.shield-bash", "se", 72, G, lufs_offset=2)
def _boss_shield_bash(rng):
    body = thump(110, 36, 0.7, 0.16) * 1.2
    clang = metal_hit(310, 1.0, rng, brightness=0.65, damp=1.1) * 0.6
    crack = _nb(rng, 0.05, 300, 3500, 0.012, 0.0008)
    x = mix((body, 1.0, 0), (clang, 0.8, 0), (crack, 0.9, 0))
    return fade(reverb(x, 1.0, 0.2, rng, tail=0.3), 0.0008, 0.25)
