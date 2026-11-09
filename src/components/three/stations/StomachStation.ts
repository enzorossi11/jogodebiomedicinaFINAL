/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 6: stomach (Câmara Gástrica 3D em "J" + Gotas 16-Bit + Quimo)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

export function createStomachStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const stomachCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.18, 1.48, 0),
    new THREE.Vector3(0.28, 1.15, 0.04),
    new THREE.Vector3(0.22, 0.68, 0.05),
    new THREE.Vector3(-0.28, 0.58, 0)
  ]);
  const stomachShellMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfda4af,
      roughness: 0.25,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      clearcoat: 0.6
    })
  );
  const stomachShell = new THREE.Mesh(
    ctx.trackGeo(new THREE.TubeGeometry(stomachCurve, 36, 0.32, 24, false)),
    stomachShellMat
  );
  stomachShell.renderOrder = 8;
  group.add(stomachShell);

  // Fluido calmo do Suco Gástrico / Quimo
  const chymeFluidMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.18,
      roughness: 0.2,
      transparent: true,
      opacity: 0.82
    })
  );
  const chymePool = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.26, 28, 24)),
    chymeFluidMat
  );
  chymePool.position.set(0.05, 0.68, 0.03);
  chymePool.scale.set(1.35, 0.35, 0.9);
  group.add(chymePool);

  const stomachBolus = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.14, 22, 22)),
    ctx.sharedMaterials.bolusGoldMat
  );
  stomachBolus.position.set(0.08, 0.88, 0.04);
  group.add(stomachBolus);

  // 3 Gotas 16-Bit de Suco Gástrico clicáveis
  const gastricDropSprites: THREE.Mesh[] = [];
  const gastricDropMats: THREE.MeshBasicMaterial[] = [];
  [-0.45, 0, 0.45].forEach((gx, idx) => {
    const { mesh, mat } = ctx.createHD2DSpritePlane(0.28);
    mesh.position.set(gx, 1.54, 0.22);
    group.add(mesh);
    gastricDropSprites.push(mesh);
    gastricDropMats.push(mat);

    // Hit proxy amplo para toque acessível
    const dropProxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.22, 12, 12)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    dropProxy.position.copy(mesh.position);
    group.add(dropProxy);
    ctx.registerInteractive(
      dropProxy,
      'stomach',
      `Liberar Gota ${idx + 1} de Suco Gástrico 16-Bit`,
      'add_gastric_drop',
      idx
    );
  });

  let smoothStomachFluidScaleY = 0.25;

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    gastricDropMats.forEach((m) => {
      m.map = pack.drops.gastric;
      m.needsUpdate = true;
    });
  };

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number
  ) => {
    const dropCount = cur.gastricDrops.filter(Boolean).length;
    const targetFluidScale = 0.25 + dropCount * 0.28;
    smoothStomachFluidScaleY = THREE.MathUtils.damp(
      smoothStomachFluidScaleY,
      targetFluidScale,
      3.5,
      dt
    );
    chymePool.scale.set(1.35, smoothStomachFluidScaleY, 0.9);
    chymePool.position.y = 0.68 + Math.sin(simTime * 2.2) * 0.015;

    gastricDropSprites.forEach((sp, idx) => {
      const isAdded = cur.gastricDrops[idx];
      const targetY = isAdded ? 0.72 : 1.54 + Math.sin(simTime * 1.8 + idx) * 0.025;
      const targetScale = isAdded ? 0.01 : 0.28;
      sp.position.y = THREE.MathUtils.damp(sp.position.y, targetY, 4.5, dt);
      const sc = THREE.MathUtils.damp(sp.scale.x, targetScale, 5, dt);
      sp.scale.set(sc, sc, 1);
      sp.visible = sc > 0.03;
    });

    stomachBolus.position.y = 0.88 - (dropCount / 3) * 0.18 + Math.sin(simTime * 1.5) * 0.02;
    const bolusScale = Math.max(0.35, 1.0 - (dropCount / 3) * 0.55);
    stomachBolus.scale.setScalar(bolusScale);
  };

  return {
    group,
    applyAssets,
    update
  };
}

