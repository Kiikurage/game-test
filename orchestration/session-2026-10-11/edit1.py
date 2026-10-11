import json
p='/home/user/game-test/.claude/worktrees/agent-a778367005d9110f1/scripts/heroShots.json'
d=json.load(open(p))
S={s['name']:s for s in d['shots']}
S['bonfire-arrival']['player']={"x":0.8,"z":-4.2,"face":[-1.6,3]}
S['bonfire-arrival']['title']='篝火「灰の炉」と石碑'
S['bonfire-lanterns']['player']={"x":-3,"z":2.5,"face":[14,5]}
S['chapel-gate-approach']['player']={"x":31.5,"z":11.5,"face":[41,17.5]}
S['chapel-breach']['title']='祭壇と東の崩れ口'
for n in ['waterway-tunnel','waterway-stairs']:
    S[n]['camera']={"distance":3.2,"pitchDeg":2}
S['crypt-bend']['player']={"x":62.5,"z":47.5,"face":[61.8,51.5]}
S['crypt-bend']['camera']={"yawOffsetDeg":30,"pitchDeg":20}
json.dump(d,open(p,'w'),ensure_ascii=False,indent=2)
