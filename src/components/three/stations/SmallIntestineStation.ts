/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 7: small_intestine (Vilosidades 3D InstancedMesh + 3 Nutrientes)
 */

import * as THREE from 'three';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

const _dummy = new THREE.Object3D();

export function createSmallIntestineStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const intFloorCurve = new THREE.Mesh(
    ctx.trackGeo(
      new THREE.CylinderGeometry(0.65, 0.65, 1.65, 28, 1, true, Math.PI * 0.65, Math.PI * 0.7)
    ).rotateZ(Math.PI / 2),
    ctx.sharedMaterials.mucosaPinkMat
  );
  intFloorCurve.position.set(0, 0.82, -0.05);
  group.add(intFloorCurve);

  // Vaso Sanguíneo 3D abaixo das vilosidades (recebe os nutrientes absorvidos)
  const bloodVesselMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe11d48,
      emissive: 0x9f1239,
      emissiveIntensity: 0.22,
      roughness: 0.3
    })
  );
  const bloodVessel = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 1.65, 20)).rotateZ(Math.PI / 2),
    bloodVesselMat
  );
  bloodVessel.position.set(0, 0.24, 0.12);
  group.add(bloodVessel);

  // 36 Vilosidades Intestinais 3D (InstancedMesh)
  const VILLI_COUNT = 36;
  const villiGeo = ctx.trackGeo(new THREE.CapsuleGeometry(0.032, 0.18, 8, 12));
  const villiMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.45 })
  );
  const villiInstanced = new THREE.InstancedMesh(villiGeo, villiMat, VILLI_COUNT);
  villiInstanced.frustumCulled = false;
  group.add(villiInstanced);

  const villiCoords = Array.from({ length: VILLI_COUNT }, (_, i) => {
    const col = i % 9;
    const row = Math.floor(i / 9);
    return {
      x: -0.64 + col * 0.16,
      z: -0.14 + row * 0.12,
      phase: i * 0.45
    };
  });

  // 3 Esferas Luminosas 3D de Nutrientes Clicáveis
  const nutrientColors = [0xf59e0b, 0x6366f1, 0x10b981];
  const nutrientNames = [
    'Carboidratos (Energia)',
    'Proteínas (Construção)',
    'Vitaminas e Minerais'
  ];
  const nutrientOrbs: Array<{ mesh: THREE.Mesh; baseX: number }> = [];

  [-0.44, 0, 0.44].forEach((nx, idx) => {
    const nMat = ctx.trackMat(
      new THREE.MeshPhysicalMaterial({
        color: nutrientColors[idx],
        emissive: nutrientColors[idx],
        emissiveIntensity: 0.32,
        roughness: 0.18,
        clearcoat: 0.8
      })
    );
    const orb = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.125, 24, 24)), nMat);
    orb.position.set(nx, 1.12, 0.08);
    orb.castShadow = true;
    group.add(orb);

    // Hit proxy amplo para coordenação motora
    const orbProxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.22, 12, 12)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    orbProxy.position.copy(orb.position);
    group.add(orbProxy);
    ctx.registerInteractive(
      orbProxy,
      'small_intestine',
      `Absorver ${nutrientNames[idx]}`,
      'absorb_nutrient',
      idx
    );
    nutrientOrbs.push({ mesh: orb, baseX: nx });
  });

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number
  ) => {
    for (let i = 0; i < VILLI_COUNT; i++) {
      const vc = villiCoords[i];
      _dummy.position.set(vc.x, 0.56, vc.z);
      _dummy.rotation.set(0, 0, Math.sin(simTime * 1.5 + vc.phase) * 0.12);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      villiInstanced.setMatrixAt(i, _dummy.matrix);
    }
    villiInstanced.instanceMatrix.needsUpdate = true;

    nutrientOrbs.forEach((item, idx) => {
      const isAbs = cur.nutrientsAbsorbed[idx];
      const targetY = isAbs ? 0.24 : 1.12 + Math.sin(simTime * 1.8 + idx) * 0.035;
      const targetZ = isAbs ? 0.12 : 0.08;
      const targetSc = isAbs ? 0.52 : 1.0;

      item.mesh.position.y = THREE.MathUtils.damp(item.mesh.position.y, targetY, 4, dt);
      item.mesh.position.z = THREE.MathUtils.damp(item.mesh.position.z, targetZ, 4, dt);
      const sc = THREE.MathUtils.damp(item.mesh.scale.x, targetSc, 4.5, dt);
      item.mesh.scale.setScalar(sc);
    });
  };

  return {
    group,
    update
  };
}
