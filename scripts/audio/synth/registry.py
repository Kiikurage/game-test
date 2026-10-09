"""素材レジストリ。各モジュールが @sound で素材を登録し、build.py が一括で書き出す。"""

from dataclasses import dataclass
from typing import Callable

import numpy as np

from dsp import rng_for


@dataclass
class Sound:
    id: str
    kind: str  # se / ui / ambient / bgm
    priority: int
    fn: Callable[..., np.ndarray]
    group: str  # 出力サブディレクトリ名（assets-src/audio/<group>/）
    peak: float | None = None  # ピーク目標（省略時は kind の既定）
    lufs_offset: float = 0.0  # 種別の基準ラウドネスからのずらし（dB）
    loop: tuple[float, float] | None = None  # (loopStart, loopEnd) 秒。None はループなし
    bitrate: int | None = None
    license: str = "synth-game-test"
    clicks_ok: bool = False  # 打撃の発音やパチパチ音など、意図した鋭い立ち上がりを含む


REGISTRY: list[Sound] = []


def sound(
    id,
    kind,
    priority,
    group,
    peak=None,
    lufs_offset=0.0,
    loop=None,
    bitrate=None,
    license="synth-game-test",
    clicks_ok=False,
):
    def deco(fn):
        REGISTRY.append(
            Sound(id, kind, priority, fn, group, peak, lufs_offset, loop, bitrate, license, clicks_ok)
        )
        return fn

    return deco


def make(s: Sound) -> np.ndarray:
    return s.fn(rng_for(s.id))
