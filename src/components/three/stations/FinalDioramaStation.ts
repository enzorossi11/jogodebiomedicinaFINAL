/**
 * Estação final: o tronco translúcido onde os órgãos vão aparecendo conforme a
 * criança monta a ordem. Cada órgão entra deslizando para o seu lugar; quando
 * o caminho fica completo, um bolinho percorre a viagem inteira, de novo e de
 * novo, bem devagar.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, TuboDinamico, aro, esfera, materialMacio, materialTranslucido, sino } from './anatomia';

type OrgaoId = 'boca' | 'esofago' | 'estomago' | 'delgado' | 'grosso';
const ORDEM: OrgaoId[] = ['boca', 'esofago', 'estomago', 'delgado', 'grosso'];

export function createFinalDioramaStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matCorpo = materialTranslucido(ctx, 0xf2dcd0, 0.22, { roughness: 0.6, side: THREE.FrontSide });
  const matPele = materialMacio(ctx, COR.pele, { roughness: 0.7, clearcoat: 0.05 });
  const matBolo = materialMacio(ctx, COR.quimo, { roughness: 0.3, clearcoat: 0.9 });

  // -------------------------------------------------------------- corpo
  const tronco = new THREE.Mesh(ctx.trackGeo(new THREE.CapsuleGeometry(0.46, 0.9, 12, 32)), matCorpo);
  tronco.scale.set(1, 1, 0.55);
  tronco.position.y = 0.78;
  group.add(tronco);
  const cabeca = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.26, 32, 24)), matPele);
  cabeca.position.y = 1.72;
  group.add(cabeca);
  const pescoco = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 20)), matCorpo);
  pescoco.position.y = 1.44;
  group.add(pescoco);
  [-1, 1].forEach((l) => {
    const ombro = new THREE.Mesh(ctx.trackGeo(new THREE.CapsuleGeometry(0.1, 0.5, 8, 16)), matCorpo);
    ombro.position.set(l * 0.56, 1.0, 0);
    ombro.rotation.z = l * 0.12;
    group.add(ombro);
  });

  // -------------------------------------------------------------- órgãos
  const orgaos: Record<OrgaoId, { group: THREE.Group; curva?: THREE.Curve<THREE.Vector3>; destino: THREE.Vector3; origem: THREE.Vector3 }> = {} as never;
  const registrar = (id: OrgaoId, g: THREE.Group, origemX: number, curva?: THREE.Curve<THREE.Vector3>) => {
    g.visible = false;
    group.add(g);
    orgaos[id] = { group: g, curva, destino: new THREE.Vector3(0, 0, 0), origem: new THREE.Vector3(origemX, 0, 0.3) };
  };

  // boca: lábios + língua na cabeça
  {
    const g = new THREE.Group();
    const labios = aro(ctx, 0.09, 0.025, materialMacio(ctx, COR.labio));
    labios.scale.set(1.3, 0.6, 1);
    labios.position.set(0, 1.68, 0.25);
    const lingua = esfera(ctx, 0.04, materialMacio(ctx, COR.lingua), 14);
    lingua.scale.set(1.2, 0.5, 1);
    lingua.position.set(0, 1.66, 0.23);
    g.add(labios, lingua);
    registrar('boca', g, -1.0);
  }
  const cEsofago = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 1.6, 0.0), new THREE.Vector3(0, 1.4, -0.02), new THREE.Vector3(-0.03, 1.18, -0.02), new THREE.Vector3(-0.08, 1.06, 0)]);
  {
    const g = new THREE.Group();
    const t = new TuboDinamico(ctx, cEsofago, 24, 14, materialMacio(ctx, COR.musculo, { roughness: 0.5 }));
    t.atualizar(() => 0.045);
    g.add(t.mesh);
    registrar('esofago', g, 1.0, cEsofago);
  }
  const cEstomago = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 1.06, 0),
    new THREE.Vector3(-0.12, 0.98, 0.02),
    new THREE.Vector3(-0.1, 0.88, 0.03),
    new THREE.Vector3(0.0, 0.8, 0.03),
    new THREE.Vector3(0.12, 0.82, 0.02)
  ]);
  {
    const g = new THREE.Group();
    const t = new TuboDinamico(ctx, cEstomago, 32, 20, materialMacio(ctx, COR.mucosaEscura, { roughness: 0.45 }));
    t.atualizar((u) => 0.045 + 0.12 * sino(u - 0.4, 0.22));
    g.add(t.mesh);
    registrar('estomago', g, -1.0, cEstomago);
  }
  // delgado: espiral compacta no centro da barriga
  const ptsDelgado: THREE.Vector3[] = [new THREE.Vector3(0.12, 0.82, 0.02)];
  for (let i = 1; i <= 28; i++) {
    const a = i * 0.75;
    const r = 0.06 + (i / 28) * 0.14;
    ptsDelgado.push(new THREE.Vector3(Math.cos(a) * r, 0.62 - (i / 28) * 0.1 + Math.sin(a * 0.5) * 0.04, Math.sin(a) * r * 0.5 + 0.03));
  }
  ptsDelgado.push(new THREE.Vector3(-0.3, 0.42, 0.02));
  const cDelgado = new THREE.CatmullRomCurve3(ptsDelgado);
  {
    const g = new THREE.Group();
    const t = new TuboDinamico(ctx, cDelgado, 140, 10, materialMacio(ctx, 0xf3a3b3, { roughness: 0.45 }));
    t.atualizar(() => 0.04);
    g.add(t.mesh);
    registrar('delgado', g, 1.0, cDelgado);
  }
  const cGrosso = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 0.42, 0.02),
    new THREE.Vector3(-0.32, 0.6, 0.0),
    new THREE.Vector3(-0.3, 0.85, -0.02),
    new THREE.Vector3(0.0, 0.92, -0.04),
    new THREE.Vector3(0.3, 0.85, -0.02),
    new THREE.Vector3(0.32, 0.6, 0.0),
    new THREE.Vector3(0.22, 0.42, 0.02),
    new THREE.Vector3(0.04, 0.36, 0.02)
  ]);
  {
    const g = new THREE.Group();
    const t = new TuboDinamico(ctx, cGrosso, 80, 14, materialMacio(ctx, 0xcf6f82, { roughness: 0.5 }));
    t.atualizar((u) => 0.065 * (1 + 0.12 * Math.abs(Math.sin(u * Math.PI * 14))));
    g.add(t.mesh);
    registrar('grosso', g, -1.0, cGrosso);
  }

  // caminho completo para o bolinho percorrer
  const caminho = new THREE.CurvePath<THREE.Vector3>();
  caminho.add(new THREE.LineCurve3(new THREE.Vector3(0, 1.62, 0.22), new THREE.Vector3(0, 1.6, 0)));
  caminho.add(cEsofago);
  caminho.add(cEstomago);
  caminho.add(cDelgado);
  caminho.add(cGrosso);
  const bolo = esfera(ctx, 0.028, matBolo, 12);
  bolo.visible = false;
  group.add(bolo);

  const progresso: Record<OrgaoId, number> = { boca: 0, esofago: 0, estomago: 0, delgado: 0, grosso: 0 };
  let uBolo = 0;

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const calmo = cur.lowSensory;
    const colocados = new Set(cur.orderedOrganIds.filter(Boolean) as OrgaoId[]);
    const completo = ORDEM.every((id, i) => cur.orderedOrganIds[i] === id);

    ORDEM.forEach((id) => {
      const o = orgaos[id];
      const alvo = colocados.has(id) ? 1 : 0;
      progresso[id] = THREE.MathUtils.damp(progresso[id], alvo, 5, dt);
      const p = progresso[id];
      o.group.visible = p > 0.02;
      // entra deslizando de fora do corpo e crescendo
      o.group.position.lerpVectors(o.origem, o.destino, p);
      const esc = 0.4 + 0.6 * p;
      o.group.scale.setScalar(esc);
      o.group.children.forEach((m) => {
        const mat = (m as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
        mat.transparent = p < 0.98;
        mat.opacity = 0.3 + 0.7 * p;
      });
    });

    // respiração suave do tronco
    const resp = calmo ? 0 : Math.sin(simTime * 0.9) * 0.008;
    tronco.scale.set(1 + resp, 1, 0.55 + resp);

    if (completo) {
      uBolo = (uBolo + dt * (calmo ? 0.025 : 0.045)) % 1;
      bolo.visible = true;
      bolo.position.copy(caminho.getPointAt(uBolo));
      // o bolinho vai mudando de cor conforme avança (bolo → quimo → fezes)
      matBolo.color.set(COR.quimo).lerp(new THREE.Color(COR.fezes), THREE.MathUtils.clamp((uBolo - 0.7) / 0.3, 0, 1));
    } else {
      bolo.visible = false;
      uBolo = 0;
    }
  };

  return { group, update };
}
