/**
 * 敵の経路問い合わせ。ナビゲーションメッシュ（#43）が入るまでは直線で向かう暫定実装。
 * 差し替えるときは `Navigator` を実装して `Game` のオプション（`enemyNavigator`）へ渡す。
 */
export interface NavPoint {
  x: number;
  z: number;
}

export interface Navigator {
  /**
   * `from` から `to` へ向かうとき、いま向かうべき次の点を `out` に書いて返す。
   * 経路がない（到達不能）ときは null。直線の実装は常に `to` を返す。
   */
  nextPoint(from: Readonly<NavPoint>, to: Readonly<NavPoint>, out: NavPoint): NavPoint | null;
}

/** 障害物を考慮せず `to` をそのまま次の点にする。 */
export const directNavigator: Navigator = {
  nextPoint(_from, to, out) {
    out.x = to.x;
    out.z = to.z;
    return out;
  },
};
