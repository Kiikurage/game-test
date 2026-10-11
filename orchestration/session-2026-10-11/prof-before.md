[33m[PLUGIN_TIMINGS] [0mJavaScript callbacks ran for 7.1s of this 16.9s build (42%).
The slowest callbacks, timed inside each callback (the wait before a callback starts is excluded, the time it awaits is included):
  - plugin vite:build-import-analysis generateBundle (38%, 6.4s, 1 call)
Additional callback time came from callbacks under 1s.
See https://rolldown.rs/reference/InputOptions.checks#bundlertimings for more details.


# CPU profile (medium, graveyard, combat, lockstep 1 step/frame)

enemy states: ["b-undead-1:recover","b-undead-2:idle","c-undead-1:idle","c-undead-2:idle","c-shield-1:idle","d-shield-1:idle","e-undead-1:idle","e-undead-2:idle","e-shield-1:idle"]

| mode | frames | JS ms/frame (CDP) | GC ms/frame | sim ms/frame | render ms/frame |
| --- | --- | --- | --- | --- | --- |
| draw | 243 | 40.91 | 3.66 | 3.33 | 36.84 |
| nodraw | 272 | 8.76 | 0.03 | 4.00 | 4.89 |

draw cost (draw - nodraw): 32.15 ms/frame

## top 15 self time (draw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| (garbage collector) | 3.659 | 8.9 |
| updateMatrixWorld (three/build/three.core.js:13067) | 3.252 | 7.9 |
| _projectObject (three/build/three.webgpu.js:64903) | 3.126 | 7.6 |
| submit | 2.237 | 5.5 |
| multiplyMatrices (three/build/three.core.js:10570) | 1.641 | 4.0 |
| writeBuffer | 1.623 | 4.0 |
| renderObject (three/build/three.webgpu.js:65367) | 1.509 | 3.7 |
| update (three/build/three.webgpu.js:16605) | 0.850 | 2.1 |
| updateForRender (three/build/three.webgpu.js:58581) | 0.839 | 2.1 |
| setVertexBuffer | 0.781 | 1.9 |
| needsRefresh (three/build/three.webgpu.js:933) | 0.734 | 1.8 |
| updateByType (three/build/three.webgpu.js:66281) | 0.721 | 1.8 |
| update (src/render/interactable/interactable.view.ts:28) | 0.694 | 1.7 |
| evaluate (three/build/three.core.js:42307) | 0.690 | 1.7 |
| getCacheKey (three/build/three.webgpu.js:2099) | 0.658 | 1.6 |

## top 15 self time (nodraw, ms/frame)

| function | ms/frame | % |
| --- | --- | --- |
| _update (three/build/three.core.js:54768) | 0.837 | 9.6 |
| interpolate_ (three/build/three.core.js:43676) | 0.422 | 4.8 |
| slerpFlat (three/build/three.core.js:3950) | 0.368 | 4.2 |
| evaluate (three/build/three.core.js:42307) | 0.357 | 4.1 |
| update (three/build/three.core.js:55820) | 0.342 | 3.9 |
| computeColliderMovement (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.290 | 3.3 |
| update (src/render/anim/characterAnimator.ts:180) | 0.229 | 2.6 |
| render (src/render/gameView.ts:244) | 0.209 | 2.4 |
| free (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.196 | 2.2 |
| index (@dimforge/rapier3d-compat/dist/rapier.mjs:1) | 0.136 | 1.5 |
| wasm-to-js | 0.131 | 1.5 |
| apply (three/build/three.core.js:52816) | 0.128 | 1.5 |
| update (src/game/game.ts:484) | 0.128 | 1.5 |
| update (three/build/three.webgpu.js:30241) | 0.127 | 1.4 |
| setListener (src/audio/sfxPlayer.ts:100) | 0.112 | 1.3 |
