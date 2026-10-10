import { Quaternion, type Object3D } from 'three/webgpu';

/**
 * ミキサーの後にボーンへ手続き的な補正を重ねるときの「元の姿勢」の管理。
 *
 * three のミキサーは、クリップの値が前回から変わったときしかボーンへ書き込まない（`PropertyMixer.apply` の最適化）。
 * ヒットストップ中や、描画がシミュレーションより速いフレームでは時刻が変わらず、補正した姿勢がそのまま残って、
 * 次のフレームの補正が重なってしまう（頭が際限なく反るなど）。そこで、補正の前に「ミキサーが書いた元の姿勢」へ戻す。
 *
 * 使い方: 補正の直前に `begin()`、直後に `end()`。補正しないフレームは `restore()`（補正が残っていれば戻す）。
 */
export class BonePoseGuard {
  private readonly base: Quaternion[];
  private readonly applied: Quaternion[];
  private valid = false;

  constructor(private readonly bones: readonly Object3D[]) {
    this.base = bones.map(() => new Quaternion());
    this.applied = bones.map(() => new Quaternion());
  }

  /** 補正の前: 前回の補正が残っていれば元の姿勢へ戻し、そうでなければ（ミキサーが書き直した）いまの姿勢を元として覚える。 */
  begin(): void {
    this.bones.forEach((bone, i) => {
      const base = this.base[i];
      const applied = this.applied[i];
      if (!base || !applied) return;
      if (this.valid && bone.quaternion.equals(applied)) bone.quaternion.copy(base);
      else base.copy(bone.quaternion);
    });
  }

  /** 補正の後: 補正した姿勢を覚える（次の `begin` で、ミキサーが書き直したかを見分ける）。 */
  end(): void {
    this.bones.forEach((bone, i) => this.applied[i]?.copy(bone.quaternion));
    this.valid = true;
  }

  /** 補正しないフレーム: 補正が残っていれば元の姿勢へ戻す。 */
  restore(): void {
    if (!this.valid) return;
    this.begin();
    this.valid = false;
  }
}
