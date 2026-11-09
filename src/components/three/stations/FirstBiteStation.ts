/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 2: first_bite (Criança Chibi Acolhedora em 3/4 + Mesa de Carvalho + Cinemática em Arco)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

// Helpers vetoriais pré-alocados para zero GC no loop de animação
const _vShoulder = new THREE.Vector3(-0.17, 0.65, 0.02);
const _vElbow = new THREE.Vector3();
const _vHand = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _vMid = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _quat = new THREE.Quaternion();

/**
 * Posiciona e orienta um cilindro/cápsula entre dois pontos 3D (pA -> pB).
 */
function alignLimbSegment(
  mesh: THREE.Mesh,
  pA: THREE.Vector3,
  pB: THREE.Vector3,
  radius: number
) {
  _vDir.subVectors(pB, pA);
  const len = _vDir.length();
  if (len < 0.001) return;

  _vMid.addVectors(pA, pB).multiplyScalar(0.5);
  mesh.position.copy(_vMid);

  _vDir.normalize();
  _quat.setFromUnitVectors(_upAxis, _vDir);
  mesh.quaternion.copy(_quat);
  mesh.scale.set(radius, len, radius);
}

export function createFirstBiteStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  // =========================================================================
  // 1. MESA DE CARVALHO NOBRE E PRATO ARTESANAL (CONTINUIDADE DA ETAPA 1)
  // =========================================================================
  const tableGroup = new THREE.Group();
  tableGroup.position.set(0.18, 0, 0.22);
  group.add(tableGroup);

  const tableBoard = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(1.65, 0.075, 0.82)),
    ctx.sharedMaterials.woodTableMat
  );
  tableBoard.position.set(0, 0.44, 0);
  tableBoard.castShadow = true;
  tableBoard.receiveShadow = true;
  tableGroup.add(tableBoard);

  const darkWoodMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.72,
      metalness: 0.03
    })
  );

  [-0.7, 0.7].forEach((lx) => {
    [-0.3, 0.3].forEach((lz) => {
      const leg = new THREE.Mesh(
        ctx.trackGeo(new THREE.CylinderGeometry(0.042, 0.032, 0.44, 16)),
        darkWoodMat
      );
      leg.position.set(lx, 0.22, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    });
  });

  // Prato sobre a mesa
  const platePos = new THREE.Vector3(0.36, 0.495, 0.24);

  const plateShadowMat = ctx.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0x2e1d11,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    })
  );
  const plateShadow = new THREE.Mesh(
    ctx.trackGeo(new THREE.CircleGeometry(0.25, 28)).rotateX(-Math.PI / 2),
    plateShadowMat
  );
  plateShadow.position.set(platePos.x, 0.479, platePos.z);
  group.add(plateShadow);

  const bitePlate = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.26, 0.2, 0.036, 32)),
    ctx.sharedMaterials.porcelainMat
  );
  bitePlate.position.copy(platePos);
  bitePlate.castShadow = true;
  bitePlate.receiveShadow = true;
  group.add(bitePlate);

  const plateRim = new THREE.Mesh(
    ctx.trackGeo(new THREE.TorusGeometry(0.25, 0.011, 12, 32)).rotateX(Math.PI / 2),
    ctx.sharedMaterials.porcelainMat
  );
  plateRim.position.set(platePos.x, platePos.y + 0.018, platePos.z);
  group.add(plateRim);

  // Halo verde-menta suave convidando à ação
  const plateHaloMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.35,
      roughness: 0.35
    })
  );
  const plateHalo = new THREE.Mesh(
    ctx.trackGeo(new THREE.TorusGeometry(0.275, 0.012, 12, 36)).rotateX(Math.PI / 2),
    plateHaloMat
  );
  plateHalo.position.set(platePos.x, platePos.y + 0.01, platePos.z);
  group.add(plateHalo);

  // Sprite do alimento pousado no prato
  const { mesh: bitePlateFoodSprite, mat: bitePlateFoodMat } = ctx.createHD2DSpritePlane(0.42);
  bitePlateFoodSprite.position.set(platePos.x, platePos.y + 0.23, platePos.z);
  group.add(bitePlateFoodSprite);

  // =========================================================================
  // 2. PERSONAGEM CHIBI ACOLHEDOR (PERSPECTIVA 3/4)
  // =========================================================================
  const chibiSkinMat = ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffdfc4,
      roughness: 0.52,
      clearcoat: 0.1
    })
  );
  const shirtMintMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      roughness: 0.62,
      metalness: 0.02
    })
  );
  const hairBrownMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x54341e,
      roughness: 0.68,
      metalness: 0.04
    })
  );
  const eyeDarkMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.15 })
  );
  const highlightWhiteMat = ctx.trackMat(
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const blushPinkMat = ctx.trackMat(
    new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.38
    })
  );

  // Grupo raiz do personagem sentado em ângulo 3/4 olhando para o prato
  const childRoot = new THREE.Group();
  childRoot.position.set(-0.34, 0, -0.08);
  childRoot.rotation.y = 0.65;
  group.add(childRoot);

  // Banquinho de madeira acolhedor
  const stoolSeat = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24)),
    darkWoodMat
  );
  stoolSeat.position.set(0, 0.25, 0);
  stoolSeat.castShadow = true;
  childRoot.add(stoolSeat);

  const stoolColumn = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.06, 0.09, 0.25, 16)),
    darkWoodMat
  );
  stoolColumn.position.set(0, 0.125, 0);
  childRoot.add(stoolColumn);

  // Tronco (Camiseta Verde-Menta)
  const torsoMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.155, 0.21, 0.44, 24)),
    shirtMintMat
  );
  torsoMesh.position.set(0, 0.48, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  childRoot.add(torsoMesh);

  const shoulderDome = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.162, 24, 16)),
    shirtMintMat
  );
  shoulderDome.position.set(0, 0.67, 0);
  shoulderDome.scale.set(1.12, 0.55, 0.92);
  childRoot.add(shoulderDome);

  // Gola da camiseta em tom creme
  const collarRing = new THREE.Mesh(
    ctx.trackGeo(new THREE.TorusGeometry(0.105, 0.02, 12, 24)).rotateX(Math.PI / 2),
    ctx.sharedMaterials.porcelainMat
  );
  collarRing.position.set(0, 0.73, 0.01);
  childRoot.add(collarRing);

  // Pescoço
  const neckMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.072, 0.082, 0.12, 16)),
    chibiSkinMat
  );
  neckMesh.position.set(0, 0.77, 0);
  childRoot.add(neckMesh);

  // Braço esquerdo em repouso natural
  const leftSleeve = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.055, 0.16, 10, 16)),
    shirtMintMat
  );
  leftSleeve.position.set(-0.2, 0.58, 0.05);
  leftSleeve.rotation.z = 0.28;
  leftSleeve.rotation.x = -0.35;
  leftSleeve.castShadow = true;
  childRoot.add(leftSleeve);

  const leftForearm = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.046, 0.14, 10, 16)),
    chibiSkinMat
  );
  leftForearm.position.set(-0.22, 0.48, 0.16);
  leftForearm.rotation.x = -1.1;
  leftForearm.rotation.z = 0.15;
  childRoot.add(leftForearm);

  // =========================================================================
  // 3. CABEÇA CHIBI EXPRESSIVA (CABELO, OLHOS COM BRILHO, BOCHECHAS E BOCA)
  // =========================================================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.0, 0);
  childRoot.add(headGroup);

  // Crânio arredondado Chibi
  const headSphere = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.25, 32, 32)),
    chibiSkinMat
  );
  headSphere.scale.set(1.06, 0.98, 0.96);
  headSphere.castShadow = true;
  headSphere.receiveShadow = true;
  headGroup.add(headSphere);

  // Orelhinhas laterais
  [-0.258, 0.258].forEach((ex) => {
    const ear = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.052, 16, 16)),
      chibiSkinMat
    );
    ear.position.set(ex, -0.02, -0.01);
    ear.scale.set(0.65, 1.0, 0.85);
    headGroup.add(ear);
  });

  // Cabelo castanho acolhedor (touca + franja volumosa)
  const hairCap = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.264, 28, 28)),
    hairBrownMat
  );
  hairCap.position.set(0, 0.045, -0.028);
  hairCap.scale.set(1.06, 1.0, 1.02);
  hairCap.castShadow = true;
  headGroup.add(hairCap);

  // Franjas frontais suaves
  const bangsConfig = [
    { pos: [0, 0.18, 0.19], rot: [0.35, 0, 0], scale: [1.3, 0.8, 0.7] },
    { pos: [-0.12, 0.16, 0.17], rot: [0.3, 0, 0.35], scale: [1.1, 0.75, 0.65] },
    { pos: [0.12, 0.16, 0.17], rot: [0.3, 0, -0.35], scale: [1.1, 0.75, 0.65] },
    { pos: [-0.21, 0.08, 0.09], rot: [0.1, 0, 0.2], scale: [0.65, 1.2, 0.7] },
    { pos: [0.21, 0.08, 0.09], rot: [0.1, 0, -0.2], scale: [0.65, 1.2, 0.7] }
  ];
  bangsConfig.forEach((b) => {
    const tuft = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.075, 16, 16)),
      hairBrownMat
    );
    tuft.position.set(b.pos[0], b.pos[1], b.pos[2]);
    tuft.rotation.set(b.rot[0], b.rot[1], b.rot[2]);
    tuft.scale.set(b.scale[0], b.scale[1], b.scale[2]);
    headGroup.add(tuft);
  });

  // Olhos abertos com brilho ("Catchlight")
  const openEyesGroup = new THREE.Group();
  headGroup.add(openEyesGroup);

  [-0.092, 0.092].forEach((ox) => {
    const eyeBall = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.036, 18, 18)),
      eyeDarkMat
    );
    eyeBall.position.set(ox, 0.025, 0.228);
    eyeBall.scale.set(0.95, 1.15, 0.45);
    openEyesGroup.add(eyeBall);

    // Brilho especular branco no canto superior do olho
    const glint = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.012, 10, 10)),
      highlightWhiteMat
    );
    glint.position.set(ox + 0.01, 0.04, 0.244);
    openEyesGroup.add(glint);
  });

  // Olhos felizes sorridentes (^ ^) durante a mordida e mastigação
  const happyEyesGroup = new THREE.Group();
  happyEyesGroup.visible = false;
  headGroup.add(happyEyesGroup);

  [-0.092, 0.092].forEach((ox) => {
    const happyArc = new THREE.Mesh(
      ctx.trackGeo(new THREE.TorusGeometry(0.034, 0.0075, 10, 20, Math.PI)),
      eyeDarkMat
    );
    happyArc.position.set(ox, 0.018, 0.232);
    happyEyesGroup.add(happyArc);
  });

  // Sobrancelhas gentis
  [-0.095, 0.095].forEach((bx, idx) => {
    const brow = new THREE.Mesh(
      ctx.trackGeo(new THREE.CapsuleGeometry(0.008, 0.042, 6, 10)).rotateZ(Math.PI / 2),
      hairBrownMat
    );
    brow.position.set(bx, 0.095, 0.222);
    brow.rotation.z = Math.PI / 2 + (idx === 0 ? 0.12 : -0.12);
    headGroup.add(brow);
  });

  // Narizinho delicado
  const nose = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.022, 14, 14)),
    chibiSkinMat
  );
  nose.position.set(0, -0.015, 0.246);
  headGroup.add(nose);

  // Bochechas coradas (Blush)
  [-0.145, 0.145].forEach((cx) => {
    const blush = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.038, 14, 14)),
      blushPinkMat
    );
    blush.position.set(cx, -0.035, 0.205);
    blush.scale.set(1.25, 0.72, 0.25);
    headGroup.add(blush);
  });

  // Boca fechada (Sorriso sereno)
  const closedSmileMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.TorusGeometry(0.038, 0.007, 10, 20, Math.PI)).rotateX(Math.PI),
    eyeDarkMat
  );
  closedSmileMesh.position.set(0, -0.072, 0.232);
  headGroup.add(closedSmileMesh);

  // Boca aberta expressiva (para morder e mastigar)
  const openMouthGroup = new THREE.Group();
  openMouthGroup.position.set(0, -0.088, 0.224);
  openMouthGroup.scale.set(1, 0.01, 1);
  openMouthGroup.visible = false;
  headGroup.add(openMouthGroup);

  const mouthInterior = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.056, 20, 20)),
    ctx.sharedMaterials.mucosaDeepMat
  );
  mouthInterior.scale.set(1.12, 1.0, 0.38);
  openMouthGroup.add(mouthInterior);

  const upperTeeth = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(0.052, 0.016, 0.016)),
    ctx.sharedMaterials.toothEnamelMat
  );
  upperTeeth.position.set(0, 0.036, 0.014);
  openMouthGroup.add(upperTeeth);

  const miniTongue = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.034, 14, 14)),
    ctx.sharedMaterials.mucosaPinkMat
  );
  miniTongue.position.set(0, -0.025, 0.01);
  miniTongue.scale.set(1.1, 0.55, 0.5);
  openMouthGroup.add(miniTongue);

  // =========================================================================
  // 4. BRAÇO DIREITO CINEMÁTICO (OMBRO -> COTOVELO -> MÃO + ARCO DE BÉZIER)
  // =========================================================================
  const unitCylinderGeo = ctx.trackGeo(new THREE.CylinderGeometry(1, 1, 1, 16));

  // Braço superior (Manga verde-menta)
  const rightUpperArmMesh = new THREE.Mesh(unitCylinderGeo, shirtMintMat);
  rightUpperArmMesh.castShadow = true;
  group.add(rightUpperArmMesh);

  // Articulação do cotovelo
  const rightElbowSphere = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.052, 16, 16)),
    chibiSkinMat
  );
  rightElbowSphere.castShadow = true;
  group.add(rightElbowSphere);

  // Antebraço (Pele)
  const rightForearmMesh = new THREE.Mesh(unitCylinderGeo, chibiSkinMat);
  rightForearmMesh.castShadow = true;
  group.add(rightForearmMesh);

  // Grupo da mãozinha + alimento segurado
  const rightHandGroup = new THREE.Group();
  group.add(rightHandGroup);

  const handPalm = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.068, 20, 20)),
    chibiSkinMat
  );
  handPalm.scale.set(1.05, 0.88, 0.92);
  handPalm.castShadow = true;
  rightHandGroup.add(handPalm);

  const handThumb = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.022, 0.035, 8, 12)),
    chibiSkinMat
  );
  handThumb.position.set(-0.04, 0.035, 0.04);
  handThumb.rotation.z = 0.6;
  rightHandGroup.add(handThumb);

  const { mesh: heldFoodSprite, mat: heldFoodMat } = ctx.createHD2DSpritePlane(0.38);
  heldFoodSprite.position.set(-0.04, 0.14, 0.02);
  rightHandGroup.add(heldFoodSprite);

  // =========================================================================
  // 5. PARTÍCULAS DE NUTRIÇÃO SUAVES (CELEBRAÇÃO DA MORDIDA)
  // =========================================================================
  const crumbSparkles: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const sp = new THREE.Mesh(
      ctx.trackGeo(new THREE.OctahedronGeometry(0.028, 0)),
      ctx.sharedMaterials.bolusGoldMat
    );
    sp.visible = false;
    group.add(sp);
    crumbSparkles.push(sp);
  }

  // Hit proxy amplo sobre a mesa e o personagem para toque acessível
  const biteHitProxy = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(2.1, 1.35, 1.1)),
    ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
  );
  biteHitProxy.position.set(0.05, 0.75, 0.1);
  group.add(biteHitProxy);
  ctx.registerInteractive(
    biteHitProxy,
    'first_bite',
    'Toque para pegar o lanche no prato e dar a primeira mordida',
    'trigger_bite'
  );

  // Estado cinemático suavizado
  const smoothHandPos = new THREE.Vector3(0.14, 0.56, 0.28);
  let smoothMouthOpen = 0;
  let smoothHeadPitch = 0;
  let smoothHeadYaw = 0.65;
  let arcProgress = 0; // 0 (no prato) -> 1 (na boca)

  // Pontos chave no espaço da estação
  const posIdleHand = new THREE.Vector3(0.12, 0.55, 0.30);
  const posPlateHand = new THREE.Vector3(platePos.x, platePos.y + 0.09, platePos.z + 0.04);
  const posMouthHand = new THREE.Vector3(-0.18, 0.87, 0.10);
  const posCompletedHand = new THREE.Vector3(0.10, 0.64, 0.26);

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => {
    // 1. Sincroniza texturas do alimento escolhido (Inteiro vs Mordido)
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

    // 2. Halo convidativo no prato quando em espera
    const targetHalo = cur.bitePhase === 'idle' ? 0.45 + (cur.lowSensory ? 0 : Math.sin(simTime * 2.5) * 0.15) : 0.08;
    plateHaloMat.emissiveIntensity = THREE.MathUtils.damp(plateHaloMat.emissiveIntensity, targetHalo, 5, dt);

    // 3. Cálculo do alvo da mão, abertura da boca e inclinação da cabeça por fase
    let targetMouthOpen = 0;
    let targetHeadPitch = 0;
    let targetHeadYaw = 0.65;
    let isHappyChewing = false;

    if (cur.bitePhase === 'idle') {
      _vHand.copy(posIdleHand);
      if (!cur.lowSensory) {
        _vHand.y += Math.sin(simTime * 2.0) * 0.012;
      }
      arcProgress = THREE.MathUtils.damp(arcProgress, 0, 5, dt);
      targetHeadPitch = 0.06;
      targetHeadYaw = 0.68;
    } else if (cur.bitePhase === 'reaching') {
      _vHand.copy(posPlateHand);
      arcProgress = THREE.MathUtils.damp(arcProgress, 0, 6, dt);
      targetHeadPitch = 0.16; // Olha para o prato com curiosidade
      targetHeadYaw = 0.78;
      targetMouthOpen = 0.15;
    } else if (cur.bitePhase === 'holding') {
      _vHand.copy(posPlateHand);
      _vHand.y += 0.05; // Levanta suavemente o lanche do prato
      arcProgress = THREE.MathUtils.damp(arcProgress, 0.15, 5, dt);
      targetHeadPitch = 0.12;
      targetHeadYaw = 0.74;
      targetMouthOpen = 0.35;
    } else if (cur.bitePhase === 'bringing_to_mouth') {
      arcProgress = THREE.MathUtils.damp(arcProgress, 0.92, 4.2, dt);
      // Curva parabólica suave (Arco de movimento entre prato e boca)
      _vHand.lerpVectors(posPlateHand, posMouthHand, arcProgress);
      _vHand.y += Math.sin(arcProgress * Math.PI) * 0.16;
      _vHand.z += Math.sin(arcProgress * Math.PI) * 0.08;

      targetHeadPitch = -0.06; // Inclina levemente para receber o lanche
      targetHeadYaw = 0.58;
      targetMouthOpen = 0.95; // Abre a boquinha com alegria
    } else if (cur.bitePhase === 'biting') {
      arcProgress = THREE.MathUtils.damp(arcProgress, 1.0, 7, dt);
      _vHand.copy(posMouthHand);
      targetHeadPitch = 0.04;
      targetHeadYaw = 0.56;
      // "Croc!" — A boquinha fecha na mordida e inicia a mastigação
      targetMouthOpen = 0.22 + Math.abs(Math.sin(simTime * 8.0)) * 0.35;
      isHappyChewing = true;
    } else if (cur.bitePhase === 'completed') {
      _vHand.copy(posCompletedHand);
      if (!cur.lowSensory) {
        _vHand.y += Math.sin(simTime * 2.2) * 0.012;
      }
      targetHeadPitch = 0.02;
      targetHeadYaw = 0.62;
      // Mastigação serena e satisfeita
      targetMouthOpen = 0.15 + Math.abs(Math.sin(simTime * 5.2)) * 0.38;
      isHappyChewing = true;
    }

    // Amortecimento suave da posição da mão
    smoothHandPos.x = THREE.MathUtils.damp(smoothHandPos.x, _vHand.x, 6.5, dt);
    smoothHandPos.y = THREE.MathUtils.damp(smoothHandPos.y, _vHand.y, 6.5, dt);
    smoothHandPos.z = THREE.MathUtils.damp(smoothHandPos.z, _vHand.z, 6.5, dt);

    rightHandGroup.position.copy(smoothHandPos);

    // 4. Cinemática Inversa de 2 Elos (Ombro -> Cotovelo -> Mão)
    // Ombro direito da criança no espaço da estação
    _vShoulder.set(-0.20, 0.65, 0.04);

    // Cotovelo calculado no meio do caminho com caimento anatômico natural
    _vElbow.addVectors(_vShoulder, smoothHandPos).multiplyScalar(0.5);
    _vElbow.y -= 0.13;
    _vElbow.x += 0.06;
    _vElbow.z += 0.08;

    rightElbowSphere.position.copy(_vElbow);
    alignLimbSegment(rightUpperArmMesh, _vShoulder, _vElbow, 0.054);
    alignLimbSegment(rightForearmMesh, _vElbow, smoothHandPos, 0.046);

    // 5. Expressão Facial, Olhos e Boca
    smoothMouthOpen = THREE.MathUtils.damp(smoothMouthOpen, targetMouthOpen, 8, dt);
    smoothHeadPitch = THREE.MathUtils.damp(smoothHeadPitch, targetHeadPitch, 5, dt);
    smoothHeadYaw = THREE.MathUtils.damp(smoothHeadYaw, targetHeadYaw, 5, dt);

    childRoot.rotation.y = smoothHeadYaw;
    headGroup.rotation.x = smoothHeadPitch;

    // Respiração suave do tronco
    if (!cur.lowSensory) {
      headGroup.position.y = 1.0 + Math.sin(simTime * 2.2) * 0.006;
    } else {
      headGroup.position.y = 1.0;
    }

    // Alterna entre sorriso fechado e boca aberta articulada
    if (smoothMouthOpen > 0.12) {
      closedSmileMesh.visible = false;
      openMouthGroup.visible = true;
      openMouthGroup.scale.set(1, Math.max(0.15, smoothMouthOpen), 1);
    } else {
      closedSmileMesh.visible = true;
      openMouthGroup.visible = false;
    }

    // Alterna entre olhos abertos com brilho e olhos sorridentes (^ ^)
    openEyesGroup.visible = !isHappyChewing;
    happyEyesGroup.visible = isHappyChewing;

    // 6. Estrelinhas de celebração nutritiva durante a mordida
    const showSparkles = (cur.bitePhase === 'biting' || cur.bitePhase === 'completed') && !cur.lowSensory;
    crumbSparkles.forEach((sp, idx) => {
      sp.visible = showSparkles;
      if (showSparkles) {
        const angle = simTime * 2.0 + (idx * Math.PI) / 2;
        const radius = 0.22 + Math.sin(simTime * 3 + idx) * 0.03;
        sp.position.set(
          -0.22 + Math.cos(angle) * radius,
          1.05 + Math.sin(simTime * 2.5 + idx) * 0.08,
          0.12 + Math.sin(angle) * 0.1
        );
        sp.rotation.y = simTime * 2.5;
        sp.rotation.z = simTime * 1.8;
      }
    });
  };

  return {
    group,
    update
  };
}
