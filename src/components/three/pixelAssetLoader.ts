/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Processador HD-2D de Assets 16-Bit para Three.js e Canvas UI
 * - Remove automaticamente o fundo cinza neutro (~#525252) dos JPGs enviados via flood-fill BFS a partir das bordas.
 * - Preserva 100% os contornos escuros internos do pixel art e aplica THREE.NearestFilter + SRGBColorSpace.
 * - Gera variantes "mordidas" em 16-bit para a animação de primeira mordida em 3D.
 * - Reveste o túnel muscular 3D do esôfago com o asset de parede muscular interna enviada.
 */

import * as THREE from 'three';

export const UPLOADED_16BIT_ASSETS = {
  apple: '/assets/aistudio/16-bit_apple_game_asset_20261020204251_f00e3ed8.jpg',
  bread: '/assets/aistudio/Make_sliced_loaf_of_bread_20261020204251_d2b5d8e5.jpg',
  carrot: '/assets/aistudio/Create_a_carrot_20261020204251_440611fe.jpg',
  drop: '/assets/aistudio/Create_a_saliva_drop_20261020204251_807481a6.jpg',
  esophagusTube: '/assets/aistudio/Creating_esophagus_game_environment_20261020204251_1988dd9b.jpg',
  esophagusWall: '/assets/aistudio/Criar_es_fago_estilo_game_20261020204251_193662d4.jpg'
} as const;

const cutoutCanvasCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Remove o fundo cinza neutro sólido conectado às bordas da imagem via BFS Flood-Fill,
 * mantendo intactas todas as cores e contornos internos do sprite 16-bit.
 */
export async function getCutoutSpriteCanvas(
  src: string,
  targetSize = 256
): Promise<HTMLCanvasElement> {
  const cacheKey = `${src}::${targetSize}`;
  const cached = cutoutCanvasCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const img = await loadHtmlImage(src);
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, targetSize, targetSize);

    const imgData = ctx.getImageData(0, 0, targetSize, targetSize);
    const data = imgData.data;

    // Amostra os 4 cantos para detectar a cor exata do fundo neutro do asset
    const corners = [
      0,
      (targetSize - 1) * 4,
      targetSize * (targetSize - 1) * 4,
      (targetSize * targetSize - 1) * 4
    ];
    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    for (const c of corners) {
      bgR += data[c];
      bgG += data[c + 1];
      bgB += data[c + 2];
    }
    bgR /= 4;
    bgG /= 4;
    bgB /= 4;

    const totalPixels = targetSize * targetSize;
    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let head = 0;
    let tail = 0;

    const thresholdSq = 38 * 38;

    const matchesBg = (pixelIdx: number): boolean => {
      const i = pixelIdx * 4;
      const dr = data[i] - bgR;
      const dg = data[i + 1] - bgG;
      const db = data[i + 2] - bgB;
      return dr * dr + dg * dg + db * db <= thresholdSq;
    };

    const enqueueIfBg = (x: number, y: number) => {
      if (x < 0 || x >= targetSize || y < 0 || y >= targetSize) return;
      const p = y * targetSize + x;
      if (visited[p]) return;
      if (matchesBg(p)) {
        visited[p] = 1;
        queue[tail++] = p;
      }
    };

    // Inicia pelas 4 bordas
    for (let x = 0; x < targetSize; x++) {
      enqueueIfBg(x, 0);
      enqueueIfBg(x, targetSize - 1);
    }
    for (let y = 0; y < targetSize; y++) {
      enqueueIfBg(0, y);
      enqueueIfBg(targetSize - 1, y);
    }

    while (head < tail) {
      const p = queue[head++];
      const i = p * 4;
      data[i + 3] = 0; // Transparente

      const x = p % targetSize;
      const y = (p - x) / targetSize;

      enqueueIfBg(x + 1, y);
      enqueueIfBg(x - 1, y);
      enqueueIfBg(x, y + 1);
      enqueueIfBg(x, y - 1);
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas;
  })();

  cutoutCanvasCache.set(cacheKey, promise);
  return promise;
}

/**
 * Cria um CanvasTexture Three.js nítido (NearestFilter + SRGBColorSpace) a partir de um canvas fonte,
 * opcionalmente recortando uma mordida em estilo pixel-art no canto superior esquerdo.
 */
