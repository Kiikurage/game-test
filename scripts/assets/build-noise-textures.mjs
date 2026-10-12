// 使い方:
//   npm run assets:noise            マテリアル用の焼いたノイズ（#326）を生成して public/assets/noise/ に書く
//   npm run assets:noise -- --check 生成し直した結果がコミット済みのファイルとバイト単位で一致するか検査する
//
// 実行時のノイズ（mx_noise・hash・ロード時のベイク）を使わず、ここで焼いたテクスチャを引く（tech-direction §3.4）。
// 中身は scripts/assets/noise.mjs。数値データなので非圧縮の KTX2（ミップマップなし、リニア）で書く:
//   perlin.ktx2  512² R16G16_SFLOAT  3D パーリンのアトラス（勾配から法線を作る箇所があり 8bit では階段になる）
//   cells.ktx2   512² R8G8_UNORM     R = 白色ノイズ（ハッシュの代わり）、G = セルノイズの F2 − F1
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KHR_DF_CHANNEL_RGBSDA_GREEN,
  KHR_DF_CHANNEL_RGBSDA_RED,
  KHR_DF_MODEL_RGBSDA,
  KHR_DF_PRIMARIES_UNSPECIFIED,
  KHR_DF_SAMPLE_DATATYPE_FLOAT,
  KHR_DF_SAMPLE_DATATYPE_SIGNED,
  KHR_DF_TRANSFER_LINEAR,
  KHR_SUPERCOMPRESSION_NONE,
  VK_FORMAT_R16G16_SFLOAT,
  VK_FORMAT_R8G8_UNORM,
  createDefaultContainer,
  write,
} from 'ktx-parse';
import { ATLAS, CELLS_SIZE, bakeCells, bakePerlin, buildNoiseAtlas } from './noise.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'public', 'assets', 'noise');

/** 2 チャンネル（R, G）の非圧縮 KTX2。`bytes` はチャンネル 1 つのバイト数（1 = UNORM8、2 = SFLOAT16）。 */
function rawKtx2(width, height, data, bytes) {
  const c = createDefaultContainer();
  c.vkFormat = bytes === 2 ? VK_FORMAT_R16G16_SFLOAT : VK_FORMAT_R8G8_UNORM;
  c.typeSize = bytes;
  c.pixelWidth = width;
  c.pixelHeight = height;
  c.pixelDepth = 0;
  c.levelCount = 1;
  c.supercompressionScheme = KHR_SUPERCOMPRESSION_NONE;
  const levelData = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  c.levels = [{ levelData, uncompressedByteLength: levelData.byteLength }];
  const dfd = c.dataFormatDescriptor[0];
  dfd.colorModel = KHR_DF_MODEL_RGBSDA;
  dfd.colorPrimaries = KHR_DF_PRIMARIES_UNSPECIFIED;
  dfd.transferFunction = KHR_DF_TRANSFER_LINEAR;
  dfd.texelBlockDimension = [0, 0, 0, 0];
  dfd.bytesPlane = [bytes * 2, 0, 0, 0, 0, 0, 0, 0];
  const float = bytes === 2;
  const type = float ? KHR_DF_SAMPLE_DATATYPE_FLOAT | KHR_DF_SAMPLE_DATATYPE_SIGNED : 0;
  dfd.samples = [KHR_DF_CHANNEL_RGBSDA_RED, KHR_DF_CHANNEL_RGBSDA_GREEN].map((ch, i) => ({
    bitOffset: i * bytes * 8,
    bitLength: bytes * 8 - 1,
    channelType: ch | type,
    samplePosition: [0, 0, 0, 0],
    // 半精度は -1.0 / 1.0 のビット列、UNORM8 は 0 / 255
    sampleLower: float ? 0xbf800000 : 0,
    sampleUpper: float ? 0x3f800000 : 255,
  }));
  c.keyValue = {};
  return Buffer.from(write(c, { keepWriter: false }));
}

function build() {
  return {
    'perlin.ktx2': rawKtx2(ATLAS, ATLAS, buildNoiseAtlas(bakePerlin()), 2),
    'cells.ktx2': rawKtx2(CELLS_SIZE, CELLS_SIZE, bakeCells(), 1),
  };
}

const checkOnly = process.argv.includes('--check');
const files = build();
mkdirSync(OUT_DIR, { recursive: true });
let mismatch = 0;
for (const [name, data] of Object.entries(files)) {
  const path = join(OUT_DIR, name);
  if (checkOnly) {
    let same;
    try {
      same = readFileSync(path).equals(data);
    } catch {
      same = false;
    }
    if (!same) {
      console.error(`mismatch: ${name}`);
      mismatch++;
    }
  } else {
    writeFileSync(path, data);
    console.log(`${name} ${data.length} bytes`);
  }
}
if (checkOnly) {
  if (mismatch > 0) process.exit(1);
  console.log('noise textures are up to date');
}
