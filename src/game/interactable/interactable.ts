// データ駆動のインタラクト（#122 / #123）。`Interactable`（データ）を、インタラクション基盤（#55）の対象として登録し、
// 状況ボタンの入力で `Effect` を実行する。
//
// - read: 立ち止まらずに実行。文（テキストパネル。最長 6 秒・2m 移動で閉じる）を出し、`read.<id>` をセーブする。
// - loot: `LOOT.frames` フレームかがむ（`interact` 状態。この間は無防備）。`LOOT.effectFrame` で効果（取得・文）が出る。
//   途中で被弾して動作が中断されたら出ない。終わると `loot.<id>` をセーブし、非表示になる。
// - bell / pray / push: loot と同じ動作の枠（`actionF` フレーム・`effectF` で効果）。鐘は F20 で `emitSound`（15m）、
//   30 秒のクールダウン。祈りは 180F かけて環境音を −6dB。鉄格子は開けたまま `world.grateDOpen` をセーブしてコライダを外す。
// - talk: 会話（`dialogue` Effect）。最後の行まで読み切ると `onEnd`（大剣・騎士の死）。動いて閉じたら何も起きない。
// - breakable: 状況ボタンなし。プレイヤーの攻撃だけで削れ（HP は配置データ）、壊れると 60F の崩壊 → コライダを外す。
//   壊れた印（`world.wallG1Broken`）はセーブし、再開後は最初から壊れている。
// - floorHatch: 状況ボタンなし。`radiusM` 以内で軋み（1 回）、板の上に乗る（接触）と割れる。セーブなし。
// - giveItem: 所持数をセーブし、`ITEM_DEFS` の効果を適用して `itemPicked` を発行する（アイテム取得 #67 と同じ経路）。
import { Health, vec3, type HitEvent, type HitTarget } from '../combat';
import { ITEM, ITEM_DEFS } from '../data/items';
import { INTERACT_VERBS, lookupText } from '../data/texts';
import { IMPLEMENTED_KINDS } from '../data/world/interactables';
import { BREAKABLE, FLOOR_HATCH, LOOT, PRAY } from '../data/world/lootTuning';
import type { Effect, Interactable } from '../data/world/types';
import type { Game } from '../game';
import { interactionOf } from '../interaction/interaction';
import { yawOf } from '../player/movement';
import { textPanelOf } from '../text/textPanel.system';
import { doneFlag, InteractableRunner, type EffectHost } from './effects';
import './worldEvents';

/** セーブのフラグを引く。`boss.<id>` は撃破済みのボス（セーブの `bosses`）。 */
export function hasFlagIn(game: Game, flag: string): boolean {
  if (game.save.hasFlag(flag)) return true;
  return flag.startsWith('boss.') && game.save.get().bosses.includes(flag.slice('boss.'.length));
}

/** 文面データの 1 行（なければ ID）。 */
function textOf(id: string): string {
  const t = lookupText(id);
  return typeof t === 'string' ? t : (t?.join('') ?? id);
}

/** 壊せる壁 1 枚。HP は自前で数える（`Health` は壊れないよう大きくし、命中の `baseDamage` に倍率を掛けて引く）。 */
interface Wall {
  readonly def: Interactable;
  readonly target: HitTarget;
  hp: number;
  /** 崩れ始めた（壊れた）。 */
  broken: boolean;
  /** 崩壊の演出の残り（F）。0 になったらコライダを外す。 */
  collapseLeft: number;
}

interface Hatch {
  readonly def: Interactable;
  broken: boolean;
  /** 軋む SE を鳴らした（半径の外へ出たら再び鳴る）。 */
  creaked: boolean;
}

/** 状況アクションの動作（かがむ・鐘・祈り・押す）。 */
interface Action {
  readonly def: Interactable;
  readonly effectFrame: number;
}

/** 状態を表すフラグ（壊れた・開いた）。最初の `setFlag` Effect のフラグ。なければ `done.<id>`。 */
function stateFlagOf(def: Interactable): string {
  const set = def.effects.find(
    (e): e is Extract<Effect, { type: 'setFlag' }> => e.type === 'setFlag',
  );
  return set?.flag ?? doneFlag(def.id);
}

