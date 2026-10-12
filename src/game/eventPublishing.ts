import type { EventBus, FootstepSurface, GameEventMap } from '../core/gameEvents';
import type { AnimMarkerEvent } from './anim/markerDispatcher';
import type { MarkerType } from './anim/eventMarkers';
import type { PlayerEvent } from './player/player';

type Point = { readonly x: number; readonly y: number; readonly z: number };

/** 回復瓶のイベントを、音（`sound`）と HUD・パーティクル用の `heal` へ流す。 */
export function publishPlayerEvent(
  events: EventBus<GameEventMap>,
  e: PlayerEvent,
  feet: Point,
  hp: number,
): void {
  const position = { x: feet.x, y: feet.y, z: feet.z };
  switch (e.type) {
    case 'healStart':
      events.emit('sound', { cue: 'sfx.heal-drink', position });
      break;
    case 'healApply':
      events.emit('sound', { cue: 'sfx.heal-glow', position });
      events.emit('heal', { amount: e.amount, hp, position });
      break;
    default:
      break;
  }
}

/** アニメーションのイベントマーカーをイベントバスへ流す。足音は音のイベント（`footstep`）にも変換する。 */
export function publishMarker(
  events: EventBus<GameEventMap>,
  counts: Record<MarkerType, number>,
  surfaceAt: (x: number, z: number, y?: number) => FootstepSurface,
  owner: string,
  e: AnimMarkerEvent,
  feet: Point,
): void {
  counts[e.type]++;
  const position = { x: feet.x, y: feet.y, z: feet.z };
  events.emit('animMarker', {
    owner,
    marker: e.type,
    actionId: e.actionId,
    frame: e.frame,
    position,
  });
  if (e.type === 'footstep') {
    events.emit('footstep', {
      surface: surfaceAt(feet.x, feet.z, feet.y),
      gait: e.gait ?? 'run',
      source: 'player',
      position,
    });
  }
}
