/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Módulo Central de Estações 3D — Proposta 1
 */

import { StageId, StationBuildContext, StationInstance } from './types';
import { createFoodSelectStation } from './FoodSelectStation';
import { createFirstBiteStation } from './FirstBiteStation';
import { createMouthStation } from './MouthStation';
import { createSwallowStation } from './SwallowStation';
import { createEsophagusStation } from './EsophagusStation';
import { createStomachStation } from './StomachStation';
import { createSmallIntestineStation } from './SmallIntestineStation';
import { createLargeIntestineStation } from './LargeIntestineStation';
import { createFinalDioramaStation } from './FinalDioramaStation';

export * from './types';
export {
  createFoodSelectStation,
  createFirstBiteStation,
  createMouthStation,
  createSwallowStation,
  createEsophagusStation,
  createStomachStation,
  createSmallIntestineStation,
  createLargeIntestineStation,
  createFinalDioramaStation
};

export function createAllStations(ctx: StationBuildContext): Record<StageId, StationInstance> {
  return {
    food_select: createFoodSelectStation(ctx),
    first_bite: createFirstBiteStation(ctx),
    mouth: createMouthStation(ctx),
    swallow: createSwallowStation(ctx),
    esophagus: createEsophagusStation(ctx),
    stomach: createStomachStation(ctx),
    small_intestine: createSmallIntestineStation(ctx),
    large_intestine: createLargeIntestineStation(ctx),
    final_ordering: createFinalDioramaStation(ctx)
  };
}
