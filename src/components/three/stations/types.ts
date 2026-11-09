/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Contratos e Tipos para as Estações 3D da Proposta 1
 */

import * as THREE from 'three';
import { ActiveScreen } from '../../StageProgressBar';
import { FoodId } from '../../FoodSelector';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';

export type StageId = Exclude<ActiveScreen, 'hub'>;

export interface SharedMaterials {
  porcelainMat: THREE.MeshPhysicalMaterial;
  woodTableMat: THREE.MeshStandardMaterial;
  bolusGoldMat: THREE.MeshStandardMaterial;
  toothEnamelMat: THREE.MeshPhysicalMaterial;
  mucosaPinkMat: THREE.MeshPhysicalMaterial;
  mucosaDeepMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshPhysicalMaterial;
}

export interface StationBuildContext {
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  registerInteractive: (
    obj: THREE.Object3D,
    stageOwner: StageId,
    hint: string,
    actionType: string,
    payload?: number | string
  ) => void;
  createHD2DSpritePlane: (size: number) => { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial };
  isSoftwareGl: boolean;
  sharedMaterials: SharedMaterials;
}

export interface StationInstance {
  group: THREE.Group;
  applyAssets?: (pack: LoadedHD2DAssetPack) => void;
  update: (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => void;
  dispose?: () => void;
}
