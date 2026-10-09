"""合成素材の生成: 波形合成 → ラウドネス/ピーク正規化 → 品質検査 → WAV 書き出し → audio.json 更新。

使い方（リポジトリルートから）:
  npm run assets:audio:synth                  全素材を再生成して assets-src/audio/ と audio.json を更新
  npm run assets:audio:synth -- --report DIR  加えてスペクトログラム画像と品質表（DIR/）を出力
  npm run assets:audio:synth -- --only PREFIX 指定 ID 接頭辞だけ生成（audio.json は触らない）

依存: python3 + numpy + scipy（スペクトログラムは matplotlib）。`pip install -r scripts/audio/synth/requirements.txt`
出力は決定的（素材 ID から乱数シードを決める）。生成物の WAV はコミットする（ffmpeg で Opus 化するのは assets:audio）。
"""

import argparse
import importlib
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))

from dsp import (  # noqa: E402
    SR,
    edge_click_score,
    loudness_integrated,
    loudness_momentary_max,
    click_score,
    seam_score,
    write_wav,
)
from registry import REGISTRY, make  # noqa: E402

MODULES = ["se_basic", "se_world", "music"]
ROOT = Path(__file__).resolve().parents[3]
AUDIO_DIR = ROOT / "assets-src" / "audio"
CONFIG = AUDIO_DIR / "audio.json"

# kind ごとの既定: (ピーク上限, 基準ラウドネス LUFS)。ピーク値は仕様書 10.2 節の目安。
# ラウドネスは SE・UI は最大モメンタリー、環境音・BGM は統合ラウドネスで測る。
KIND_TARGET = {
    "se": (0.8, -16.0),
    "ui": (0.7, -18.0),
    "ambient": (0.4, -27.0),
    "bgm": (0.6, -23.0),
}


def load_modules():
    for m in MODULES:
        try:
            importlib.import_module(m)
        except ModuleNotFoundError as e:
            if e.name != m:
                raise


def measure(kind, x):
    return loudness_integrated(x) if kind in ("bgm", "ambient") else loudness_momentary_max(x)


def normalize(s, x):
    peak_t, lufs_t = KIND_TARGET[s.kind]
    if s.peak is not None:
        peak_t = s.peak
    if s.loop is None:
        x = x - np.mean(x, axis=-1, keepdims=True)  # DC 除去
        n_in = int(0.001 * SR)  # 1ms の立ち上がりフェード（クリック防止）
        ramp = np.sin(np.linspace(0, np.pi / 2, n_in)) ** 2
        x = x.copy()
        x[..., :n_in] *= ramp
        x[..., -n_in:] *= ramp[::-1]
    cur = measure(s.kind, x)
    g_l = 10 ** ((lufs_t + s.lufs_offset - cur) / 20)
    g_p = peak_t / (np.max(np.abs(x)) + 1e-12)
    g = min(g_l, g_p)
    return x * g, ("peak" if g_p < g_l else "lufs")


def qc(s, x):
    problems = []
    if np.max(np.abs(x)) >= 0.999:
        problems.append("クリップ")
    if s.loop is None:
        e = edge_click_score(x)
        if e > 0.01:
            problems.append(f"端が 0 でない({e:.3f})")
    if s.loop is not None:
        ss = seam_score(x)
        if ss > 6:
            problems.append(f"ループの継ぎ目が目立つ(seam {ss:.1f})")
    cs = click_score(x)
    if cs > 14 and not s.clicks_ok:
        problems.append(f"不連続の疑い(click {cs:.1f})")
    if not np.all(np.isfinite(x)):
        problems.append("NaN/inf")
    return problems


# ループ素材は Opus のコーデック立ち上がり・終端の誤差がループ継ぎ目に乗らないよう、
# ループ区間の前に 1 秒（ループ末尾のコピー）、後ろに 0.5 秒（ループ先頭のコピー）を付けて書き出し、
# loopStart / loopEnd をその分だけずらす。ループ区間そのものは継ぎ目なしの波形。
LOOP_LEAD = 1.0
LOOP_TRAIL = 0.5


