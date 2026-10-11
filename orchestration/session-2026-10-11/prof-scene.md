
# CPU profile (medium, graveyard, combat, lockstep 1 step/frame)

enemy states: ["b-undead-1:approach","b-undead-2:suspicious","c-undead-1:idle","c-undead-2:idle","c-shield-1:idle","d-shield-1:idle","e-undead-1:idle","e-undead-2:idle","e-shield-1:idle"]

scene: {"objects":1248,"meshes":360,"autoUpdate":1206,"traversed":1248,"largest":["Scene: 131","Scene: 110","Scene: 94","Scene: 94","Scene: 94","Scene: 92","Scene: 92","Scene: 92","Scene: 92","Scene: 92"]}

| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame |
| --- | --- | --- | --- | --- | --- |
| draw | 32 | 42.22 | 0.55 | 4.18 | 38.13 |
| nodraw | 38 | 5.14 | 0.04 | 2.68 | 3.88 |

draw cost (draw - nodraw): 37.08 ms/frame

## top 15 self time (draw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| convert (three/build/three.core.js:6722) | 7.863 | 18.6 |
| updateMatrixWorld (three/build/three.core.js:13067) | 2.509 | 5.9 |
| updateByType (three/build/three.webgpu.js:66281) | 2.171 | 5.1 |
| submit | 1.944 | 4.6 |
| renderObject (three/build/three.webgpu.js:65367) | 1.630 | 3.9 |
| _projectObject (three/build/three.webgpu.js:64903) | 1.510 | 3.6 |
| writeBuffer | 1.477 | 3.5 |
| multiplyMatrices (three/build/three.core.js:10570) | 1.352 | 3.2 |
| get (three/build/three.webgpu.js:31541) | 0.907 | 2.1 |
| getCacheKey (three/build/three.webgpu.js:34897) | 0.677 | 1.6 |
| setVertexBuffer | 0.647 | 1.5 |
| updateAttribute (three/build/three.webgpu.js:32203) | 0.631 | 1.5 |
| _update (three/build/three.webgpu.js:33882) | 0.617 | 1.5 |
| _getRenderPassDescriptor (three/build/three.webgpu.js:87626) | 0.601 | 1.4 |
| updateForRender (three/build/three.webgpu.js:58581) | 0.570 | 1.3 |

## top 15 self time (nodraw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| _update (three/build/three.core.js:54768) | 0.315 | 6.1 |
| update (three/build/three.core.js:55820) | 0.282 | 5.5 |
| slerpFlat (three/build/three.core.js:3950) | 0.274 | 5.3 |
| interpolate_ (three/build/three.core.js:43676) | 0.240 | 4.7 |
| update (src/render/anim/characterAnimator.ts:180) | 0.238 | 4.6 |
| accumulate (three/build/three.core.js:52748) | 0.229 | 4.5 |
| wasm-function[1352] (00bc1dde:1) | 0.226 | 4.4 |
| update (src/render/playerView.ts:127) | 0.194 | 3.8 |
| evaluate (three/build/three.core.js:42307) | 0.153 | 3.0 |
| update (src/game/player/player.ts:733) | 0.131 | 2.6 |
| render (src/render/gameView.ts:244) | 0.103 | 2.0 |
| _setValue_fromArray_setMatrixWorldNeedsUpdate (three/build/three.core.js:53463) | 0.101 | 2.0 |
| update (src/render/enemyView.ts:172) | 0.091 | 1.8 |
| update (src/render/anim/layeredAnimation.ts:127) | 0.086 | 1.7 |
| _slerp (three/build/three.core.js:52956) | 0.079 | 1.5 |
