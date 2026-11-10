/**
 * Estação Boca: vista frontal de uma boca aberta. A cada mastigada a mandíbula
 * fecha e abre, o pedaço de alimento encolhe e se desmancha, a saliva cai das
 * glândulas e o bolo alimentar vai se formando sobre a língua.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { ALIMENTO, COR, Gotas, Impulso, aplicarCorAlimento, capsula, criarPedacoAlimento, esfera, materialMacio, pulso, suave } from './anatomia';

const CENTRO_Y = 0.95;
const MASTIGADAS = 5;

export function createMouthStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matPele = materialMacio(ctx, COR.pele, { roughness: 0.75, clearcoat: 0.05 });
  const matLabio = materialMacio(ctx, COR.labio, { roughness: 0.45 });
  const matCavidade = ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x8e2a40, roughness: 0.85, side: THREE.BackSide }));
  const matGengiva = materialMacio(ctx, COR.mucosa, { roughness: 0.5 });
  const matLingua = materialMacio(ctx, COR.lingua, { roughness: 0.5, clearcoat: 0.5 });
  const matDente = materialMacio(ctx, COR.dente, { roughness: 0.25, clearcoat: 0.8 });
  const matSaliva = materialMacio(ctx, COR.saliva, { roughness: 0.1, transparent: true, opacity: 0.8, clearcoat: 1 });

  // ------------------------------------------------------------- rosto
  // Uma "janela" de pele ao redor dos lábios; por trás, a cavidade escura.
  const matPeleFosca = ctx.trackMat(new THREE.MeshStandardMaterial({ color: COR.pele, roughness: 0.85 }));
  const rosto = new THREE.Mesh(ctx.trackGeo(new THREE.RingGeometry(0.62, 3.0, 64, 1)), matPeleFosca);
  rosto.scale.set(1.15, 0.78, 1);
  rosto.position.set(0, CENTRO_Y, 0.02);
  group.add(rosto);
  const bochecha = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(0.72, 0.12, 20, 64)), matPele);
  bochecha.scale.set(1.15, 0.78, 1);
  bochecha.position.set(0, CENTRO_Y, 0.02);
  group.add(bochecha);

  const cavidade = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.75, 40, 28, 0, Math.PI * 2, 0, Math.PI)), matCavidade);
  cavidade.scale.set(1.0, 0.75, 0.8);
  cavidade.position.set(0, CENTRO_Y, -0.2);
  group.add(cavidade);
  const garganta = new THREE.Mesh(ctx.trackGeo(new THREE.CircleGeometry(0.18, 32)), ctx.trackMat(new THREE.MeshStandardMaterial({ color: 0x5c1626, roughness: 0.9 })));
  garganta.position.set(0, CENTRO_Y - 0.02, -0.72);
  group.add(garganta);

  const uvula = capsula(ctx, 0.03, 0.08, matGengiva);
  uvula.position.set(0, CENTRO_Y + 0.26, -0.6);
  group.add(uvula);

  // ------------------------------------------------------- maxilar (fixo)
  const maxilar = new THREE.Group();
  group.add(maxilar);

  const labioSup = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(0.66, 0.075, 18, 56, Math.PI)), matLabio);
  labioSup.scale.set(1.0, 0.55, 1);
  labioSup.position.set(0, CENTRO_Y + 0.03, 0.12);
  maxilar.add(labioSup);

  const gengivaSup = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(0.44, 0.075, 14, 48, Math.PI)), matGengiva);
  gengivaSup.rotation.x = Math.PI / 2;
  gengivaSup.position.set(0, CENTRO_Y + 0.2, -0.3);
  maxilar.add(gengivaSup);
  const palato = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.44, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), matGengiva);
  palato.scale.set(1, 0.5, 1);
  palato.position.set(0, CENTRO_Y + 0.2, -0.3);
  maxilar.add(palato);

  const dentes: THREE.Mesh[] = [];
  const arcoDentes = (pai: THREE.Group, y: number, paraCima: boolean) => {
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (0.1 + (0.8 * i) / (n - 1));
      const central = Math.abs(i - (n - 1) / 2) < 1.6;
      const largura = central ? 0.09 : 0.075;
      const altura = central ? 0.15 : 0.11;
      const geo = ctx.trackGeo(new THREE.CapsuleGeometry(largura * 0.5, altura * 0.5, 6, 10));
      const d = new THREE.Mesh(geo, matDente);
      d.position.set(Math.cos(a) * 0.44, y + (paraCima ? 1 : -1) * altura * 0.35, -0.3 + Math.sin(a) * 0.44);
      d.castShadow = true;
      ctx.registerInteractive(d, 'mouth', 'Mastigar', 'chew_mouth');
      pai.add(d);
      dentes.push(d);
    }
  };
  arcoDentes(maxilar, CENTRO_Y + 0.13, false);

  // ---------------------------------------------------- mandíbula (móvel)
  const mandibula = new THREE.Group();
  group.add(mandibula);
  const queixo = mandibula; // tudo que desce junto com a mandíbula

  const labioInf = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(0.66, 0.085, 18, 56, Math.PI)), matLabio);
  labioInf.rotation.z = Math.PI;
  labioInf.scale.set(1.0, 0.55, 1);
  labioInf.position.set(0, CENTRO_Y + 0.0, 0.12);
  queixo.add(labioInf);

  const gengivaInf = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(0.42, 0.075, 14, 48, Math.PI)), matGengiva);
  gengivaInf.rotation.x = Math.PI / 2;
  gengivaInf.position.set(0, CENTRO_Y - 0.1, -0.3);
  queixo.add(gengivaInf);
  arcoDentes(queixo, CENTRO_Y - 0.03, true);

  // língua
  const lingua = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(0.3, 32, 24)), matLingua);
  lingua.scale.set(1.25, 0.4, 1.4);
  lingua.position.set(0, CENTRO_Y - 0.12, -0.22);
  lingua.castShadow = true;
  lingua.receiveShadow = true;
  queixo.add(lingua);
  const sulco = new THREE.Mesh(ctx.trackGeo(new THREE.CapsuleGeometry(0.012, 0.34, 4, 8)), materialMacio(ctx, COR.mucosaEscura));
  sulco.rotation.x = Math.PI / 2;
  sulco.position.set(0, CENTRO_Y - 0.005, -0.24);
  queixo.add(sulco);

  // ------------------------------------------------------- alimento
  const pedaco = criarPedacoAlimento(ctx, 0.2);
  const migalhas: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const m = criarPedacoAlimento(ctx, 0.035 + Math.random() * 0.03).mesh;
    m.visible = false;
    migalhas.push(m);
  }
  const bolo = esfera(ctx, 0.17, materialMacio(ctx, COR.quimo, { roughness: 0.35, clearcoat: 0.9 }));
  bolo.scale.set(1.2, 0.8, 1.1);
  const comida = new THREE.Group();
  comida.add(pedaco.mesh, bolo, ...migalhas);
  queixo.add(comida);
  comida.position.set(0, CENTRO_Y - 0.03, -0.2);

  // glândulas salivares (pontos de onde a saliva sai, nas bochechas)
  const gotas = new Gotas(ctx, matSaliva, 18, 0.022);
  group.add(gotas.group);
  const glandulas = [new THREE.Vector3(-0.5, CENTRO_Y + 0.1, -0.2), new THREE.Vector3(0.5, CENTRO_Y + 0.1, -0.2)];

  // --------------------------------------------------------- animação
  const impulsoMastigada = new Impulso(0.55);
  let aberturaAtual = 0.5;
  let escalaPedaco = 1;
  let escalaBolo = 0;
  let ultimaGotaEm = -1;
  let timerGota = 0;
  const posMigalha = migalhas.map((_, i) => ({
    a: (i / migalhas.length) * Math.PI * 2 + Math.random() * 0.4,
    r: 0.08 + Math.random() * 0.14,
    y: Math.random() * 0.02
  }));

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const etapa = THREE.MathUtils.clamp(cur.chewCount, 0, MASTIGADAS);
    const feito = etapa >= MASTIGADAS;
    const calmo = cur.lowSensory;
    const t = impulsoMastigada.observar(cur.chewCount, simTime);
    const fechando = pulso(t); // 0 → 1 → 0 durante a mastigada

    // 1. abertura da boca: aberta em repouso, fecha e reabre em cada mastigada
    const aberturaRepouso = feito ? 0.4 : 0.66;
    const respirar = calmo ? 0 : Math.sin(simTime * 1.1) * 0.015;
    const alvo = aberturaRepouso * (1 - suave(fechando) * 0.72) + respirar;
    aberturaAtual = THREE.MathUtils.damp(aberturaAtual, alvo, 14, dt);
    mandibula.position.y = -aberturaAtual * 0.55; // mandíbula desce
    maxilar.position.y = aberturaAtual * 0.12; // maxilar sobe um pouco
    // leve movimento lateral de moagem enquanto fecha
    mandibula.position.x = fechando > 0 && !calmo ? Math.sin(t * Math.PI * 2) * 0.02 : 0;

    // 2. língua: sobe para empurrar o alimento contra os dentes
    lingua.position.y = CENTRO_Y - 0.12 + fechando * 0.03 + (feito ? 0.03 : 0);
    lingua.scale.z = 1.4 - fechando * 0.08;
    comida.position.y = CENTRO_Y - 0.03 + fechando * 0.03 + (feito ? 0.03 : 0);

    // 3. alimento: cor, encolhimento, migalhas e bolo
    aplicarCorAlimento(pedaco.mat, cur.selectedFoodId, Math.min(1, etapa * 0.12));
    const escalaAlvo = etapa === 0 ? 1 : feito ? 0 : 1 - etapa * 0.17;
    escalaPedaco = THREE.MathUtils.damp(escalaPedaco, escalaAlvo, 6, dt);
    pedaco.mesh.visible = escalaPedaco > 0.03;
    const amassar = 1 - fechando * 0.25;
    pedaco.mesh.scale.set(escalaPedaco * (1 + (1 - amassar) * 0.4), escalaPedaco * amassar, escalaPedaco);
    pedaco.mesh.position.y = 0.2 * escalaPedaco * amassar;
    if (!calmo) pedaco.mesh.rotation.y += dt * 0.3;

    const nMigalhas = etapa === 0 ? 0 : feito ? 0 : Math.min(migalhas.length, etapa * 3);
    const corMigalha = new THREE.Color(ALIMENTO[cur.selectedFoodId].miolo);
    migalhas.forEach((m, i) => {
      m.visible = i < nMigalhas;
      if (!m.visible) return;
      (m.material as THREE.MeshPhysicalMaterial).color.copy(corMigalha);
      const p = posMigalha[i];
      const espalhar = 1 - etapa * 0.08;
      m.position.set(Math.cos(p.a) * p.r * espalhar, 0.03 + p.y + fechando * 0.02, Math.sin(p.a) * p.r * 0.6 * espalhar);
      m.rotation.set(simTime * 0.4 + i, simTime * 0.3, 0);
    });

    const boloAlvo = etapa < 2 ? 0 : feito ? 1 : 0.35 + (etapa - 2) * 0.2;
    escalaBolo = THREE.MathUtils.damp(escalaBolo, boloAlvo, 5, dt);
    bolo.visible = escalaBolo > 0.03;
    const pulsar = feito && !calmo ? 1 + Math.sin(simTime * 2.2) * 0.02 : 1;
    bolo.scale.set(1.2 * escalaBolo * pulsar, 0.8 * escalaBolo, 1.1 * escalaBolo * pulsar);
    bolo.position.y = 0.1 * escalaBolo;
    (bolo.material as THREE.MeshPhysicalMaterial).color.set(COR.quimo).lerp(new THREE.Color(ALIMENTO[cur.selectedFoodId].cor), 0.35);

    // 4. saliva: cai das glândulas durante a mastigada e um fio contínuo quando já umedeceu
    const emitindo = fechando > 0.05 || (cur.salivaAdded && !feito);
    if (emitindo && !calmo) {
      timerGota -= dt;
      if (timerGota <= 0) {
        timerGota = fechando > 0.05 ? 0.07 : 0.5;
        const g = glandulas[Math.floor(Math.random() * 2)];
        gotas.emitir(g, new THREE.Vector3(-Math.sign(g.x) * 0.5, -0.05, 0.05));
      }
    } else if (cur.chewCount !== ultimaGotaEm && calmo && fechando > 0.4) {
      // modo baixo estímulo: só uma gota por mastigada
      ultimaGotaEm = cur.chewCount;
      gotas.emitir(glandulas[cur.chewCount % 2], new THREE.Vector3(-Math.sign(glandulas[cur.chewCount % 2].x) * 0.45, -0.05, 0.05));
    }
    gotas.atualizar(dt, CENTRO_Y - 0.04 - aberturaAtual * 0.45);

    // brilho úmido da língua e do bolo conforme a saliva entra
    matLingua.clearcoat = cur.salivaAdded ? 0.9 : 0.5;
    matLingua.roughness = cur.salivaAdded ? 0.3 : 0.5;

    if (!calmo) uvula.rotation.z = Math.sin(simTime * 1.7) * 0.04;
  };

  return { group, update };
}
