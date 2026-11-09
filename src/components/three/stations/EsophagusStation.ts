/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 5: esophagus (Túnel Muscular 3D com Textura 16-Bit + Tubo 16-Bit)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

export function createEsophagusStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  // Túnel muscular semi-aberto
  const esoWallMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.58,
      metalness: 0.04,
      side: THREE.DoubleSide
    })
  );
  const esoTunnelGeo = ctx.trackGeo(
    new THREE.CylinderGeometry(0.28, 0.28, 1.35, 32, 16, true, Math.PI * 0.22, Math.PI * 1.56)
  );
  const esoTunnelMesh = new THREE.Mesh(esoTunnelGeo, esoWallMat);
  esoTunnelMesh.position.set(0, 0.94, 0);
  esoTunnelMesh.castShadow = true;
  group.add(esoTunnelMesh);

  // Placa HD-2D lateral exibindo o tubo do esôfago
  const { mesh: esoRefSprite, mat: esoRefSpriteMat } = ctx.createHD2DSpritePlane(0.82);
  esoRefSprite.position.set(-0.74, 0.96, 0.08);
  group.add(esoRefSprite);

  // 3 Anéis Musculares Peristálticos 3D Clicáveis
  const esoRings: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    y: number;
  }> = [];
  const ringHeights = [1.34, 0.95, 0.56];
  const ringNames = ['Anel Muscular Superior', 'Anel Muscular Médio', 'Anel Muscular Inferior'];

  ringHeights.forEach((ry, idx) => {
    const rMat = ctx.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.12,
        roughness: 0.35
      })
    );
    const rMesh = new THREE.Mesh(
      ctx.trackGeo(new THREE.TorusGeometry(0.31, 0.042, 16, 40)).rotateX(Math.PI / 2),
      rMat
    );
    rMesh.position.set(0, ry, 0);
    group.add(rMesh);

    // Hit proxy amplo para facilitar o clique
    const proxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.CylinderGeometry(0.44, 0.44, 0.36, 20)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    proxy.position.set(0, ry, 0);
    group.add(proxy);
    ctx.registerInteractive(proxy, 'esophagus', `Contrair ${ringNames[idx]}`, 'squeeze_eso_ring', idx);

    esoRings.push({ mesh: rMesh, mat: rMat, y: ry });
  });

  const esoBolus = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.14, 24, 24)),
    ctx.sharedMaterials.bolusGoldMat
  );
  esoBolus.position.set(0, 1.42, 0.05);
  group.add(esoBolus);

  let smoothEsoBolusY = 1.42;

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    esoRefSpriteMat.map = pack.esophagusTube;
    esoRefSpriteMat.needsUpdate = true;

    esoWallMat.map = pack.esophagusWall;
    esoWallMat.needsUpdate = true;
  };

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number
  ) => {
    const bolusTargets = [1.42, 1.12, 0.74, 0.34];
    const targetY = bolusTargets[Math.min(cur.esoRingStep, 3)];
    smoothEsoBolusY = THREE.MathUtils.damp(smoothEsoBolusY, targetY, 4.2, dt);
    esoBolus.position.y = smoothEsoBolusY;

    esoRings.forEach((r, idx) => {
      const isAct = cur.esoRingStep > idx;
      const isCurrent = cur.esoRingStep === idx;
      const targetScale = isCurrent ? 0.78 + Math.sin(simTime * 4.5) * 0.05 : isAct ? 0.88 : 1.0;
      const s = THREE.MathUtils.damp(r.mesh.scale.x, targetScale, 6, dt);
      r.mesh.scale.set(s, 1, s);
      r.mat.emissiveIntensity = THREE.MathUtils.damp(
        r.mat.emissiveIntensity,
        isAct ? 0.45 : isCurrent ? 0.3 : 0.08,
        5,
        dt
      );
    });
  };

  return {
    group,
    applyAssets,
    update
  };
}

