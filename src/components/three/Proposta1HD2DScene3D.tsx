/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PALCO ESPACIAL 3D UNIFICADO (ESTILO HD-2D) — PROPOSTA 1: "A VIAGEM DO ALIMENTO"
 * Arquitetura Modularizada — Gerencia o palco de estúdio 3D, câmera, iluminação,
 * raycasting acessível e orquestra as 9 estações anatômicas isoladas.
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
import {
  createAllStations,
  StageId,
  SharedMaterials,
  StationBuildContext,
  StationInstance
} from './stations';

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
  orderedOrganIds: (string | null)[]; // length 5

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

const STAGE_CAMERAS: Record<
  StageId,
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
    scene.background = new THREE.Color(0xf5efeb);
    scene.fog = new THREE.Fog(0xf5efeb, 7.5, 20);

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

    // Iluminação de Estúdio 3 Pontos (Paleta Sensorial Acolhedora — 3200K)
    const hemi = new THREE.HemisphereLight(0xffedd5, 0xe2d5c5, 0.95);
    hemi.position.set(0, 8, 0);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.25);
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

    const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.45);
    fillLight.position.set(-3.0, 2.2, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa7f3d0, 0.45);
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

    // Base / Pedestal de Estúdio Orgânico Acolhedor
    const baseGroup = new THREE.Group();
    scene.add(baseGroup);

    const floorMesh = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(9, 48)).rotateX(-Math.PI / 2),
      trackMat(new THREE.MeshStandardMaterial({ color: 0xd6c7b6, roughness: 0.88, metalness: 0.02 }))
    );
    floorMesh.position.y = -0.08;
    floorMesh.receiveShadow = true;
    baseGroup.add(floorMesh);

    const pedestalMesh = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(1.42, 1.52, 0.08, 56)),
      trackMat(
        new THREE.MeshPhysicalMaterial({
          color: 0xf3ede3,
          roughness: 0.42,
          metalness: 0.04,
          clearcoat: 0.25
        })
      )
    );
    pedestalMesh.position.y = -0.04;
    pedestalMesh.receiveShadow = true;
    baseGroup.add(pedestalMesh);

    const pedestalTrim = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(1.45, 0.016, 14, 64)).rotateX(Math.PI / 2),
      trackMat(new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.3 }))
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
    // RAYCASTING LAYER 1 (INTERAÇÕES)
    // =========================================================================
    const interactiveMeshes: THREE.Object3D[] = [];
    const registerInteractive = (
      obj: THREE.Object3D,
      stageOwner: StageId,
      hint: string,
      actionType: string,
      payload?: number | string
    ) => {
      obj.layers.enable(1);
      obj.userData = { stageOwner, hint, actionType, payload };
      interactiveMeshes.push(obj);
    };

    // Helper para criar plano HD-2D duplo
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

    // Materiais PBR Orgânicos Compartilhados
    const sharedMaterials: SharedMaterials = {
      porcelainMat: trackMat(
        new THREE.MeshPhysicalMaterial({ color: 0xfefcf8, roughness: 0.24, clearcoat: 0.5 })
      ),
      woodTableMat: trackMat(
        new THREE.MeshStandardMaterial({ color: 0x9c6644, roughness: 0.65, metalness: 0.04 })
      ),
      bolusGoldMat: trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xfde047,
          emissive: 0xd97706,
          emissiveIntensity: 0.35,
          roughness: 0.32
        })
      ),
      toothEnamelMat: trackMat(
        new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.18, clearcoat: 0.7 })
      ),
      mucosaPinkMat: trackMat(
        new THREE.MeshPhysicalMaterial({ color: 0xfda4af, roughness: 0.45, clearcoat: 0.25 })
      ),
      mucosaDeepMat: trackMat(
        new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.55 })
      ),
      skinMat: trackMat(
        new THREE.MeshPhysicalMaterial({ color: 0xfde68a, roughness: 0.48, clearcoat: 0.15 })
      )
    };

    // Contexto de Construção para as Estações
    const buildCtx: StationBuildContext = {
      trackGeo,
      trackMat,
      registerInteractive,
      createHD2DSpritePlane,
      isSoftwareGl,
      sharedMaterials
    };

    // Instancia as 9 estações modularizadas
    const stations: Record<StageId, StationInstance> = createAllStations(buildCtx);
    (Object.keys(stations) as StageId[]).forEach((key) => {
      scene.add(stations[key].group);
    });

    // Carregamento assíncrono dos assets 16-bit
    let assetPack: LoadedHD2DAssetPack | null = null;
    let disposed = false;

    loadAllProposta1HD2DAssets(renderer)
      .then((pack) => {
        if (disposed) {
          pack.disposeAll();
          return;
        }
        assetPack = pack;
        Object.values(stations).forEach((s) => s.applyAssets?.(pack));
      })
      .catch(() => {
        // Silencioso: geometrias 3D permanecem funcionais
      });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting de clique e hover
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

    // Loop de Renderização e Animação
    const clock = new THREE.Clock();
    let simTime = 0;
    let rafId = 0;
    const afterDrawTimer = { id: 0 };

    const tick = () => {
      if (disposed) return;

      const dt = Math.min(clock.getDelta(), 0.05);
      const cur = propsRef.current;

      if (!cur.isPaused) {
        simTime += dt;
      }

      // Fundo calmo sincronizado com Baixo Estímulo (Opção A - Cozinha & Estúdio Acolhedor)
      _bgColor.set(cur.lowSensory ? '#EDE4DA' : '#F5EFEB');
      (scene.background as THREE.Color).lerp(_bgColor, 0.1);
      if (scene.fog) {
        scene.fog.color.copy(scene.background as THREE.Color);
      }

      // Alterna visibilidade exclusiva da estação atual
      (Object.keys(stations) as StageId[]).forEach((k) => {
        stations[k].group.visible = k === cur.stage;
      });

      // Executa a atualização da estação ativa
      const activeStation = stations[cur.stage];
      if (activeStation) {
        activeStation.update(cur, dt, simTime, assetPack);
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
      Object.values(stations).forEach((s) => s.dispose?.());
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
