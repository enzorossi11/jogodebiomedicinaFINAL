/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 4: swallow (Garganta, Traqueia, Esôfago e Válvula 3D da Epiglote)
 */

import * as THREE from 'three';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

const _curvePt = new THREE.Vector3();

export function createSwallowStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const tracheaMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      roughness: 0.3,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    })
  );
  const throatEsoMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfecdd3,
      roughness: 0.35,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    })
  );

  // Tubo anterior: Traqueia (Canal do Ar)
  const tracheaTube = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 24)),
    tracheaMat
  );
  tracheaTube.position.set(-0.24, 0.56, 0);
  group.add(tracheaTube);

  // Anéis cartilaginosos da traqueia
  const cartRingMat = ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
  for (let r = 0; r < 4; r++) {
    const trRing = new THREE.Mesh(
      ctx.trackGeo(new THREE.TorusGeometry(0.145, 0.015, 10, 28)).rotateX(Math.PI / 2),
      cartRingMat
    );
    trRing.position.set(-0.24, 0.3 + r * 0.17, 0);
    group.add(trRing);
  }

  // Tubo posterior: Entrada do Esôfago (Alimento)
  const swallowEsoTube = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.95, 24)),
    throatEsoMat
  );
  swallowEsoTube.position.set(0.24, 0.56, 0);
  group.add(swallowEsoTube);

  // Câmara superior da Faringe
  const pharynxChamber = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.38, 0.42, 0.42, 28, 1, true)),
    throatEsoMat
  );
  pharynxChamber.position.set(0, 1.25, 0);
  group.add(pharynxChamber);

  // Válvula Articulada 3D da Epiglote
  const epiglottisPivot = new THREE.Group();
  epiglottisPivot.position.set(-0.04, 1.02, 0);
  group.add(epiglottisPivot);

  const epiglottisFlap = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(0.32, 0.045, 0.24)),
    ctx.sharedMaterials.mucosaDeepMat
  );
  epiglottisFlap.position.set(-0.14, 0.02, 0);
  epiglottisPivot.add(epiglottisFlap);

  // Curva de descida da deglutição
  const swallowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 1.42, 0),
    new THREE.Vector3(0.14, 1.16, 0),
    new THREE.Vector3(0.24, 0.82, 0),
    new THREE.Vector3(0.24, 0.24, 0)
  ]);
  const swallowBolus = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.115, 22, 22)),
    ctx.sharedMaterials.bolusGoldMat
  );
  group.add(swallowBolus);

  // Hit proxy acessível amplo
  const swallowHitProxy = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(1.2, 1.5, 0.8)),
    ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
  );
  swallowHitProxy.position.set(0, 0.85, 0);
  group.add(swallowHitProxy);
  ctx.registerInteractive(
    swallowHitProxy,
    'swallow',
    'Toque para engolir e ver a epiglote fechar o canal do ar',
    'trigger_swallow'
  );

  let smoothEpiglottisRot = 0.42;

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number
  ) => {
    const goalRot = cur.swallowed ? -0.18 : 0.45;
    smoothEpiglottisRot = THREE.MathUtils.damp(smoothEpiglottisRot, goalRot, 5, dt);
    epiglottisPivot.rotation.z = smoothEpiglottisRot;

    const t = Math.max(0, Math.min(1, cur.throatProgress / 100));
    swallowCurve.getPointAt(t, _curvePt);
    swallowBolus.position.copy(_curvePt);
  };

  return {
    group,
    update
  };
}

