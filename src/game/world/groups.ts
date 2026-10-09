/**
 * 衝突グループ（Rapier の InteractionGroups: 上位 16 bit = 所属, 下位 16 bit = 相手のフィルタ）。
 * 地形・静的物 / ロックオン対象や敵 / プレイヤー / カメラ（問い合わせ専用）を分けて、
 * カメラの衝突判定がプレイヤー自身に当たらないようにする。
 */
export const GROUP = {
  world: 0x0001,
  target: 0x0002,
  player: 0x0004,
  camera: 0x0008,
} as const;

const ALL = 0xffff;

export function interactionGroups(membership: number, filter: number): number {
  return ((membership & ALL) << 16) | (filter & ALL);
}

/** 地形・静的物・ターゲットのコライダー用（誰とでも衝突し得る）。 */
export const WORLD_GROUPS = interactionGroups(GROUP.world, ALL);
export const TARGET_GROUPS = interactionGroups(GROUP.target, ALL);
/** プレイヤーのカプセル: 地形とターゲットにだけ当たる。 */
export const PLAYER_GROUPS = interactionGroups(GROUP.player, GROUP.world | GROUP.target);
/** カメラの球の問い合わせ: 地形とターゲットに当たる。プレイヤーは無視する。 */
export const CAMERA_QUERY_GROUPS = interactionGroups(GROUP.camera, GROUP.world | GROUP.target);
/** 視線（ロックオンの遮蔽判定）: 地形だけを遮蔽物とする。 */
export const SIGHT_QUERY_GROUPS = interactionGroups(GROUP.camera, GROUP.world);
