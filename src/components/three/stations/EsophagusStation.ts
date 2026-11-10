/**
 * Estação Esôfago: um tubo muscular visto por fora, com corte frontal para ver
 * o bolo lá dentro. Cada anel apertado gera uma onda peristáltica que desce
 * empurrando o bolo, independente da gravidade.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, Impulso, TuboDinamico, aro, esfera, materialMacio, materialTranslucido, sino, suave } from './anatomia';

const TOPO = 1.62;
const BASE = 0.28;
const RAIO = 0.15;

export function createEsophagusStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matParede = materialTranslucido(ctx, COR.musculo, 0.62, { roughness: 0.5, side: THREE.DoubleSide });
  const matLumen = materialMacio(ctx, COR.mucosaClara, { roughness: 0.4, side: THREE.BackSide });
  const matFibra = materialMacio(ctx, COR.mucosaEscura, { roughness: 0.6 });
  const matAnel = materialTranslucido(ctx, 0xffffff, 0.0, { roughness: 0.3, side: THREE.FrontSide });
  const matBolo = materialMacio(ctx, COR.quimo, { roughness: 0.3, clearcoat: 0.9 });

  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, TOPO, 0),
    new THREE.Vector3(0.03, TOPO - 0.4, 0),
    new THREE.Vector3(0.0, BASE + 0.45, 0),
    new THREE.Vector3(-0.08, BASE, 0)
  ]);
  const parede = new TuboDinamico(ctx, curva, 72, 28, matParede);
  const lumen = new TuboDinamico(ctx, curva, 72, 20, matLumen);
  group.add(parede.mesh, lumen.mesh);

  // fibras musculares longitudinais (finas, dão leitura de "músculo")
  const fibras: TuboDinamico[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const pts = [0, 0.25, 0.5, 0.75, 1].map((u) => {
      const p = curva.getPointAt(u);
      return new THREE.Vector3(p.x + Math.cos(ang) * (RAIO + 0.012), p.y, p.z + Math.sin(ang) * (RAIO + 0.012));
    });
    const f = new TuboDinamico(ctx, new THREE.CatmullRomCurve3(pts), 36, 6, matFibra);
    f.atualizar(() => 0.006);
    fibras.push(f);
    group.add(f.mesh);
  }

  // stubs: faringe em cima e cárdia embaixo
  const faringe = aro(ctx, RAIO + 0.03, 0.03, materialMacio(ctx, COR.mucosa));
  faringe.rotation.x = Math.PI / 2;
  faringe.position.y = TOPO;
  group.add(faringe);
  const cardia = aro(ctx, RAIO - 0.02, 0.035, materialMacio(ctx, COR.mucosaEscura));
  cardia.rotation.x = Math.PI / 2;
  cardia.position.copy(curva.getPointAt(1));
  group.add(cardia);

  // zonas clicáveis: três trechos do tubo
  const zonas: THREE.Mesh[] = [];
  [0.17, 0.5, 0.83].forEach((u, i) => {
    const z = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(RAIO + 0.06, RAIO + 0.06, 0.34, 24, 1, true)), matAnel);
    z.position.copy(curva.getPointAt(u));
    ctx.registerInteractive(z, 'esophagus', `Apertar o anel ${i + 1}`, 'squeeze_eso_ring', i);
    group.add(z);
    zonas.push(z);
  });

  const bolo = esfera(ctx, RAIO * 0.72, matBolo);
  group.add(bolo);

  const impulso = new Impulso(1.3);
  let uBolo = 0.04;
  let uOnda = -0.2;

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const passo = THREE.MathUtils.clamp(cur.esoRingStep, 0, 3);
    const t = impulso.observar(cur.esoRingStep, simTime);
    const calmo = cur.lowSensory;

    // onda: nasce no anel apertado e desce até o próximo trecho
    const inicio = passo === 0 ? -0.2 : (passo - 1) / 3;
    const fim = passo === 0 ? -0.2 : passo / 3;
    uOnda = passo === 0 ? -0.2 : THREE.MathUtils.lerp(inicio - 0.05, fim - 0.02, suave(t));
    const alvoBolo = passo === 0 ? 0.04 : 0.04 + (passo / 3) * 0.92;
    uBolo = THREE.MathUtils.damp(uBolo, Math.max(uBolo, Math.min(alvoBolo, uOnda + 0.1)), 6, dt);
    if (passo === 0) uBolo = THREE.MathUtils.damp(uBolo, 0.04, 8, dt);

    const repouso = calmo ? 0 : Math.sin(simTime * 1.6) * 0.012;
    const raio = (u: number) => {
      const constricao = 0.5 * sino(u - uOnda, 0.045) * (passo > 0 && t < 1 ? 1 : 0);
      const bojo = 0.4 * sino(u - uBolo, 0.05);
      return RAIO * (1 - constricao + bojo) + repouso;
    };
    parede.atualizar((u, th) => raio(u) + 0.02 + 0.008 * Math.sin(th * 14));
    lumen.atualizar((u) => raio(u) * 0.78);
    const pb = curva.getPointAt(THREE.MathUtils.clamp(uBolo, 0, 1));
    bolo.position.copy(pb);
    const achatado = 1 - 0.25 * sino(uBolo - uOnda - 0.08, 0.06);
    bolo.scale.set(1 / Math.sqrt(achatado), achatado, 1 / Math.sqrt(achatado));
    bolo.visible = !(passo >= 3 && t >= 1 && uBolo > 0.94);

    zonas.forEach((z, i) => {
      const ativa = i === passo && passo < 3;
      (z.material as THREE.MeshPhysicalMaterial).opacity = ativa ? 0.12 + (calmo ? 0 : Math.sin(simTime * 2.5) * 0.05) : 0;
    });
  };

  return { group, update };
}
