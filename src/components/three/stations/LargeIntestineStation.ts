/**
 * Estação Intestino grosso: a moldura do cólon (sobe, atravessa, desce) com
 * os haustros, a parede translúcida e o conteúdo dentro. Cada gota de água
 * reabsorvida atravessa a parede e segue pela veia azul de volta ao corpo;
 * o conteúdo vai ficando mais firme e escuro.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, Impulso, TuboDinamico, esfera, materialMacio, materialTranslucido, sino, suave } from './anatomia';

export function createLargeIntestineStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const matParede = materialTranslucido(ctx, COR.mucosa, 0.55, { roughness: 0.45 });
  const matTenia = materialMacio(ctx, COR.musculo, { roughness: 0.55 });
  const matConteudo = materialMacio(ctx, COR.quimo, { roughness: 0.5 });
  const matAgua = materialMacio(ctx, COR.agua, { roughness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 });
  const matVeia = materialMacio(ctx, COR.veia, { roughness: 0.4, clearcoat: 0.5 });
  const matApendice = materialMacio(ctx, COR.mucosaEscura, { roughness: 0.5 });

  // moldura do cólon: ceco (baixo, à direita do corpo = esquerda da tela) → ascendente → transverso → descendente → sigmoide
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.62, 0.3, 0),
    new THREE.Vector3(-0.62, 0.7, 0),
    new THREE.Vector3(-0.6, 1.15, 0),
    new THREE.Vector3(-0.45, 1.4, 0),
    new THREE.Vector3(0.0, 1.45, 0.02),
    new THREE.Vector3(0.45, 1.4, 0),
    new THREE.Vector3(0.6, 1.15, 0),
    new THREE.Vector3(0.62, 0.7, 0),
    new THREE.Vector3(0.55, 0.38, 0),
    new THREE.Vector3(0.35, 0.28, 0)
  ]);
  const RAIO = 0.125;
  const parede = new TuboDinamico(ctx, curva, 110, 30, matParede);
  const conteudo = new TuboDinamico(ctx, curva, 110, 18, matConteudo);
  group.add(parede.mesh, conteudo.mesh);

  // tênia: a faixa muscular que corre ao longo do cólon
  const pontosTenia = Array.from({ length: 24 }, (_, i) => {
    const p = curva.getPointAt(i / 23);
    return new THREE.Vector3(p.x, p.y, p.z + RAIO * 0.95);
  });
  const tenia = new TuboDinamico(ctx, new THREE.CatmullRomCurve3(pontosTenia), 80, 8, matTenia);
  tenia.atualizar(() => 0.018);
  group.add(tenia.mesh);

  // apêndice no ceco
  const apendice = new THREE.Mesh(ctx.trackGeo(new THREE.CapsuleGeometry(0.03, 0.14, 6, 12)), matApendice);
  apendice.position.set(-0.56, 0.2, 0.02);
  apendice.rotation.z = 0.5;
  group.add(apendice);

  // veia que acompanha o cólon por dentro da moldura, voltando ao centro
  const curvaVeia = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.42, 0.55, -0.05),
    new THREE.Vector3(-0.4, 1.1, -0.05),
    new THREE.Vector3(0.0, 1.22, -0.05),
    new THREE.Vector3(0.4, 1.1, -0.05),
    new THREE.Vector3(0.42, 0.55, -0.05),
    new THREE.Vector3(0.0, 0.62, -0.05)
  ]);
  const veia = new TuboDinamico(ctx, curvaVeia, 60, 12, matVeia);
  veia.atualizar(() => 0.03);
  group.add(veia.mesh);
  const figado = esfera(ctx, 0.06, matVeia, 16); // ponto de chegada (simplificado)
  figado.position.set(0, 0.62, -0.05);
  figado.scale.set(1.4, 0.7, 0.7);
  group.add(figado);

  // gotas de água dentro do cólon (clicáveis)
  const POSICOES = [0.2, 0.5, 0.8];
  const gotas = POSICOES.map((u, i) => {
    const g = esfera(ctx, 0.055, matAgua, 16);
    g.scale.set(1, 1.2, 1);
    ctx.registerInteractive(g, 'large_intestine', 'Reabsorver água', 'absorb_water', i);
    group.add(g);
    return { mesh: g, u, impulso: new Impulso(2.6) };
  });

  let firmeza = 0;

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const calmo = cur.lowSensory;
    const total = cur.waterDropsAbsorbed.filter(Boolean).length;
    firmeza = THREE.MathUtils.damp(firmeza, total / 3, 2.5, dt);

    // haustros respiram devagar; uma onda lenta de massa percorre o cólon
    const uOnda = (simTime * 0.08) % 1;
    const respira = calmo ? 0 : Math.sin(simTime * 1.2) * 0.01;
    parede.atualizar((u, th) => {
      const haustro = 1 + 0.16 * Math.abs(Math.sin(u * Math.PI * 16)) * (0.6 + 0.4 * Math.cos(th));
      const onda = 1 + 0.08 * sino(u - uOnda, 0.05);
      return RAIO * haustro * onda + respira;
    });
    conteudo.atualizar((u) => {
      const haustro = 1 + 0.12 * Math.abs(Math.sin(u * Math.PI * 16));
      const enche = 0.55 + firmeza * 0.2;
      return RAIO * haustro * enche;
    });
    // conteúdo escurece e fica fosco conforme perde água
    matConteudo.color.set(COR.quimo).lerp(new THREE.Color(COR.fezes), firmeza);
    matConteudo.roughness = 0.5 + firmeza * 0.35;

    gotas.forEach((g, i) => {
      const absorvida = cur.waterDropsAbsorbed[i];
      const t = g.impulso.observar(absorvida ? 1 : 0, simTime);
      if (!absorvida) g.impulso.reiniciar();
      const dentro = curva.getPointAt(g.u);
      if (!absorvida) {
        g.mesh.visible = true;
        g.mesh.position.set(dentro.x + Math.sin(simTime * 0.8 + i) * 0.02, dentro.y + Math.cos(simTime * 0.6 + i) * 0.02, dentro.z + 0.03);
        g.mesh.scale.set(1, 1.2, 1);
        matAgua.opacity = 0.85;
        return;
      }
      // atravessa a parede (até a veia) e depois corre pela veia até o centro
      const f1 = suave(t / 0.35);
      const uVeia = THREE.MathUtils.clamp(g.u * 0.78, 0, 1);
      const naVeia = curvaVeia.getPointAt(uVeia);
      if (t < 0.35) {
        g.mesh.visible = true;
        g.mesh.position.lerpVectors(dentro, naVeia, f1);
        g.mesh.scale.setScalar(1 - f1 * 0.4);
      } else if (t < 1) {
        const f2 = suave((t - 0.35) / 0.65);
        g.mesh.visible = true;
        g.mesh.position.copy(curvaVeia.getPointAt(THREE.MathUtils.lerp(uVeia, 1, f2)));
        g.mesh.scale.setScalar(0.6 - f2 * 0.3);
      } else {
        g.mesh.visible = false;
      }
    });

    // a veia "bebe": pulsa quando recebe água
    const recebendo = gotas.some((g) => cur.waterDropsAbsorbed[gotas.indexOf(g)] && g.mesh.visible);
    const pulsar = recebendo && !calmo ? 1 + Math.sin(simTime * 4) * 0.08 : 1;
    figado.scale.set(1.4 * pulsar, 0.7 * pulsar, 0.7 * pulsar);
  };

  return { group, update };
}