export class InteractableController {
  private readonly defs = new Map<string, Interactable>();
  private readonly offs = new Map<string, () => void>();
  private readonly runner: InteractableRunner;
  /** 動作中の対象（調べる・鐘・祈り・押す）。 */
  private action: Action | null = null;
  private readonly walls = new Map<string, Wall>();
  private readonly hatches = new Map<string, Hatch>();
  /** 進行中の会話。読み切ったら `onEnd`、動いて閉じたら捨てる。 */
  private dialogue: { readonly onEnd: () => void; readonly completions: number } | null = null;

  constructor(private readonly game: Game) {
    this.runner = new InteractableRunner(this.host());
    // 持っているアイテムの効果を復元する（回復瓶の最大数など）
    for (const def of Object.values(ITEM_DEFS)) {
      if (def.effect && game.save.getCount(def.id) >= 1) this.applyItemEffect(def.id);
    }
    // 床板が割れた（ほかの経路でも）。割れた板は軋まない・割れ直さない
    game.events.on('floorHatchBroken', (e) => {
      const hatch = this.hatches.get(e.id);
      if (hatch) hatch.broken = true;
    });
  }

  /** 登録した対象の ID。 */
  get ids(): readonly string[] {
    return [...this.defs.keys()];
  }

  /** まだ使える（取得済みでない・条件を満たす・壊れていない）対象の ID。 */
  get usableIds(): readonly string[] {
    return [...this.defs.values()].filter((d) => this.isOffered(d)).map((d) => d.id);
  }

  get isLooting(): boolean {
    return this.action !== null;
  }

  /** 壊せる壁の残り HP（壊れていれば 0。登録がなければ undefined）。 */
  wallHp(id: string): number | undefined {
    const wall = this.walls.get(id);
    return wall && (wall.broken ? 0 : wall.hp);
  }

  /** 壊せる壁が崩れ始めたか（登録がなければ false）。 */
  isWallBroken(id: string): boolean {
    return this.walls.get(id)?.broken ?? false;
  }

  /** 床板が割れたか。 */
  isHatchBroken(id: string): boolean {
    return this.hatches.get(id)?.broken ?? false;
  }

  /** 対象を登録する（実動作のある種別だけ）。戻り値は登録解除。 */
  add(def: Interactable): () => void {
    if (!IMPLEMENTED_KINDS.has(def.kind)) {
      throw new Error(`interactable "${def.id}": kind ${def.kind} has no implementation yet`);
    }
    this.defs.set(def.id, def);
    let off: () => void;
    if (def.kind === 'breakable') off = this.addWall(def);
    else if (def.kind === 'floorHatch') off = this.addHatch(def);
    else off = this.addButton(def);
    const release = () => {
      off();
      this.defs.delete(def.id);
      this.offs.delete(def.id);
    };
    this.offs.set(def.id, release);
    return release;
  }

  /** 状況ボタンで使う対象。 */
  private addButton(def: Interactable): () => void {
    if (def.prompt === null) {
      throw new Error(`interactable "${def.id}": kind ${def.kind} needs a prompt`);
    }
    const verb = def.prompt;
    // 開けたまま（push）は、再開後も最初から開いている
    if (def.kind === 'push' && this.game.save.hasFlag(stateFlagOf(def))) this.applyOpened(def);
    return interactionOf(this.game).register({
      id: def.id,
      kind: def.kind,
      x: def.x,
      z: def.z,
      ...(def.radiusM !== undefined ? { radius: def.radiusM } : {}),
      label: () => INTERACT_VERBS[verb],
      available: () => this.isOffered(def),
      interact: () => {
        if (def.kind === 'read' || def.kind === 'talk') this.runner.fire(def);
        else this.beginAction(def);
      },
    });
  }

  /** 状況ボタンの候補にしてよいか。実行済みの `once`（loot 以外）も候補から外す。 */
  private isOffered(def: Interactable): boolean {
    if (def.kind === 'breakable') return !(this.walls.get(def.id)?.broken ?? true);
    if (def.kind === 'floorHatch') return !(this.hatches.get(def.id)?.broken ?? true);
    if (!this.runner.isUsable(def)) return false;
    return !(def.once && this.runner.isDone(def));
  }

  /** 開けたまま・壊れたままの状態を世界へ反映する（コライダを外す）。 */
  private applyOpened(def: Interactable): void {
    if (def.colliderId !== undefined) this.game.setBoxEnabled(def.colliderId, false);
  }

  // --- 壊す（breakable） ---

