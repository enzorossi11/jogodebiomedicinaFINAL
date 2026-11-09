/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 9: final_ordering (Diorama 3D do Tronco Translúcido Completo)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

const _curvePt = new THREE.Vector3();

export function createFinalDioramaStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const torsoShellMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xcbd5e1,
      roughness: 0.22,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      clearcoat: 0.5
    })
  );
  const finalTorso = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.46, 0.78, 16, 32)),
    torsoShellMat
  );
  finalTorso.position.set(0, 0.86, 0);
  finalTorso.scale.set(1.08, 1, 0.68);
  finalTorso.renderOrder = 10;
  group.add(finalTorso);

  const finalHead = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.25, 28, 28)),
    torsoShellMat
  );
  finalHead.position.set(0, 1.66, 0);
  finalHead.renderOrder = 10;
  group.add(finalHead);

  const finalOrganMats: Record<string, THREE.MeshStandardMaterial> = {
    boca: ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 })),
    esofago: ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.38 })),
    estomago: ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })),
    delgado: ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 })),
    grosso: ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.4 }))
  };

  const fMouth = new THREE.Mesh(
    ctx.trackGeo(new THREE.TorusGeometry(0.075, 0.026, 12, 24, Math.PI)).rotateX(Math.PI / 2),
    finalOrganMats.boca
  );
  fMouth.position.set(0, 1.56, 0.08);
  group.add(fMouth);

  const fEso = new THREE.Mesh(
    ctx.trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 1.54, 0.04),
          new THREE.Vector3(0, 1.28, 0),
          new THREE.Vector3(0.04, 1.04, 0.02)
        ]),
        24,
        0.034,
        14,
        false
      )
    ),
    finalOrganMats.esofago
  );
  group.add(fEso);

  const fStomach = new THREE.Mesh(
    ctx.trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.04, 1.04, 0.02),
          new THREE.Vector3(0.16, 0.95, 0.05),
          new THREE.Vector3(0.13, 0.81, 0.05),
          new THREE.Vector3(-0.04, 0.79, 0.03)
        ]),
        28,
        0.082,
        18,
        false
      )
    ),
    finalOrganMats.estomago
  );
  group.add(fStomach);

  const fSmall = new THREE.Mesh(
    ctx.trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.04, 0.79, 0.03),
          new THREE.Vector3(-0.12, 0.7, 0.05),
          new THREE.Vector3(0.12, 0.64, 0.06),
          new THREE.Vector3(-0.11, 0.58, 0.05),
          new THREE.Vector3(0.1, 0.52, 0.04),
          new THREE.Vector3(-0.16, 0.47, 0.02)
        ]),
        48,
        0.038,
        14,
        false
      )
    ),
    finalOrganMats.delgado
  );
  group.add(fSmall);

  const fLarge = new THREE.Mesh(
    ctx.trackGeo(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.18, 0.45, 0.01),
          new THREE.Vector3(-0.24, 0.73, 0.02),
          new THREE.Vector3(0, 0.76, 0.06),
          new THREE.Vector3(0.24, 0.73, 0.02),
          new THREE.Vector3(0.22, 0.45, 0.01),
          new THREE.Vector3(0, 0.35, 0)
        ]),
        48,
        0.054,
        16,
        false
      )
    ),
    finalOrganMats.grosso
  );
  group.add(fLarge);

  const fullTractCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.56, 0.08),
    new THREE.Vector3(0, 1.28, 0),
    new THREE.Vector3(0.14, 0.9, 0.05),
    new THREE.Vector3(0, 0.62, 0.05),
    new THREE.Vector3(0.2, 0.56, 0.02),
    new THREE.Vector3(0, 0.36, 0)
  ]);
  const finalTravelSprite = ctx.createHD2DSpritePlane(0.22);
  finalTravelSprite.mesh.renderOrder = 12;
  group.add(finalTravelSprite.mesh);

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => {
    if (assetPack) {
      const chosenPack = assetPack.foods[cur.selectedFoodId];
      if (finalTravelSprite.mat.map !== chosenPack.whole) {
        finalTravelSprite.mat.map = chosenPack.whole;
        finalTravelSprite.mat.needsUpdate = true;
      }
    }

    const placedSet = new Set(cur.orderedOrganIds.filter(Boolean));
    const allPlaced = cur.orderedOrganIds.every(Boolean);

    Object.keys(finalOrganMats).forEach((orgKey) => {
      const mat = finalOrganMats[orgKey];
      const active = placedSet.has(orgKey);
      mat.emissive.copy(mat.color);
      mat.emissiveIntensity = THREE.MathUtils.damp(
        mat.emissiveIntensity,
        active ? 0.42 : 0.03,
        5,
        dt
      );
      mat.opacity = active ? 1.0 : 0.45;
      mat.transparent = true;
    });

    finalTravelSprite.mesh.visible = allPlaced || placedSet.size > 0;
    const maxProgress = Math.max(0.08, placedSet.size / 5);
    const loopT = ((simTime * 0.16) % 1) * maxProgress;
    fullTractCurve.getPointAt(Math.min(1, loopT), _curvePt);
    finalTravelSprite.mesh.position.copy(_curvePt);
    finalTravelSprite.mesh.position.z += 0.12;

    if (!cur.isPaused) {
      group.rotation.y = Math.sin(simTime * 0.35) * 0.16;
    }
  };

  return {
    group,
    update
  };
}
