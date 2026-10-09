"""合成用の DSP 部品（numpy / scipy のみ）。全素材は 48kHz・float64 で扱い、書き出し時に 16bit にする。

乱数は素材 ID から決まるシードなので、再実行しても同じ波形になる。
"""

import zlib

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000


def rng_for(name: str) -> np.random.Generator:
    return np.random.default_rng(zlib.crc32(name.encode()))


def tt(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


# ---------- ノイズ・フィルタ ----------


def white(n: int, rng) -> np.ndarray:
    return rng.standard_normal(n)


def pink(n: int, rng) -> np.ndarray:
    x = rng.standard_normal(n)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, x) * 6


def brown(n: int, rng) -> np.ndarray:
    x = np.cumsum(rng.standard_normal(n))
    x -= np.linspace(x[0], x[-1], n)
    return x / (np.std(x) + 1e-12)


def _sos(kind, f, order):
    nyq = SR / 2
    if isinstance(f, (tuple, list)):
        f = [min(max(v, 5.0), nyq * 0.98) for v in f]
    else:
        f = min(max(f, 5.0), nyq * 0.98)
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def lp(x, f, order=2):
    return signal.sosfilt(_sos("low", f, order), x)


def hp(x, f, order=2):
    return signal.sosfilt(_sos("high", f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos("band", (lo, hi), order), x)


def svf_bandpass(x, f_curve, q):
    """時間変化する中心周波数のバンドパス（状態変数フィルタ）。f_curve は x と同じ長さ（Hz）。"""
    n = len(x)
    g = np.tan(np.pi * np.clip(f_curve, 20, SR * 0.45) / SR)
    k = 1.0 / q
    out = np.zeros(n)
    ic1 = ic2 = 0.0
    for i in range(n):
        gi = g[i]
        a1 = 1.0 / (1.0 + gi * (gi + k))
        a2 = gi * a1
        a3 = gi * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v1
    return out * k  # 通過帯域のゲインをおよそ 1 に


def resonator(x, f, bw):
    """2 次バンドパスで 1 つのフォルマント/共鳴を作る。"""
    lo = max(f - bw / 2, 20)
    hi = f + bw / 2
    return bp(x, lo, hi, 2)


# ---------- エンベロープ ----------


def env_exp(n_or_dur, attack=0.002, decay=0.1, curve=1.0):
    """立ち上がり attack 秒（線形）→ 指数減衰（時定数 decay 秒）。"""
    n = n_or_dur if isinstance(n_or_dur, (int, np.integer)) else int(round(n_or_dur * SR))
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    d = np.exp(-((np.clip(t - attack, 0, None) / decay) ** curve))
    return a * d


def env_hann(dur, peak_at=0.5, power=1.0):
    """山形（peak_at は 0〜1）。スイング音の振幅に使う。"""
    n = int(round(dur * SR))
    x = np.linspace(0, 1, n)
    w = np.where(x < peak_at, x / peak_at, (1 - x) / (1 - peak_at))
    return np.sin(np.clip(w, 0, 1) * np.pi / 2) ** (2 * power)


def fade(x, fin=0.002, fout=0.01):
    x = x.copy()
    ni = min(int(fin * SR), len(x) // 2)
    no = min(int(fout * SR), len(x) // 2)
    if ni:
        x[:ni] *= np.sin(np.linspace(0, np.pi / 2, ni)) ** 2
    if no:
        x[-no:] *= np.cos(np.linspace(0, np.pi / 2, no)) ** 2
    return x


# ---------- 物理モデル風の部品 ----------


def modal(freqs, amps, decays, dur, rng, detune=0.0):
    """減衰正弦の和。decays は各モードの時定数（秒）。金属・鐘・木の共鳴の基本。"""
    t = tt(dur)
    out = np.zeros_like(t)
    for f, a, d in zip(freqs, amps, decays):
        f2 = f * (1 + detune * rng.uniform(-1, 1))
        ph = rng.uniform(0, 2 * np.pi)
        out += a * np.sin(2 * np.pi * f2 * t + ph) * np.exp(-t / d)
    return out


# 自由-自由棒（剣身・金属板）の曲げモード比
BAR_RATIOS = np.array([1.0, 2.756, 5.404, 8.933, 13.344, 18.64])
# 教会鐘の部分音比（hum, prime, tierce, quint, nominal, ...）
BELL_RATIOS = np.array([0.5, 1.0, 1.183, 1.506, 2.0, 2.514, 2.662, 3.011, 4.166])


def metal_hit(f0, dur, rng, brightness=1.0, damp=1.0, ratios=BAR_RATIOS, tilt=0.8):
    """金属の打撃音: 非調和モード + 高域ほど速く減衰 + 接触の短いノイズ。"""
    freqs = f0 * ratios
    freqs = freqs[freqs < SR * 0.45]
    k = np.arange(len(freqs))
    amps = (1.0 / (1 + k) ** tilt) * (brightness**k)
    decays = 0.28 * damp / (1 + 0.55 * k) ** 1.1
    body = modal(freqs, amps, decays, dur, rng, detune=0.004)
    n = len(body)
    tick = hp(white(n, rng), 2500) * env_exp(n, 0.0004, 0.004)
    return body + 0.5 * tick * brightness


def bell(f0, dur, rng, decay=2.5, ratios=BELL_RATIOS, hi_decay=0.35):
    """鐘: 部分音ごとに減衰を変える（低い部分音ほど長く鳴る）。"""
    freqs = f0 * ratios
    amps = np.array([0.9, 1.0, 0.7, 0.55, 0.6, 0.35, 0.3, 0.25, 0.2][: len(freqs)])
    decays = decay * (1.0 / (1 + 0.55 * np.arange(len(freqs)))) + hi_decay * 0.1
    keep = freqs < SR * 0.45
    out = modal(freqs[keep], amps[keep], decays[keep], dur, rng, detune=0.0015)
    n = len(out)
    return out + 0.15 * bp(white(n, rng), 1500, 6000) * env_exp(n, 0.0005, 0.01)


def thump(f_start, f_end, dur, decay):
    """低域の打撃: 周波数が下がる正弦。"""
    t = tt(dur)
    f = f_end + (f_start - f_end) * np.exp(-t / (decay * 0.5))
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t / decay)


def swish(dur, f0, f1, rng, q=1.6, peak_at=0.55, power=1.0, body_lp=None):
    """風切り音: ノイズを中心周波数が掃引するバンドパスに通す。"""
    n = int(round(dur * SR))
    src = white(n, rng)
    x = np.linspace(0, 1, n)
    curve = f0 * (f1 / f0) ** (x**0.8)
    y = svf_bandpass(src, curve, q)
    y = y * env_hann(dur, peak_at, power)
    if body_lp:
        y += 0.5 * lp(src, body_lp) * env_hann(dur, peak_at, power * 1.5)
    return y


def crackle(dur, rate, rng, f=(1500, 6000), decay=0.004):
    """ポアソン的なパチパチ（焚き火・灰・砂利）。"""
    n = int(round(dur * SR))
    imp = np.zeros(n)
    count = rng.poisson(rate * dur)
    pos = rng.integers(0, n, size=count)
    imp[pos] = rng.uniform(0.2, 1.0, size=count) * rng.choice([-1, 1], size=count)
    k = np.arange(int(0.03 * SR)) / SR
    ker = np.exp(-k / decay)
    out = signal.fftconvolve(imp, ker)[:n]
    return bp(out, f[0], f[1])


def reverb(x, rt60, wet, rng, damp_hz=5000, predelay=0.012, tail=None):
    """指数減衰ノイズの IR によるコンボリューション・リバーブ。tail 秒だけ長さを延ばす。"""
    n_ir = int(rt60 * 1.1 * SR)
    t = np.arange(n_ir) / SR
    ir = white(n_ir, rng) * 10 ** (-3 * t / rt60)
    ir = lp(ir, damp_hz, 1)
    ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
    ir /= np.sqrt(np.sum(ir**2)) + 1e-12
    x = fade(x, 0.0, 0.06)  # 打ち切られた波形をそのまま畳み込むとクリックになる
    pad = int((tail if tail is not None else rt60) * SR)
    xp = np.concatenate([x, np.zeros(pad)])
    y = signal.fftconvolve(xp, ir)[: len(xp)]
    return xp * (1 - wet * 0.5) + y * wet


def glottal(f0_curve, rng, jitter=0.01, tilt_hz=1800):
    """声帯音源に近いのこぎり波（帯域制限）+ ジッター。f0_curve は Hz の配列。"""
    n = len(f0_curve)
    j = lp(white(n, rng), 8) * jitter * 6
    f = f0_curve * (1 + j)
    phase = np.cumsum(f) / SR
    out = np.zeros(n)
    kmax = int(min(SR * 0.45 / max(f0_curve.min(), 1), 120))
    for k in range(1, kmax + 1):
        mask = (f * k < SR * 0.45).astype(float)
        out += np.sin(2 * np.pi * k * phase) / k * mask
    return lp(out, tilt_hz, 1)


def formants(src, bank):
    """並列フォルマント: bank = [(周波数, 帯域幅, ゲイン), ...]"""
    out = np.zeros_like(src)
    for f, bw, g in bank:
        out += g * resonator(src, f, bw)
    return out


def soft_clip(x, drive=2.0):
    return np.tanh(x * drive) / np.tanh(drive)


def pitch_curve(dur, points):
    """[(時刻の割合 0〜1, Hz), ...] を対数領域で線形補間した周波数カーブ。"""
    n = int(round(dur * SR))
    xs = [p[0] for p in points]
    ys = np.log([p[1] for p in points])
    return np.exp(np.interp(np.linspace(0, 1, n), xs, ys))


def mix(*parts, length=None):
    """長さの違う波形を加算。parts は (波形, ゲイン, 開始秒) のタプル。"""
    items = [(w, g, int(round(s * SR))) for w, g, s in parts]
    n = length or max(o + len(w) for w, _, o in items)
    out = np.zeros(n)
    for w, g, o in items:
        m = min(len(w), n - o)
        if m > 0:
            out[o : o + m] += w[:m] * g
    return out


# ---------- 計測・書き出し ----------

_K_SHELF = (
    [1.53512485958697, -2.69169618940638, 1.19839281085285],
    [1.0, -1.69065929318241, 0.73248077421585],
)
_K_HP = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def k_weight(x):
    return signal.lfilter(*_K_HP, signal.lfilter(*_K_SHELF, x))


def _mono(x):
    return x if x.ndim == 1 else x.mean(axis=0)


def loudness_momentary_max(x, win=0.4, hop=0.1):
    """BS.1770 の K 重み付けによる最大モメンタリー・ラウドネス（LUFS）。短い SE 向け。
    400ms 未満の素材は全体を 1 窓として扱う（ゲーティングなし）。"""
    k = k_weight(_mono(x))
    w = int(win * SR)
    if len(k) <= w:
        ms = np.mean(k**2)
    else:
        sq = np.concatenate([[0], np.cumsum(k**2)])
        starts = np.arange(0, len(k) - w + 1, int(hop * SR))
        ms = np.max((sq[starts + w] - sq[starts]) / w)
    return float(-0.691 + 10 * np.log10(ms + 1e-12))


def loudness_integrated(x):
    """統合ラウドネス（絶対ゲート -70 と相対ゲート -10 を適用）。BGM・環境音向け。"""
    chans = [x] if x.ndim == 1 else list(x)
    w = int(0.4 * SR)
    hop = int(0.1 * SR)
    ks = [k_weight(c) for c in chans]
    n = len(ks[0])
    if n <= w:
        return float(-0.691 + 10 * np.log10(sum(np.mean(k**2) for k in ks) + 1e-12))
    sqs = [np.concatenate([[0], np.cumsum(k**2)]) for k in ks]
    starts = np.arange(0, n - w + 1, hop)
    blocks = sum((sq[starts + w] - sq[starts]) / w for sq in sqs)
    lk = -0.691 + 10 * np.log10(blocks + 1e-12)
    kept = blocks[lk > -70]
    if len(kept) == 0:
        return -70.0
    rel = -0.691 + 10 * np.log10(kept.mean()) - 10
    kept = kept[-0.691 + 10 * np.log10(kept) > rel]
    return float(-0.691 + 10 * np.log10(kept.mean() + 1e-12))


def edge_click_score(x, n=4):
    """先頭・末尾のサンプル値（ピーク比）。0 に近いほどクリックが出ない。"""
    xx = _mono(x)
    p = np.max(np.abs(xx)) + 1e-12
    return float(max(np.max(np.abs(xx[:n])), np.max(np.abs(xx[-n:]))) / p)


def click_score(x):
    """内部の不連続（クリック）の指標: 隣接サンプル差が局所 RMS（±20ms）の何倍か。
    ノイズ状の信号は 5 前後、本物のクリックは 15 以上になる。立ち上がり直後 10ms は除外。"""
    xx = _mono(x)
    d = np.abs(np.diff(xx))
    skip = int(0.01 * SR)
    d = d[skip:]
    if len(d) < 100:
        return 0.0
    w = int(0.02 * SR)
    sq = np.concatenate([[0], np.cumsum(d**2)])
    idx = np.arange(len(d))
    lo = np.clip(idx - w, 0, len(d))
    hi = np.clip(idx + w, 0, len(d))
    rms = np.sqrt((sq[hi] - sq[lo]) / np.maximum(hi - lo, 1))
    floor = 1e-3 * (np.max(np.abs(xx)) + 1e-12)  # 無音に近い所の比は無視
    return float(np.max(d / (rms + floor)))


def loopify(x, n, xf):
    """長さ n + xf の波形を、長さ n の継ぎ目なしループにする（末尾 xf を先頭へ等パワー・クロスフェード）。
    x は (n,) または (2, n)。ノイズ状（無相関）の素材向け。周期成分は呼び出し側で整数周期にしておく。"""
    ramp = np.linspace(0, np.pi / 2, xf)
    fin, fout = np.sin(ramp), np.cos(ramp)
    out = x[..., :n].copy()
    out[..., :xf] = x[..., :xf] * fin + x[..., n : n + xf] * fout
    return out


def slow_noise(n, rng, hz, floor=0.0):
    """ゆっくり変動する 0〜1 の制御信号（LFO 的な乱数）。"""
    s = lp(white(n, rng), hz, 2)
    s = (s - s.min()) / (s.max() - s.min() + 1e-12)
    return floor + (1 - floor) * s


def seam_score(x, width=0.05):
    """ループを 2 回つないだときの継ぎ目での隣接サンプル差が、通常の RMS の何倍か。小さいほど継ぎ目なし。"""
    xx = _mono(x)
    n = len(xx)
    w = int(width * SR)
    tiled = np.concatenate([xx, xx])
    d = np.abs(np.diff(tiled[n - w : n + w]))
    rms = np.sqrt(np.mean(np.diff(xx) ** 2)) + 1e-9
    return float(d.max() / rms)


def write_wav(path, x):
    """float → 16bit PCM。モノラルは 1 次元、ステレオは (2, n)。"""
    x = np.clip(x, -1.0, 1.0)
    data = x.T if x.ndim == 2 else x
    wavfile.write(path, SR, np.round(data * 32767).astype(np.int16))
