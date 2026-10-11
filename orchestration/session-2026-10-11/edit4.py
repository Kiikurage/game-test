import os, json
os.chdir('/home/user/game-test/.claude/worktrees/agent-a952723406003375a')
def sub(path, old, new, n=1):
    s=open(path).read()
    assert old in s, (path, old)
    s=s.replace(old,new,n)
    open(path,'w').write(s)

p='src/game/enemy/enemy.ts'
sub(p,"  attackBehavior: EnemyAttackBehavior = NO_ATTACK;\n","""  attackBehavior: EnemyAttackBehavior = NO_ATTACK;
  /**
   * 拘束中（致命の一撃の発動中。#115）。行動・知覚・向きの更新を止める（気付きゲージも進まない = Alert にならず、
   * 振り向かない）。`provoke` も無視する。ヒットストップの凍結は通常どおり進む。
   */
  restrained = false;
""")
sub(p,"""  provoke(x: number, z: number): void {
    if (this.state !== 'idle'""","""  provoke(x: number, z: number): void {
    if (this.restrained) return;
    if (this.state !== 'idle'""")
sub(p,"""    this.fsm.advance();
    this.perceive(target);
""","""    if (this.restrained) {
      // 拘束: 立ち止まったまま（速度だけ落として押し戻しは受ける）。状態・ゲージ・向きは動かさない
      this.integrate(dt);
      this.syncTransform();
      return;
    }
    this.fsm.advance();
    this.perceive(target);
""")
sub(p,"  reset(): void {\n    this.cancelAttack();","  reset(): void {\n    this.restrained = false;\n    this.cancelAttack();")

# playerAttack: thrust shape
p='src/game/combat/playerAttack.ts'
sub(p,"import { PLAYER_ACTIONS, activeWindow } from '../data';","import { AMBUSH, PLAYER_ACTIONS, activeWindow } from '../data';")
sub(p,"""/** 走り攻撃の弧（度）。""","""/**
 * 致命の一撃（Sword_Thrust の突き）の判定: 脇に引いた剣を胸の高さで正面へ真っ直ぐ突き出す（左右の振れなし）。
 * 剣先は体の前 `AMBUSH.reachM`（吸着後の対象は体の前 0.9m）まで届く。`p` は持続中の進行。
 */
export function backstabCapsule(feet: Vec3, yaw: number, p: number, out: Capsule): Capsule {
  const len = WEAPON_CAPSULE.length;
  const sx = Math.sin(yaw);
  const sz = Math.cos(yaw);
  const s = THRUST_GRIP_START + (AMBUSH.reachM - len - THRUST_GRIP_START) * p;
  set(out.a, feet.x + sx * s, feet.y + THRUST_HEIGHT, feet.z + sz * s);
  set(out.b, feet.x + sx * (s + len), feet.y + THRUST_HEIGHT, feet.z + sz * (s + len));
  out.radius = WEAPON_CAPSULE.radius;
  return out;
}

/** 走り攻撃の弧（度）。""")
sub(p,"""      case 'runAttack':
        runAttackCapsule(source.feet, source.yaw, p, this.scratch);
        break;""","""      case 'runAttack':
        runAttackCapsule(source.feet, source.yaw, p, this.scratch);
        break;
      case 'backstab':
        backstabCapsule(source.feet, source.yaw, p, this.scratch);
        break;""")

# playerClips.json
p='src/game/anim/data/playerClips.json'
d=json.load(open(p))
i=[e['id'] for e in d['entries']].index('player.runAttack')
d['entries'].insert(i+1,{
 "id":"player.backstab","clip":"Sword_Thrust","clipFps":30,
 "clipRange":{"startFrame":0,"endFrame":26},"clipHitFrame":8,
 "spec":{"startup":10,"active":3,"recovery":34},
 "markers":[{"type":"hitStart","frame":11},{"type":"hitEnd","frame":13}]})
open(p,'w').write(json.dumps(d,ensure_ascii=False,indent=2)+"\n")