def with_loop_padding(s, x):
    if s.loop is None:
        return x
    assert s.loop[0] == 0 and abs(s.loop[1] - x.shape[-1] / SR) < 1e-6, f"{s.id}: loop は全長（0, 長さ）で指定する"
    lead, trail = int(LOOP_LEAD * SR), int(LOOP_TRAIL * SR)
    return np.concatenate([x[..., -lead:], x, x[..., :trail]], axis=-1)


def update_config(sounds):
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    managed = {s.id for s in sounds}
    kept = [e for e in cfg["sounds"] if e["id"] not in managed and e.get("license") != "synth-game-test"]
    new = []
    for s in sounds:
        e = {"id": s.id, "source": f"{s.group}/{s.id}.wav", "kind": s.kind}
        if s.loop:
            e.update(loop=True, loopStart=round(LOOP_LEAD + s.loop[0], 4), loopEnd=round(LOOP_LEAD + s.loop[1], 4))
        e["priority"] = s.priority
        if s.bitrate:
            e["bitrateKbps"] = s.bitrate
        e["license"] = s.license
        new.append(e)
    cfg["sounds"] = kept + new
    CONFIG.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def report_images(rows, outdir):
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    outdir.mkdir(parents=True, exist_ok=True)
    groups = {}
    for r in rows:
        groups.setdefault(r["prefix"], []).append(r)
    for prefix, items in groups.items():
        cols = 4
        for page in range(0, len(items), 16):
            chunk = items[page : page + 16]
            nrows = (len(chunk) + cols - 1) // cols
            fig, axes = plt.subplots(nrows, cols, figsize=(cols * 4.2, nrows * 2.4), squeeze=False)
            for ax in axes.ravel():
                ax.axis("off")
            for ax, r in zip(axes.ravel(), chunk):
                ax.axis("on")
                x = r["wave"] if r["wave"].ndim == 1 else r["wave"].mean(axis=0)
                ax.specgram(x, NFFT=1024, Fs=SR, noverlap=768, cmap="magma", vmin=-120, vmax=-40)
                ax.set_ylim(0, 12000)
                ax.set_title(r["id"].split(".", 1)[-1] + f"  {r['lufs']:.0f}LU", fontsize=7)
                ax.tick_params(labelsize=5)
            fig.tight_layout()
            fig.savefig(outdir / f"spec-{prefix}-{page // 16}.png", dpi=110)
            plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", type=Path)
    ap.add_argument("--only", default="")
    args = ap.parse_args()

    load_modules()
    sounds = [s for s in REGISTRY if s.id.startswith(args.only)]
    ids = [s.id for s in REGISTRY]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        sys.exit(f"error: ID が重複: {sorted(dup)}")

    rows, failed = [], False
    for s in sounds:
        x = make(s)
        x, limited = normalize(s, x)
        problems = qc(s, x)
        out = AUDIO_DIR / s.group
        out.mkdir(parents=True, exist_ok=True)
        write_wav(out / f"{s.id}.wav", with_loop_padding(s, x))
        lufs = measure(s.kind, x)
        rows.append(
            dict(
                id=s.id,
                kind=s.kind,
                prefix=("boss" if s.id.startswith("sfx.boss") else "enemy" if s.id.startswith("sfx.enemy") else "foot" if s.id.startswith("sfx.footstep") else s.group),
                dur=x.shape[-1] / SR,
                peak=float(np.max(np.abs(x))),
                lufs=lufs,
                limited=limited,
                problems=problems,
                wave=x,
            )
        )
        flag = "  !! " + ", ".join(problems) if problems else ""
        failed |= bool(problems)
        print(f"{s.id:34s} {x.shape[-1] / SR:5.2f}s peak {np.max(np.abs(x)):.2f} {lufs:6.1f} LU ({limited}){flag}")

    if not args.only:
        update_config(sounds)
    if args.report:
        report_images(rows, args.report)
    if failed:
        sys.exit("error: 品質検査に失敗した素材がある")


if __name__ == "__main__":
    main()
