"""#38: BGM（すべて合成、ステレオ）。暗く荘厳な弦・合唱風パッド、ボス戦は打楽器と低音のオスティナート。

素材: タイトル（60s ループ）/ ボス フェーズ 1（90s ループ）/ ボス フェーズ 2 レイヤー（同長・同テンポで同期）/
撃破（20s 非ループ）/ エンディング（60s 非ループ）。

テンポとループ長（同期の根拠）:
  title   48 BPM  4/4  12 小節 = 60.0 s
  boss    80 BPM  4/4  30 小節 = 90.0 s（フェーズ 1 とレイヤーは同じ 90.0 s・同じ小節構成。0 秒から同時に再生する）
  ending  60 BPM  4/4  15 小節 = 60.0 s

構成: 全パートを「小節・拍」で配置し、ループ曲はリバーブの尾を先頭へ折り返して（2 連結して中央を切り出す）継ぎ目をなくす。
"""

import numpy as np

from dsp import SR, bell, bp, fade, formants, hp, lp, metal_hit, pink, reverb, thump, white
from registry import sound
from scipy import signal

G = "bgm"


def hz(m):
    return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


class Track:
    """ステレオのミックスバス。ノートはドライとリバーブセンドへ分けて加算する。"""

    def __init__(self, seconds, loop):
        self.n = int(round(seconds * SR))
        self.loop = loop
        self.dry = np.zeros((2, self.n))
        self.send = np.zeros((2, self.n))

    def add(self, x, t, gain=1.0, pan=0.0, send=0.3):
        """x（モノラル）を t 秒に置く。ループ曲は末尾を越えた分を先頭へ折り返す。"""
        s = int(round(t * SR)) % self.n if self.loop else int(round(t * SR))
        if s < 0:  # 非ループで先頭より前に置いた分は捨てる
            x = x[-s:]
            s = 0
        gl = np.cos((pan + 1) * np.pi / 4) * gain
        gr = np.sin((pan + 1) * np.pi / 4) * gain
        m = len(x)
        pos = 0
        while pos < m:
            room = self.n - s
            if room <= 0:
                if not self.loop:
                    return
                s = 0
                room = self.n
            k = min(room, m - pos)
            seg = x[pos : pos + k]
            self.dry[0, s : s + k] += seg * gl
            self.dry[1, s : s + k] += seg * gr
            self.send[0, s : s + k] += seg * gl * send
            self.send[1, s : s + k] += seg * gr * send
            pos += k
            s += k
            if s >= self.n:
                if not self.loop:
                    return
                s = 0

    def render(self, rng, rt60=3.2, damp=3800, wet=1.0):
        """ドライ + リバーブ。ループは 2 連結して中央を取り、尾が先頭へ回り込む。"""
        out = self.dry.copy()
        for ch in range(2):
            n_ir = int(rt60 * 1.15 * SR)
            t = np.arange(n_ir) / SR
            ir = rng.standard_normal(n_ir) * 10 ** (-3 * t / rt60)
            ir = lp(ir, damp, 1)
            ir = np.concatenate([np.zeros(int(0.02 * SR)), ir])
            ir /= np.sqrt(np.sum(ir**2)) + 1e-12
            if self.loop:
                tri = np.concatenate([self.send[ch], self.send[ch], self.send[ch]])
                y = signal.fftconvolve(tri, ir)[self.n : 2 * self.n]
            else:
                y = signal.fftconvolve(self.send[ch], ir)[: self.n]
            out[ch] += y * wet
        return out


# ---------- 楽器 ----------


