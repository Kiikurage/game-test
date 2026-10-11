import os
os.chdir('/home/user/game-test/.claude/worktrees/agent-a952723406003375a')
def sub(path, old, new, n=1):
    s=open(path).read()
    assert old in s, (path, old)
    s=s.replace(old,new,n)
    open(path,'w').write(s)
p='src/game/player/ambushGame.test.ts'
sub(p,"standBehind(1.5, 0.6);","standBehind(1.4, 0.6);")
sub(p,"""  it('条件を外す（正面・Alert 以降・崩し中）と通常の軽攻撃 1 になる', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    // 正面（+z 側）から
    game.teleportPlayer(0, 1.2, Math.PI);
    run(2);
    press();
    expect(game.player.state).toBe('light1');
    run(60);

    // Alert 以降
    standBehind(1.2);
    soldier.provoke(0, -1.2);
    expect(soldier.state).toBe('alert');
    press();
    expect(game.player.state).toBe('light1');
    run(60);

    // 強靭度崩し中
    soldier.stagger(120);
    standBehind(1.2);
    press();
    expect(game.player.state).toBe('light1');
  });
""","""  it('正面からは通常の軽攻撃 1', async () => {
    await setup([spawn('undead_soldier', 'a')]);
    game.teleportPlayer(0, 1.2, Math.PI);
    run(2);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('Alert 以降の敵には不発（軽攻撃 1）', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.provoke(0, -1.2);
    expect(soldier.state).toBe('alert');
    expect(game.player.ambushReady).toBe(false);
    run(1);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('強靭度崩し中の敵には不発（軽攻撃 1）', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.stagger(120);
    run(1);
    press();
    expect(game.player.state).toBe('light1');
  });

  it('Suspicious の敵にも発動する', async () => {
    const [soldier] = await setup([spawn('undead_soldier', 'a')]);
    if (!soldier) throw new Error('no enemy');
    standBehind(1.2);
    soldier.gauge = 60;
    soldier.fsm.transition('suspicious');
    expect(soldier.state).toBe('suspicious');
    press();
    expect(game.player.state).toBe('backstab');
  });
""")
sub(p,"""    input.press('dodge');
    tick();""","""    input.setMove(1, 0);
    input.press('dodge');
    tick();
    input.setMove(0, 0);""")
