/**
 * three のレイヤー割り当て。
 *
 * - 0: 通常（メインカメラが描く）。
 * - `SHADOW_PROXY_LAYER`: シャドウパスだけが描くメッシュ（キャラクターの簡略シャドウ用メッシュ）。
 *   メインカメラは見ない。太陽のシャドウカメラだけがこのレイヤーを有効にしている（`environment.ts`）。
 */
export const SHADOW_PROXY_LAYER = 1;
