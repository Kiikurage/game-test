p='/home/user/game-test/.claude/worktrees/agent-a778367005d9110f1/scripts/heroShots.mjs'
lines=open(p).read().split('\n')
# lines 78..86 (1-based) are the main block
block=lines[77:86]
assert block[0].startswith('mkdirSync(opts.outDir') and block[-1]=='}', block
rest=lines[:77]+lines[87:] if lines[86]=='' else lines[:77]+lines[86:]
s='\n'.join(rest).rstrip('\n')+'\n\n// ---- 実行（関数・定数の宣言の後に置く） ----\n\n'+'\n'.join(block)+'\n'
open(p,'w').write(s)
