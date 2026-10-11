import os
os.chdir('/home/user/game-test/.claude/worktrees/agent-a952723406003375a')
def sub(path, old, new, n=1):
    s=open(path).read()
    assert old in s, (path, old)
    s=s.replace(old,new,n)
    open(path,'w').write(s)

p='src/render/assets/playerAnimator.ts'
sub(p,"    runAttack: { fadeIn: 0.05, fadeOut: 0.12 },\n","    runAttack: { fadeIn: 0.05, fadeOut: 0.12 },\n    // 致命の一撃（#115）: 背後へ吸着しながら素早く突く\n    backstab: { fadeIn: 0.04, fadeOut: 0.15 },\n")
sub(p,"    'runAttack',\n    'guardBreak',","    'runAttack',\n    'backstab',\n    'guardBreak',")

p='src/render/playerView.ts'
sub(p,"import { heavyChargeGlow } from './player/heavyChargeGlow';","import { AMBUSH } from '../game/data';\nimport { heavyChargeGlow } from './player/heavyChargeGlow';")
sub(p,"""      if (glow.amount > 0) this.light.setWeaponTelegraph(glow.amount, glow.color);
      else if""","""      if (glow.amount > 0) this.light.setWeaponTelegraph(glow.amount, glow.color);
      else if (player.ambushReady) {
        // 致命の一撃が出せる間、剣の縁がわずかに光る（#115。HUD は出さない）
        this.light.setWeaponTelegraph(AMBUSH.glowAmount, AMBUSH.glowColor, { edge: 1 });
      } else if""")

p='src/render/player/lightThrust.view.ts'
sub(p,"      if (anim.state !== 'light3') {","      if (anim.state !== 'light3' && anim.state !== 'backstab') {")
sub(p,"      const p = thrustPose(frame);","      const p = thrustPose(anim.state === 'backstab' ? backstabToThrustFrame(frame) : frame);")
sub(p,"registerViewPlugin('light-thrust'","""/**
 * 致命の一撃（#115）は同じ突きを発生 10F（軽 3 は 16F）で出す。判定開始（F11 = 軽 3 の F17）に合わせて、
 * それまでを 1.6 倍速で進め、以降は同じ速さで続ける（姿勢の時間割 `thrustPose` は軽 3 の F 基準）。
 */
function backstabToThrustFrame(frame: number): number {
  return frame <= 11 ? 1 + (frame - 1) * 1.6 : frame + 6;
}

registerViewPlugin('light-thrust'""")
sub(p,"軽攻撃 3 段目を「突き」に見せる手続き的な補正（#173）。","軽攻撃 3 段目と致命の一撃（#115）を「突き」に見せる手続き的な補正（#173）。")
