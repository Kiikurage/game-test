
# CPU profile (medium, graveyard, combat, lockstep 1 step/frame)

enemy states: ["b-undead-1:recover","b-undead-2:idle","c-undead-1:idle","c-undead-2:idle","c-shield-1:idle","d-shield-1:idle","e-undead-1:idle","e-undead-2:idle","e-shield-1:idle"]

scene: {"objects":1248,"meshes":360,"autoUpdate":1206,"traversed":1248,"largest":["Scene: 131","Scene: 110","Scene: 94","Scene: 94","Scene: 94","Scene: 92","Scene: 92","Scene: 92","Scene: 92","Scene: 92"]}

| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame | worst frame ms |
| --- | --- | --- | --- | --- | --- | --- |
| draw | 241 | 39.50 | 1.02 | 3.77 | 36.42 | 622.5 |
| nodraw | 268 | 7.19 | 0.18 | 3.58 | 4.32 | 27.3 |

draw cost (draw - nodraw): 32.32 ms/frame

## top 15 self time (draw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| get (three/build/three.webgpu.js:31541) | 3.334 | 8.4 |
| updateMatrixWorld (three/build/three.core.js:13067) | 3.082 | 7.8 |
| _projectObject (three/build/three.webgpu.js:64903) | 2.897 | 7.3 |
| submit | 2.663 | 6.7 |
| writeBuffer | 1.452 | 3.7 |
| _update (three/build/three.webgpu.js:33882) | 1.388 | 3.5 |
| multiplyMatrices (three/build/three.core.js:10570) | 1.262 | 3.2 |
| renderObject (three/build/three.webgpu.js:65367) | 1.165 | 2.9 |
| (garbage collector) | 1.024 | 2.6 |
| updateByType (three/build/three.webgpu.js:66281) | 0.725 | 1.8 |
| evaluate (three/build/three.core.js:42307) | 0.683 | 1.7 |
| updateForRender (three/build/three.webgpu.js:58581) | 0.683 | 1.7 |
| setVertexBuffer | 0.567 | 1.4 |
| update (three/build/three.core.js:25135) | 0.539 | 1.4 |
| _getChildren (three/build/three.webgpu.js:2033) | 0.539 | 1.4 |

## top 15 allocations (draw, sampled, total 250.4 KB/frame)

| function | KB/frame |
| --- | --- |
| evaluate (three/build/three.core.js:42307) | 23.92 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 23.35 |
| next | 17.56 |
| _update (three/build/three.webgpu.js:33882) | 11.80 |
| painterSortStable (three/build/three.webgpu.js:34046) | 10.34 |
| getPrototypeOf | 7.87 |
| get (three/build/three.webgpu.js:31541) | 7.85 |
| push | 7.62 |
| (anonymous) (src/render/perf.view.ts:39) | 7.31 |
| _projectObject (three/build/three.webgpu.js:64903) | 5.98 |
| getOwnPropertyNames | 5.89 |
| cyrb53 (three/build/three.webgpu.js:1118) | 5.76 |
| update (three/build/three.webgpu.js:16605) | 5.42 |
| getCacheKey (three/build/three.webgpu.js:2099) | 4.96 |
| sort | 4.80 |

## top 15 self time (nodraw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| tryStart (src/game/enemy/attackRunner.ts:194) | 0.787 | 10.9 |
| slerpFlat (three/build/three.core.js:3950) | 0.519 | 7.2 |
| _update (three/build/three.core.js:54768) | 0.510 | 7.1 |
| interpolate_ (three/build/three.core.js:43676) | 0.271 | 3.8 |
| update (three/build/three.core.js:55820) | 0.184 | 2.6 |
| (garbage collector) | 0.180 | 2.5 |
| evaluate (three/build/three.core.js:42307) | 0.179 | 2.5 |
| real.endFrame (src/render/perf.view.ts:34) | 0.173 | 2.4 |
| apply (three/build/three.core.js:52816) | 0.139 | 1.9 |
| update (src/game/enemy/enemyManager.ts:103) | 0.128 | 1.8 |
| update (src/render/anim/layeredAnimation.ts:127) | 0.108 | 1.5 |
| wasm-function[32] (00bc1dde:1) | 0.103 | 1.4 |
| accumulate (three/build/three.core.js:52748) | 0.096 | 1.3 |
| setFromRotationMatrix (three/build/three.core.js:11523) | 0.089 | 1.2 |
| render (src/render/gameView.ts:244) | 0.088 | 1.2 |

## top 15 allocations (nodraw, sampled, total 372.6 KB/frame)

| function | KB/frame |
| --- | --- |
| slerpFlat (three/build/three.core.js:3950) | 113.15 |
| apply (three/build/three.core.js:52816) | 41.64 |
| accumulate (three/build/three.core.js:52748) | 27.97 |
| next | 25.42 |
| evaluate (three/build/three.core.js:42307) | 19.66 |
| __wbindgen_object_drop_ref (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 16.83 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 14.93 |
| (anonymous) (src/render/perf.view.ts:39) | 7.82 |
| interpolate_ (three/build/three.core.js:43676) | 6.10 |
| update (src/render/anim/layeredAnimation.ts:127) | 4.45 |
| _updateTime (three/build/three.core.js:54932) | 4.01 |
| forEachColliderHandle (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.90 |
| values | 3.79 |
| unmapRemovedColliders (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.70 |
| filter | 3.06 |
 15:25:15 up  9:48,  0 user,  load average: 23.45, 24.52, 27.12