  private addWall(def: Interactable): () => void {
    const { game } = this;
    const base = game.heightAt(def.x, def.z);
    const target: HitTarget = {
      id: def.id,
      team: 'enemy', // プレイヤーの攻撃だけが当たる（敵の攻撃は同じ陣営に当たらない）
      health: new Health(1e9),
      invulnerable: false,
      staggered: false,
      heartboxes: [
        {
          a: vec3(def.x, base + BREAKABLE.hurtRadiusM, def.z),
          b: vec3(def.x, base + BREAKABLE.hurtHeightM - BREAKABLE.hurtRadiusM, def.z),
          radius: BREAKABLE.hurtRadiusM,
        },
      ],
    };
    const wall: Wall = { def, target, hp: def.hp ?? 1, broken: false, collapseLeft: 0 };
    this.walls.set(def.id, wall);
    if (game.save.hasFlag(stateFlagOf(def))) {
      // 再開後: 最初から壊れている（元に戻らない）
      wall.broken = true;
      this.applyOpened(def);
    } else {
      game.combat.addTarget(target);
    }
    return () => {
      game.combat.removeTarget(def.id);
      this.walls.delete(def.id);
    };
  }

  /** 命中のたびに（`interactable.system.ts` の `onImpact`）。壁への命中を HP に反映する。 */
  onHit(e: HitEvent): void {
    const wall = this.walls.get(e.targetId);
    if (!wall || wall.broken || e.attackerId !== 'player') return;
    const { game } = this;
    wall.hp -= Math.round(e.baseDamage * BREAKABLE.damageScale);
    // 空ろな音（ほかの壁の「カツン」と違う手がかり）。ヒットストップは最低 6F
    game.events.emit('sound', { cue: BREAKABLE.hollowCue, source: 'world', position: e.position });
    game.player.hitStop(BREAKABLE.hitStopF);
    if (wall.hp > 0) return;
    wall.hp = 0;
    wall.broken = true;
    wall.collapseLeft = BREAKABLE.collapseF;
    game.combat.removeTarget(wall.def.id);
    // 聴覚イベント（crash 12m）・破壊のセーブ
    this.runner.run(wall.def);
    game.events.emit('sound', {
      cue: BREAKABLE.collapseCue,
      source: 'world',
      position: { x: wall.def.x, y: e.position.y, z: wall.def.z },
    });
    game.events.emit('wallCollapse', {
      id: wall.def.id,
      position: { x: wall.def.x, y: game.heightAt(wall.def.x, wall.def.z), z: wall.def.z },
      frames: BREAKABLE.collapseF,
    });
  }

  // --- 床板（floorHatch） ---

  private addHatch(def: Interactable): () => void {
    this.hatches.set(def.id, { def, broken: false, creaked: false });
    return () => {
      this.hatches.delete(def.id);
    };
  }

  private updateHatches(): void {
    const { player } = this.game;
    const feet = player.feet;
    for (const hatch of this.hatches.values()) {
      if (hatch.broken) continue;
      const { def } = hatch;
      const reach = def.radiusM ?? 3;
      const dist = Math.hypot(feet.x - def.x, feet.z - def.z);
      // 近付くと軋む（1 回。遠ざかると再び鳴る）
      if (dist <= reach) {
        if (!hatch.creaked) {
          hatch.creaked = true;
          this.playSound(FLOOR_HATCH.creakCue, def);
        }
      } else if (dist > reach + 1) {
        hatch.creaked = false;
      }
      // 踏む（接触）と割れる。板の上（真下の水路ではなく）に立っているときだけ
      const half = (def.halfM ?? 1) - FLOOR_HATCH.contactMarginM;
      if (!player.grounded) continue;
      if (Math.abs(feet.x - def.x) > half || Math.abs(feet.z - def.z) > half) continue;
      if (feet.y < this.game.heightAt(def.x, def.z) - 0.5) continue;
      this.breakHatch(def);
    }
  }

  /** 床板を割る（踏んだとき。デバッグ・テストからも呼べる）。割れていなければ true。 */
  breakHatch(def: Interactable): boolean {
    const hatch = this.hatches.get(def.id);
    if (!hatch || hatch.broken) return false;
    hatch.broken = true;
    this.runner.run(def);
    this.game.events.emit('floorHatchBroken', {
      id: def.id,
      ...(def.colliderId !== undefined ? { colliderId: def.colliderId } : {}),
      position: { x: def.x, y: this.game.heightAt(def.x, def.z), z: def.z },
    });
    this.applyOpened(def);
    return true;
  }

