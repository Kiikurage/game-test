import json,math,sys
rows=json.load(open(sys.argv[1]))
def w(a): return math.atan2(math.sin(a),math.cos(a))
D=180/math.pi
by={}
for r in rows: by.setdefault(r['label'],[]).append(r)
for lab,rs in by.items():
    mr=mc=mrel=0; cum=0; cummax=0; prev=None
    for r in rs:
        rel=w(r['chestYaw']-r['rootYaw'])
        if prev:
            dr=abs(w(r['rootYaw']-prev['rootYaw'])); dc=w(r['chestYaw']-prev['chestYaw'])
            mr=max(mr,dr); mc=max(mc,abs(dc))
            # chest relative to target direction, cumulative
            d=w((r['chestYaw']-r['to'])-(prev['chestYaw']-prev['to'])); cum+=d; cummax=max(cummax,abs(cum))
        prev=r
    s=rs[len(rs)//2]
    print(f"{lab:16s} n={len(rs)} maxdRoot={mr*D:6.1f} maxdChest={mc*D:6.1f} cumChestVsTarget={cummax*D:7.1f} states={sorted(set(x['state'] for x in rs))} mid: yaw-to={w(s['yaw']-s['to'])*D:.1f} off={s['offset']*D:.1f} root-yaw={w(s['rootYaw']-s['yaw'])*D:.1f} chest-root={w(s['chestYaw']-s['rootYaw'])*D:.1f} spd={s['speed']:.2f} dist={s['dist']:.1f}")
