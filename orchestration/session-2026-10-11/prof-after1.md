
# CPU profile (medium, graveyard, combat, lockstep 1 step/frame)

enemy states: ["b-undead-1:recover","b-undead-2:idle","c-undead-1:idle","c-undead-2:idle","c-shield-1:idle","d-shield-1:idle","e-undead-1:idle","e-undead-2:idle","e-shield-1:idle"]

scene: {"objects":1248,"meshes":360,"autoUpdate":1180,"traversed":1248,"largest":["Scene: 131","Scene: 110","Scene: 94","Scene: 94","Scene: 94","Scene: 92","Scene: 92","Scene: 92","Scene: 92","Scene: 92"]}

| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame |
| --- | --- | --- | --- | --- | --- |
| draw | 244 | 31.32 | 0.54 | 3.36 | 29.32 |
| nodraw | 258 | 8.63 | 0.11 | 3.51 | 4.63 |

draw cost (draw - nodraw): 22.69 ms/frame

## top 15 self time (draw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| _projectObject (three/build/three.webgpu.js:64903) | 2.329 | 7.4 |
| renderObject (three/build/three.webgpu.js:65367) | 2.060 | 6.6 |
| submit | 1.539 | 4.9 |
| updateMatrixWorld (three/build/three.core.js:13067) | 1.376 | 4.4 |
| multiplyMatrices (three/build/three.core.js:10570) | 1.217 | 3.9 |
| writeBuffer | 1.030 | 3.3 |
| setVertexBuffer | 0.712 | 2.3 |
| update (three/build/three.webgpu.js:66245) | 0.709 | 2.3 |
| updateByType (three/build/three.webgpu.js:66281) | 0.706 | 2.3 |
| beginRender (three/build/three.webgpu.js:87838) | 0.681 | 2.2 |
| updateForRender (three/build/three.webgpu.js:58581) | 0.679 | 2.2 |
| get (three/build/three.webgpu.js:31541) | 0.667 | 2.1 |
| _update (three/build/three.webgpu.js:33882) | 0.655 | 2.1 |
| getCacheKey (three/build/three.webgpu.js:2099) | 0.569 | 1.8 |
| update (three/build/three.webgpu.js:16605) | 0.560 | 1.8 |

## top 15 allocations (draw, sampled, total 255.9 KB/frame)

| function | KB/frame |
| --- | --- |
| evaluate (three/build/three.core.js:42307) | 25.18 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 24.05 |
| next | 20.45 |
| _update (three/build/three.webgpu.js:33882) | 11.39 |
| painterSortStable (three/build/three.webgpu.js:34046) | 10.72 |
| get (three/build/three.webgpu.js:31541) | 7.80 |
| (anonymous) (src/render/perf.view.ts:39) | 7.55 |
| getPrototypeOf | 7.46 |
| push | 7.03 |
| _projectObject (three/build/three.webgpu.js:64903) | 5.87 |
| sort | 5.83 |
| getOwnPropertyNames | 5.74 |
| update (three/build/three.webgpu.js:16605) | 5.70 |
| cyrb53 (three/build/three.webgpu.js:1118) | 5.36 |
| getCacheKey (three/build/three.webgpu.js:2099) | 5.01 |

## top 15 self time (nodraw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| updateMatrixWorld (three/build/three.core.js:13067) | 1.537 | 17.8 |
| _update (three/build/three.core.js:54768) | 0.536 | 6.2 |
| multiplyMatrices (three/build/three.core.js:10570) | 0.276 | 3.2 |
| update (src/game/game.ts:484) | 0.254 | 2.9 |
| slerpFlat (three/build/three.core.js:3950) | 0.243 | 2.8 |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.145 | 1.7 |
| setListener (src/audio/sfxPlayer.ts:100) | 0.140 | 1.6 |
| wasm-function[32] (00bc1dde:1) | 0.129 | 1.5 |
| (anonymous) (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.125 | 1.4 |
| wasm-to-js | 0.123 | 1.4 |
| render (src/render/gameView.ts:244) | 0.123 | 1.4 |
| wasm-function[155] (00bc1dde:1) | 0.110 | 1.3 |
| (garbage collector) | 0.105 | 1.2 |
| wasm-function[2664] (00bc1dde:1) | 0.103 | 1.2 |
| wasm-function[161] (00bc1dde:1) | 0.098 | 1.1 |

## top 15 allocations (nodraw, sampled, total 122.0 KB/frame)

| function | KB/frame |
| --- | --- |
| __wbg_call_187d372bd5fdd4aa (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 23.04 |
| _update (three/build/three.core.js:54768) | 21.92 |
| next | 16.96 |
| (anonymous) (src/render/perf.view.ts:39) | 6.27 |
| unmapRemovedColliders (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.44 |
| forEachColliderHandle (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 3.25 |
| sort | 2.22 |
| applyLocomotion (src/render/anim/characterAnimator.ts:261) | 1.79 |
| moveBy (src/game/enemy/enemyBody.ts:71) | 1.78 |
| dot (three/build/three.core.js:5539) | 1.38 |
| update (src/render/anim/layeredAnimation.ts:127) | 1.34 |
| values | 1.21 |
| get animation (src/game/player/player.ts:574) | 1.09 |
| get animation (src/game/enemy/enemy.ts:283) | 1.07 |
| hypot | 1.02 |
