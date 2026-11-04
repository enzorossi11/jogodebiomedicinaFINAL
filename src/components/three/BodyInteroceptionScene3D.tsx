/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estúdio Espacial 3D Profissional em Three.js — Proposta 2: "Meu Corpo Está Falando Comigo"
 * Arquitetura Three.js r160+ com modelo escultural composto (18+ partes), iluminação PBR
 * RoomEnvironment, Raycasting por camadas, partículas InstancedMesh sem GC no loop e
 * compatibilidade integral com GPUs dedicadas e Software WebGL.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BodyRegionId,
  SensationId,
  BODY_REGIONS_PROPOSTA_2,
  SENSATIONS_PROPOSTA_2
} from '../../data/scriptData';
import {
  detectSoftwareGl,
  scheduleAfterDraw,
  createRadialContactShadowTexture,
  createStudioFloorDialTexture
} from './webglUtils';

interface BodyInteroceptionScene3DProps {
  selectedRegion: BodyRegionId | null;
  selectedSensation: SensationId | null;
  onSelectRegion: (region: BodyRegionId) => void;
  isPaused: boolean;
  lowSensory: boolean;
  cameraResetTrigger: number;
}

// Helpers pré-alocados no escopo do módulo (Zero GC no render loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _tempColor = new THREE.Color();
const _baseSkinColor = new THREE.Color('#E2E8F0');
const _baseSuitColor = new THREE.Color('#CBD5E1');
const _hoverEmissive = new THREE.Color('#0D9488');

