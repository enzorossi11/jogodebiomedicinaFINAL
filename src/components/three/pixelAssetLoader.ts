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
import { ASSET_CATALOG, getAssetPath } from '../../data/assetCatalog';

export const UPLOADED_16BIT_ASSETS = {
  apple: getAssetPath(ASSET_CATALOG.foods.apple),
  appleBitten: getAssetPath(ASSET_CATALOG.foods.appleBitten),
  bread: getAssetPath(ASSET_CATALOG.foods.bread),
  breadBitten: getAssetPath(ASSET_CATALOG.foods.breadBitten),
  carrot: getAssetPath(ASSET_CATALOG.foods.carrot),
  carrotBitten: getAssetPath(ASSET_CATALOG.foods.carrotBitten),
  egg: getAssetPath(ASSET_CATALOG.foods.egg),
  eggBitten: getAssetPath(ASSET_CATALOG.foods.eggBitten),
  salivaDrop: getAssetPath(ASSET_CATALOG.fluids.saliva),
  gastricDrop: getAssetPath(ASSET_CATALOG.fluids.gastric),
  waterDrop: getAssetPath(ASSET_CATALOG.fluids.water),
  nutrientEnergy: getAssetPath(ASSET_CATALOG.fluids.nutrientEnergy),
  nutrientProtein: getAssetPath(ASSET_CATALOG.fluids.nutrientProtein),
  nutrientVitamin: getAssetPath(ASSET_CATALOG.fluids.nutrientVitamin),
  drop: getAssetPath(ASSET_CATALOG.fluids.saliva),
  esophagusTube: getAssetPath(ASSET_CATALOG.organs.esophagusTube),
  esophagusWall: getAssetPath(ASSET_CATALOG.textures3D.esophagusMucosa)
} as const;

const cutoutCanvasCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Fonte de imagem vazia'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Cria um canvas procedural de segurança para evitar texturas em branco caso
 * algum arquivo de imagem não seja encontrado ou falhe na rede.
 */
export function createProceduralFallbackCanvas(
  label: string,
  color = '#10b981',
  size = 256
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Borda pixel art suave
  const pad = 24;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(pad - 4, pad - 4, size - (pad - 4) * 2, size - (pad - 4) * 2);

  // Preenchimento com a cor tema do nutriente/alimento
  ctx.fillStyle = color;
  ctx.fillRect(pad, pad, size - pad * 2, size - pad * 2);

  // Texto amigável centralizado
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.slice(0, 10), size / 2, size / 2);

  return canvas;
}

/**
 * Remove o fundo cinza neutro sólido conectado às bordas da imagem via BFS Flood-Fill,
 * mantendo intactas todas as cores e contornos internos do sprite 16-bit.
 * Inclui tratamento com fallback automático e canvas procedural de emergência.
 */
