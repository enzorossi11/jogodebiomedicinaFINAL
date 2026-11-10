/**
 * Estação Garganta: corte lateral da cabeça e do pescoço. O bolo desce da boca
 * pela faringe; na hora de engolir a epiglote vira e tampa a traqueia, e o
 * alimento segue para o esôfago. Bolinhas de ar mostram o caminho que o ar
 * usa e param enquanto a epiglote está fechada.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, TuboDinamico, aro, capsula, esfera, materialMacio, materialTranslucido, sino, suave } from './anatomia';

export function createSwallowStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matPele = materialTranslucido(ctx, 0xf2dcd0, 0.32, { roughness: 0.7, side: THREE.FrontSide });
  const matMucosa = materialMacio(ctx, COR.mucosa, { roughness: 0.5 });
  const matFaringe = materialTranslucido(ctx, COR.mucosaClara, 0.55);
  const matEsofago = materialTranslucido(ctx, COR.mucosa, 0.6);
  const matTraqueia = materialTranslucido(ctx, 0xdff1f8, 0.55);
  const matCartilagem = materialMacio(ctx, COR.cartilagem, { roughness: 0.4 });
  const matEpiglote = materialMacio(ctx, COR.mucosaEscura, { roughness: 0.45, side: THREE.DoubleSide });
  const matBolo = materialMacio(ctx, COR.quimo, { roughness: 0.3, clearcoat: 0.9 });
  const matAr = materialTranslucido(ctx, 0xffffff, 0.75, { side: THREE.FrontSide });

  // ------------------------------------------------ perfil da cabeça (fundo)
  const perfil = new THREE.Group();
  perfil.position.z = -0.55;
  group.add(perfil);
  const cranio = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.62, 32, 24)), matPele);
  cranio.scale.set(1.05, 1.15, 0.5);
  cranio.position.set(0.05, 1.55, 0);
  perfil.add(cranio);
  const pescoco = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(0.42, 0.5, 1.0, 32)), matPele);
  pescoco.scale.z = 0.5;
  pescoco.position.set(0.12, 0.65, 0);
  perfil.add(pescoco);
  const nariz = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.1, 16, 12)), matPele);
  nariz.position.set(-0.62, 1.42, 0.05);
  perfil.add(nariz);
  const orelha = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.1, 16, 12)), matPele);
  orelha.scale.set(0.6, 1, 0.4);
  orelha.position.set(0.52, 1.5, 0.12);
  perfil.add(orelha);

  // ------------------------------------------------------- boca e língua
  const boca = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.22, 24, 18)), materialTranslucido(ctx, 0x9b2f45, 0.5));
  boca.scale.set(1.6, 0.6, 0.5);
  boca.position.set(-0.3, 1.3, -0.1);
  group.add(boca);
  const lingua = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.2, 24, 18)), materialMacio(ctx, COR.lingua, { clearcoat: 0.7, roughness: 0.4 }));
  lingua.scale.set(1.6, 0.45, 0.5);
  lingua.position.set(-0.28, 1.22, -0.1);
  group.add(lingua);
  const palatoMole = capsula(ctx, 0.035, 0.22, matMucosa);
  palatoMole.rotation.z = Math.PI / 2 - 0.35;
  palatoMole.position.set(0.02, 1.4, -0.1);
  group.add(palatoMole);

  // ---------------------------------------------------- faringe (o funil)
  const curvaFaringe = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.08, 1.42, -0.1),
    new THREE.Vector3(0.1, 1.25, -0.1),
    new THREE.Vector3(0.16, 1.05, -0.1),
    new THREE.Vector3(0.16, 0.92, -0.1)
  ]);
  const faringe = new TuboDinamico(ctx, curvaFaringe, 24, 20, matFaringe);
  faringe.atualizar((u) => 0.17 - u * 0.03);
  group.add(faringe.mesh);

  // ------------------------------------------- traqueia (na frente, à esq.)
  const curvaTraqueia = new THREE.LineCurve3(new THREE.Vector3(0.02, 0.92, -0.04), new THREE.Vector3(0.02, 0.18, -0.04));
  const traqueia = new TuboDinamico(ctx, curvaTraqueia, 12, 20, matTraqueia);
  traqueia.atualizar(() => 0.085);
  group.add(traqueia.mesh);
  for (let i = 0; i < 7; i++) {
    const anel = aro(ctx, 0.09, 0.016, matCartilagem, Math.PI * 1.5);
    anel.rotation.x = Math.PI / 2;
    anel.rotation.z = Math.PI * 0.75;
    anel.position.set(0.02, 0.82 - i * 0.095, -0.04);
    group.add(anel);
  }
  // laringe (pomo de adão)
  const laringe = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.11, 20, 16)), matCartilagem);
  laringe.scale.set(1, 1.2, 1);
  laringe.position.set(0.02, 0.9, -0.04);
  group.add(laringe);

  // ------------------------------------------- esôfago (atrás, à direita)
  const curvaEsofago = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 0.92, -0.1),
    new THREE.Vector3(0.24, 0.7, -0.14),
    new THREE.Vector3(0.26, 0.45, -0.16),
    new THREE.Vector3(0.26, 0.18, -0.16)
  ]);
  const esofago = new TuboDinamico(ctx, curvaEsofago, 24, 20, matEsofago);
  group.add(esofago.mesh);

  // --------------------------------------------------------- epiglote
  const epiglote = new THREE.Group();
  epiglote.position.set(0.09, 1.0, -0.04); // dobradiça na base da língua
  group.add(epiglote);
  const folha = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.09, 20, 14)), matEpiglote);
  folha.scale.set(0.35, 1, 0.9);
  folha.position.set(0, 0.08, 0);
  epiglote.add(folha);
  ctx.registerInteractive(folha, 'swallow', 'Engolir', 'trigger_swallow');
  ctx.registerInteractive(lingua, 'swallow', 'Engolir', 'trigger_swallow');

  // --------------------------------------------------------- bolo e ar
  const bolo = esfera(ctx, 0.07, matBolo);
  group.add(bolo);
  const caminhoBolo = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.3, 1.3, -0.08),
    new THREE.Vector3(-0.08, 1.38, -0.1),
    new THREE.Vector3(0.12, 1.2, -0.1),
    new THREE.Vector3(0.17, 0.98, -0.1),
    new THREE.Vector3(0.24, 0.7, -0.14),
    new THREE.Vector3(0.26, 0.4, -0.16),
    new THREE.Vector3(0.26, 0.2, -0.16)
  ]);
  const bolhas: { mesh: THREE.Mesh; fase: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const b = esfera(ctx, 0.02, matAr, 10);
    b.castShadow = false;
    group.add(b);
    bolhas.push({ mesh: b, fase: i / 6 });
  }

  let progressoSuave = 0;
  let anguloEpiglote = 0;
  let avancoAr = 0;

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const calmo = cur.lowSensory;
    const p = cur.swallowed ? cur.throatProgress / 100 : 0;
    progressoSuave = THREE.MathUtils.damp(progressoSuave, p, 10, dt);

    // 1. epiglote: fecha rápido no início da deglutição e reabre no fim
    const fechada = p > 0.08 && p < 0.9 ? 1 : 0;
    anguloEpiglote = THREE.MathUtils.damp(anguloEpiglote, fechada, 9, dt);
    epiglote.rotation.z = -anguloEpiglote * 1.35; // deita sobre a traqueia

    // 2. palato mole sobe para fechar o nariz enquanto engole
    palatoMole.rotation.z = Math.PI / 2 - 0.35 + anguloEpiglote * 0.45;

    // 3. língua empurra para trás no começo
    const empurrao = sino(p - 0.12, 0.1);
    lingua.position.x = -0.3 + empurrao * 0.06;
    lingua.position.y = 1.22 + empurrao * 0.04;

    // 4. bolo pelo caminho, com onda de constrição logo atrás dele
    const uBolo = suave(progressoSuave);
    bolo.visible = !(cur.swallowed && cur.throatProgress >= 100 && progressoSuave > 0.98);
    bolo.position.copy(caminhoBolo.getPointAt(uBolo));
    const achatado = 1 + sino(uBolo - 0.45, 0.08) * 0.35;
    bolo.scale.set(1 / Math.sqrt(achatado), achatado, 1 / Math.sqrt(achatado));

    const uEsof = THREE.MathUtils.clamp((uBolo - 0.5) / 0.5, 0, 1);
    esofago.atualizar((u) => 0.075 * (1 + 0.55 * sino(u - uEsof, 0.07) - 0.4 * sino(u - uEsof + 0.14, 0.06) * (uEsof > 0 ? 1 : 0)));
    const uFar = THREE.MathUtils.clamp(uBolo / 0.5, 0, 1);
    faringe.atualizar((u) => (0.17 - u * 0.03) * (1 - 0.3 * sino(u - uFar + 0.15, 0.1) * (p > 0 ? 1 : 0)));

    // 5. ar: sobe e desce pela traqueia; para quando a epiglote fecha
    if (!calmo || anguloEpiglote < 0.5) avancoAr += dt * 0.25 * (1 - anguloEpiglote);
    bolhas.forEach(({ mesh, fase }) => {
      const t = (avancoAr + fase) % 1;
      mesh.position.set(0.02 + Math.sin(t * 12) * 0.02, 0.22 + t * 0.68, -0.04);
      mesh.visible = t < 0.97;
      const esc = 0.7 + Math.sin(simTime * 3 + fase * 6) * 0.1;
      mesh.scale.setScalar(esc);
    });
  };

  return { group, update };
}
