/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 8: large_intestine (Moldura 3D do Cólon + Gotas de Água 16-Bit)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

const _curvePt = new THREE.Vector3();

export function createLargeIntestineStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const colonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 0.35, 0),
    new THREE.Vector3(-0.58, 1.28, 0),
    new THREE.Vector3(0, 1.36, 0.04),
    new THREE.Vector3(0.58, 1.28, 0),
    new THREE.Vector3(0.55, 0.35, 0),
    new THREE.Vector3(0.18, 0.22, 0)
  ]);
  const colonShellMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf472b6,
      roughness: 0.34,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      clearcoat: 0.4
    })
  );
  const colonTube = new THREE.Mesh(
    ctx.trackGeo(new THREE.TubeGeometry(colonCurve, 56, 0.17, 20, false)),
    colonShellMat
  );
  colonTube.renderOrder = 8;
  group.add(colonTube);

  const fiberBolusMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 })
  );
  const colonBolus = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.12, 20, 20)),
    fiberBolusMat
  );
  group.add(colonBolus);

  const colonWaterSprites: THREE.Mesh[] = [];
  const colonWaterMats: THREE.MeshBasicMaterial[] = [];
  const waterBaseCoords: Array<[number, number, number]> = [
    [-0.55, 0.85, 0.18],
    [0, 1.36, 0.22],
    [0.55, 0.85, 0.18]
  ];
  waterBaseCoords.forEach(([wx, wy, wz], idx) => {
    const { mesh, mat } = ctx.createHD2DSpritePlane(0.26);
    mesh.position.set(wx, wy, wz);
    group.add(mesh);
    colonWaterSprites.push(mesh);
    colonWaterMats.push(mat);

    // Hit proxy amplo para acessibilidade motora
    const waterProxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.22, 12, 12)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    waterProxy.position.copy(mesh.position);
    group.add(waterProxy);
    ctx.registerInteractive(
      waterProxy,
      'large_intestine',
      `Reabsorver Gota de Água ${idx + 1} para hidratar o corpo`,
      'absorb_water',
      idx
    );
  });

  let smoothColonT = 0.1;

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    colonWaterMats.forEach((m) => {
      m.map = pack.drops.water;
      m.needsUpdate = true;
    });
  };

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number
  ) => {
    const waterCount = cur.waterDropsAbsorbed.filter(Boolean).length;
    const desiredT = 0.12 + (waterCount / 3) * 0.82;
    smoothColonT = THREE.MathUtils.damp(smoothColonT, desiredT, 3.2, dt);
    colonCurve.getPointAt(Math.min(1, smoothColonT), _curvePt);
    colonBolus.position.copy(_curvePt);

    colonWaterSprites.forEach((sp, idx) => {
      const reabsorbed = cur.waterDropsAbsorbed[idx];
      const [bx, by] = waterBaseCoords[idx];
      const targetY = reabsorbed ? by + 0.35 : by + Math.sin(simTime * 1.6 + idx) * 0.025;
      const targetSc = reabsorbed ? 0.01 : 0.26;
      sp.position.x = bx;
      sp.position.y = THREE.MathUtils.damp(sp.position.y, targetY, 4, dt);
      const sc = THREE.MathUtils.damp(sp.scale.x, targetSc, 5, dt);
      sp.scale.set(sc, sc, 1);
      sp.visible = sc > 0.03;
    });
  };

  return {
    group,
    applyAssets,
    update
  };
}
