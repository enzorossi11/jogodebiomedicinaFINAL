/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 3: mouth (Diorama Anatômico da Cavidade Bucal 3D + 5 Mastigadas Progressivas + Saliva Automática)
 */

import * as THREE from 'three';
import { FoodId } from '../../FoodSelector';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

// Paleta de cores autênticas das partículas trituradas por alimento
const FOOD_CRUMB_PALETTES: Record<FoodId, { primary: number; secondary: number; bolus: number }> = {
  maca: { primary: 0xef4444, secondary: 0xfef08a, bolus: 0xfca5a5 },
  pao: { primary: 0xd97706, secondary: 0xfde68a, bolus: 0xfcd34d },
  cenoura: { primary: 0xf97316, secondary: 0xfdba74, bolus: 0xfb923c },
  ovo: { primary: 0xf59e0b, secondary: 0xffffff, bolus: 0xfde047 }
};

export function createMouthStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  // =========================================================================
  // 1. BASE DE SUSTENTAÇÃO E FUNDO DA CAVIDADE ORAL (CÉU DA BOCA, FARINGE E ÚVULA)
  // =========================================================================
  const standPedestal = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 0.42, 24)),
    ctx.sharedMaterials.porcelainMat
  );
  standPedestal.position.set(0, 0.21, -0.08);
  standPedestal.castShadow = true;
  standPedestal.receiveShadow = true;
  group.add(standPedestal);

  // Concha interna da cavidade bucal (Faringe e Bochechas Internas)
  const cavityInteriorMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9f1239,
      roughness: 0.65,
      side: THREE.DoubleSide
    })
  );
  const oralBackDome = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.58, 32, 24, 0, Math.PI, 0, Math.PI)),
    cavityInteriorMat
  );
  oralBackDome.position.set(0, 0.94, -0.04);
  oralBackDome.rotation.y = Math.PI;
  oralBackDome.scale.set(1.08, 0.92, 0.78);
  group.add(oralBackDome);

  // Úvula ("Campainha" no fundo da garganta) para referência anatômica amigável
  const uvulaMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.036, 0.085, 12, 16)),
    ctx.sharedMaterials.mucosaPinkMat
  );
  uvulaMesh.position.set(0, 1.15, -0.26);
  group.add(uvulaMesh);

  // Glândulas Salivares Laterais (Parótidas estilizadas de onde saem as gotas de saliva)
  const glandMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfda4af,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.12,
      roughness: 0.35,
      clearcoat: 0.4
    })
  );
  [-0.52, 0.52].forEach((gx) => {
    const glandCluster = new THREE.Group();
    glandCluster.position.set(gx, 1.08, 0.02);
    group.add(glandCluster);

    [
      [0, 0, 0, 0.048],
      [0.035, 0.03, 0.01, 0.036],
      [-0.03, -0.025, 0.01, 0.038]
    ].forEach(([ox, oy, oz, r]) => {
      const lobe = new THREE.Mesh(
        ctx.trackGeo(new THREE.SphereGeometry(r, 14, 14)),
        glandMat
      );
      lobe.position.set(ox, oy, oz);
      glandCluster.add(lobe);
    });
  });

  // =========================================================================
  // 2. ARCADAS SUPERIOR E INFERIOR COM LÁBIOS, GENGIVAS E DENTES ARREDONDADOS
  // =========================================================================
  const lipMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xf472b6,
      roughness: 0.38,
      clearcoat: 0.35
    })
  );

  const upperArchGroup = new THREE.Group();
  upperArchGroup.position.set(0, 1.24, 0);
  group.add(upperArchGroup);

  const lowerArchGroup = new THREE.Group();
  lowerArchGroup.position.set(0, 0.64, 0);
  group.add(lowerArchGroup);

  // Gengivas anatômicas
  const gumArchGeo = ctx.trackGeo(new THREE.TorusGeometry(0.45, 0.078, 20, 40, Math.PI));
  const upperGum = new THREE.Mesh(gumArchGeo, ctx.sharedMaterials.mucosaPinkMat);
  upperGum.rotation.x = Math.PI / 2;
  upperGum.rotation.z = Math.PI;
  upperArchGroup.add(upperGum);

  const lowerGum = new THREE.Mesh(gumArchGeo, ctx.sharedMaterials.mucosaPinkMat);
  lowerGum.rotation.x = Math.PI / 2;
  lowerGum.rotation.z = Math.PI;
  lowerArchGroup.add(lowerGum);

  // Lábios externos suaves emoldurando as gengivas
  const lipArchGeo = ctx.trackGeo(new THREE.TorusGeometry(0.51, 0.052, 16, 40, Math.PI));
  const upperLip = new THREE.Mesh(lipArchGeo, lipMat);
  upperLip.rotation.x = Math.PI / 2;
  upperLip.rotation.z = Math.PI;
  upperLip.position.set(0, 0.045, 0.02);
  upperArchGroup.add(upperLip);

  const lowerLip = new THREE.Mesh(lipArchGeo, lipMat);
  lowerLip.rotation.x = Math.PI / 2;
  lowerLip.rotation.z = Math.PI;
  lowerLip.position.set(0, -0.045, 0.02);
  lowerArchGroup.add(lowerLip);

  // Geometrias anatômicas arredondadas para os dentes (Incisivos, Caninos e Molares)
  const incisorGeo = ctx.trackGeo(new THREE.CapsuleGeometry(0.038, 0.055, 12, 18));
  const canineGeo = ctx.trackGeo(new THREE.ConeGeometry(0.042, 0.13, 16));
  const molarCrownGeo = ctx.trackGeo(new THREE.SphereGeometry(0.056, 18, 16));

  const totalTeethPerArch = 8;
  for (let i = 0; i < totalTeethPerArch; i++) {
    const t = i / (totalTeethPerArch - 1); // 0..1
    const ang = Math.PI * (0.12 + t * 0.76);
    const tx = Math.cos(ang) * 0.44;
    const tz = Math.sin(ang) * 0.38 - 0.06;

    const isFrontIncisor = i === 3 || i === 4;
    const isCanine = i === 2 || i === 5;

    // Dente Superior
    const uToothGroup = new THREE.Group();
    uToothGroup.position.set(tx, -0.078, tz);
    uToothGroup.lookAt(0, -0.078, -0.2);

    if (isFrontIncisor) {
      const incisor = new THREE.Mesh(incisorGeo, ctx.sharedMaterials.toothEnamelMat);
      incisor.scale.set(1.15, 1.0, 0.62);
      incisor.castShadow = true;
      uToothGroup.add(incisor);
    } else if (isCanine) {
      const canine = new THREE.Mesh(canineGeo, ctx.sharedMaterials.toothEnamelMat);
      canine.rotation.x = Math.PI;
      canine.scale.set(1.0, 0.95, 0.8);
      canine.castShadow = true;
      uToothGroup.add(canine);
    } else {
      // Molar arredondado com duas cúspides suaves
      const molar = new THREE.Mesh(molarCrownGeo, ctx.sharedMaterials.toothEnamelMat);
      molar.scale.set(1.15, 1.1, 1.05);
      molar.castShadow = true;
      uToothGroup.add(molar);
    }
    upperArchGroup.add(uToothGroup);

    // Dente Inferior
    const lToothGroup = new THREE.Group();
    lToothGroup.position.set(tx, 0.078, tz);
    lToothGroup.lookAt(0, 0.078, -0.2);

    if (isFrontIncisor) {
      const incisor = new THREE.Mesh(incisorGeo, ctx.sharedMaterials.toothEnamelMat);
      incisor.scale.set(1.05, 0.95, 0.6);
      incisor.castShadow = true;
      lToothGroup.add(incisor);
    } else if (isCanine) {
      const canine = new THREE.Mesh(canineGeo, ctx.sharedMaterials.toothEnamelMat);
      canine.scale.set(0.95, 0.9, 0.78);
      canine.castShadow = true;
      lToothGroup.add(canine);
    } else {
      const molar = new THREE.Mesh(molarCrownGeo, ctx.sharedMaterials.toothEnamelMat);
      molar.scale.set(1.15, 1.08, 1.05);
      molar.castShadow = true;
      lToothGroup.add(molar);
    }
    lowerArchGroup.add(lToothGroup);
  }

  // =========================================================================
  // 3. LÍNGUA 3D MACIA E ARTICULADA COM SULCO CENTRAL
  // =========================================================================
  const tongueGroup = new THREE.Group();
  tongueGroup.position.set(0, 0.03, -0.02);
  lowerArchGroup.add(tongueGroup);

  const tongueMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xfb7185,
      roughness: 0.42,
      clearcoat: 0.35
    })
  );
  const tongueMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.22, 0.26, 16, 28)).rotateX(Math.PI / 2),
    tongueMat
  );
  tongueMesh.scale.set(1.18, 0.42, 1.05);
  tongueMesh.receiveShadow = true;
  tongueGroup.add(tongueMesh);

  // Sulco central suave da língua
  const tongueGroove = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.015, 0.24, 8, 12)).rotateX(Math.PI / 2),
    ctx.sharedMaterials.mucosaDeepMat
  );
  tongueGroove.position.set(0, 0.088, 0.02);
  tongueGroup.add(tongueGroove);

  // =========================================================================
  // 4. ALIMENTO CENTRAL + SISTEMA DE 16 PARTÍCULAS PROGRESSIVAS + SALIVA AUTOMÁTICA
  // =========================================================================
  const { mesh: mouthFoodSprite, mat: mouthFoodMat } = ctx.createHD2DSpritePlane(0.48);
  mouthFoodSprite.position.set(0, 0.94, 0.08);
  group.add(mouthFoodSprite);

  // Grupo de partículas trituradas que aumentam de quantidade (0 -> 4 -> 8 -> 12 -> 16)
  const particlesGroup = new THREE.Group();
  particlesGroup.position.set(0, 0.92, 0.08);
  group.add(particlesGroup);

  const primaryCrumbMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.05
    })
  );
  const secondaryCrumbMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.45,
      metalness: 0.05
    })
  );

  const crumbGeo = ctx.trackGeo(new THREE.DodecahedronGeometry(0.048, 1));
  const foodParticles: Array<{
    mesh: THREE.Mesh;
    baseAngle: number;
    baseRadius: number;
    baseY: number;
    speed: number;
  }> = [];

  for (let i = 0; i < 16; i++) {
    const isPrimary = i % 2 === 0;
    const mesh = new THREE.Mesh(crumbGeo, isPrimary ? primaryCrumbMat : secondaryCrumbMat);
    mesh.castShadow = true;
    mesh.visible = false;
    particlesGroup.add(mesh);

    const ringLayer = Math.floor(i / 4); // 0..3
    const angleInLayer = ((i % 4) / 4) * Math.PI * 2 + ringLayer * 0.45;
    foodParticles.push({
      mesh,
      baseAngle: angleInLayer,
      baseRadius: 0.08 + ringLayer * 0.048,
      baseY: (i % 3 - 1) * 0.035,
      speed: 1.6 + (i % 4) * 0.35
    });
  }

  // 5 Gotas de Saliva 16-Bit que brotam automaticamente das glândulas a cada mastigada
  const salivaDrops: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    side: number;
    phaseOffset: number;
  }> = [];

  for (let i = 0; i < 5; i++) {
    const { mesh, mat } = ctx.createHD2DSpritePlane(0.19);
    const side = i % 2 === 0 ? -1 : 1;
    mesh.position.set(side * 0.38, 1.08, 0.14);
    mesh.visible = false;
    group.add(mesh);
    salivaDrops.push({
      mesh,
      mat,
      side,
      phaseOffset: i * 1.25
    });
  }

  // Bolo Alimentar Úmido e Envoltório Aquoso de Saliva (Amilase)
  const bolusGroup = new THREE.Group();
  bolusGroup.position.set(0, 0.91, 0.08);
  group.add(bolusGroup);

  const bolusCoreMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xd97706,
      emissiveIntensity: 0.22,
      roughness: 0.35
    })
  );
  const bolusCoreMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.155, 28, 28)),
    bolusCoreMat
  );
  bolusGroup.add(bolusCoreMesh);

  // Película aquosa azul-celeste translúcida representando a saliva envolvendo o bolo
  const salivaCoatMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.34,
      roughness: 0.12,
      clearcoat: 0.9
    })
  );
  const salivaCoatMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.182, 28, 28)),
    salivaCoatMat
  );
  bolusGroup.add(salivaCoatMesh);

  // Hit proxy único e amplo para mastigar clicando diretamente na boca 3D
  const teethProxy = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(1.35, 1.05, 0.95)),
    ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
  );
  teethProxy.position.set(0, 0.95, 0.05);
  group.add(teethProxy);
  ctx.registerInteractive(
    teethProxy,
    'mouth',
    'Toque na boca 3D para mastigar e liberar saliva automaticamente',
    'chew_mouth'
  );

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    salivaDrops.forEach((d) => {
      d.mat.map = pack.drops.saliva;
      d.mat.needsUpdate = true;
    });
  };

  // Controle de animação de pulso a cada mastigada
  let lastChewCount = 0;
  let chewImpulse = 0;
  let smoothBolusScale = 0.01;

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => {
    // 1. Atualiza textura do alimento e paleta de cores das partículas
    if (assetPack) {
      const chosenPack = assetPack.foods[cur.selectedFoodId];
      if (mouthFoodMat.map !== chosenPack.bitten) {
        mouthFoodMat.map = chosenPack.bitten;
        mouthFoodMat.needsUpdate = true;
      }
    }

    const palette = FOOD_CRUMB_PALETTES[cur.selectedFoodId];
    primaryCrumbMat.color.setHex(palette.primary);
    secondaryCrumbMat.color.setHex(palette.secondary);
    bolusCoreMat.color.setHex(palette.bolus);

    // 2. Detecta nova mastigada para disparar impulso mecânico ("Nhac!")
    if (cur.chewCount !== lastChewCount) {
      if (cur.chewCount > lastChewCount) {
        chewImpulse = 1.0;
      }
      lastChewCount = cur.chewCount;
    }
    chewImpulse = THREE.MathUtils.damp(chewImpulse, 0, 5.5, dt);

    const chewStep = Math.min(5, Math.max(0, cur.chewCount));
    const isStageDone = chewStep >= 5;

    // 3. Movimento de mastigação das arcadas e ondulação da língua
    const continuousChew =
      chewStep > 0 && !isStageDone && !cur.lowSensory
        ? Math.abs(Math.sin(simTime * 4.5)) * 0.045
        : 0;
    const biteClosure = chewImpulse * 0.11 + continuousChew;

    upperArchGroup.position.y = 1.24 - biteClosure * 0.45;
    lowerArchGroup.position.y = 0.64 + biteClosure * 0.55;

    // A língua sobe e ondula para misturar as partículas com a saliva
    const tongueWave = chewStep > 0 && !cur.lowSensory ? Math.sin(simTime * 4.5) * 0.08 : 0;
    tongueGroup.rotation.z = tongueWave;
    tongueGroup.position.y = 0.03 + biteClosure * 0.25;

    // Úvula balança sutilmente
    if (!cur.lowSensory) {
      uvulaMesh.rotation.z = Math.sin(simTime * 2.4) * 0.05;
    }

    // 4. Redução gradual do pedaço inteiro (0/5 -> 4/5) até sumir em 5/5
    const targetFoodScale = isStageDone ? 0.001 : Math.max(0.18, 0.48 * (1 - chewStep * 0.18));
    const currentFoodScale = THREE.MathUtils.damp(mouthFoodSprite.scale.x, targetFoodScale, 7, dt);
    mouthFoodSprite.scale.set(currentFoodScale, currentFoodScale, 1);
    mouthFoodSprite.visible = currentFoodScale > 0.04 && !isStageDone;
    if (!cur.lowSensory && mouthFoodSprite.visible) {
      mouthFoodSprite.rotation.z = Math.sin(simTime * 3.2) * 0.12 * (chewStep > 0 ? 1 : 0.2);
    }

    // 5. Multiplicação progressiva de partículas de alimento (0 -> 4 -> 8 -> 12 -> 16)
    const activeParticleCount = chewStep === 0 ? 0 : Math.min(16, chewStep * 4);
    foodParticles.forEach((fp, idx) => {
      const shouldShow = idx < activeParticleCount;
      fp.mesh.visible = shouldShow;
      if (!shouldShow) return;

      // Na 5ª mastigada, as partículas se aglutinam na superfície do bolo alimentar
      const gatherFactor = isStageDone ? 0.42 : 1.0 - chewStep * 0.08;
      const angle = fp.baseAngle + (cur.lowSensory ? 0 : simTime * fp.speed * (isStageDone ? 0.3 : 1));
      const radius = fp.baseRadius * gatherFactor;

      fp.mesh.position.set(
        Math.cos(angle) * radius,
        fp.baseY * gatherFactor + (cur.lowSensory ? 0 : Math.sin(simTime * 3 + idx) * 0.015),
        Math.sin(angle) * radius * 0.75
      );

      // Tamanho das partículas fica mais refinado conforme mastiga
      const particleScale = isStageDone ? 0.55 : Math.max(0.65, 1.05 - chewStep * 0.08);
      fp.mesh.scale.setScalar(particleScale);
      fp.mesh.rotation.x = simTime * 1.5 + idx;
      fp.mesh.rotation.y = simTime * 1.2 + idx;
    });

    // 6. Gotas de Saliva 16-Bit liberadas automaticamente a cada mastigada (1 a 5 gotas)
    salivaDrops.forEach((drop, idx) => {
      const isDropActive = idx < chewStep;
      drop.mesh.visible = isDropActive;
      if (!isDropActive) return;

      // As gotas saem das glândulas salivares laterais e orbitam umedecendo o alimento
      const t = (simTime * 0.85 + drop.phaseOffset) % 1.0;
      if (isStageDone) {
        // Na conclusão (5/5), orbitam suavemente ao redor do bolo úmido formado
        const orbitAngle = simTime * 1.4 + (idx * Math.PI * 2) / 5;
        drop.mesh.position.set(
          Math.cos(orbitAngle) * 0.24,
          0.92 + Math.sin(simTime * 2 + idx) * 0.04,
          0.12 + Math.sin(orbitAngle) * 0.08
        );
        drop.mesh.scale.setScalar(0.14);
      } else {
        // Trajetória da glândula salivar lateral (x = ±0.46, y = 1.08) até o alimento central (0, 0.91)
        const startX = drop.side * 0.44;
        const startY = 1.1;
        const curX = THREE.MathUtils.lerp(startX, drop.side * 0.08, t);
        const curY = THREE.MathUtils.lerp(startY, 0.9, t) + Math.sin(t * Math.PI) * 0.06;
        drop.mesh.position.set(curX, curY, 0.14);
        const sc = 0.18 * (1 - t * 0.35);
        drop.mesh.scale.set(sc, sc, 1);
      }
    });

    // 7. Formação progressiva do Bolo Alimentar Úmido (visível a partir da 2ª mastigada, completo na 5ª)
    const targetBolus =
      chewStep === 0
        ? 0.001
        : chewStep < 5
          ? 0.25 + chewStep * 0.12
          : 1.0 + (cur.lowSensory ? 0 : Math.sin(simTime * 2.8) * 0.04);

    smoothBolusScale = THREE.MathUtils.damp(smoothBolusScale, targetBolus, 6, dt);
    bolusGroup.scale.setScalar(smoothBolusScale);
    bolusGroup.visible = smoothBolusScale > 0.05;
  };

  return {
    group,
    applyAssets,
    update
  };
}
