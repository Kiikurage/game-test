import sys
from PIL import Image
import numpy as np
tag = sys.argv[1]
ch = int(sys.argv[2]) if len(sys.argv) > 2 else 0
im = Image.open('/home/user/game-test/.claude/worktrees/agent-a03c51d58079421db/public/assets/water/water-caustics.png')
r = im.split()[ch]
t = Image.new('L', (1024, 512))
t.paste(r, (0, 0))
t.paste(r, (512, 0))
t.save(f'/tmp/claude-0/-home-user-game-test/31f8f843-5216-5ee9-851d-3ca43c4a860a/scratchpad/caus-{tag}.png')
a = np.asarray(r) / 255 * 4
print(tag, a.mean(), a.max(), (a >= 3.99).mean())
