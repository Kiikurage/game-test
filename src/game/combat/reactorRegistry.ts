import type { Freezable } from './hitStop';
import type { HitEvent } from './hitResolver';
import type { HitReactor, HitReaction } from './hitReactor';
import type { UprightTarget } from './uprightTarget';

/** 押し戻しの変位を受け取る口（敵は自分の体へ足す）。 */
export type SlideSink = (dx: number, dz: number) => void;

/**
 * プレイヤー以外の被弾側の強靭度・押し戻し（`HitReactor`）と、ヒットストップの凍結口・ボス ID の登録簿。
 * 反復順（登録順）は命中・ステップの処理順になるので、`Map` の挿入順を保つ。
 */
export class ReactorRegistry {
  readonly reactors = new Map<string, HitReactor>();
  /** ボスの ID（ボスの攻撃・撃破でヒットストップ / スローの長さが変わる）。 */
  readonly bossIds = new Set<string>();
  /** 強靭度崩し中の 1.5 倍を反映する対象（`reactors` と同じ ID）。 */
  private readonly reactiveTargets = new Map<string, UprightTarget>();
  /** 押し戻しを捨てる反応体（テストシーンのダミー）。 */
  private readonly discardSlideIds = new Set<string>();
  /** 押し戻しを受け取る反応体（敵）。 */
  private readonly slideSinks = new Map<string, SlideSink>();
  private readonly freezables = new Map<string, Freezable[]>();
  private readonly slideScratch = { x: 0, z: 0 };

  add(id: string, reactor: HitReactor, target?: UprightTarget): void {
    this.reactors.set(id, reactor);
    this.registerFreezable(id, reactor);
    if (target) this.reactiveTargets.set(id, target);
  }

  /** 押し戻しを受けない反応体（ダミー）として印を付ける。 */
  discardSlide(id: string): void {
    this.discardSlideIds.add(id);
  }

  /** 押し戻しの受け口を付け替える（敵の登録・解除）。 */
  setSlideSink(id: string, sink: SlideSink | null): void {
    if (sink) this.slideSinks.set(id, sink);
    else this.slideSinks.delete(id);
  }

  remove(id: string): void {
    this.reactors.delete(id);
    this.freezables.delete(id);
    this.reactiveTargets.delete(id);
    this.discardSlideIds.delete(id);
  }

  registerFreezable(id: string, target: Freezable): void {
    const list = this.freezables.get(id);
    if (list) list.push(target);
    else this.freezables.set(id, [target]);
  }

  unregisterFreezable(id: string): void {
    this.freezables.delete(id);
  }

  freeze(id: string, frames: number): void {
    for (const f of this.freezables.get(id) ?? []) f.freeze(frames);
  }

  /**
   * 登録済みの反応体を 1 ステップ進める（強靭度の回復・崩しの残り・被弾後無敵）。ダミーは押し戻しを受けないので
   * 変位を捨てる。敵は受け口へ渡す。どちらでもないもの（ボス）は自分で `reactor.consumeSlide` を呼ぶ。
   */
  step(): void {
    const slide = this.slideScratch;
    for (const [id, reactor] of this.reactors) {
      // ヒットストップ中は強靭度の回復・崩しの残り・被弾後無敵・押し戻しも止める
      if (reactor.consumeFreeze()) continue;
      reactor.step();
      if (this.discardSlideIds.has(id)) reactor.consumeSlide(slide);
      const sink = this.slideSinks.get(id);
      if (sink) {
        // 被弾の押し戻しは敵の次の移動に足す（壁・地形には体が従う）
        reactor.consumeSlide(slide);
        if (slide.x !== 0 || slide.z !== 0) sink(slide.x, slide.z);
      }
      const target = this.reactiveTargets.get(id);
      if (target) target.staggered = reactor.staggered;
    }
  }

  /** プレイヤー以外への命中を強靭度・押し戻しへ反映する。未登録なら undefined。 */
  react(e: HitEvent, dx: number, dz: number): HitReaction | undefined {
    const reactor = this.reactors.get(e.targetId);
    if (!reactor) return undefined;
    const reaction = reactor.react(e, dx, dz);
    const target = this.reactiveTargets.get(e.targetId);
    if (target) target.staggered = reactor.staggered;
    return reaction;
  }
}
