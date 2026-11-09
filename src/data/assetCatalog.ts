/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Catálogo Canônico de Assets — Segundo Cérebro & Governança
 * Centraliza os caminhos oficiais e fallbacks dos assets visuais do projeto.
 */

export interface AssetEntry {
  id: string;
  officialPath: string;
  fallbackPath: string;
  isNativeAlpha: boolean;
  label: string;
  hasOfficial?: boolean;
}

export const ASSET_CATALOG = {
  // Grupo A: Alimentos 16-Bit
  foods: {
    apple: {
      id: 'food-apple',
      officialPath: '/assets/2d/foods/apple.png',
      fallbackPath: '/assets/2d/foods/apple-test.jpg',
      isNativeAlpha: true,
      label: 'Maçã 16-Bit'
    },
    appleBitten: {
      id: 'food-apple-bitten',
      officialPath: '/assets/2d/foods/apple-bitten.png',
      fallbackPath: '/assets/2d/foods/apple-bitten-test.jpg',
      isNativeAlpha: true,
      label: 'Maçã Mordida 16-Bit'
    },
    bread: {
      id: 'food-bread',
      officialPath: '/assets/2d/foods/bread.png',
      fallbackPath: '/assets/2d/foods/bread-test.jpg',
      isNativeAlpha: true,
      label: 'Pão Fatiado 16-Bit'
    },
    breadBitten: {
      id: 'food-bread-bitten',
      officialPath: '/assets/2d/foods/bread-bitten.png',
      fallbackPath: '/assets/2d/foods/bread-bitten-test.jpg',
      isNativeAlpha: true,
      label: 'Pão Fatiado Mordido 16-Bit'
    },
    carrot: {
      id: 'food-carrot',
      officialPath: '/assets/2d/foods/carrot.png',
      fallbackPath: '/assets/2d/foods/carrot-test.jpg',
      isNativeAlpha: true,
      label: 'Cenoura 16-Bit'
    },
    carrotBitten: {
      id: 'food-carrot-bitten',
      officialPath: '/assets/2d/foods/carrot-bitten.png',
      fallbackPath: '/assets/2d/foods/carrot-bitten-test.jpg',
      isNativeAlpha: true,
      label: 'Cenoura Mordida 16-Bit'
    },
    egg: {
      id: 'food-egg',
      officialPath: '/assets/2d/foods/egg.png',
      fallbackPath: '/assets/2d/foods/egg-test.jpg',
      isNativeAlpha: true,
      label: 'Ovo Cozido 16-Bit'
    },
    eggBitten: {
      id: 'food-egg-bitten',
      officialPath: '/assets/2d/foods/egg-bitten.png',
      fallbackPath: '/assets/2d/foods/egg-bitten-test.jpg',
      isNativeAlpha: true,
      label: 'Ovo Cozido Mordido 16-Bit'
    },
    appleCrumbs: {
      id: 'food-crumbs-apple',
      officialPath: '/assets/2d/foods/apple-crumbs.png',
      fallbackPath: '',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Partículas de Maçã Triturada 16-Bit'
    },
    breadCrumbs: {
      id: 'food-crumbs-bread',
      officialPath: '/assets/2d/foods/bread-crumbs.png',
      fallbackPath: '',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Partículas de Pão Triturado 16-Bit'
    },
    carrotCrumbs: {
      id: 'food-crumbs-carrot',
      officialPath: '/assets/2d/foods/carrot-crumbs.png',
      fallbackPath: '',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Partículas de Cenoura Triturada 16-Bit'
    },
    eggCrumbs: {
      id: 'food-crumbs-egg',
      officialPath: '/assets/2d/foods/egg-crumbs.png',
      fallbackPath: '',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Partículas de Ovo Triturado 16-Bit'
    },
    bolusFormed: {
      id: 'bolus-formed',
      officialPath: '/assets/2d/foods/bolus-formed.png',
      fallbackPath: '',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Bolo Alimentar Úmido Formado 16-Bit'
    }
  },

  // Grupo B: Fluidos e Partículas Fisiológicas
  fluids: {
    saliva: {
      id: 'fluid-saliva',
      officialPath: '/assets/2d/fluids-particles/saliva-drop.png',
      fallbackPath: '/assets/2d/fluids-particles/saliva-drop-test.jpg',
      isNativeAlpha: true,
      label: 'Gota de Saliva 16-Bit'
    },
    gastric: {
      id: 'fluid-gastric',
      officialPath: '/assets/2d/fluids-particles/gastric-drop.png',
      fallbackPath: '/assets/2d/fluids-particles/gastric-drop.jpg',
      isNativeAlpha: true,
      label: 'Gota de Suco Gástrico 16-Bit'
    },
    water: {
      id: 'fluid-water',
      officialPath: '/assets/2d/fluids-particles/water-drop.png',
      fallbackPath: '/assets/2d/fluids-particles/water-drop-test.jpg',
      isNativeAlpha: true,
      label: 'Gota de Água 16-Bit'
    },
    nutrientEnergy: {
      id: 'particle-carb',
      officialPath: '/assets/2d/fluids-particles/nutrient-energy.png',
      fallbackPath: '/assets/2d/fluids-particles/nutrient-energy-test.jpg',
      isNativeAlpha: true,
      label: 'Nutriente Energia (Amido / Carboidrato)'
    },
    nutrientProtein: {
      id: 'particle-protein',
      officialPath: '/assets/2d/fluids-particles/nutrient-protein.png',
      fallbackPath: '/assets/2d/fluids-particles/nutrient-protein-teste.jpg',
      isNativeAlpha: true,
      label: 'Nutriente Proteína (Aminoácidos)'
    },
    nutrientVitamin: {
      id: 'particle-vitamin',
      officialPath: '/assets/2d/fluids-particles/nutrient-vitamin.png',
      fallbackPath: '/assets/2d/fluids-particles/nutrient-vitamin-test.jpg',
      isNativeAlpha: true,
      label: 'Nutriente Vitaminas e Minerais'
    }
  },

  // Grupo C: Órgãos e HUD
  organs: {
    esophagusTube: {
      id: 'hud-esophagus',
      officialPath: '/assets/2d/organs-hud/organ-esophagus.png',
      fallbackPath: '/assets/2d/organs-hud/esophagus-tube-test.jpg',
      isNativeAlpha: false,
      hasOfficial: false,
      label: 'Tubo do Esôfago 16-Bit'
    }
  },

  // Grupo E: Texturas 3D
  textures3D: {
    esophagusMucosa: {
      id: 'tex-esophagus-mucosa',
      officialPath: '/assets/3d/textures/esophagus-mucosa.png',
      fallbackPath: '/assets/3d/textures/esophagus-mucosa-test.jpg',
      isNativeAlpha: true,
      hasOfficial: false,
      label: 'Textura Mucosa Esofágica'
    }
  },

  // Documentação e Apoio
  docs: {
    pdfProjeto: '/assets/docs/projeto-biodesign-fmu.pdf'
  }
} as const;

/**
 * Retorna o melhor caminho disponível para o asset, usando o oficial
 * prioritariamente se disponível e o fallback se o oficial ainda não existir.
 */
export function getAssetPath(asset: { officialPath: string; fallbackPath?: string; hasOfficial?: boolean }): string {
  if (asset.hasOfficial === false && asset.fallbackPath) {
    return asset.fallbackPath;
  }
  return asset.officialPath || asset.fallbackPath || '';
}
