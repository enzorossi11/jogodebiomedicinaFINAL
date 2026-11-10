/**
 * Estação Estômago: a bolsa em forma de J, com parede translúcida para ver o
 * que acontece dentro. As glândulas da parede pingam suco gástrico, o nível
 * de líquido sobe, o bolo vai se desfazendo e o estômago "amassa" tudo com
 * ondas até formar o quimo, que sai pelo piloro.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, Gotas, Impulso, TuboDinamico, aro, esfera, materialMacio, materialTranslucido, pulso, sino } from './anatomia';

export function createStomachStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matParede = materialTranslucido(ctx, COR.mucosa, 0.42, { roughness: 0.45 });
    const matSuco = materialMacio(ctx, COR.sucoGastrico, { roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.85 });
  const matLiquido = materialTranslucido(ctx, COR.sucoGastrico, 0.7, { roughness: 0.2, side: THREE.FrontSide });
  const matBolo = materialMacio(ctx, COR.quimo, { roughness: 0.35, clearcoat: 0.8 });
  const matGlandula = materialMacio(ctx, 0xf8d9a0, { roughness: 0.4 });
  const matEsfincter = materialMacio(ctx, COR.musculo, { roughness: 0.5 });

  // J: do topo do fundo (alto) desce pelo corpo e faz a curva do antro até o piloro (direita)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 1.7, 0),
    new THREE.Vector3(-0.02, 1.42, 0),
    new THREE.Vector3(0.0, 1.1, 0),
    new THREE.Vector3(0.08, 0.8, 0),
    new THREE.Vector3(0.22, 0.58, 0),
    new THREE.Vector3(0.42, 0.5, 0),
    new THREE.Vector3(0.6, 0.6, 0),
    new THREE.Vector3(0.7, 0.72, 0)
  ]);
  const perfil = (u: number) => {
    // raio ao longo do J: fundo e corpo largos, antro mais estreito, piloro fino
    const fundo = 0.3 * sino(u - 0.18, 0.2);
    const corpo = 0.22 * sino(u - 0.5, 0.18);
    const antro = 0.12 * sino(u - 0.78, 0.1);
    return 0.06 + fundo + corpo + antro;
  };
  const parede = new TuboDinamico(ctx, curva, 80, 36, matParede);
  group.add(parede.mesh);

  // esôfago chegando pelo lado esquerdo do fundo (cárdia)
  const curvaEsofago = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.46, 1.9, 0), new THREE.Vector3(-0.4, 1.68, 0), new THREE.Vector3(-0.27, 1.5, 0)]);
  const esofago = new TuboDinamico(ctx, curvaEsofago, 12, 16, materialMacio(ctx, COR.musculo, { roughness: 0.5 }));
  esofago.atualizar(() => 0.07);
  group.add(esofago.mesh);

  const cardia = aro(ctx, 0.085, 0.025, matEsfincter);
  cardia.rotation.x = Math.PI / 2;
  cardia.rotation.z = 0.6;
  cardia.position.set(-0.29, 1.52, 0);
  group.add(cardia);
  const piloro = aro(ctx, 0.07, 0.03, matEsfincter);
  piloro.lookAt(curva.getTangentAt(1));
  piloro.position.copy(curva.getPointAt(0.98));
  group.add(piloro);

  // três glândulas na parede (clicáveis): soltam o suco
  const glandulas: { mesh: THREE.Mesh; pos: THREE.Vector3 }[] = [];
  [
    [0.22, 0.9],
    [0.42, -0.6],
    [0.6, 2.3]
  ].forEach(([u, th], i) => {
    const centro = curva.getPointAt(u);
    const r = perfil(u);
    const pos = new THREE.Vector3(centro.x + Math.cos(th) * r * 0.92, centro.y + Math.sin(th) * r * 0.92 * 0.2, Math.sin(th) * r * 0.92);
    // desloca para a frente/lados para ficar visível
    pos.set(centro.x + Math.cos(th) * r * 0.85, centro.y + 0.05, Math.sin(th) * r * 0.85);
    const g = esfera(ctx, 0.035, matGlandula, 14);
    g.position.copy(pos);
    ctx.registerInteractive(g, 'stomach', `Pingar suco ${i + 1}`, 'add_gastric_drop', i);
    group.add(g);
    glandulas.push({ mesh: g, pos });
  });

  // conteúdo: bolo, líquido e partículas do quimo
  const bolo = esfera(ctx, 0.14, matBolo);
  group.add(bolo);
  const liquido = esfera(ctx, 0.25, matLiquido, 32);
  group.add(liquido);
  const particulas: THREE.Mesh[] = [];
  for (let i = 0; i < 16; i++) {
    const p = esfera(ctx, 0.018 + Math.random() * 0.015, matBolo, 10);
    p.visible = false;
    group.add(p);
    particulas.push(p);
  }
  const gotas = new Gotas(ctx, matSuco, 20, 0.022);
  group.add(gotas.group);

  const impulsoGota = new Impulso(0.9);
  const impulsoFinal = new Impulso(4);
  let nivel = 0;
  let escalaBolo = 0.14;
  let timerGota = 0;
  let totalAnterior = 0;
  let uQuimo = 0;

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const calmo = cur.lowSensory;
    const total = cur.gastricDrops.filter(Boolean).length;
    const completo = total >= 3;
    const tg = impulsoGota.observar(total, simTime);
    const tf = impulsoFinal.observar(completo ? 1 : 0, simTime);

    // 1. gotas das glândulas que foram acionadas
    const ultimaAcionada = total > totalAnterior ? cur.gastricDrops.findIndex((v, i) => v && !(i < totalAnterior && cur.gastricDrops[i])) : -1;
    void ultimaAcionada;
    totalAnterior = total;
    if (tg < 1 && !calmo) {
      timerGota -= dt;
      if (timerGota <= 0) {
        timerGota = 0.12;
        cur.gastricDrops.forEach((v, i) => {
          if (v && Math.random() < 0.5) gotas.emitir(glandulas[i].pos, new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.1, 0));
        });
      }
    } else if (calmo && tg < 0.05) {
      cur.gastricDrops.forEach((v, i) => v && gotas.emitir(glandulas[i].pos));
    }
    const superficie = 0.56 + nivel * 0.3;
    gotas.atualizar(dt, superficie);

    glandulas.forEach((g, i) => {
      const ativa = cur.gastricDrops[i];
      const proxima = !ativa && cur.gastricDrops.findIndex((v) => !v) === i;
      const pulsar = proxima && !calmo ? 1 + Math.sin(simTime * 2.5) * 0.12 : 1;
      g.mesh.scale.setScalar(pulsar * (ativa ? 1.1 : 1));
      (g.mesh.material as THREE.MeshPhysicalMaterial).emissive.set(ativa ? 0x7a5a10 : 0x000000);
      (g.mesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.25;
    });

    // 2. nível de líquido sobe a cada gota; bolo encolhe e vira quimo
    nivel = THREE.MathUtils.damp(nivel, total / 3, 3, dt);
    liquido.visible = nivel > 0.03;
    const centroLiq = curva.getPointAt(0.6);
    liquido.position.set(centroLiq.x + 0.02, 0.56 + nivel * 0.2, 0);
    liquido.scale.set(1.05 + nivel * 0.25, 0.35 + nivel * 0.55, 0.9 + nivel * 0.2);

    escalaBolo = THREE.MathUtils.damp(escalaBolo, completo ? 0.0 : 0.14 - total * 0.03, 3, dt);
    bolo.visible = escalaBolo > 0.01;
    const bob = calmo ? 0 : Math.sin(simTime * 1.8) * 0.01;
    bolo.position.set(centroLiq.x + 0.02 + (calmo ? 0 : Math.sin(simTime * 0.9) * 0.04), 0.64 + nivel * 0.18 + bob, 0.04);
    bolo.scale.setScalar(escalaBolo / 0.14);

    // partículas do quimo giram no líquido (mistura)
    const nPart = Math.min(particulas.length, total * 5 + (completo ? 1 : 0));
    particulas.forEach((p, i) => {
      p.visible = i < nPart;
      if (!p.visible) return;
      const a = simTime * (calmo ? 0.3 : 0.9) + i * 1.3;
      const r = 0.06 + (i % 5) * 0.035;
      p.position.set(centroLiq.x + 0.02 + Math.cos(a) * r, 0.58 + nivel * 0.2 + Math.sin(a * 1.7) * 0.05 * nivel + 0.02, Math.sin(a) * r * 0.6);
    });

    // 3. paredes: rugas + ondas de mistura; quando completo, onda forte até o piloro
    const mistura = calmo ? 0 : 0.03 * Math.sin(simTime * 2.2) * nivel;
    const ondaForte = completo ? 1 - tf : 0;
    const uOnda = (simTime * 0.35) % 1.2;
    parede.atualizar((u, th) => {
      const base = perfil(u);
      const ruga = 1 + 0.04 * Math.sin(th * 9 + u * 18) * (1 - 0.5 * nivel);
      const onda = -0.12 * sino(u - uOnda, 0.06) * (nivel * 0.5 + ondaForte);
      return base * ruga * (1 + onda) + mistura * sino(u - 0.55, 0.2);
    });

    // 4. quimo saindo pelo piloro quando tudo foi misturado
    if (completo) {
      uQuimo = (uQuimo + dt * 0.18) % 1;
      piloro.scale.setScalar(1 + 0.25 * pulso((uQuimo * 3) % 1));
    } else {
      piloro.scale.setScalar(1);
    }
  };

  return { group, update };
}