export function canvasToCrispPixelTexture(
  sourceCanvas: HTMLCanvasElement,
  bitten = false
): THREE.CanvasTexture {
  let finalCanvas = sourceCanvas;

  if (bitten) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sourceCanvas, 0, 0);

      // Aplica recorte escalonado 16-bit simulando uma mordida macia na lateral superior esquerda
      ctx.globalCompositeOperation = 'destination-out';
      const step = Math.max(8, Math.floor(w / 16));
      const biteBlocks = [
        [3, 4, 4, 4],
        [2, 5, 5, 3],
        [4, 3, 3, 2]
      ];
      ctx.fillStyle = '#000000';
      for (const [bx, by, bw, bh] of biteBlocks) {
        ctx.fillRect(bx * step, by * step, bw * step, bh * step);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    finalCanvas = c;
  }

  const tex = new THREE.CanvasTexture(finalCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Gera o sprite 16-bit recortado do Ovo Cozido (para harmonizar perfeitamente em HD-2D com Maçã, Pão e Cenoura).
 */
export function createPixelEggCutoutTexture(bitten = false): THREE.CanvasTexture {
  const grid = 32;
  const scale = 8;
  const canvas = document.createElement('canvas');
  canvas.width = grid * scale;
  canvas.height = grid * scale;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    const px = (x: number, y: number, w: number, h: number, fill: string) => {
      ctx.fillStyle = fill;
      ctx.fillRect(x * scale, y * scale, w * scale, h * scale);
    };

    // Contorno escuro estilo 16-bit idêntico aos demais assets enviados
    px(12, 4, 8, 2, '#1E1B2E');
    px(9, 6, 3, 3, '#1E1B2E');
    px(20, 6, 3, 3, '#1E1B2E');
    px(7, 9, 2, 13, '#1E1B2E');
    px(23, 9, 2, 13, '#1E1B2E');
    px(9, 22, 3, 3, '#1E1B2E');
    px(20, 22, 3, 3, '#1E1B2E');
    px(12, 25, 8, 2, '#1E1B2E');

    // Clara branca iluminada e sombra lateral 16-bit
    px(12, 6, 8, 19, '#F8FAFC');
    px(9, 9, 14, 13, '#F8FAFC');
    px(11, 8, 10, 15, '#FFFFFF');
    px(19, 10, 4, 11, '#CBD5E1');
    px(14, 23, 6, 2, '#CBD5E1');
    px(11, 9, 3, 3, '#FFFFFF');

    // Gema dourada nutritiva rica em proteínas
    px(12, 13, 8, 8, '#D97706');
    px(11, 14, 10, 6, '#F59E0B');
    px(12, 14, 7, 5, '#FBBF24');
    px(13, 15, 3, 2, '#FEF3C7');
  }

  return canvasToCrispPixelTexture(canvas, bitten);
}

/**
 * Carrega a textura muscular interna 16-bit do esôfago para mapear no cilindro/túnel 3D.
 */
export async function loadEsophagusWallTexture(
  renderer: THREE.WebGLRenderer
): Promise<THREE.Texture> {
  const img = await loadHtmlImage(UPLOADED_16BIT_ASSETS.esophagusWall);
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

export interface LoadedHD2DAssetPack {
  foods: {
    maca: { whole: THREE.CanvasTexture; bitten: THREE.CanvasTexture };
    pao: { whole: THREE.CanvasTexture; bitten: THREE.CanvasTexture };
    cenoura: { whole: THREE.CanvasTexture; bitten: THREE.CanvasTexture };
    ovo: { whole: THREE.CanvasTexture; bitten: THREE.CanvasTexture };
  };
  drop: THREE.CanvasTexture;
  esophagusTube: THREE.CanvasTexture;
  esophagusWall: THREE.Texture;
  disposeAll: () => void;
}

/**
 * Carrega em paralelo todos os 6 assets 16-bit enviados + Ovo 16-bit, prontos para uso na cena Three.js.
 */
export async function loadAllProposta1HD2DAssets(
  renderer: THREE.WebGLRenderer
): Promise<LoadedHD2DAssetPack> {
  const [appleCanvas, breadCanvas, carrotCanvas, dropCanvas, esoTubeCanvas, esoWallTex] =
    await Promise.all([
      getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.apple, 256),
      getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.bread, 256),
      getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.carrot, 256),
      getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.drop, 256),
      getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.esophagusTube, 256),
      loadEsophagusWallTexture(renderer)
    ]);

  const pack: LoadedHD2DAssetPack = {
    foods: {
      maca: {
        whole: canvasToCrispPixelTexture(appleCanvas, false),
        bitten: canvasToCrispPixelTexture(appleCanvas, true)
      },
      pao: {
        whole: canvasToCrispPixelTexture(breadCanvas, false),
        bitten: canvasToCrispPixelTexture(breadCanvas, true)
      },
      cenoura: {
        whole: canvasToCrispPixelTexture(carrotCanvas, false),
        bitten: canvasToCrispPixelTexture(carrotCanvas, true)
      },
      ovo: {
        whole: createPixelEggCutoutTexture(false),
        bitten: createPixelEggCutoutTexture(true)
      }
    },
    drop: canvasToCrispPixelTexture(dropCanvas, false),
    esophagusTube: canvasToCrispPixelTexture(esoTubeCanvas, false),
    esophagusWall: esoWallTex,
    disposeAll: () => {
      pack.foods.maca.whole.dispose();
      pack.foods.maca.bitten.dispose();
      pack.foods.pao.whole.dispose();
      pack.foods.pao.bitten.dispose();
      pack.foods.cenoura.whole.dispose();
      pack.foods.cenoura.bitten.dispose();
      pack.foods.ovo.whole.dispose();
      pack.foods.ovo.bitten.dispose();
      pack.drop.dispose();
      pack.esophagusTube.dispose();
      pack.esophagusWall.dispose();
    }
  };

  return pack;
}