export async function getCutoutSpriteCanvas(
  src: string,
  targetSize = 256,
  fallbackSrc?: string,
  label = 'Asset',
  fallbackColor = '#10b981'
): Promise<HTMLCanvasElement> {
  const cacheKey = `${src}::${targetSize}::${fallbackSrc ?? ''}`;
  const cached = cutoutCanvasCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<HTMLCanvasElement> => {
    let img: HTMLImageElement | null = null;
    let actualSrc = src;

    try {
      img = await loadHtmlImage(src);
    } catch {
      if (fallbackSrc && fallbackSrc !== src) {
        try {
          img = await loadHtmlImage(fallbackSrc);
          actualSrc = fallbackSrc;
        } catch {
          // Ambos falharam
        }
      }
    }

    if (!img) {
      console.warn(`[pixelAssetLoader] Usando fallback procedural para: "${label}" (${src})`);
      return createProceduralFallbackCanvas(label, fallbackColor, targetSize);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return canvas;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, targetSize, targetSize);

    // Se o asset for nativamente transparente (PNG/SVG), não precisa de flood-fill de remoção de fundo
    if (actualSrc.toLowerCase().endsWith('.png') || actualSrc.toLowerCase().endsWith('.svg') || actualSrc.startsWith('data:image/png')) {
      return canvas;
    }

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
 * Possui fallback automático e textura procedural de emergência.
 */
export async function loadEsophagusWallTexture(
  renderer: THREE.WebGLRenderer
): Promise<THREE.Texture> {
  let img: HTMLImageElement | null = null;
  const primarySrc = UPLOADED_16BIT_ASSETS.esophagusWall;
  const fallbackSrc = ASSET_CATALOG.textures3D.esophagusMucosa.fallbackPath;

  try {
    img = await loadHtmlImage(primarySrc);
  } catch {
    if (fallbackSrc && fallbackSrc !== primarySrc) {
      try {
        img = await loadHtmlImage(fallbackSrc);
      } catch {
        // Falha no fallback
      }
    }
  }

  let tex: THREE.Texture;
  if (img) {
    tex = new THREE.Texture(img);
  } else {
    // Textura procedural suave em tons de mucosa rosa/rubi
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#be123c';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#fb7185';
      for (let y = 0; y < 128; y += 16) {
        ctx.fillRect(0, y, 128, 8);
      }
    }
    tex = new THREE.CanvasTexture(c);
  }

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
  drops: {
    saliva: THREE.CanvasTexture;
    gastric: THREE.CanvasTexture;
    water: THREE.CanvasTexture;
  };
  nutrients: {
    energy: THREE.CanvasTexture;
    protein: THREE.CanvasTexture;
    vitamin: THREE.CanvasTexture;
  };
  drop: THREE.CanvasTexture;
  esophagusTube: THREE.CanvasTexture;
  esophagusWall: THREE.Texture;
  disposeAll: () => void;
}

/**
 * Carrega em paralelo todos os assets 16-bit oficiais com resiliência total a falhas.
 */
export async function loadAllProposta1HD2DAssets(
  renderer: THREE.WebGLRenderer
): Promise<LoadedHD2DAssetPack> {
  const [
    appleCanvas,
    appleBittenCanvas,
    breadCanvas,
    breadBittenCanvas,
    carrotCanvas,
    carrotBittenCanvas,
    eggCanvas,
    eggBittenCanvas,
    salivaCanvas,
    gastricCanvas,
    waterCanvas,
    nutEnergyCanvas,
    nutProteinCanvas,
    nutVitaminCanvas,
    esoTubeCanvas,
    esoWallTex
  ] = await Promise.all([
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.apple, 256, ASSET_CATALOG.foods.apple.fallbackPath, 'Maçã', '#ef4444'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.appleBitten, 256, ASSET_CATALOG.foods.appleBitten.fallbackPath, 'Maçã', '#ef4444'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.bread, 256, ASSET_CATALOG.foods.bread.fallbackPath, 'Pão', '#d97706'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.breadBitten, 256, ASSET_CATALOG.foods.breadBitten.fallbackPath, 'Pão', '#d97706'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.carrot, 256, ASSET_CATALOG.foods.carrot.fallbackPath, 'Cenoura', '#f97316'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.carrotBitten, 256, ASSET_CATALOG.foods.carrotBitten.fallbackPath, 'Cenoura', '#f97316'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.egg, 256, ASSET_CATALOG.foods.egg.fallbackPath, 'Ovo', '#f59e0b'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.eggBitten, 256, ASSET_CATALOG.foods.eggBitten.fallbackPath, 'Ovo', '#f59e0b'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.salivaDrop, 256, ASSET_CATALOG.fluids.saliva.fallbackPath, 'Saliva', '#38bdf8'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.gastricDrop, 256, ASSET_CATALOG.fluids.gastric.fallbackPath, 'Gástrico', '#10b981'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.waterDrop, 256, ASSET_CATALOG.fluids.water.fallbackPath, 'Água', '#60a5fa'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.nutrientEnergy, 256, ASSET_CATALOG.fluids.nutrientEnergy.fallbackPath, 'Energia', '#facc15'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.nutrientProtein, 256, ASSET_CATALOG.fluids.nutrientProtein.fallbackPath, 'Proteína', '#818cf8'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.nutrientVitamin, 256, ASSET_CATALOG.fluids.nutrientVitamin.fallbackPath, 'Vitamina', '#34d399'),
    getCutoutSpriteCanvas(UPLOADED_16BIT_ASSETS.esophagusTube, 256, ASSET_CATALOG.organs.esophagusTube.fallbackPath, 'Esôfago', '#fb7185'),
    loadEsophagusWallTexture(renderer)
  ]);

  const salivaDropTex = canvasToCrispPixelTexture(salivaCanvas, false);
  const gastricDropTex = canvasToCrispPixelTexture(gastricCanvas, false);
  const waterDropTex = canvasToCrispPixelTexture(waterCanvas, false);

  const pack: LoadedHD2DAssetPack = {
    foods: {
      maca: {
        whole: canvasToCrispPixelTexture(appleCanvas, false),
        bitten: canvasToCrispPixelTexture(appleBittenCanvas, false)
      },
      pao: {
        whole: canvasToCrispPixelTexture(breadCanvas, false),
        bitten: canvasToCrispPixelTexture(breadBittenCanvas, false)
      },
      cenoura: {
        whole: canvasToCrispPixelTexture(carrotCanvas, false),
        bitten: canvasToCrispPixelTexture(carrotBittenCanvas, false)
      },
      ovo: {
        whole: canvasToCrispPixelTexture(eggCanvas, false),
        bitten: canvasToCrispPixelTexture(eggBittenCanvas, false)
      }
    },
    drops: {
      saliva: salivaDropTex,
      gastric: gastricDropTex,
      water: waterDropTex
    },
    nutrients: {
      energy: canvasToCrispPixelTexture(nutEnergyCanvas, false),
      protein: canvasToCrispPixelTexture(nutProteinCanvas, false),
      vitamin: canvasToCrispPixelTexture(nutVitaminCanvas, false)
    },
    drop: salivaDropTex,
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
      pack.drops.saliva.dispose();
      pack.drops.gastric.dispose();
      pack.drops.water.dispose();
      pack.nutrients.energy.dispose();
      pack.nutrients.protein.dispose();
      pack.nutrients.vitamin.dispose();
      pack.esophagusTube.dispose();
      pack.esophagusWall.dispose();
    }
  };

  return pack;
}
