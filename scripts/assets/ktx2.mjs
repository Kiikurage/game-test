// テクスチャを KTX2（Basis Universal）へエンコードする共通処理（#328）。
// エンコーダは npm の ktx2-encoder（Basis の公式エンコーダを wasm 化したもの）。外部コマンド（toktx 等）は使わない。
// 入力画像のデコードは sharp。ミップマップはエンコーダが生成する。
//
// 種類ごとの設定:
//   color : ETC1S（sRGB）。ベースカラー。小さく配れる
//   linear: ETC1S（リニア）。メタリック・ラフネス
//   normal: UASTC + RDO + Zstandard（リニア、法線マップ用の設定）
//   data  : UASTC + Zstandard（リニア）。水の勾配などの数値データ。ブロック誤差を抑えるため RDO はかけない
import { encodeToKTX2 } from 'ktx2-encoder';
import sharp from 'sharp';

/** @typedef {'color' | 'linear' | 'normal' | 'data'} Ktx2Kind */

const PRESETS = {
  color: {
    isUASTC: false,
    qualityLevel: 128,
    compressionLevel: 4,
    isPerceptual: true,
    isSetKTX2SRGBTransferFunc: true,
  },
  linear: {
    isUASTC: false,
    qualityLevel: 128,
    compressionLevel: 4,
    isPerceptual: false,
    isSetKTX2SRGBTransferFunc: false,
  },
  normal: {
    isUASTC: false,
    qualityLevel: 255,
    compressionLevel: 4,
    isNormalMap: true,
    isPerceptual: false,
    isSetKTX2SRGBTransferFunc: false,
  },
  data: {
    isUASTC: true,
    uastcLDRQualityLevel: 3,
    needSupercompression: true,
    isPerceptual: false,
    isSetKTX2SRGBTransferFunc: false,
  },
};

async function decode(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data) };
}

/**
 * 画像（PNG / WebP / JPEG 等、sharp が読めるもの）を KTX2 にする。
 * flipY: 先頭行を下にして格納する（TextureLoader の既定 flipY=true で読んでいた画像と同じ向きにする。glTF 内のテクスチャは false）。
 * @param {Uint8Array} image
 * @param {Ktx2Kind} kind
 * @param {{ flipY?: boolean }} [opts]
 * @returns {Promise<Uint8Array>}
 */
export async function encodeKtx2(image, kind, opts = {}) {
  return encodeToKTX2(image, {
    ...PRESETS[kind],
    isKTX2File: true,
    generateMipmap: true,
    isYFlip: opts.flipY ?? false,
    imageDecoder: decode,
  });
}
