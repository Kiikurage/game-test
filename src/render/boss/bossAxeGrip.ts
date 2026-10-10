/**
 * ボスの大斧の「握りの向き」（#225）。
 *
 * 斧は長柄（約 4.4m）で、判定の射程（4.5〜5.0m）に刃先が届くようにしてある。ただし UAL のクリップは剣の振りで、
 * 手から見た斧の向きが 1 つだと、振りによって刃が体の近くを通ったり、地面に潜ったりする。
 * そこで斧の向きを 2 つの握りの間（0 = 構え / 1 = 振り）で動作ごとに選び、実クリップに合わせる。
 *
 *   0（構え）: 待機・移動の向き。柄を肩に担ぎ、刃が頭の後ろ上に出る（装備のソケットの向き）。
 *   1（振り）: 剣のソケットと同じ向き。柄が前腕の延長に近く、剣の振りに沿って刃が前へ出る。
 *
 * 動作の前後で向きが跳ばないよう、`approachAxeGrip` で指数的に追従させる。
 */

/** 構え（待機・移動）。 */
export const AXE_GRIP_CARRY = 0;
/** 動作で表に指定がないときの握り（構えのまま）。 */
export const AXE_GRIP_DEFAULT = AXE_GRIP_CARRY;

/** 動作 ID（マーカー表。`boss.<段 ID>.p1|p2`）→ 握り（0..1）。表にない動作は `AXE_GRIP_DEFAULT`。 */
export const AXE_GRIP_BY_ACTION: Readonly<Record<string, number>> = {
  // 大上段（と同じクリップの盾打ち追撃・灰の波）: 構えのまま、頭上から前下へ振り下ろす。刃先は射程 4.2m の手前 0.3m
  'boss.overhead.1.p1': 0,
  'boss.overhead.1.p2': 0,
  'boss.shieldBash.2.p1': 0,
  'boss.ashWave.1.p2': 0,
  // 薙ぎ払い（射程 5.0m）
  'boss.sweep.1.p1': 0.4,
  'boss.sweep.1.p2': 0.4,
  'boss.sweep.2.p2': 0.75,
  // 三連撃（射程 5.0m）: 斬り上げ・斬り下ろし・突き
  'boss.combo3.1.p1': 0.15,
  'boss.combo3.1.p2': 0.15,
  'boss.combo3.2.p1': 0.7,
  'boss.combo3.2.p2': 0.7,
  'boss.combo3.3.p1': 0.3,
  'boss.combo3.3.p2': 0.3,
  // 盾打ち 1 段目は盾で打つ。斧は肩に構えたまま
  'boss.shieldBash.1.p1': 0,
  // 跳躍は斧を使わない。構えのまま
  'boss.leap.1.p1': 0,
  'boss.leap.1.p2': 0,
  // 回転斬り（半径 4.8m）
  'boss.spin.1.p2': 0.25,
  'boss.spin.2.p2': 0.75,
};

/** 動作 ID の握り。動作中でなければ（null）構え。 */
export function axeGripOf(actionId: string | null): number {
  if (actionId === null) return AXE_GRIP_CARRY;
  return AXE_GRIP_BY_ACTION[actionId] ?? AXE_GRIP_DEFAULT;
}

/** 握りの追従の速さ（1/秒）。約 0.08 秒で 63%。 */
const FOLLOW_RATE = 12;

/** `current` を `target` へ `dt` 秒ぶん近づける。 */
export function approachAxeGrip(current: number, target: number, dt: number): number {
  const k = 1 - Math.exp(-FOLLOW_RATE * Math.max(0, dt));
  return current + (target - current) * k;
}
