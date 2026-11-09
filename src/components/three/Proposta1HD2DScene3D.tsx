/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PALCO ESPACIAL 3D UNIFICADO (ESTILO HD-2D) — PROPOSTA 1: "A VIAGEM DO ALIMENTO"
 * Integra órgãos anatômicos 3D esculpidos em Three.js r160+ (PBR RoomEnvironment, sombras suaves
 * e iluminação 3 pontos) com os 6 assets autorais 16-bit recortados em canal alfa (NearestFilter).
 *
 * Estações 3D:
 * 1. food_select     — Mesa circular 3D com 4 pratos e sprites HD-2D (Maçã, Pão, Cenoura e Ovo)
 * 2. first_bite      — Braço articulado 3D levando o alimento 16-bit do prato até a boca 3D e mordendo
 * 3. mouth           — Cavidade bucal 3D com arcadas dentárias, trituração e gotas de saliva 16-bit
 * 4. swallow         — Faringe, traqueia, esôfago e válvula 3D da epiglote em deglutição segura
 * 5. esophagus       — Túnel muscular 3D revestido com a textura 16-bit do esôfago + tubo 16-bit e 3 anéis
 * 6. stomach         — Câmara gástrica 3D translúcida com gotas 16-bit e nível fluido calmo de quimo
 * 7. small_intestine — Canal intestinal 3D com 36 vilosidades (InstancedMesh) e 3 esferas de nutrientes
 * 8. large_intestine — Moldura 3D do cólon com reabsorção das gotas 16-bit de água e fibras
 * 9. final_ordering  — Diorama 3D do tronco translúcido completo iluminando os 5 órgãos em sequência
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FoodId } from '../FoodSelector';
import { ActiveScreen } from '../StageProgressBar';
import {
  detectSoftwareGl,
  scheduleAfterDraw,
  createRadialContactShadowTexture,
  createStudioFloorDialTexture
} from './webglUtils';
import { loadAllProposta1HD2DAssets, LoadedHD2DAssetPack } from './pixelAssetLoader';

export type Bite3DPhase =
  | 'idle'
  | 'reaching'
  | 'holding'
  | 'bringing_to_mouth'
  | 'biting'
  | 'completed';

export interface Proposta1HD2DSceneProps {
  stage: Exclude<ActiveScreen, 'hub'>;
  selectedFoodId: FoodId;
  isPaused: boolean;
  lowSensory: boolean;
  cameraResetTrigger: number;

  // Estados das 9 estações sincronizados via ref
  bitePhase: Bite3DPhase;
  chewCount: number;
  salivaAdded: boolean;
  swallowed: boolean;
  throatProgress: number; // 0..100
  esoRingStep: number; // 0..3
  gastricDrops: boolean[]; // [bool, bool, bool]
  nutrientsAbsorbed: boolean[]; // [bool, bool, bool]
  waterDropsAbsorbed: boolean[]; // [bool, bool, bool]
  orderedOrganIds: (string | null)[]; // length 5: ['boca','esofago','estomago','delgado','grosso']

  // Callbacks de clique direto nos elementos 3D (Raycasting)
  onSelectFood3D: (id: FoodId) => void;
  onTriggerBite3D: () => void;
  onChew3D: () => void;
  onAddSaliva3D: () => void;
  onSwallow3D: () => void;
  onSqueezeEsoRing3D: (ringIdx: number) => void;
  onAddGastricDrop3D: (dropIdx: number) => void;
  onAbsorbNutrient3D: (nutIdx: number) => void;
  onAbsorbWaterDrop3D: (waterIdx: number) => void;
}

// Helpers matemáticos pré-alocados no escopo do módulo (Zero GC no loop)
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();
const _bgColor = new THREE.Color();
const _dummy = new THREE.Object3D();
const _curvePt = new THREE.Vector3();

const STAGE_CAMERAS: Record<
  Exclude<ActiveScreen, 'hub'>,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  food_select: { pos: [0, 1.48, 2.85], target: [0, 0.72, 0] },
  first_bite: { pos: [0, 1.25, 2.75], target: [0, 0.92, 0] },
  mouth: { pos: [0, 1.22, 2.45], target: [0, 0.95, 0] },
  swallow: { pos: [0, 1.15, 2.55], target: [0, 0.95, 0] },
  esophagus: { pos: [0, 1.18, 2.65], target: [0, 0.98, 0] },
  stomach: { pos: [0, 1.12, 2.55], target: [0, 0.9, 0] },
  small_intestine: { pos: [0, 1.28, 2.55], target: [0, 0.78, 0] },
  large_intestine: { pos: [0, 1.12, 2.65], target: [0, 0.92, 0] },
  final_ordering: { pos: [0, 1.12, 2.95], target: [0, 0.96, 0] }
};

