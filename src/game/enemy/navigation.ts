/**
 * 敵の経路問い合わせ。実装は `GridNavigator`（`gridNavigator.ts`。レベルの地形から作る格子で A*）と、
 * 障害物を考慮せず直線で向かう `directNavigator`（ナビゲーションのないテストシーン・単体テスト用）。
 * 差し替えるときは `Navigator` を実装して `Game` のオプション（`enemyNavigator`）へ渡す。
 */
export interface NavPoint {
  x: number;
  z: number;
}

/** 経路を問い合わせる主体（敵）。ステート（経路・スタック検出）の持ち主を区別し、敵同士の分離にも使う。 */
export interface NavAgent {
  /** 足元の位置（実装が更新する参照）。 */
  readonly position: Readonly<NavPoint>;
  /** false なら（倒れている）分離の対象にしない。省略時は生きている扱い。 */
  readonly alive?: boolean;
  readonly id?: string;
}

export interface Navigator {
  /**
   * `from` から `to` へ向かうとき、いま向かうべき次の点を `out` に書いて返す。
   * 経路がない（到達不能）ときは null。直線の実装は常に `to` を返す。
   * `agent` を渡すと、その主体ごとに経路を保持する（経路の再利用・スタック検出・他の敵との分離）。
   */
  nextPoint(
    from: Readonly<NavPoint>,
    to: Readonly<NavPoint>,
    out: NavPoint,
    agent?: NavAgent,
  ): NavPoint | null;

  /** 毎ステップ 1 回、敵の更新の前に呼ばれる。経路探索を複数ステップに分けて進める。 */
  update?(): void;

  /** 門（`Game.setBoxEnabled` の id）が閉じた / 開いたとき。経路が通れるかが変わる。 */
  setGateClosed?(id: string, closed: boolean): void;
}

/** 障害物を考慮せず `to` をそのまま次の点にする。 */
export const directNavigator: Navigator = {
  nextPoint(_from, to, out) {
    out.x = to.x;
    out.z = to.z;
    return out;
  },
};
