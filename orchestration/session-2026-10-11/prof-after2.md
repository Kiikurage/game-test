

# CPU profile (medium, graveyard, combat, lockstep 1 step/frame)

enemy states: ["b-undead-1:recover","b-undead-2:idle","c-undead-1:idle","c-undead-2:idle","c-shield-1:idle","d-shield-1:idle","e-undead-1:idle","e-undead-2:idle","e-shield-1:idle"]

scene: {"objects":1248,"meshes":360,"autoUpdate":1180,"traversed":1248,"largest":["Scene: 131","Scene: 110","Scene: 94","Scene: 94","Scene: 94","Scene: 92","Scene: 92","Scene: 92","Scene: 92","Scene: 92"]}

| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame | worst frame ms |
| --- | --- | --- | --- | --- | --- | --- |
| draw | 243 | 28.40 | 0.84 | 3.85 | 28.57 | 402.3 |
| nodraw | 253 | 7.60 | 0.09 | 3.82 | 4.36 | 97.4 |

draw cost (draw - nodraw): 20.80 ms/frame

## top 15 self time (draw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| _projectObject (three/build/three.webgpu.js:64903) | 1.907 | 6.7 |
| submit | 1.411 | 5.0 |
| updateMatrixWorld (three/build/three.core.js:13067) | 1.267 | 4.5 |
| renderObject (three/build/three.webgpu.js:65367) | 1.192 | 4.2 |
| multiplyMatrices (three/build/three.core.js:10570) | 1.173 | 4.1 |
| writeBuffer | 1.034 | 3.6 |
| get (three/build/three.webgpu.js:31541) | 0.911 | 3.2 |
| (garbage collector) | 0.839 | 3.0 |
| _update (three/build/three.webgpu.js:33882) | 0.725 | 2.6 |
| updateForRender (three/build/three.webgpu.js:58581) | 0.621 | 2.2 |
| update (three/build/three.webgpu.js:66245) | 0.537 | 1.9 |
| updateByType (three/build/three.webgpu.js:66281) | 0.528 | 1.9 |
| setVertexBuffer | 0.500 | 1.8 |
| slerpFlat (three/build/three.core.js:3950) | 0.485 | 1.7 |
| update (three/build/three.webgpu.js:16605) | 0.458 | 1.6 |

## top 15 allocations (draw, sampled, total 238.6 KB/frame)

| function | KB/frame |
| --- | --- |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 24.56 |
| evaluate (three/build/three.core.js:42307) | 23.90 |
| next | 16.47 |
| _update (three/build/three.webgpu.js:33882) | 12.10 |
| painterSortStable (three/build/three.webgpu.js:34046) | 11.13 |
| getPrototypeOf | 8.26 |
| get (three/build/three.webgpu.js:31541) | 8.08 |
| push | 6.55 |
| cyrb53 (three/build/three.webgpu.js:1118) | 6.12 |
| update (three/build/three.webgpu.js:16605) | 5.77 |
| _projectObject (three/build/three.webgpu.js:64903) | 5.52 |
| getOwnPropertyNames | 5.48 |
| getCacheKey (three/build/three.webgpu.js:2099) | 5.05 |
| get (three/build/three.webgpu.js:34951) | 3.66 |
| forEachColliderHandle (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.38 |

## top 15 self time (nodraw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| slerpFlat (three/build/three.core.js:3950) | 0.530 | 7.0 |
| evaluate (three/build/three.core.js:42307) | 0.332 | 4.4 |
| compose (three/build/three.core.js:11030) | 0.318 | 4.2 |
| _update (three/build/three.core.js:54768) | 0.265 | 3.5 |
| update (src/render/anim/layeredAnimation.ts:127) | 0.175 | 2.3 |
| place (src/game/combat/uprightTarget.ts:60) | 0.167 | 2.2 |
| update (three/build/three.core.js:55820) | 0.160 | 2.1 |
| apply (three/build/three.core.js:52816) | 0.155 | 2.0 |
| onQuaternionChange (three/build/three.core.js:12042) | 0.142 | 1.9 |
| multiplyQuaternions (three/build/three.core.js:4576) | 0.130 | 1.7 |
| js-to-wasm:iii: (e5dcf6aa:1) | 0.126 | 1.7 |
| __wbindgen_object_drop_ref (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.122 | 1.6 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.122 | 1.6 |
| (anonymous) (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.119 | 1.6 |
| wasm-function[155] (00bc1dde:1) | 0.114 | 1.5 |

## top 15 allocations (nodraw, sampled, total 286.2 KB/frame)

| function | KB/frame |
| --- | --- |
| slerpFlat (three/build/three.core.js:3950) | 72.36 |
| apply (three/build/three.core.js:52816) | 28.18 |
| next | 24.94 |
| accumulate (three/build/three.core.js:52748) | 20.79 |
| evaluate (three/build/three.core.js:42307) | 19.62 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 16.57 |
| __wbindgen_object_drop_ref (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 10.24 |
| update (src/render/anim/layeredAnimation.ts:127) | 3.94 |
| interpolate_ (three/build/three.core.js:43676) | 3.85 |
| values | 3.68 |
| forEachColliderHandle (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.67 |
| unmapRemovedColliders (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.16 |
| interpolate_ (three/build/three.core.js:42711) | 2.90 |
| filter | 2.84 |
| _updateTime (three/build/three.core.js:54932) | 2.72 |
 15:17:59 up  9:41,  0 user,  load average: 28.34, 30.08, 29.73