def _env(n, atk, rel, hold_to=None):
    e = np.ones(n)
    a = min(int(atk * SR), n // 2)
    r = min(int(rel * SR), n // 2)
    if a:
        e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        e[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def _saw(freq, n, rng, detunes=(-8, 0, 8), vib=0.0, vib_hz=5.0):
    t = np.arange(n) / SR
    out = np.zeros(n)
    for c in detunes:
        f = freq * 2 ** (c / 1200)
        v = 1 + vib * np.sin(2 * np.pi * vib_hz * t + rng.uniform(0, 6.28))
        ph = np.cumsum(f * v) / SR + rng.uniform(0, 1)
        out += 2 * (ph % 1) - 1
    return out / len(detunes)


def strings(midi, dur, rng, atk=0.7, rel=1.0, cutoff=2000, vib=0.0035):
    n = int((dur + rel) * SR)
    x = _saw(hz(midi), n, rng, (-9, -3, 3, 9), vib=vib)
    x = lp(x, cutoff, 2) * _env(n, atk, rel)
    return x


def brass(midi, dur, rng, atk=0.07, rel=0.35, cutoff=1500):
    n = int((dur + rel) * SR)
    x = _saw(hz(midi), n, rng, (-5, 0, 5))
    t = np.arange(n) / SR
    x = lp(x, cutoff, 2) * (0.6 + 0.4 * np.exp(-t / 0.25))
    return x * _env(n, atk, rel)


def choir(midis, dur, rng, vowel="a", atk=1.0, rel=1.4, breath=0.25):
    n = int((dur + rel) * SR)
    src = np.zeros(n)
    for m in midis:
        src += _saw(hz(m), n, rng, (-12, -4, 4, 12), vib=0.004, vib_hz=5.2)
    src /= max(len(midis), 1)
    banks = {
        "a": [(700, 110, 1.0), (1150, 130, 0.5), (2600, 220, 0.18)],
        "o": [(450, 90, 1.0), (800, 110, 0.5), (2500, 220, 0.1)],
        "u": [(330, 80, 1.0), (700, 100, 0.35), (2400, 220, 0.06)],
    }
    v = formants(src, banks[vowel])
    air = formants(white(n, rng), [(f, bw * 2, g * 0.6) for f, bw, g in banks[vowel]]) * breath
    return (v + air) * _env(n, atk, rel)


def pluck(midi, dur, rng, bright=1.0, decay=1.2):
    """ハープ / 撥弦: 倍音の減衰正弦 + 短い爪の音。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = float(hz(midi))
    out = np.zeros(n)
    for k in range(1, 9):
        if f * k > 9000:
            break
        out += (bright ** (k - 1) / k) * np.sin(2 * np.pi * f * k * t + rng.uniform(0, 6.28)) * np.exp(-t / (decay / (1 + 0.5 * (k - 1))))
    tick = bp(white(n, rng), 1500, 5000) * np.exp(-t / 0.004) * 0.2
    return fade(out + tick, 0.0008, min(0.2, dur * 0.4))


def bass_pluck(midi, dur, rng):
    n = int(dur * SR)
    x = _saw(hz(midi), n, rng, (-4, 4))
    t = np.arange(n) / SR
    x = lp(x, 380, 2) * np.exp(-t / (dur * 0.6)) + 0.5 * np.sin(2 * np.pi * float(hz(midi)) * t) * np.exp(-t / (dur * 0.8))
    return fade(x, 0.002, dur * 0.3)


def taiko(rng, f=64.0, dur=1.1):
    body = thump(f * 1.5, f * 0.55, dur, 0.28)
    skin = bp(white(int(dur * SR), rng), 120, 900) * np.exp(-np.arange(int(dur * SR)) / SR / 0.05) * 0.8
    return fade(body + skin, 0.001, 0.2)


def war_snare(rng, dur=0.18):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(white(n, rng), 900, 4200) * np.exp(-t / 0.035) + 0.5 * thump(220, 120, dur, 0.04)
    return fade(x, 0.0006, 0.05)


def riser(dur, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(white(n, rng), 500, 5000) * (t / dur) ** 2.2
    return fade(x, 0.01, 0.02)


def flute(midi, dur, rng):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = float(hz(midi))
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t) * np.minimum(t / 0.5, 1)
    ph = np.cumsum(f * vib) / SR
    x = np.sin(2 * np.pi * ph) + 0.18 * np.sin(4 * np.pi * ph) + 0.05 * np.sin(6 * np.pi * ph)
    x += 0.07 * bp(white(n, rng), f * 0.8, f * 3) * 3
    return x * _env(n, 0.12, 0.5)


# ---------- 和声 ----------

# (ルート MIDI, 構成音のルートからの半音) — 短 3 度ベースの暗い響き
CH = {
    "Dm": (38, [0, 7, 12, 15, 19]),
    "Bb": (34, [0, 7, 12, 16, 19]),
    "Gm": (43, [0, 7, 12, 15, 19]),
    "F": (41, [0, 7, 12, 16, 19]),
    "C": (36, [0, 7, 12, 16, 19]),
    "A": (45, [0, 7, 12, 16, 19]),  # 属和音（C#）
}


def chord_notes(name, lift=0):
    root, iv = CH[name]
    return [root + i + lift for i in iv]


def seam_tail(x, fade_s=0.0):
    return x


# ============ タイトル（48 BPM・12 小節・60s ループ） ============

TITLE_BEAT = 60 / 48


@sound("bgm.title", "bgm", 40, G, loop=(0.0, 60.0), bitrate=80)
def _title(rng):
    tr = Track(60.0, loop=True)
    bar = 4 * TITLE_BEAT
    chords = ["Dm", "Dm", "Bb", "Bb", "Gm", "Gm", "Dm", "Dm", "Bb", "C", "A", "A"]
    # 低いドローン（整数周期にして継ぎ目を作らない）
    for m, g in [(26, 0.55), (38, 0.3)]:
        f = round(float(hz(m)) * 60) / 60
        t = np.arange(60 * SR) / SR
        d = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
        tr.add(d, 0.0, gain=g * 0.4, send=0.15)
    for i, c in enumerate(chords):
        t0 = i * bar
        notes = chord_notes(c)
        for j, m in enumerate(notes[1:], 1):  # 弦: 5 度以上（ルートは低弦で別）
            tr.add(strings(m + (0 if m < 62 else 0), bar, rng, atk=1.4, rel=1.6, cutoff=1700), t0 - 0.4, gain=0.16, pan=(-0.5 + 0.25 * j))
        tr.add(strings(notes[0] + 12, bar, rng, atk=1.2, rel=1.4, cutoff=900), t0 - 0.2, gain=0.22, pan=0.0)
    for i0 in (2, 6, 10):  # 合唱（2 小節ごと、ほとんど息のように）
        c = chords[i0]
        tr.add(choir(chord_notes(c, 12)[1:4], 2 * bar - 1.0, rng, "o", atk=2.5, rel=2.5), i0 * bar - 0.5, gain=0.22, send=0.45)
    melody = [
        (0, 2, 69), (1, 0, 74), (1, 2.5, 77), (2, 1, 76), (2, 3, 74), (3, 0.5, 70),
        (4, 1, 70), (4, 3, 74), (5, 0, 72), (5, 2, 70), (5, 3.5, 67),
        (6, 1, 69), (7, 0, 74), (7, 2, 77), (7, 3, 81), (8, 2, 77), (9, 0, 76),
        (9, 2, 72), (10, 0, 73), (10, 2, 76), (11, 1, 74),
    ]
    for b, beat, m in melody:
        t = b * bar + beat * TITLE_BEAT
        tr.add(bell(float(hz(m)) * 0.5, 4.5, rng, decay=1.6) * 0.5, t, gain=0.07, pan=rng.uniform(-0.4, 0.4), send=0.7)
        tr.add(pluck(m, 3.5, rng, bright=0.7, decay=2.0), t, gain=0.12, pan=rng.uniform(-0.3, 0.3), send=0.6)
    return tr.render(rng, rt60=4.0, damp=3200)


# ============ ボス（80 BPM・30 小節・90s ループ + フェーズ 2 レイヤー） ============

BOSS_BEAT = 60 / 80
BOSS_BAR = 4 * BOSS_BEAT
BOSS_CHORDS = (
    ["Dm", "Dm", "Bb", "Bb", "Gm", "Gm", "A", "A"]
    + ["Dm", "Bb", "Gm", "A", "Dm", "Bb", "C", "A"]
    + ["Dm", "Dm", "F", "F", "Gm", "Gm", "A", "A"]
    + ["Bb", "Bb", "C", "C", "A", "A"]
)
assert len(BOSS_CHORDS) == 30


@sound("bgm.boss", "bgm", 45, G, loop=(0.0, 90.0), bitrate=80)
def _boss(rng):
    tr = Track(90.0, loop=True)
    for i, c in enumerate(BOSS_CHORDS):
        t0 = i * BOSS_BAR
        notes = chord_notes(c)
        root = notes[0]
        # 低音のオスティナート（8 分、2 拍目裏と 4 拍目裏にアクセント）
        pat = [0, 0, 12, 0, 0, 0, 7, 0]
        acc = [1.0, 0.6, 0.8, 0.6, 0.9, 0.6, 0.8, 0.6]
        for k in range(8):
            tr.add(bass_pluck(root + pat[k], BOSS_BEAT * 0.5, rng), t0 + k * BOSS_BEAT / 2, gain=0.55 * acc[k], send=0.12, pan=0.0)
        # 弦: 低めの和音の持続
        for j, m in enumerate(notes[1:4], 1):
            tr.add(strings(m, BOSS_BAR, rng, atk=0.5, rel=0.8, cutoff=1500), t0 - 0.2, gain=0.15, pan=-0.4 + 0.4 * j)
        # 太鼓: 1 拍目（強）、3 拍目（中）、4 拍目裏（弱）。4 小節ごとにフィル
        tr.add(taiko(rng, 62), t0, gain=0.9, send=0.3)
        tr.add(taiko(rng, 70), t0 + 2 * BOSS_BEAT, gain=0.55, send=0.3)
        tr.add(taiko(rng, 78, 0.6), t0 + 3.5 * BOSS_BEAT, gain=0.4, send=0.25)
        if i % 4 == 3:
            for k in range(4):
                tr.add(taiko(rng, 90 - 6 * k, 0.5), t0 + (3 + k / 4) * BOSS_BEAT, gain=0.45 + 0.1 * k, send=0.25)
        if i % 4 == 0:
            tr.add(metal_hit(98.0, 2.5, rng, brightness=0.55, damp=2.5) * 0.5, t0, gain=0.22, send=0.5)
    for i in range(0, 30, 2):  # 合唱（暗い /o/、フェーズ 1 では控えめ）
        c = BOSS_CHORDS[i]
        tr.add(choir(chord_notes(c, 0)[1:4], 2 * BOSS_BAR - 0.5, rng, "o", atk=1.2, rel=1.5), i * BOSS_BAR - 0.3, gain=0.16, send=0.4)
    return tr.render(rng, rt60=2.6, damp=3500)


@sound("bgm.boss-layer", "bgm", 46, G, loop=(0.0, 90.0), bitrate=80, lufs_offset=-3)
def _boss_layer(rng):
    tr = Track(90.0, loop=True)  # bgm.boss と同じ長さ・テンポ・小節構成。同時に 0 秒から再生して重ねる
    sixteenth = BOSS_BEAT / 4
    for i, c in enumerate(BOSS_CHORDS):
        t0 = i * BOSS_BAR
        notes = chord_notes(c)
        # 16 分の軍鼓（アクセントは拍頭と裏）
        for k in range(16):
            lvl = 0.55 if k % 4 == 0 else 0.4 if k % 2 == 0 else 0.22
            if k % 4 == 2:
                lvl *= 1.2
            tr.add(war_snare(rng), t0 + k * sixteenth, gain=lvl * 0.4, pan=-0.2 + 0.4 * (k % 2), send=0.2)
        # 高音域の弦スタッカート（コードトーンの上下行アルペジオ）
        arp = [notes[1], notes[2], notes[3], notes[2], notes[1], notes[3], notes[4], notes[3]]
        for k in range(8):
            m = arp[k] + 12
            n = int(BOSS_BEAT * 0.4 * SR)
            x = lp(_saw(hz(m), n, rng, (-6, 6)), 2600, 2) * np.exp(-np.arange(n) / SR / 0.12)
            tr.add(fade(x, 0.002, 0.05), t0 + k * BOSS_BEAT / 2, gain=0.22, pan=-0.6 + 0.2 * k % 1.2, send=0.25)
        # 金管のスタブ: 1 拍目と 3 拍目裏
        for off in (0.0, 2.5):
            for m in (notes[0] + 12, notes[1] + 12, notes[2] + 12):
                tr.add(brass(m, BOSS_BEAT * 0.8, rng), t0 + off * BOSS_BEAT, gain=0.2, pan=0.0, send=0.35)
        # 補強の低い太鼓の連打（4 小節ごとのフィルを倍密度にする）
        if i % 4 == 3:
            for k in range(8):
                tr.add(taiko(rng, 72 - 3 * k, 0.4), t0 + (2 + k / 4) * BOSS_BEAT, gain=0.4, send=0.2)
    for i in range(0, 30, 2):  # 合唱: 1 オクターブ上の /a/ で張り詰める
        c = BOSS_CHORDS[i]
        tr.add(choir(chord_notes(c, 12)[1:5], 2 * BOSS_BAR - 0.3, rng, "a", atk=0.8, rel=1.0), i * BOSS_BAR - 0.2, gain=0.26, send=0.45)
    for i in (7, 15, 23, 29):  # ライザー: 8 小節区切りの直前
        tr.add(riser(BOSS_BAR * 1.0, rng), i * BOSS_BAR, gain=0.1, send=0.3)
    return tr.render(rng, rt60=2.6, damp=3500)


# ============ 撃破（20s、非ループ） ============


@sound("bgm.victory", "bgm", 50, G, bitrate=80, clicks_ok=True)
def _victory(rng):
    tr = Track(20.0, loop=False)
    seq = [("Dm", 0.0, 7.5), ("Bb", 6.0, 7.5), ("Dm", 12.0, 8.0)]
    for c, t0, d in seq:
        notes = chord_notes(c, 12 if c == "Dm" else 0)
        for j, m in enumerate(notes[:4]):
            tr.add(strings(m, d, rng, atk=2.0, rel=2.5, cutoff=1600), t0, gain=0.18, pan=-0.45 + 0.3 * j)
    tr.add(choir([62, 69, 74], 14.0, rng, "a", atk=4.0, rel=5.0), 3.0, gain=0.26, send=0.5)
    for k, m in enumerate([50, 57]):  # 低い鐘の余韻
        tr.add(bell(float(hz(m)), 12.0, rng, decay=4.0) * 0.5, 0.2 + 5.8 * k, gain=0.12, send=0.6)
    out = tr.render(rng, rt60=4.5, damp=3000)
    return fade(out, 0.5, 4.0)


# ============ エンディング（60 BPM・15 小節・60s、非ループ） ============

END_BEAT = 1.0


@sound("bgm.ending", "bgm", 40, G, bitrate=80)
def _ending(rng):
    tr = Track(60.0, loop=False)
    bar = 4 * END_BEAT
    chords = ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A", "F", "C", "Dm", "Bb", "Gm", "A", "Dm"]
    assert len(chords) == 15
    for i, c in enumerate(chords):
        t0 = i * bar
        notes = chord_notes(c)
        for j, m in enumerate(notes[:4]):
            tr.add(strings(m + (12 if j == 0 else 0), bar, rng, atk=1.5, rel=1.8, cutoff=1700), t0 - 0.3, gain=0.14, pan=-0.4 + 0.27 * j)
        # ハープのアルペジオ（8 分）
        arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 12]
        for k in range(8):
            tr.add(pluck(arp[k] + 12 * (k % 2 == 1) * 0, 2.2, rng, bright=0.8, decay=1.4), t0 + k * END_BEAT / 2, gain=0.1, pan=-0.5 + 0.14 * k, send=0.5)
    melody = [
        (0, 0, 74, 3), (1, 0, 77, 2), (1, 2, 76, 2), (2, 0, 74, 3), (3, 0, 72, 2), (3, 2, 76, 2),
        (4, 0, 77, 3), (5, 0, 74, 2), (5, 2, 70, 2), (6, 0, 74, 3), (7, 0, 73, 2), (7, 2, 76, 2),
        (8, 0, 77, 3), (9, 0, 79, 2), (9, 2, 76, 2), (10, 0, 74, 3), (11, 0, 74, 2), (11, 2, 77, 2),
        (12, 0, 79, 3), (13, 0, 76, 2), (13, 2, 73, 2), (14, 0, 74, 8),
    ]
    for b, beat, m, ln in melody:
        tr.add(flute(m, ln * END_BEAT * 0.95, rng), b * bar + beat, gain=0.17, pan=0.15, send=0.55)
    out = tr.render(rng, rt60=3.8, damp=3400)
    return fade(out, 1.0, 6.0)