export const Proposta1HD2DScene3D: React.FC<Proposta1HD2DSceneProps> = (props) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [hoverHint, setHoverHint] = useState<string | null>(null);

  const propsRef = useRef(props);
  propsRef.current = props;

  const camAnimRef = useRef({
    animating: true,
    goalPos: new THREE.Vector3(...STAGE_CAMERAS[props.stage].pos),
    goalTarget: new THREE.Vector3(...STAGE_CAMERAS[props.stage].target)
  });

  useEffect(() => {
    const preset = STAGE_CAMERAS[props.stage];
    camAnimRef.current.goalPos.set(...preset.pos);
    camAnimRef.current.goalTarget.set(...preset.target);
    camAnimRef.current.animating = true;
  }, [props.stage, props.cameraResetTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance'
      });
    } catch {
      setWebglReady(false);
      return;
    }

    const initW = Math.max(container.clientWidth, 300);
    const initH = Math.max(container.clientHeight, 320);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglReady(false);
    };
    const onContextRestored = () => setWebglReady(true);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.Fog(0xf1f5f9, 6.5, 16);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 40);
    camera.position.set(...STAGE_CAMERAS[propsRef.current.stage].pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(...STAGE_CAMERAS[propsRef.current.stage].target);
    controls.minDistance = 1.4;
    controls.maxDistance = 5.0;
    controls.minPolarAngle = Math.PI * 0.12;
    controls.maxPolarAngle = Math.PI * 0.54;
    controls.enablePan = false;
    controls.addEventListener('start', () => {
      camAnimRef.current.animating = false;
    });

    // Iluminação de Estúdio 3 Pontos (Quente / Fria)
    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0xcbd5e1, 0.8);
    hemi.position.set(0, 8, 0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(2.8, 4.4, 3.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      const d = 2.4;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.55);
    fillLight.position.set(-3.0, 2.2, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x99f6e4, 0.65);
    rimLight.position.set(0, 2.8, -3.2);
    scene.add(rimLight);

    // Registro de geometrias, materiais e texturas para dispose completo
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const extraTextures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    // Base / Pedestal de Estúdio Comum
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const floorMesh = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(9, 48)).rotateX(-Math.PI / 2),
      trackMat(new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.92, metalness: 0.02 }))
    );
    floorMesh.position.y = -0.08;
    floorMesh.receiveShadow = true;
    baseGroup.add(floorMesh);

    const pedestalMesh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.42, 1.52, 0.08, 56)),
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.35,
          metalness: 0.06,
          clearcoat: 0.35
        })
      )
    );
    pedestalMesh.position.y = -0.04;
    pedestalMesh.receiveShadow = true;
    baseGroup.add(pedestalMesh);

    const pedestalTrim = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(1.45, 0.016, 14, 64)).rotateX(Math.PI / 2),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3, metalness: 0.7 }))
    );
    pedestalTrim.position.y = -0.004;
    baseGroup.add(pedestalTrim);

    const dialTex = createStudioFloorDialTexture(renderer);
    extraTextures.push(dialTex);
    const dialPlane = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(3.3, 3.3)).rotateX(-Math.PI / 2),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: dialTex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        })
      )
    );
    dialPlane.position.y = -0.075;
    baseGroup.add(dialPlane);

    const shadowTex = createRadialContactShadowTexture(renderer);
    extraTextures.push(shadowTex);
    const contactShadow = new THREE.Mesh(
      trackGeo(new THREE.PlaneGeometry(2.2, 1.6)).rotateX(-Math.PI / 2),
      trackMat(
        new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          depthWrite: false,
          opacity: 0.48
        })
      )
    );
    contactShadow.position.y = 0.003;
    baseGroup.add(contactShadow);

    // =========================================================================
    // LISTA DE PROXIES INTERATIVOS (RAYCASTING LAYER 1)
    // =========================================================================
    const interactiveMeshes: THREE.Object3D[] = [];
    const registerInteractive = (
      obj: THREE.Object3D,
      stageOwner: Exclude<ActiveScreen, 'hub'>,
      hint: string,
      actionType: string,
      payload?: number | string
    ) => {
      obj.layers.enable(1);
      obj.userData = { stageOwner, hint, actionType, payload };
      interactiveMeshes.push(obj);
    };

    // Helper para criar placa HD-2D dupla-face (Sprite 16-bit nítido no espaço 3D)
    const sharedSpritePlaneGeo = trackGeo(new THREE.PlaneGeometry(1, 1));
    const createHD2DSpritePlane = (size: number) => {
      const mat = trackMat(
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          alphaTest: 0.08,
          side: THREE.DoubleSide
        })
      );
      const mesh = new THREE.Mesh(sharedSpritePlaneGeo, mat);
      mesh.scale.set(size, size, 1);
      mesh.castShadow = !isSoftwareGl;
      return { mesh, mat };
    };

    // =========================================================================
    // GRUPOS DAS 9 ESTAÇÕES
    // =========================================================================
    const stationGroups: Record<Exclude<ActiveScreen, 'hub'>, THREE.Group> = {
      food_select: new THREE.Group(),
      first_bite: new THREE.Group(),
      mouth: new THREE.Group(),
      swallow: new THREE.Group(),
      esophagus: new THREE.Group(),
      stomach: new THREE.Group(),
      small_intestine: new THREE.Group(),
      large_intestine: new THREE.Group(),
      final_ordering: new THREE.Group()
    };
    (Object.keys(stationGroups) as Array<Exclude<ActiveScreen, 'hub'>>).forEach((k) => {
      scene.add(stationGroups[k]);
    });

    // Materiais comuns orgânicos PBR
    const porcelainMat = trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.22, clearcoat: 0.6 })
    );
    const woodTableMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.65, metalness: 0.05 })
    );
    const bolusGoldMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        roughness: 0.32
      })
    );
    const toothEnamelMat = trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 0.7 })
    );
    const mucosaPinkMat = trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0xfda4af, roughness: 0.45, clearcoat: 0.25 })
    );
    const mucosaDeepMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.55 })
    );

    // -------------------------------------------------------------------------
    // ESTAÇÃO 1: food_select (Mesa 3D com 4 Pratos e Sprites HD-2D)
    // -------------------------------------------------------------------------
    const tableBoard = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(2.55, 0.08, 0.92)),
      woodTableMat
    );
    tableBoard.position.set(0, 0.42, 0);
    tableBoard.castShadow = true;
    tableBoard.receiveShadow = true;
    stationGroups.food_select.add(tableBoard);

    // Pés da bancada
    [-1.1, 1.1].forEach((lx) => {
      [-0.32, 0.32].forEach((lz) => {
        const leg = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.045, 0.035, 0.42, 16)),
          woodTableMat
        );
        leg.position.set(lx, 0.21, lz);
        stationGroups.food_select.add(leg);
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
    }> = [];

    foodOrder.forEach((fid, idx) => {
      const xPos = -0.93 + idx * 0.62;
      const slotGroup = new THREE.Group();
      slotGroup.position.set(xPos, 0.48, (idx === 1 || idx === 2 ? 0.06 : -0.04));
      stationGroups.food_select.add(slotGroup);

      const plate = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.24, 0.19, 0.035, 32)),
        porcelainMat
      );
      plate.castShadow = true;
      plate.receiveShadow = true;
      slotGroup.add(plate);

      const ringMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0d9488,
          emissive: 0x0d9488,
          emissiveIntensity: 0,
          roughness: 0.3
        })
      );
      const ring = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.25, 0.014, 12, 36)).rotateX(Math.PI / 2),
        ringMat
      );
      ring.position.y = 0.02;
      slotGroup.add(ring);

      const { mesh: foodCard, mat: spriteMat } = createHD2DSpritePlane(0.42);
      foodCard.position.y = 0.26;
      slotGroup.add(foodCard);

      const hitProxy = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.27, 0.27, 0.55, 16)),
        trackMat(new THREE.MeshBasicMaterial({ visible: false }))
      );
      hitProxy.position.y = 0.22;
      slotGroup.add(hitProxy);
      registerInteractive(hitProxy, 'food_select', `Escolher ${foodLabels[fid]}`, 'select_food', fid);

      foodSelectSlots.push({ id: fid, group: slotGroup, spriteMat, ringMat });
    });

    // -------------------------------------------------------------------------
    // ESTAÇÃO 2: first_bite (Personagem 3D + Prato + Braço 3D Mordendo Sprite 16-Bit)
    // -------------------------------------------------------------------------
    const biteHeadGroup = new THREE.Group();
    biteHeadGroup.position.set(-0.68, 0.92, 0);
    stationGroups.first_bite.add(biteHeadGroup);

    const skinMat = trackMat(
      new THREE.MeshPhysicalMaterial({ color: 0xfde68a, roughness: 0.48, clearcoat: 0.15 })
    );
    const craniumUpper = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.32, 28, 28)),
      skinMat
    );
    craniumUpper.scale.set(0.95, 1.02, 0.92);
    craniumUpper.castShadow = true;
    biteHeadGroup.add(craniumUpper);

    // Olhos amigáveis 3D
    const eyeDarkMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 }));
    [-0.08, 0.08].forEach((ez) => {
      const eye = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.032, 14, 14)), eyeDarkMat);
      eye.position.set(0.26, 0.08, ez * 1.4);
      biteHeadGroup.add(eye);
    });

    // Cavidade oral e mandíbula articulada para abrir na hora da mordida
    const biteMouthCavity = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.16, 20, 20)),
      mucosaDeepMat
    );
    biteMouthCavity.position.set(0.22, -0.08, 0);
    biteHeadGroup.add(biteMouthCavity);

    const biteLowerJaw = new THREE.Group();
    biteLowerJaw.position.set(0.12, -0.14, 0);
    biteHeadGroup.add(biteLowerJaw);
    const jawChin = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.09, 0.14, 10, 16)).rotateZ(Math.PI / 2),
      skinMat
    );
    jawChin.position.set(0.08, -0.03, 0);
    biteLowerJaw.add(jawChin);

    // Pedestal e prato direito do lanche
    const biteTableStand = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.26, 0.3, 0.62, 24)),
      woodTableMat
    );
    biteTableStand.position.set(0.72, 0.31, 0);
    stationGroups.first_bite.add(biteTableStand);

    const bitePlate = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.28, 0.22, 0.04, 32)),
      porcelainMat
    );
    bitePlate.position.set(0.72, 0.64, 0);
    stationGroups.first_bite.add(bitePlate);

    const { mesh: bitePlateFoodSprite, mat: bitePlateFoodMat } = createHD2DSpritePlane(0.44);
    bitePlateFoodSprite.position.set(0.72, 0.9, 0.02);
    stationGroups.first_bite.add(bitePlateFoodSprite);

    // Braço 3D Articulado + Mão + Alimento 16-Bit Segurado
    const biteArmGroup = new THREE.Group();
    biteArmGroup.position.set(0.72, 0.85, 0.16);
    stationGroups.first_bite.add(biteArmGroup);

    const sleeveMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.5 }));
    const forearmMesh = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.068, 0.34, 12, 20)).rotateZ(Math.PI / 2),
      sleeveMat
    );
    forearmMesh.position.set(0.24, -0.04, 0);
    forearmMesh.castShadow = true;
    biteArmGroup.add(forearmMesh);

    const handPalm = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.095, 20, 20)), skinMat);
    handPalm.scale.set(1.1, 0.9, 0.8);
    biteArmGroup.add(handPalm);

    const { mesh: heldFoodSprite, mat: heldFoodMat } = createHD2DSpritePlane(0.42);
    heldFoodSprite.position.set(-0.08, 0.16, 0.04);
    biteArmGroup.add(heldFoodSprite);

    const biteHitProxy = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.8, 1.0, 0.8)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    biteHitProxy.position.set(0.1, 0.85, 0);
    stationGroups.first_bite.add(biteHitProxy);
    registerInteractive(
      biteHitProxy,
      'first_bite',
      'Toque para o braço pegar o alimento e dar a mordida',
      'trigger_bite'
    );

    // -------------------------------------------------------------------------
    // ESTAÇÃO 3: mouth (Cavidade Bucal 3D: Arcadas Dentárias + Saliva 16-Bit)
    // -------------------------------------------------------------------------
    const upperArchGroup = new THREE.Group();
    upperArchGroup.position.set(0, 1.26, 0);
    stationGroups.mouth.add(upperArchGroup);

    const lowerArchGroup = new THREE.Group();
    lowerArchGroup.position.set(0, 0.64, 0);
    stationGroups.mouth.add(lowerArchGroup);

    const gumArchGeo = trackGeo(new THREE.TorusGeometry(0.46, 0.085, 16, 36, Math.PI));
    const upperGum = new THREE.Mesh(gumArchGeo, mucosaPinkMat);
    upperGum.rotation.x = Math.PI / 2;
    upperGum.rotation.z = Math.PI;
    upperArchGroup.add(upperGum);

    const lowerGum = new THREE.Mesh(gumArchGeo, mucosaPinkMat);
    lowerGum.rotation.x = Math.PI / 2;
    lowerGum.rotation.z = Math.PI;
    lowerArchGroup.add(lowerGum);

    // Língua 3D macia
    const tongueMesh = new THREE.Mesh(
      trackGeo(new THREE.CapsuleGeometry(0.22, 0.26, 12, 24)).rotateX(Math.PI / 2),
      mucosaDeepMat
    );
    tongueMesh.scale.set(1.15, 0.45, 1);
    tongueMesh.position.set(0, 0.02, -0.05);
    lowerArchGroup.add(tongueMesh);

    // 6 Dentes superiores e 6 inferiores chanfrados
    const molarGeo = trackGeo(new THREE.BoxGeometry(0.11, 0.14, 0.11));
    for (let i = 0; i < 6; i++) {
      const ang = Math.PI * (0.15 + (i / 5) * 0.7);
      const tx = Math.cos(ang) * 0.44;
      const tz = Math.sin(ang) * 0.36 - 0.1;

      const uTooth = new THREE.Mesh(molarGeo, toothEnamelMat);
      uTooth.position.set(tx, -0.09, tz);
      uTooth.castShadow = true;
      upperArchGroup.add(uTooth);

      const lTooth = new THREE.Mesh(molarGeo, toothEnamelMat);
      lTooth.position.set(tx, 0.09, tz);
      lTooth.castShadow = true;
      lowerArchGroup.add(lTooth);
    }

    // Alimento central sendo triturado + Bolo alimentar formado
    const { mesh: mouthFoodSprite, mat: mouthFoodMat } = createHD2DSpritePlane(0.5);
    mouthFoodSprite.position.set(0, 0.95, 0.06);
    stationGroups.mouth.add(mouthFoodSprite);

    const mouthChunksGroup = new THREE.Group();
    mouthChunksGroup.position.set(0, 0.94, 0.06);
    stationGroups.mouth.add(mouthChunksGroup);
    const chunkMeshes: THREE.Mesh[] = [];
    for (let c = 0; c < 5; c++) {
      const chunk = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.085, 1)), bolusGoldMat);
      chunk.position.set((c - 2) * 0.09, (c % 2) * 0.06 - 0.03, (c % 3 - 1) * 0.05);
      mouthChunksGroup.add(chunk);
      chunkMeshes.push(chunk);
    }

    const mouthBolusSphere = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.17, 24, 24)),
      bolusGoldMat
    );
    mouthBolusSphere.position.set(0, 0.94, 0.06);
    stationGroups.mouth.add(mouthBolusSphere);

    // 3 Gotas de Saliva 16-Bit flutuando acima da boca
    const mouthSalivaSprites: THREE.Mesh[] = [];
    const mouthSalivaMats: THREE.MeshBasicMaterial[] = [];
    [-0.28, 0, 0.28].forEach((sx, idx) => {
      const { mesh, mat } = createHD2DSpritePlane(0.24);
      mesh.position.set(sx, 1.52 + (idx === 1 ? 0.06 : 0), 0.14);
      stationGroups.mouth.add(mesh);
      mouthSalivaSprites.push(mesh);
      mouthSalivaMats.push(mat);

      registerInteractive(mesh, 'mouth', 'Adicionar gota de saliva 16-bit', 'add_saliva');
    });

    const teethProxy = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.1, 0.72, 0.75)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    teethProxy.position.set(0, 0.95, 0);
    stationGroups.mouth.add(teethProxy);
    registerInteractive(teethProxy, 'mouth', 'Mastigar alimento com os dentes 3D', 'chew_mouth');

    // -------------------------------------------------------------------------
    // ESTAÇÃO 4: swallow (Garganta, Traqueia, Esôfago e Válvula 3D da Epiglote)
    // -------------------------------------------------------------------------
    const tracheaMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        roughness: 0.3,
        transparent: true,
        opacity: 0.75,
        depthWrite: false
      })
    );
    const throatEsoMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xfecdd3,
        roughness: 0.35,
        transparent: true,
        opacity: 0.78,
        depthWrite: false
      })
    );

    // Tubo anterior: Traqueia (Ar)
    const tracheaTube = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 24)),
      tracheaTubeMatHelper(tracheaMat)
    );
    tracheaTube.position.set(-0.24, 0.56, 0);
    stationGroups.swallow.add(tracheaTube);

    function tracheaTubeMatHelper(m: THREE.Material) {
      return m;
    }

    // Anéis cartilaginosos da traqueia
    const cartRingMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 }));
    for (let r = 0; r < 4; r++) {
      const trRing = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.145, 0.015, 10, 28)).rotateX(Math.PI / 2),
        cartRingMat
      );
      trRing.position.set(-0.24, 0.3 + r * 0.17, 0);
      stationGroups.swallow.add(trRing);
    }

    // Tubo posterior: Entrada do Esôfago (Alimento)
    const swallowEsoTube = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.15, 0.15, 0.95, 24)),
      throatEsoMat
    );
    swallowEsoTube.position.set(0.24, 0.56, 0);
    stationGroups.swallow.add(swallowEsoTube);

    // Câmara superior da Faringe
    const pharynxChamber = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.38, 0.42, 0.42, 28, 1, true)),
      throatEsoMat
    );
    pharynxChamber.position.set(0, 1.25, 0);
    stationGroups.swallow.add(pharynxChamber);

    // Válvula Articulada 3D da Epiglote
    const epiglottisPivot = new THREE.Group();
    epiglottisPivot.position.set(-0.04, 1.02, 0);
    stationGroups.swallow.add(epiglottisPivot);

    const epiglottisFlap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.32, 0.045, 0.24)),
      mucosaDeepMat
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
      trackGeo(new THREE.SphereGeometry(0.115, 22, 22)),
      bolusGoldMat
    );
    stationGroups.swallow.add(swallowBolus);

    const swallowHitProxy = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.0, 1.35, 0.6)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    swallowHitProxy.position.set(0, 0.85, 0);
    stationGroups.swallow.add(swallowHitProxy);
    registerInteractive(
      swallowHitProxy,
      'swallow',
      'Toque para engolir e ver a epiglote fechar o canal do ar',
      'trigger_swallow'
    );

    // -------------------------------------------------------------------------
    // ESTAÇÃO 5: esophagus (Túnel Muscular 3D com Textura 16-Bit + Tubo 16-Bit)
    // -------------------------------------------------------------------------
    // Túnel muscular semi-aberto mostrando a textura interna 16-bit enviada!
    const esoWallMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.58,
        metalness: 0.04,
        side: THREE.DoubleSide
      })
    );
    const esoTunnelGeo = trackGeo(
      new THREE.CylinderGeometry(0.28, 0.28, 1.35, 32, 16, true, Math.PI * 0.22, Math.PI * 1.56)
    );
    const esoTunnelMesh = new THREE.Mesh(esoTunnelGeo, esoWallMat);
    esoTunnelMesh.position.set(0, 0.94, 0);
    esoTunnelMesh.castShadow = true;
    stationGroups.esophagus.add(esoTunnelMesh);

    // Placa HD-2D lateral exibindo o asset "Creating_esophagus_game_environment" recortado!
    const { mesh: esoRefSprite, mat: esoRefSpriteMat } = createHD2DSpritePlane(0.82);
    esoRefSprite.position.set(-0.74, 0.96, 0.08);
    stationGroups.esophagus.add(esoRefSprite);

    // 3 Anéis Musculares Peristálticos 3D Clicáveis
    const esoRings: Array<{
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      y: number;
    }> = [];
    const ringHeights = [1.34, 0.95, 0.56];
    const ringNames = ['Anel Muscular Superior', 'Anel Muscular Médio', 'Anel Muscular Inferior'];

    ringHeights.forEach((ry, idx) => {
      const rMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.12,
          roughness: 0.35
        })
      );
      const rMesh = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.31, 0.042, 16, 40)).rotateX(Math.PI / 2),
        rMat
      );
      rMesh.position.set(0, ry, 0);
      stationGroups.esophagus.add(rMesh);

      const proxy = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20)),
        trackMat(new THREE.MeshBasicMaterial({ visible: false }))
      );
      proxy.position.set(0, ry, 0);
      stationGroups.esophagus.add(proxy);
      registerInteractive(proxy, 'esophagus', `Contrair ${ringNames[idx]}`, 'squeeze_eso_ring', idx);

      esoRings.push({ mesh: rMesh, mat: rMat, y: ry });
    });

    const esoBolus = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 24, 24)), bolusGoldMat);
    esoBolus.position.set(0, 1.42, 0.05);
    stationGroups.esophagus.add(esoBolus);

    // -------------------------------------------------------------------------
    // ESTAÇÃO 6: stomach (Câmara Gástrica 3D em "J" + Gotas 16-Bit + Quimo)
    // -------------------------------------------------------------------------
    const stomachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 1.48, 0),
      new THREE.Vector3(0.28, 1.15, 0.04),
      new THREE.Vector3(0.22, 0.68, 0.05),
      new THREE.Vector3(-0.28, 0.58, 0)
    ]);
    const stomachShellMat = trackMat(
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
      trackGeo(new THREE.TubeGeometry(stomachCurve, 36, 0.32, 24, false)),
      stomachShellMat
    );
    stomachShell.renderOrder = 8;
    stationGroups.stomach.add(stomachShell);

    // Fluido calmo do Suco Gástrico / Quimo no interior do estômago
    const chymeFluidMat = trackMat(
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
      trackGeo(new THREE.SphereGeometry(0.26, 28, 24)),
      chymeFluidMat
    );
    chymePool.position.set(0.05, 0.68, 0.03);
    chymePool.scale.set(1.35, 0.35, 0.9);
    stationGroups.stomach.add(chymePool);

    const stomachBolus = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.14, 22, 22)),
      bolusGoldMat
    );
    stomachBolus.position.set(0.08, 0.88, 0.04);
    stationGroups.stomach.add(stomachBolus);

    // 3 Gotas 16-Bit de Suco Gástrico clicáveis
    const gastricDropSprites: THREE.Mesh[] = [];
    const gastricDropMats: THREE.MeshBasicMaterial[] = [];
    [-0.45, 0, 0.45].forEach((gx, idx) => {
      const { mesh, mat } = createHD2DSpritePlane(0.28);
      mesh.position.set(gx, 1.54, 0.22);
      stationGroups.stomach.add(mesh);
      gastricDropSprites.push(mesh);
      gastricDropMats.push(mat);

      registerInteractive(
        mesh,
        'stomach',
        `Liberar Gota ${idx + 1} de Suco Gástrico 16-Bit`,
        'add_gastric_drop',
        idx
      );
    });

    // -------------------------------------------------------------------------
    // ESTAÇÃO 7: small_intestine (Vilosidades 3D InstancedMesh + 3 Nutrientes)
    // -------------------------------------------------------------------------
    const intFloorCurve = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.65, 0.65, 1.65, 28, 1, true, Math.PI * 0.65, Math.PI * 0.7)).rotateZ(
        Math.PI / 2
      ),
      mucosaPinkMat
    );
    intFloorCurve.position.set(0, 0.82, -0.05);
    stationGroups.small_intestine.add(intFloorCurve);

    // Vaso Sanguíneo 3D abaixo das vilosidades (recebe os nutrientes)
    const bloodVesselMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xe11d48,
        emissive: 0x9f1239,
        emissiveIntensity: 0.22,
        roughness: 0.3
      })
    );
    const bloodVessel = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.09, 0.09, 1.65, 20)).rotateZ(Math.PI / 2),
      bloodVesselMat
    );
    bloodVessel.position.set(0, 0.24, 0.12);
    stationGroups.small_intestine.add(bloodVessel);

    // 36 Vilosidades Intestinais 3D (InstancedMesh)
    const VILLI_COUNT = 36;
    const villiGeo = trackGeo(new THREE.CapsuleGeometry(0.032, 0.18, 8, 12));
    const villiMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.45 })
    );
    const villiInstanced = new THREE.InstancedMesh(villiGeo, villiMat, VILLI_COUNT);
    villiInstanced.frustumCulled = false;
    stationGroups.small_intestine.add(villiInstanced);

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
      const nMat = trackMat(
        new THREE.MeshPhysicalMaterial({
          color: nutrientColors[idx],
          emissive: nutrientColors[idx],
          emissiveIntensity: 0.32,
          roughness: 0.18,
          clearcoat: 0.8
        })
      );
      const orb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.125, 24, 24)), nMat);
      orb.position.set(nx, 1.12, 0.08);
      orb.castShadow = true;
      stationGroups.small_intestine.add(orb);

      registerInteractive(
        orb,
        'small_intestine',
        `Absorver ${nutrientNames[idx]}`,
        'absorb_nutrient',
        idx
      );
      nutrientOrbs.push({ mesh: orb, baseX: nx });
    });

    // -------------------------------------------------------------------------
    // ESTAÇÃO 8: large_intestine (Moldura 3D do Cólon + Gotas de Água 16-Bit)
    // -------------------------------------------------------------------------
    const colonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.35, 0),
      new THREE.Vector3(-0.58, 1.28, 0),
      new THREE.Vector3(0, 1.36, 0.04),
      new THREE.Vector3(0.58, 1.28, 0),
      new THREE.Vector3(0.55, 0.35, 0),
      new THREE.Vector3(0.18, 0.22, 0)
    ]);
    const colonShellMat = trackMat(
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
      trackGeo(new THREE.TubeGeometry(colonCurve, 56, 0.17, 20, false)),
      colonShellMat
    );
    colonTube.renderOrder = 8;
    stationGroups.large_intestine.add(colonTube);

    const fiberBolusMat = trackMat(
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 })
    );
    const colonBolus = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.12, 20, 20)),
      fiberBolusMat
    );
    stationGroups.large_intestine.add(colonBolus);

    const colonWaterSprites: THREE.Mesh[] = [];
    const colonWaterMats: THREE.MeshBasicMaterial[] = [];
    const waterBaseCoords: Array<[number, number, number]> = [
      [-0.55, 0.85, 0.18],
      [0, 1.36, 0.22],
      [0.55, 0.85, 0.18]
    ];
    waterBaseCoords.forEach(([wx, wy, wz], idx) => {
      const { mesh, mat } = createHD2DSpritePlane(0.26);
      mesh.position.set(wx, wy, wz);
      stationGroups.large_intestine.add(mesh);
      colonWaterSprites.push(mesh);
      colonWaterMats.push(mat);

      registerInteractive(
        mesh,
        'large_intestine',
        `Reabsorver Gota de Água ${idx + 1} para hidratar o corpo`,
        'absorb_water',
        idx
      );
    });

    // -------------------------------------------------------------------------
    // ESTAÇÃO 9: final_ordering (Diorama 3D do Tronco Translúcido Completo)
    // -------------------------------------------------------------------------
    const torsoShellMat = trackMat(
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
      trackGeo(new THREE.CapsuleGeometry(0.46, 0.78, 16, 32)),
      torsoShellMat
    );
    finalTorso.position.set(0, 0.86, 0);
    finalTorso.scale.set(1.08, 1, 0.68);
    finalTorso.renderOrder = 10;
    stationGroups.final_ordering.add(finalTorso);

    const finalHead = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.25, 28, 28)),
      torsoShellMat
    );
    finalHead.position.set(0, 1.66, 0);
    finalHead.renderOrder = 10;
    stationGroups.final_ordering.add(finalHead);

    const finalOrganMats: Record<string, THREE.MeshStandardMaterial> = {
      boca: trackMat(new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 })),
      esofago: trackMat(new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.38 })),
      estomago: trackMat(new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 })),
      delgado: trackMat(new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 })),
      grosso: trackMat(new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.4 }))
    };

    const fMouth = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.075, 0.026, 12, 24, Math.PI)).rotateX(Math.PI / 2),
      finalOrganMats.boca
    );
    fMouth.position.set(0, 1.56, 0.08);
    stationGroups.final_ordering.add(fMouth);

    const fEso = new THREE.Mesh(
      trackGeo(
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
    stationGroups.final_ordering.add(fEso);

    const fStomach = new THREE.Mesh(
      trackGeo(
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
    stationGroups.final_ordering.add(fStomach);

    const fSmall = new THREE.Mesh(
      trackGeo(
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
    stationGroups.final_ordering.add(fSmall);

    const fLarge = new THREE.Mesh(
      trackGeo(
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
    stationGroups.final_ordering.add(fLarge);

    const fullTractCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.56, 0.08),
      new THREE.Vector3(0, 1.28, 0),
      new THREE.Vector3(0.14, 0.9, 0.05),
      new THREE.Vector3(0, 0.62, 0.05),
      new THREE.Vector3(0.2, 0.56, 0.02),
      new THREE.Vector3(0, 0.36, 0)
    ]);
    const finalTravelSprite = createHD2DSpritePlane(0.22);
    finalTravelSprite.mesh.renderOrder = 12;
    stationGroups.final_ordering.add(finalTravelSprite.mesh);

    // =========================================================================
    // CARREGAMENTO ASSÍNCRONO DOS 6 ASSETS 16-BIT RECORTADOS
    // =========================================================================
    let assetPack: LoadedHD2DAssetPack | null = null;
    let disposed = false;

    loadAllProposta1HD2DAssets(renderer)
      .then((pack) => {
        if (disposed) {
          pack.disposeAll();
          return;
        }
        assetPack = pack;

        // Aplica cada alimento na mesa 3D inicial
        foodSelectSlots.forEach((slot) => {
          slot.spriteMat.map = pack.foods[slot.id].whole;
          slot.spriteMat.needsUpdate = true;
        });

        // Aplica gotas 16-bit dedicadas por órgão (Boca, Estômago e Intestino Grosso)
        mouthSalivaMats.forEach((m) => {
          m.map = pack.drops.saliva;
          m.needsUpdate = true;
        });
        gastricDropMats.forEach((m) => {
          m.map = pack.drops.gastric;
          m.needsUpdate = true;
        });
        colonWaterMats.forEach((m) => {
          m.map = pack.drops.water;
          m.needsUpdate = true;
        });

        // Aplica tubo esofágico 16-bit e parede muscular interna 16-bit
        esoRefSpriteMat.map = pack.esophagusTube;
        esoRefSpriteMat.needsUpdate = true;

        esoWallMat.map = pack.esophagusWall;
        esoWallMat.needsUpdate = true;
      })
      .catch(() => {
        // Silencioso: geometrias 3D permanecem funcionais
      });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // RAYCASTING DE CLIQUE E HOVER NAS ESTAÇÕES ATIVAS
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };
    let lastMove = 0;

    const getStageIntersections = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const activeStg = propsRef.current.stage;
      const candidates = interactiveMeshes.filter((m) => m.userData.stageOwner === activeStg);
      return raycaster.intersectObjects(candidates, false);
    };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 8) return;
      const hits = getStageIntersections(e.clientX, e.clientY);
      if (hits.length === 0) return;

      const { actionType, payload } = hits[0].object.userData;
      const p = propsRef.current;

      if (actionType === 'select_food' && payload) {
        p.onSelectFood3D(payload as FoodId);
      } else if (actionType === 'trigger_bite') {
        p.onTriggerBite3D();
      } else if (actionType === 'chew_mouth') {
        p.onChew3D();
      } else if (actionType === 'add_saliva') {
        p.onAddSaliva3D();
      } else if (actionType === 'trigger_swallow') {
        p.onSwallow3D();
      } else if (actionType === 'squeeze_eso_ring' && typeof payload === 'number') {
        p.onSqueezeEsoRing3D(payload);
      } else if (actionType === 'add_gastric_drop' && typeof payload === 'number') {
        p.onAddGastricDrop3D(payload);
      } else if (actionType === 'absorb_nutrient' && typeof payload === 'number') {
        p.onAbsorbNutrient3D(payload);
      } else if (actionType === 'absorb_water' && typeof payload === 'number') {
        p.onAbsorbWaterDrop3D(payload);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 50) return;
      lastMove = now;

      const hits = getStageIntersections(e.clientX, e.clientY);
      if (hits.length > 0) {
        setHoverHint(hits[0].object.userData.hint as string);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoverHint(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 300);
      const h = Math.max(container.clientHeight, 320);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // =========================================================================
    // LOOP DE RENDERIZAÇÃO E CINEMÁTICA SUAVE (SEM FLASHES)
    // =========================================================================
    const clock = new THREE.Clock();
    let simTime = 0;
    let rafId = 0;
    const afterDrawTimer = { id: 0 };

    let smoothArmX = 0.72;
    let smoothArmY = 0.85;
    let smoothJawAngle = 0;
    let smoothEpiglottisRot = 0.42;
    let smoothEsoBolusY = 1.42;
    let smoothStomachFluidScaleY = 0.25;
    let smoothColonT = 0.1;

    const tick = () => {
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const cur = propsRef.current;

      if (!cur.isPaused) {
        simTime += dt;
      }

      // Fundo calmo sincronizado com Baixo Estímulo
      _bgColor.set(cur.lowSensory ? '#E2E8F0' : '#F1F5F9');
      (scene.background as THREE.Color).lerp(_bgColor, 0.1);
      if (scene.fog) {
        scene.fog.color.copy(scene.background as THREE.Color);
      }

      // Visibilidade exclusiva da estação atual
      (Object.keys(stationGroups) as Array<Exclude<ActiveScreen, 'hub'>>).forEach((k) => {
        stationGroups[k].visible = k === cur.stage;
      });

      // Atualiza texturas dependentes do alimento escolhido
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
        if (mouthFoodMat.map !== chosenPack.bitten) {
          mouthFoodMat.map = chosenPack.bitten;
          mouthFoodMat.needsUpdate = true;
        }
        if (finalTravelSprite.mat.map !== chosenPack.whole) {
          finalTravelSprite.mat.map = chosenPack.whole;
          finalTravelSprite.mat.needsUpdate = true;
        }
      }

      // 1. Animação Estação food_select
      if (cur.stage === 'food_select') {
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
          const cardMesh = slot.group.children[2];
          if (cardMesh) {
            cardMesh.position.y = 0.27 + Math.sin(simTime * 1.6 + i) * 0.018;
          }
        });
      }

      // 2. Animação Estação first_bite
      if (cur.stage === 'first_bite') {
        const handHoldingFood =
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
      }

      // 3. Animação Estação mouth
      if (cur.stage === 'mouth') {
        const isStageDone = cur.chewCount >= 3 && cur.salivaAdded;
        mouthFoodSprite.visible = cur.chewCount === 0 && !isStageDone;
        mouthChunksGroup.visible = cur.chewCount > 0 && !isStageDone;
        mouthBolusSphere.visible = isStageDone;

        const chewOsc = !isStageDone && cur.chewCount > 0 ? Math.sin(simTime * 3.0) * 0.035 : 0;
        upperArchGroup.position.y = 1.24 - Math.abs(chewOsc);
        lowerArchGroup.position.y = 0.66 + Math.abs(chewOsc);

        chunkMeshes.forEach((cm, idx) => {
          const s = Math.max(0.55, 1.15 - cur.chewCount * 0.2);
          cm.scale.setScalar(s);
          cm.rotation.y = simTime * 0.5 + idx;
        });

        mouthSalivaSprites.forEach((sp, idx) => {
          const targetY = cur.salivaAdded ? 0.96 : 1.5 + (idx === 1 ? 0.06 : 0) + Math.sin(simTime * 1.8 + idx) * 0.025;
          const targetScale = cur.salivaAdded ? 0.01 : 0.24;
          sp.position.y = THREE.MathUtils.damp(sp.position.y, targetY, 4.5, dt);
          const sc = THREE.MathUtils.damp(sp.scale.x, targetScale, 5, dt);
          sp.scale.set(sc, sc, 1);
          sp.visible = sc > 0.03;
        });
      }

      // 4. Animação Estação swallow
      if (cur.stage === 'swallow') {
        const goalRot = cur.swallowed ? -0.18 : 0.45;
        smoothEpiglottisRot = THREE.MathUtils.damp(smoothEpiglottisRot, goalRot, 5, dt);
        epiglottisPivot.rotation.z = smoothEpiglottisRot;

        const t = Math.max(0, Math.min(1, cur.throatProgress / 100));
        swallowCurve.getPointAt(t, _curvePt);
        swallowBolus.position.copy(_curvePt);
      }

      // 5. Animação Estação esophagus
      if (cur.stage === 'esophagus') {
        const bolusTargets = [1.42, 1.12, 0.74, 0.34];
        const desiredY = bolusTargets[Math.min(cur.esoRingStep, 3)];
        smoothEsoBolusY = THREE.MathUtils.damp(smoothEsoBolusY, desiredY, 4.2, dt);
        esoBolus.position.y = smoothEsoBolusY;

        esoRings.forEach((r, idx) => {
          const contracted = cur.esoRingStep > idx;
          const isNext = cur.esoRingStep === idx;
          const targetScale = contracted ? 0.78 : isNext ? 1.04 + Math.sin(simTime * 2) * 0.02 : 1.0;
          const s = THREE.MathUtils.damp(r.mesh.scale.x, targetScale, 6, dt);
          r.mesh.scale.set(s, s, 1);

          r.mat.color.setHex(contracted ? 0x10b981 : 0xa855f7);
          r.mat.emissive.setHex(contracted ? 0x059669 : 0x7e22ce);
          r.mat.emissiveIntensity = isNext ? 0.28 : 0.12;
        });

        esoRefSprite.position.y = 0.96 + Math.sin(simTime * 1.4) * 0.02;
      }

      // 6. Animação Estação stomach
      if (cur.stage === 'stomach') {
        const addedCount = cur.gastricDrops.filter(Boolean).length;
        const goalFluidScaleY = 0.25 + addedCount * 0.22;
        smoothStomachFluidScaleY = THREE.MathUtils.damp(
          smoothStomachFluidScaleY,
          goalFluidScaleY,
          4,
          dt
        );
        chymePool.scale.set(1.38, smoothStomachFluidScaleY, 0.92);
        chymePool.position.y = 0.62 + smoothStomachFluidScaleY * 0.22;

        const bolusScale = Math.max(0.45, 1.0 - addedCount * 0.18);
        stomachBolus.scale.setScalar(bolusScale);
        stomachBolus.position.y = 0.84 - addedCount * 0.04 + Math.sin(simTime * 1.6) * 0.02;

        gastricDropSprites.forEach((sp, idx) => {
          const dropped = cur.gastricDrops[idx];
          const targetY = dropped ? 0.75 : 1.52 + Math.sin(simTime * 1.7 + idx) * 0.03;
          const targetSc = dropped ? 0.01 : 0.28;
          sp.position.y = THREE.MathUtils.damp(sp.position.y, targetY, 4.5, dt);
          const sc = THREE.MathUtils.damp(sp.scale.x, targetSc, 5, dt);
          sp.scale.set(sc, sc, 1);
          sp.visible = sc > 0.03;
        });
      }

      // 7. Animação Estação small_intestine
      if (cur.stage === 'small_intestine') {
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
      }

      // 8. Animação Estação large_intestine
      if (cur.stage === 'large_intestine') {
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
      }

      // 9. Animação Estação final_ordering
      if (cur.stage === 'final_ordering') {
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
          stationGroups.final_ordering.rotation.y = Math.sin(simTime * 0.35) * 0.16;
        }
      }

      // Transição amortecida de câmera
      if (camAnimRef.current.animating) {
        _camGoal.copy(camAnimRef.current.goalPos);
        _targetGoal.copy(camAnimRef.current.goalTarget);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, 4.2, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, 4.2, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, 4.2, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, 4.8, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, 4.8, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, 4.8, dt);

        if (
          camera.position.distanceToSquared(_camGoal) < 0.001 &&
          controls.target.distanceToSquared(_targetGoal) < 0.001
        ) {
          camAnimRef.current.animating = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        scheduleAfterDraw(renderer, tick, afterDrawTimer);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(afterDrawTimer.id);
      resizeObserver.disconnect();

      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      controls.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      extraTextures.forEach((t) => t.dispose());
      assetPack?.disposeAll();
      envMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[440px] select-none overflow-hidden bg-slate-100">
      <div ref={mountRef} className="w-full h-full" />

      {/* Dica discreta de hover sobre elemento 3D clicável */}
      {hoverHint && webglReady && (
        <div className="pointer-events-none absolute top-16 right-4 z-10 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs">
          {hoverHint}
        </div>
      )}

      {/* Fallback caso WebGL seja indisponível */}
      {!webglReady && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-100 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Modo Visual Simplificado Ativo
            </h3>
            <p className="text-sm text-slate-600">
              Use os controles na barra inferior para acompanhar todas as etapas da Viagem do Alimento com conforto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
