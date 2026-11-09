/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 1: food_select (Mesa 3D com 4 Pratos e Sprites HD-2D)
 */

import * as THREE from 'three';
import { FoodId } from '../../FoodSelector';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

export function createFoodSelectStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  // Mesa de madeira nobre (tampo em carvalho e pés contrastantes)
  const tableBoard = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(2.55, 0.08, 0.92)),
    ctx.sharedMaterials.woodTableMat
  );
  tableBoard.position.set(0, 0.42, 0);
  tableBoard.castShadow = true;
  tableBoard.receiveShadow = true;
  group.add(tableBoard);

  // Material dos pés em madeira maciça escura
  const legMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.72,
      metalness: 0.03
    })
  );

  // Pés da bancada
  [-1.1, 1.1].forEach((lx) => {
    [-0.34, 0.34].forEach((lz) => {
      const leg = new THREE.Mesh(
        ctx.trackGeo(new THREE.CylinderGeometry(0.045, 0.035, 0.42, 16)),
        legMat
      );
      leg.position.set(lx, 0.21, lz);
      leg.castShadow = true;
      group.add(leg);
    });
  });

  const foodOrder: FoodId[] = ['maca', 'pao', 'cenoura', 'ovo'];
  const foodLabels: Record<FoodId, string> = {
    maca: 'Maçã 16-Bit (Fibras)',
    pao: 'Pão Fatiado 16-Bit (Amido)',
    cenoura: 'Cenoura 16-Bit (Vitamina A)',
    ovo: 'Ovo 16-Bit (Proteínas)'
  };

  const foodSelectSlots: Array<{
    id: FoodId;
    group: THREE.Group;
    spriteMat: THREE.MeshBasicMaterial;
    ringMat: THREE.MeshStandardMaterial;
    cardMesh: THREE.Mesh;
  }> = [];

  // Material de sombra de contato sob os pratos
  const plateContactShadowMat = ctx.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x2e1d11,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    })
  );

  foodOrder.forEach((fid, idx) => {
    const xPos = -0.93 + idx * 0.62;
    const slotGroup = new THREE.Group();
    slotGroup.position.set(xPos, 0.48, idx === 1 || idx === 2 ? 0.06 : -0.04);
    group.add(slotGroup);

    // Sombra de oclusão de contato na madeira
    const contactShadow = new THREE.Mesh(
      ctx.trackGeo(new THREE.CircleGeometry(0.22, 24)).rotateX(-Math.PI / 2),
      plateContactShadowMat
    );
    contactShadow.position.y = -0.018;
    slotGroup.add(contactShadow);

    // Prato de cerâmica artesanal
    const plate = new THREE.Mesh(
      ctx.trackGeo(new THREE.CylinderGeometry(0.24, 0.19, 0.035, 32)),
      ctx.sharedMaterials.porcelainMat
    );
    plate.castShadow = true;
    plate.receiveShadow = true;
    slotGroup.add(plate);

    // Borda artesanal suave do prato
    const plateRim = new THREE.Mesh(
      ctx.trackGeo(new THREE.TorusGeometry(0.23, 0.01, 12, 32)).rotateX(Math.PI / 2),
      ctx.sharedMaterials.porcelainMat
    );
    plateRim.position.y = 0.018;
    slotGroup.add(plateRim);

    // Halo atencional verde-menta sereno (sem estroboscopia)
    const ringMat = ctx.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0,
        roughness: 0.35
      })
    );
    const ring = new THREE.Mesh(
      ctx.trackGeo(new THREE.TorusGeometry(0.255, 0.012, 12, 36)).rotateX(Math.PI / 2),
      ringMat
    );
    ring.position.y = 0.02;
    slotGroup.add(ring);

    const { mesh: foodCard, mat: spriteMat } = ctx.createHD2DSpritePlane(0.42);
    foodCard.position.y = 0.26;
    slotGroup.add(foodCard);

    // Hit proxy ampliado para toque acessível
    const hitProxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.65, 16)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    hitProxy.position.y = 0.22;
    slotGroup.add(hitProxy);
    ctx.registerInteractive(hitProxy, 'food_select', `Escolher ${foodLabels[fid]}`, 'select_food', fid);

    foodSelectSlots.push({ id: fid, group: slotGroup, spriteMat, ringMat, cardMesh: foodCard });
  });

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    foodSelectSlots.forEach((slot) => {
      slot.spriteMat.map = pack.foods[slot.id].whole;
      slot.spriteMat.needsUpdate = true;
    });
  };

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number
  ) => {
    foodSelectSlots.forEach((slot, i) => {
      const isSel = slot.id === cur.selectedFoodId;
      const targetY = isSel ? 0.56 : 0.48;
      slot.group.position.y = THREE.MathUtils.damp(slot.group.position.y, targetY, 6, dt);
      slot.ringMat.emissiveIntensity = THREE.MathUtils.damp(
        slot.ringMat.emissiveIntensity,
        isSel ? 0.55 : 0,
        6,
        dt
      );
      if (slot.cardMesh) {
        const floatAmp = cur.lowSensory ? 0 : (isSel ? 0.02 : 0.008);
        slot.cardMesh.position.y = 0.26 + (floatAmp > 0 ? Math.sin(simTime * 1.8 + i * 1.2) * floatAmp : 0);
      }
    });
  };

  return {
    group,
    applyAssets,
    update
  };
}

