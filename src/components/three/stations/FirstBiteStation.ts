/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 2: first_bite (Personagem 3D + Prato + Braço 3D Mordendo Sprite 16-Bit)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

export function createFirstBiteStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const biteHeadGroup = new THREE.Group();
  biteHeadGroup.position.set(-0.68, 0.92, 0);
  group.add(biteHeadGroup);

  const skinMat = ctx.sharedMaterials.skinMat;
  const craniumUpper = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.32, 28, 28)),
    skinMat
  );
  craniumUpper.scale.set(0.95, 1.02, 0.92);
  craniumUpper.castShadow = true;
  biteHeadGroup.add(craniumUpper);

  // Olhos amigáveis 3D
  const eyeDarkMat = ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 }));
  [-0.08, 0.08].forEach((ez) => {
    const eye = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.032, 14, 14)), eyeDarkMat);
    eye.position.set(0.26, 0.08, ez * 1.4);
    biteHeadGroup.add(eye);
  });

  // Cavidade oral e mandíbula articulada
  const biteMouthCavity = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.16, 20, 20)),
    ctx.sharedMaterials.mucosaDeepMat
  );
  biteMouthCavity.position.set(0.22, -0.08, 0);
  biteHeadGroup.add(biteMouthCavity);

  const biteLowerJaw = new THREE.Group();
  biteLowerJaw.position.set(0.12, -0.14, 0);
  biteHeadGroup.add(biteLowerJaw);
  const jawChin = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.09, 0.14, 10, 16)).rotateZ(Math.PI / 2),
    skinMat
  );
  jawChin.position.set(0.08, -0.03, 0);
  biteLowerJaw.add(jawChin);

  // Pedestal e prato direito do lanche
  const biteTableStand = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.26, 0.3, 0.62, 24)),
    ctx.sharedMaterials.woodTableMat
  );
  biteTableStand.position.set(0.72, 0.31, 0);
  group.add(biteTableStand);

  const bitePlate = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.28, 0.22, 0.04, 32)),
    ctx.sharedMaterials.porcelainMat
  );
  bitePlate.position.set(0.72, 0.64, 0);
  group.add(bitePlate);

  const { mesh: bitePlateFoodSprite, mat: bitePlateFoodMat } = ctx.createHD2DSpritePlane(0.44);
  bitePlateFoodSprite.position.set(0.72, 0.9, 0.02);
  group.add(bitePlateFoodSprite);

  // Braço 3D Articulado + Mão + Alimento 16-Bit Segurado
  const biteArmGroup = new THREE.Group();
  biteArmGroup.position.set(0.72, 0.85, 0.16);
  group.add(biteArmGroup);

  const sleeveMat = ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.5 }));
  const forearmMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.068, 0.34, 12, 20)).rotateZ(Math.PI / 2),
    sleeveMat
  );
  forearmMesh.position.set(0.24, -0.04, 0);
  forearmMesh.castShadow = true;
  biteArmGroup.add(forearmMesh);

  const handPalm = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.095, 20, 20)), skinMat);
  handPalm.scale.set(1.1, 0.9, 0.8);
  biteArmGroup.add(handPalm);

  const { mesh: heldFoodSprite, mat: heldFoodMat } = ctx.createHD2DSpritePlane(0.42);
  heldFoodSprite.position.set(-0.08, 0.16, 0.04);
  biteArmGroup.add(heldFoodSprite);

  // Hit proxy amplo para facilitar o clique
  const biteHitProxy = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(2.0, 1.2, 0.9)),
    ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
  );
  biteHitProxy.position.set(0.1, 0.85, 0);
  group.add(biteHitProxy);
  ctx.registerInteractive(
    biteHitProxy,
    'first_bite',
    'Toque para o braço pegar o alimento e dar a mordida',
    'trigger_bite'
  );

  let smoothArmX = 0.72;
  let smoothArmY = 0.85;
  let smoothJawAngle = 0;

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => {
    // Sincroniza texturas do alimento escolhido
    if (assetPack) {
      const chosenPack = assetPack.foods[cur.selectedFoodId];
      if (bitePlateFoodMat.map !== chosenPack.whole) {
        bitePlateFoodMat.map = chosenPack.whole;
        bitePlateFoodMat.needsUpdate = true;
      }
      const shouldBeBitten = cur.bitePhase === 'biting' || cur.bitePhase === 'completed';
      const targetHeldTex = shouldBeBitten ? chosenPack.bitten : chosenPack.whole;
      if (heldFoodMat.map !== targetHeldTex) {
        heldFoodMat.map = targetHeldTex;
        heldFoodMat.needsUpdate = true;
      }
    }

    const handHoldingFood =
      cur.bitePhase === 'holding' ||
      cur.bitePhase === 'bringing_to_mouth' ||
      cur.bitePhase === 'biting' ||
      cur.bitePhase === 'completed';

    bitePlateFoodSprite.visible = !handHoldingFood;
    heldFoodSprite.visible = handHoldingFood;

    let goalX = 0.86;
    let goalY = 0.65;
    let goalJaw = 0;

    if (cur.bitePhase === 'reaching' || cur.bitePhase === 'holding') {
      goalX = 0.72;
      goalY = 0.88;
    } else if (cur.bitePhase === 'bringing_to_mouth') {
      goalX = -0.32;
      goalY = 0.88;
      goalJaw = -0.34;
    } else if (cur.bitePhase === 'biting') {
      goalX = -0.38;
      goalY = 0.86;
      goalJaw = -0.05;
    } else if (cur.bitePhase === 'completed') {
      goalX = 0.18;
      goalY = 0.76;
      goalJaw = Math.sin(simTime * 3.2) * 0.06 - 0.06;
    }

    smoothArmX = THREE.MathUtils.damp(smoothArmX, goalX, 4.5, dt);
    smoothArmY = THREE.MathUtils.damp(smoothArmY, goalY, 4.5, dt);
    smoothJawAngle = THREE.MathUtils.damp(smoothJawAngle, goalJaw, 6, dt);

    biteArmGroup.position.set(smoothArmX, smoothArmY, 0.16);
    biteLowerJaw.rotation.z = smoothJawAngle;
  };

  return {
    group,
    update
  };
}