export const BodyInteroceptionScene3D: React.FC<BodyInteroceptionScene3DProps> = ({
  selectedRegion,
  selectedSensation,
  onSelectRegion,
  isPaused,
  lowSensory,
  cameraResetTrigger
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // Refs mutáveis sincronizados para nunca recriar o WebGLRenderer em atualizações React
  const stateRef = useRef({
    selectedRegion,
    selectedSensation,
    isPaused,
    lowSensory,
    cameraAnimating: false,
    desiredCamPos: new THREE.Vector3(0, 1.05, 3.15),
    desiredTarget: new THREE.Vector3(0, 0.92, 0)
  });

  const onSelectRegionRef = useRef(onSelectRegion);
  onSelectRegionRef.current = onSelectRegion;

  // Atualiza câmera suave quando região muda
  useEffect(() => {
    stateRef.current.selectedRegion = selectedRegion;
    stateRef.current.selectedSensation = selectedSensation;
    stateRef.current.isPaused = isPaused;
    stateRef.current.lowSensory = lowSensory;

    if (selectedRegion) {
      const spec = BODY_REGIONS_PROPOSTA_2.find((r) => r.id === selectedRegion);
      if (spec) {
        stateRef.current.desiredCamPos.set(...spec.cameraPos);
        stateRef.current.desiredTarget.set(...spec.cameraTarget);
        stateRef.current.cameraAnimating = true;
      }
    } else {
      stateRef.current.desiredCamPos.set(0, 1.05, 3.15);
      stateRef.current.desiredTarget.set(0, 0.92, 0);
      stateRef.current.cameraAnimating = true;
    }
  }, [selectedRegion, selectedSensation, isPaused, lowSensory]);

  useEffect(() => {
    if (cameraResetTrigger > 0) {
      stateRef.current.desiredCamPos.set(0, 1.05, 3.15);
      stateRef.current.desiredTarget.set(0, 0.92, 0);
      stateRef.current.cameraAnimating = true;
    }
  }, [cameraResetTrigger]);

  useEffect(() => {
    const container = canvasMountRef.current;
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

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 300);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglReady(false);
    };
    const onContextRestored = () => {
      setWebglReady(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    // Cena, Fog e Ambiente PBR
    const scene = new THREE.Scene();
    const bgHex = 0xf1f5f9;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.Fog(bgHex, 6, 16);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    // Câmera e OrbitControls
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 40);
    camera.position.set(0, 1.05, 3.15);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.92, 0);
    controls.minDistance = 1.35;
    controls.maxDistance = 5.2;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.enablePan = false;

    controls.addEventListener('start', () => {
      stateRef.current.cameraAnimating = false;
    });

    // Iluminação de Estúdio de 3 Pontos (Quente / Fria)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xcbd5e1, 0.75);
    hemiLight.position.set(0, 8, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(2.8, 4.2, 3.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      const d = 2.2;
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
    rimLight.position.set(0, 2.6, -3.2);
    scene.add(rimLight);

    // Registro de recursos para dispose limpo
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      geometries.push(g);
      return g;
    };
    const trackMat = <T extends THREE.Material>(m: T): T => {
      materials.push(m);
      return m;
    };

    // Plataforma / Pedestal de Estúdio
    const studioBaseGroup = new THREE.Group();
    scene.add(studioBaseGroup);

    const floorGeo = trackGeo(new THREE.CircleGeometry(9, 48));
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.92,
        metalness: 0.02
      })
    );
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.y = -0.08;
    floorMesh.receiveShadow = true;
    studioBaseGroup.add(floorMesh);

    const pedestalGeo = trackGeo(new THREE.CylinderGeometry(0.92, 1.02, 0.08, 48));
    const pedestalMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.08,
        clearcoat: 0.4,
        clearcoatRoughness: 0.25
      })
    );
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -0.04;
    pedestalMesh.receiveShadow = true;
    studioBaseGroup.add(pedestalMesh);

    const trimGeo = trackGeo(new THREE.TorusGeometry(0.94, 0.018, 16, 64));
    trimGeo.rotateX(Math.PI / 2);
    const trimMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0d9488,
        roughness: 0.28,
        metalness: 0.72
      })
    );
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = -0.005;
    studioBaseGroup.add(trimMesh);

    // Dial espacial e sombra de contato radial (offset Y + polygonOffset sem Z-fighting)
    const dialTex = createStudioFloorDialTexture(renderer);
    textures.push(dialTex);
    const dialGeo = trackGeo(new THREE.PlaneGeometry(2.5, 2.5));
    dialGeo.rotateX(-Math.PI / 2);
    const dialMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: dialTex,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      })
    );
    const dialMesh = new THREE.Mesh(dialGeo, dialMat);
    dialMesh.position.y = -0.075;
    studioBaseGroup.add(dialMesh);

    const shadowTex = createRadialContactShadowTexture(renderer);
    textures.push(shadowTex);
    const contactShadowGeo = trackGeo(new THREE.PlaneGeometry(1.3, 1.3));
    contactShadowGeo.rotateX(-Math.PI / 2);
    const contactShadowMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55
      })
    );
    const contactShadowMesh = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadowMesh.position.y = 0.003;
    studioBaseGroup.add(contactShadowMesh);

    // =========================================================================
    // BONECO ESCULTURAL 3D COMPOSTO (18+ Partes Articuladas por Região)
    // =========================================================================
    const characterRoot = new THREE.Group();
    characterRoot.position.y = 0; // Base nos pés tocando y = 0
    scene.add(characterRoot);

    // Materiais dedicados por região para resposta tátil PBR independente
    const createRegionMaterial = (baseHex: string, roughness = 0.42) =>
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: baseHex,
          roughness,
          metalness: 0.06,
          clearcoat: 0.35,
          clearcoatRoughness: 0.25,
          sheen: 0.25,
          sheenColor: new THREE.Color('#ffffff')
        })
      );

    const regionMaterials: Record<Exclude<BodyRegionId, 'nao_sei'>, THREE.MeshPhysicalMaterial> = {
      cabeca: createRegionMaterial('#F1F5F9', 0.38),
      peito: createRegionMaterial('#E2E8F0', 0.48),
      barriga: createRegionMaterial('#CBD5E1', 0.52),
      maos: createRegionMaterial('#F1F5F9', 0.36),
      pes: createRegionMaterial('#94A3B8', 0.62)
    };

    const neutralJointMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#94A3B8',
        roughness: 0.68,
        metalness: 0.18
      })
    );

    const featureDarkMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#1E293B',
        roughness: 0.2,
        metalness: 0.1
      })
    );

    const heartBadgeMat = trackMat(
      new THREE.MeshPhysicalMaterial({
        color: '#14B8A6',
        emissive: '#0F766E',
        emissiveIntensity: 0.22,
        roughness: 0.25,
        metalness: 0.15,
        clearcoat: 0.6
      })
    );

    // Lista de colisores clicáveis para Raycasting
    const clickableProxies: THREE.Mesh[] = [];
    const registerProxy = (
      geo: THREE.BufferGeometry,
      pos: [number, number, number],
      region: Exclude<BodyRegionId, 'nao_sei'>,
      label: string
    ) => {
      const proxyMat = trackMat(
        new THREE.MeshBasicMaterial({
          visible: false
        })
      );
      const proxy = new THREE.Mesh(geo, proxyMat);
      proxy.position.set(...pos);
      proxy.layers.enable(1);
      proxy.userData = { region, label };
      characterRoot.add(proxy);
      clickableProxies.push(proxy);
    };

    // 1. PÉS E PERNAS (Ancorados em y = 0)
    const footGeo = trackGeo(new THREE.CapsuleGeometry(0.085, 0.14, 12, 20));
    footGeo.rotateX(Math.PI / 2);

    [-0.17, 0.17].forEach((xOffset) => {
      const foot = new THREE.Mesh(footGeo, regionMaterials.pes);
      foot.position.set(xOffset, 0.075, 0.04);
      foot.scale.set(1, 0.78, 1);
      foot.castShadow = true;
      foot.receiveShadow = true;
      characterRoot.add(foot);

      // Perna inferior e coxa
      const legGeo = trackGeo(new THREE.CapsuleGeometry(0.078, 0.42, 12, 20));
      const leg = new THREE.Mesh(legGeo, neutralJointMat);
      leg.position.set(xOffset, 0.38, 0);
      leg.castShadow = true;
      characterRoot.add(leg);

      // Articulação do joelho
      const kneeGeo = trackGeo(new THREE.SphereGeometry(0.082, 20, 20));
      const knee = new THREE.Mesh(kneeGeo, regionMaterials.pes);
      knee.position.set(xOffset, 0.36, 0.015);
      characterRoot.add(knee);
    });

    registerProxy(trackGeo(new THREE.BoxGeometry(0.62, 0.34, 0.42)), [0, 0.17, 0.03], 'pes', 'Pés');

    // Quadril de transição
    const pelvisGeo = trackGeo(new THREE.CylinderGeometry(0.23, 0.2, 0.14, 28));
    const pelvis = new THREE.Mesh(pelvisGeo, neutralJointMat);
    pelvis.position.set(0, 0.66, 0);
    pelvis.castShadow = true;
    characterRoot.add(pelvis);

    // 2. BARRIGA / ABDÔMEN
    const bellyGroup = new THREE.Group();
    bellyGroup.position.set(0, 0.84, 0);
    characterRoot.add(bellyGroup);

    const bellyGeo = trackGeo(new THREE.CapsuleGeometry(0.235, 0.16, 16, 32));
    const bellyMesh = new THREE.Mesh(bellyGeo, regionMaterials.barriga);
    bellyMesh.scale.set(1.04, 0.92, 0.86);
    bellyMesh.castShadow = true;
    bellyMesh.receiveShadow = true;
    bellyGroup.add(bellyMesh);

    // Anel abdominal suave de referência tátil
    const bellyRingGeo = trackGeo(new THREE.TorusGeometry(0.085, 0.012, 12, 32));
    const bellyRing = new THREE.Mesh(bellyRingGeo, heartBadgeMat);
    bellyRing.position.set(0, -0.01, 0.2);
    bellyGroup.add(bellyRing);

    registerProxy(trackGeo(new THREE.BoxGeometry(0.56, 0.32, 0.46)), [0, 0.84, 0], 'barriga', 'Barriga');

    // 3. PEITO / TÓRAX
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 1.14, 0);
    characterRoot.add(chestGroup);

    const chestGeo = trackGeo(new THREE.CapsuleGeometry(0.26, 0.18, 16, 32));
    const chestMesh = new THREE.Mesh(chestGeo, regionMaterials.peito);
    chestMesh.scale.set(1.08, 0.95, 0.84);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    chestGroup.add(chestMesh);

    // Emblema anatômico de coração biselado no peito
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.045);
    heartShape.bezierCurveTo(0.055, -0.005, 0.075, 0.045, 0.035, 0.068);
    heartShape.bezierCurveTo(0.012, 0.08, 0, 0.055, 0, 0.045);
    heartShape.bezierCurveTo(0, 0.055, -0.012, 0.08, -0.035, 0.068);
    heartShape.bezierCurveTo(-0.075, 0.045, -0.055, -0.005, 0, -0.045);

    const heartGeo = trackGeo(
      new THREE.ExtrudeGeometry(heartShape, {
        depth: 0.022,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.008
      })
    );
    const heartMesh = new THREE.Mesh(heartGeo, heartBadgeMat);
    heartMesh.position.set(0.05, 0.03, 0.21);
    chestGroup.add(heartMesh);

    // Ombros arredondados
    const shoulderGeo = trackGeo(new THREE.SphereGeometry(0.095, 20, 20));
    [-0.31, 0.31].forEach((xSide) => {
      const shoulder = new THREE.Mesh(shoulderGeo, regionMaterials.peito);
      shoulder.position.set(xSide, 0.08, 0);
      shoulder.castShadow = true;
      chestGroup.add(shoulder);
    });

    registerProxy(trackGeo(new THREE.BoxGeometry(0.58, 0.34, 0.48)), [0, 1.15, 0], 'peito', 'Peito');

    // 4. BRAÇOS E MÃOS (Abertos em postura acolhedora)
    [-1, 1].forEach((dir) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(dir * 0.33, 1.21, 0);
      armPivot.rotation.z = dir * 0.26;
      characterRoot.add(armPivot);

      const upperArmGeo = trackGeo(new THREE.CapsuleGeometry(0.065, 0.28, 12, 20));
      const upperArm = new THREE.Mesh(upperArmGeo, neutralJointMat);
      upperArm.position.set(0, -0.18, 0);
      upperArm.castShadow = true;
      armPivot.add(upperArm);

      // Mão escultural (Palma + Polegar)
      const handGroup = new THREE.Group();
      handGroup.position.set(0, -0.4, 0.03);
      armPivot.add(handGroup);

      const palmGeo = trackGeo(new THREE.SphereGeometry(0.095, 24, 24));
      const palm = new THREE.Mesh(palmGeo, regionMaterials.maos);
      palm.scale.set(0.92, 1.12, 0.65);
      palm.castShadow = true;
      handGroup.add(palm);

      const thumbGeo = trackGeo(new THREE.CapsuleGeometry(0.028, 0.05, 8, 12));
      const thumb = new THREE.Mesh(thumbGeo, regionMaterials.maos);
      thumb.position.set(-dir * 0.075, 0.02, 0.02);
      thumb.rotation.z = -dir * 0.6;
      handGroup.add(thumb);

      // Colisor amplo para cada mão
      registerProxy(
        trackGeo(new THREE.SphereGeometry(0.2, 12, 12)),
        [dir * 0.44, 0.83, 0.04],
        'maos',
        'Mãos'
      );
    });

    // Pescoço
    const neckGeo = trackGeo(new THREE.CylinderGeometry(0.085, 0.1, 0.12, 20));
    const neck = new THREE.Mesh(neckGeo, neutralJointMat);
    neck.position.set(0, 1.35, 0);
    characterRoot.add(neck);

    // 5. CABEÇA ESCULTURAL SERENA
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.56, 0);
    characterRoot.add(headGroup);

    const craniumGeo = trackGeo(new THREE.SphereGeometry(0.23, 32, 32));
    const cranium = new THREE.Mesh(craniumGeo, regionMaterials.cabeca);
    cranium.scale.set(1.04, 1.0, 0.96);
    cranium.castShadow = true;
    cranium.receiveShadow = true;
    headGroup.add(cranium);

    // Orelhas suaves
    const earGeo = trackGeo(new THREE.SphereGeometry(0.055, 16, 16));
    [-0.23, 0.23].forEach((xEar) => {
      const ear = new THREE.Mesh(earGeo, regionMaterials.cabeca);
      ear.position.set(xEar, -0.01, 0);
      ear.scale.set(0.5, 1, 0.8);
      headGroup.add(ear);
    });

    // Olhos calmos e sorriso acolhedor
    const eyeGeo = trackGeo(new THREE.SphereGeometry(0.026, 16, 16));
    [-0.078, 0.078].forEach((xEye) => {
      const eye = new THREE.Mesh(eyeGeo, featureDarkMat);
      eye.position.set(xEye, 0.03, 0.21);
      eye.scale.set(1, 1.15, 0.6);
      headGroup.add(eye);
    });

    const smileGeo = trackGeo(new THREE.TorusGeometry(0.052, 0.009, 10, 24, Math.PI * 0.82));
    const smile = new THREE.Mesh(smileGeo, featureDarkMat);
    smile.position.set(0, -0.025, 0.212);
    smile.rotation.z = Math.PI * 1.09;
    headGroup.add(smile);

    registerProxy(trackGeo(new THREE.SphereGeometry(0.3, 16, 16)), [0, 1.56, 0], 'cabeca', 'Cabeça');

    // 6. ANÉIS ORBITAIS PARA OPÇÃO "NÃO SEI" (Corpo Inteiro Acolhido)
    const auraRingGroup = new THREE.Group();
    auraRingGroup.position.set(0, 0.92, 0);
    characterRoot.add(auraRingGroup);

    const auraMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#8B5CF6',
        emissive: '#6D28D9',
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );

    const ring1 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.68, 0.012, 12, 64)), auraMat);
    ring1.rotation.x = Math.PI * 0.42;
    ring1.rotation.y = 0.25;
    auraRingGroup.add(ring1);

    const ring2 = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.76, 0.01, 12, 64)), auraMat);
    ring2.rotation.x = -Math.PI * 0.38;
    ring2.rotation.y = -0.3;
    auraRingGroup.add(ring2);

    // 7. PARTÍCULAS ORBITAIS LENTAS DE SENSAÇÃO (InstancedMesh — 36 esferas suaves)
    const PARTICLE_COUNT = 36;
    const particleGeo = trackGeo(new THREE.SphereGeometry(0.022, 12, 12));
    const particleMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: '#10B981',
        emissive: '#059669',
        emissiveIntensity: 0.45,
        roughness: 0.25,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_COUNT);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particleSeeds = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2,
      radiusOffset: 0.28 + (i % 5) * 0.06,
      heightOffset: ((i % 7) - 3) * 0.07,
      speed: 0.35 + (i % 4) * 0.08
    }));

    // Pré-compila shaders em GPUs dedicadas
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================================
    // INTERAÇÃO RAYCASTER (Clique e Hover Throttled)
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let hoveredRegion: Exclude<BodyRegionId, 'nao_sei'> | null = null;
    let lastMoveCheck = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const updatePointerFromEvent = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      // Ignora arrastes de rotação da câmera
      if (Math.hypot(dx, dy) > 8) return;

      updatePointerFromEvent(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableProxies, false);
      if (hits.length > 0) {
        const region = hits[0].object.userData.region as Exclude<BodyRegionId, 'nao_sei'>;
        if (region) {
          onSelectRegionRef.current(region);
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveCheck < 50) return;
      lastMoveCheck = now;

      updatePointerFromEvent(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableProxies, false);

      if (hits.length > 0) {
        const hitRegion = hits[0].object.userData.region as Exclude<BodyRegionId, 'nao_sei'>;
        const hitLabel = hits[0].object.userData.label as string;
        hoveredRegion = hitRegion;
        setHoveredLabel(hitLabel);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        hoveredRegion = null;
        setHoveredLabel(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    // Redimensionamento responsivo
    const onResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 300);
      const h = Math.max(container.clientHeight, 300);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // =========================================================================
    // LOOP DE ANIMAÇÃO CALMO E CADENCIADO (SEM FLASHES)
    // =========================================================================
    const clock = new THREE.Clock();
    let simTime = 0;
    let rafId = 0;
    const afterDrawTimer = { id: 0 };
    let disposed = false;

    const regionCentersY: Record<BodyRegionId, number> = {
      cabeca: 1.56,
      peito: 1.15,
      barriga: 0.84,
      maos: 0.85,
      pes: 0.16,
      nao_sei: 0.92
    };

    const tick = () => {
      if (disposed) return;

      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const {
        selectedRegion: curReg,
        selectedSensation: curSens,
        isPaused: paused,
        lowSensory: lowSens,
        cameraAnimating
      } = stateRef.current;

      if (!paused) {
        simTime += dt;
      }

      // Fundo adaptado suavemente ao modo Baixo Estímulo
      _tempColor.set(lowSens ? '#E2E8F0' : '#F1F5F9');
      (scene.background as THREE.Color).lerp(_tempColor, 0.08);
      if (scene.fog) {
        scene.fog.color.copy(scene.background as THREE.Color);
      }

      // Respiração torácica lenta e orgânica (~0.22 Hz — cerca de 13 respirações/minuto, super serena)
      const breath = Math.sin(simTime * 1.35) * 0.018;
      chestGroup.scale.set(1 + breath, 1 + breath * 0.6, 1 + breath);
      bellyGroup.scale.set(1 + breath * 0.6, 1, 1 + breath * 0.6);
      headGroup.position.y = 1.56 + breath * 0.25;

      // Cor ativa baseada na sensação escolhida (ou turquesa calmo se apenas a região foi escolhida)
      const sensSpec = curSens ? SENSATIONS_PROPOSTA_2.find((s) => s.id === curSens) : null;
      const activeHex = sensSpec ? sensSpec.hexColor : '#14B8A6';
      const activeEmissiveHex = sensSpec ? sensSpec.emissiveHex : '#0D9488';

      // Atualiza materiais das 5 regiões com interpolação suave
      (Object.keys(regionMaterials) as Array<Exclude<BodyRegionId, 'nao_sei'>>).forEach((regKey) => {
        const mat = regionMaterials[regKey];
        const isSelected = curReg === regKey || curReg === 'nao_sei';
        const isHovered = hoveredRegion === regKey;

        if (isSelected) {
          _tempColor.set(activeHex);
          mat.color.lerp(_tempColor, 1 - Math.exp(-6 * dt));
          _tempColor.set(activeEmissiveHex);
          mat.emissive.lerp(_tempColor, 1 - Math.exp(-6 * dt));
          const targetEmissive = curReg === 'nao_sei' ? 0.16 : 0.28;
          mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, targetEmissive, 5, dt);
        } else if (isHovered) {
          mat.color.lerp(_baseSkinColor, 1 - Math.exp(-6 * dt));
          mat.emissive.lerp(_hoverEmissive, 1 - Math.exp(-8 * dt));
          mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, 0.18, 6, dt);
        } else {
          const neutralTarget = regKey === 'peito' || regKey === 'barriga' ? _baseSuitColor : _baseSkinColor;
          mat.color.lerp(neutralTarget, 1 - Math.exp(-5 * dt));
          mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, 0, 5, dt);
        }
      });

      // Anéis de acolhimento quando "Não sei" está selecionado
      const targetAuraOpacity = curReg === 'nao_sei' ? (lowSens ? 0.25 : 0.45) : 0;
      auraMat.opacity = THREE.MathUtils.damp(auraMat.opacity, targetAuraOpacity, 4, dt);
      if (curSens && sensSpec) {
        _tempColor.set(sensSpec.hexColor);
        auraMat.color.lerp(_tempColor, 0.1);
      }
      auraRingGroup.rotation.y = simTime * 0.22;

      // Partículas orbitais suaves ao redor da região e sensação ativas
      const showParticles = Boolean(curReg && curSens && !lowSens);
      particleMat.opacity = THREE.MathUtils.damp(
        particleMat.opacity,
        showParticles ? 0.68 : 0,
        4,
        dt
      );

      if (sensSpec) {
        _tempColor.set(sensSpec.hexColor);
        particleMat.color.lerp(_tempColor, 0.12);
        _tempColor.set(sensSpec.emissiveHex);
        particleMat.emissive.lerp(_tempColor, 0.12);
      }

      const centerY = curReg ? regionCentersY[curReg] : 0.92;
      const spreadRadius = curReg === 'nao_sei' ? 0.62 : curReg === 'maos' ? 0.56 : 0.36;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const seed = particleSeeds[i];
        const ang = seed.angle + simTime * seed.speed;
        const r = spreadRadius + (seed.radiusOffset - 0.28);
        let py = centerY + seed.heightOffset;

        if (curSens === 'quente') {
          py = centerY + (((simTime * 0.22 + i * 0.07) % 0.5) - 0.25);
        } else if (curSens === 'frio') {
          py = centerY - (((simTime * 0.18 + i * 0.07) % 0.45) - 0.22);
        }

        _dummyObj.position.set(Math.cos(ang) * r, Math.max(0.06, py), Math.sin(ang) * r);
        const s = curSens === 'formigamento' ? 0.85 + Math.sin(simTime * 2.2 + i) * 0.2 : 1.0;
        _dummyObj.scale.setScalar(s);
        _dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, _dummyObj.matrix);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;

      // Transição suave de câmera por amortecimento exponencial
      if (cameraAnimating) {
        _targetCamPos.copy(stateRef.current.desiredCamPos);
        _targetLookAt.copy(stateRef.current.desiredTarget);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 4.2, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 4.2, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 4.2, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 4.8, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 4.8, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 4.8, dt);

        if (
          camera.position.distanceToSquared(_targetCamPos) < 0.001 &&
          controls.target.distanceToSquared(_targetLookAt) < 0.001
        ) {
          stateRef.current.cameraAnimating = false;
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
      textures.forEach((t) => t.dispose());
      envMap.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] select-none overflow-hidden bg-slate-100">
      {/* Container Isolado do Canvas WebGL */}
      <div ref={canvasMountRef} className="w-full h-full" />

      {/* Rótulo discreto de hover sobre a região apontada */}
      {hoveredLabel && webglReady && (
        <div className="pointer-events-none absolute top-4 right-4 z-10 bg-slate-900/85 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
          Toque para selecionar: {hoveredLabel}
        </div>
      )}

      {/* Fallback Acessível Caso WebGL não esteja disponível */}
      {!webglReady && (
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-100 text-center">
          <div className="max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Modo Visual Simplificado Ativo
            </h3>
            <p className="text-sm text-slate-600">
              Use os botões na parte inferior para escolher a região do corpo e comunicar o que você está sentindo com tranquilidade.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