  // --- 毎ステップ ---

  /** 毎ステップ（`interactable.system.ts`）。動作の確定・中断、会話の読了、壁の崩壊、床板の接触を見る。 */
  update(): void {
    this.runner.update();
    this.updateAction();
    this.updateDialogue();
    this.updateWalls();
    this.updateHatches();
  }

  private updateAction(): void {
    const act = this.action;
    if (!act) return;
    const { player } = this.game;
    if (player.state !== 'interact') {
      this.action = null; // 被弾などで中断
      return;
    }
    if (player.stateFrame >= act.effectFrame) {
      this.action = null;
      if (this.runner.fire(act.def) && act.def.kind === 'push') this.applyOpened(act.def);
    }
  }

  private updateDialogue(): void {
    const talk = this.dialogue;
    if (!talk) return;
    const model = textPanelOf(this.game);
    if (model.completions > talk.completions) {
      this.dialogue = null;
      talk.onEnd();
    } else if (!model.conversing) {
      this.dialogue = null; // 動いて閉じた（次に話すと 1 行目から）
    }
  }

  private updateWalls(): void {
    for (const wall of this.walls.values()) {
      if (!wall.broken || wall.collapseLeft <= 0) continue;
      wall.collapseLeft--;
      if (wall.collapseLeft === 0) this.applyOpened(wall.def);
    }
  }

  private beginAction(def: Interactable): void {
    const { player } = this.game;
    const faceYaw = yawOf(def.x - player.feet.x, def.z - player.feet.z);
    const frames = def.actionF ?? LOOT.frames;
    if (player.beginScripted('interact', { frames, faceYaw })) {
      this.action = { def, effectFrame: def.effectF ?? LOOT.effectFrame };
    }
  }

  private applyItemEffect(itemId: string): void {
    const effect = ITEM_DEFS[itemId]?.effect;
    if (effect?.type === 'flaskMax') this.game.player.flask.increaseMax(effect.amount);
  }

  private playSound(cue: string, source: { readonly x: number; readonly z: number }): void {
    const { game } = this;
    game.events.emit('sound', {
      cue,
      source: 'world',
      position: { x: source.x, y: game.player.feet.y, z: source.z },
    });
  }

  private host(): EffectHost {
    const { game } = this;
    return {
      hasFlag: (flag) => hasFlagIn(game, flag),
      setFlag: (flag) => {
        game.save.setFlag(flag);
      },
      showText: (textId) => {
        game.events.emit('showText', { id: textId, mode: 'read' });
      },
      playSound: (cue, source) => {
        this.playSound(cue, source);
      },
      emitSound: (radiusM, kind, source) => {
        game.emitSound({ x: source.x, y: game.player.feet.y, z: source.z }, radiusM, kind);
      },
      ambientDuck: (db, frames) => {
        game.events.emit('ambientDuck', { db, frames, ashIntensity: PRAY.ashIntensity });
      },
      dialogue: (lines, onEnd) => {
        game.events.emit('showText', { text: lines.map(textOf), mode: 'conversation' });
        this.dialogue = { onEnd, completions: textPanelOf(game).completions };
      },
      giveItem: (itemId, count, source) => {
        const def = ITEM_DEFS[itemId];
        if (!def) return;
        const first = game.save.getCount(itemId) === 0;
        if (def.maxCount !== undefined) {
          game.save.setCount(itemId, Math.min(def.maxCount, game.save.getCount(itemId) + count));
        } else {
          game.save.collectItem(itemId);
        }
        if (first) this.applyItemEffect(itemId);
        game.events.emit('itemPicked', {
          id: source.id,
          itemId,
          name: textOf(def.nameId),
          message: textOf(def.noticeId),
          position: { x: source.x, y: game.heightAt(source.x, source.z), z: source.z },
          noticeSeconds: ITEM.noticeSeconds,
        });
      },
    };
  }
}

const controllers = new WeakMap<Game, InteractableController>();

/** `game` のインタラクト対象の管理（なければ作る）。 */
export function interactablesOf(game: Game): InteractableController {
  let c = controllers.get(game);
  if (!c) {
    c = new InteractableController(game);
    controllers.set(game, c);
  }
  return c;
}
