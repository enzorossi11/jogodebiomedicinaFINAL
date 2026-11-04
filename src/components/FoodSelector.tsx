/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Catálogo Validado dos 4 Alimentos da Proposta 1 ("A Viagem do Alimento"):
 * - Maçã (asset 16-bit enviado + escopo PDF: fibras)
 * - Pão Fatiado (asset 16-bit enviado + escopo PDF: amido na boca)
 * - Cenoura (asset 16-bit enviado: betacaroteno/vitamina A e fibras)
 * - Ovo (escopo PDF: proteínas digeridas no estômago)
 */

import React from 'react';
import { PixelApple, PixelBread, PixelCarrot, PixelEgg } from './PixelArtAssets';

export type FoodId = 'maca' | 'pao' | 'cenoura' | 'ovo';

export interface FoodOption {
  id: FoodId;
  name: string;
  category: string;
  desc: string;
  accentHex: string;
  nutrientMain: string;
  svgIcon: React.ReactNode;
}

export const FOOD_OPTIONS: FoodOption[] = [
  {
    id: 'maca',
    name: 'Maçã',
    category: 'Fibras e Vitaminas',
    desc: 'Rica em fibras e água, ajudando o intestino a funcionar com conforto.',
    accentHex: '#EF4444',
    nutrientMain: 'Fibras e Água',
    svgIcon: <PixelApple size={52} />
  },
  {
    id: 'pao',
    name: 'Pão',
    category: 'Carboidrato (Amido)',
    desc: 'Fonte de energia. A digestão do amido começa logo na boca com a saliva.',
    accentHex: '#D97706',
    nutrientMain: 'Amido (Energia)',
    svgIcon: <PixelBread size={52} />
  },
  {
    id: 'cenoura',
    name: 'Cenoura',
    category: 'Vitamina A e Fibras',
    desc: 'Crocante e nutritiva, estimula a mastigação e traz vitamina A e fibras.',
    accentHex: '#F97316',
    nutrientMain: 'Vitamina A e Fibras',
    svgIcon: <PixelCarrot size={52} />
  },
  {
    id: 'ovo',
    name: 'Ovo',
    category: 'Proteínas',
    desc: 'Rico em proteínas construtoras, cuja digestão começa nos sucos do estômago.',
    accentHex: '#0284C7',
    nutrientMain: 'Proteínas',
    svgIcon: <PixelEgg size={52} />
  }
];
