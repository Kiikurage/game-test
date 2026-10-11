import re, sys, glob, os
d = sys.argv[1]
rows = []
for f in sorted(glob.glob(d + '/*.wgsl')):
    code = open(f).read()
    if '@fragment' not in code:
        continue
    fr = code[code.index('@fragment'):]
    perlin = len(re.findall(r'mx_perlin_noise_float_\d+\(', fr))
    fetch = len(re.findall(r'textureSample\( nodeUniform\d+, nodeUniform\d+_sampler, \( \(.*?/ vec3<f32>\( 8\.0 \)', fr))
    # アトラス参照: / 528.0 を含む textureSample
    atlas = len(re.findall(r'528\.0', fr))
    lines = fr.count('\n')
    sig = []
    if '1.18' in fr: sig.append('arenaFloor')
    if 'v_mu' in code or 'nodeVar' in fr and '0.72' in fr and '0.024' in fr: sig.append('masonry')
    if '1.15' in fr and '0.68' in fr and '0.55' in fr: sig.append('ground')
    if '0.0015' in fr and '0.85' in fr and 'arenaFloor' not in sig: sig.append('rock?')
    rows.append((os.path.basename(f), lines, perlin, atlas, ','.join(sig)))
rows.sort(key=lambda r: -(r[2] + r[3]))
for r in rows[:30]:
    print(*r)
