/**
 * Estação Intestino delgado: um trecho do intestino aberto ao meio, com o
 * tapete de vilosidades ondulando. Os nutrientes flutuam no quimo; quando são
 * absorvidos, entram por uma vilosidade e seguem pelo vaso sanguíneo que corre
 * por baixo, iluminando o caminho até o sangue.
 */
import * as THREE from 'three';
import type { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import type { StationBuildContext, StationInstance } from './types';
import { COR, Impulso, TuboDinamico, esfera, materialMacio, materialTranslucido, suave } from './anatomia';

const CENTRO_Y = 0.8;
const COMPRIMENTO = 1.7;
const RAIO = 0.42;
const NUTRIENTES = [COR.nutrienteEnergia, COR.nutrienteProteina, COR.nutrienteVitamina];

export function createSmallIntestineStation(ctx: StationBuildContext): StationInstance {
  // "pivo" inclina a calha para a câmera enxergar o tapete de vilosidades
  const pivo = new THREE.Group();
  pivo.position.y = CENTRO_Y;
  pivo.rotation.x = 0.62;
  const group = new THREE.Group();
  group.position.y = -CENTRO_Y;
  pivo.add(group);

  const matParede = materialMacio(ctx, COR.mucosa, { roughness: 0.55, side: THREE.DoubleSide });
  const matBorda = materialMacio(ctx, COR.musculo, { roughness: 0.5 });
  const matVilo = materialMacio(ctx, 0xf7b9c4, { roughness: 0.45, clearcoat: 0.6 });
  const matQuimo = materialTranslucido(ctx, COR.quimo, 0.35, { roughness: 0.3, side: THREE.FrontSide });
  const matArteria = materialMacio(ctx, COR.sangue, { roughness: 0.4, clearcoat: 0.6 });
  const matVeia = materialMacio(ctx, COR.veia, { roughness: 0.4, clearcoat: 0.6 });

  // calha: meio tubo deitado no eixo x, aberto para cima
  const calha = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(RAIO, RAIO, COMPRIMENTO, 48, 1, true, Math.PI, Math.PI)), matParede);
  calha.rotation.z = Math.PI / 2;
  calha.position.y = CENTRO_Y;
  calha.receiveShadow = true;
  group.add(calha);
  // bordas da calha (parede cortada)
  [-1, 1].forEach((lado) => {
    const borda = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, COMPRIMENTO, 10)), matBorda);
    borda.rotation.z = Math.PI / 2;
    borda.position.set(0, CENTRO_Y, lado * RAIO);
    group.add(borda);
  });
  // anéis das extremidades (pregas circulares)
  [-1, 1].forEach((lado) => {
    const prega = new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(RAIO, 0.035, 12, 40, Math.PI)), matBorda);
    prega.rotation.y = Math.PI / 2;
    prega.rotation.z = Math.PI;
    prega.position.set(lado * COMPRIMENTO * 0.5, CENTRO_Y, 0);
    group.add(prega);
  });

  // quimo: lâmina de líquido no fundo da calha
  const quimo = new THREE.Mesh(ctx.trackGeo(new THREE.BoxGeometry(COMPRIMENTO * 0.98, 0.16, RAIO * 1.5)), matQuimo);
  quimo.position.set(0, CENTRO_Y - RAIO + 0.1, 0);
  group.add(quimo);

  // vilosidades (instanciadas) plantadas no fundo da calha
  const N = 160;
  const vilos = new THREE.InstancedMesh(ctx.trackGeo(new THREE.CapsuleGeometry(0.026, 0.15, 5, 10)), matVilo, N);
  vilos.castShadow = true;
  group.add(vilos);
  const base: { x: number; ang: number; fase: number; alt: number }[] = [];
  for (let i = 0; i < N; i++) {
    base.push({
      x: -COMPRIMENTO * 0.46 + (i / (N - 1)) * COMPRIMENTO * 0.92 + (Math.random() - 0.5) * 0.04,
      ang: (Math.random() - 0.5) * 1.9, // posição na calha (0 = fundo)
      fase: Math.random() * Math.PI * 2,
      alt: 0.8 + Math.random() * 0.5
    });
  }
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const esc = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const eixo = new THREE.Vector3();

  // vasos: artéria e veia correndo por baixo da calha
  const curvaVaso = (z: number) =>
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-COMPRIMENTO * 0.55, CENTRO_Y - RAIO - 0.12, z),
      new THREE.Vector3(-0.3, CENTRO_Y - RAIO - 0.16, z),
      new THREE.Vector3(0.3, CENTRO_Y - RAIO - 0.16, z),
      new THREE.Vector3(COMPRIMENTO * 0.55, CENTRO_Y - RAIO - 0.12, z)
    ]);
  const arteria = new TuboDinamico(ctx, curvaVaso(0.08), 40, 14, matArteria);
  const veia = new TuboDinamico(ctx, curvaVaso(-0.08), 40, 14, matVeia);
  arteria.atualizar(() => 0.04);
  veia.atualizar(() => 0.045);
  group.add(arteria.mesh, veia.mesh);
  // capilares subindo até as vilosidades
  const capilares: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(ctx.trackGeo(new THREE.CylinderGeometry(0.008, 0.012, 0.16, 6)), i % 2 ? matArteria : matVeia);
    c.position.set(-0.7 + i * 0.175, CENTRO_Y - RAIO - 0.06, i % 2 ? 0.06 : -0.06);
    group.add(c);
    capilares.push(c);
  }

  // nutrientes
  const nutrientes = NUTRIENTES.map((cor, i) => {
    const mat = materialMacio(ctx, cor, { roughness: 0.3, clearcoat: 0.9, emissive: new THREE.Color(cor), emissiveIntensity: 0.15 });
    const n = esfera(ctx, 0.075, mat, 20);
    ctx.registerInteractive(n, 'small_intestine', 'Absorver', 'absorb_nutrient', i);
    group.add(n);
    return { mesh: n, mat, impulso: new Impulso(2.2), alvoX: -0.45 + i * 0.45, pontoSangue: esfera(ctx, 0.03, mat, 10) };
  });
  nutrientes.forEach((n) => {
    n.pontoSangue.visible = false;
    group.add(n.pontoSangue);
  });

  const update = (cur: Proposta1HD2DSceneProps, dt: number, simTime: number) => {
    const calmo = cur.lowSensory;
    const vel = calmo ? 0.35 : 1;

    // vilosidades balançam como alga
    for (let i = 0; i < N; i++) {
      const b = base[i];
      const balanco = Math.sin(simTime * 1.6 * vel + b.fase + b.x * 2) * 0.18;
      // posição na calha
      const r = RAIO - 0.02;
      pos.set(b.x, CENTRO_Y - Math.cos(b.ang) * r + 0.06, Math.sin(b.ang) * r);
      // orienta a vilosidade para o centro da calha, com balanço
      eixo.set(0, Math.cos(b.ang), -Math.sin(b.ang)).normalize();
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eixo);
      const inclinar = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), balanco);
      q.multiply(inclinar);
      esc.set(1, b.alt, 1);
      m4.compose(pos, q, esc);
      vilos.setMatrixAt(i, m4);
    }
    vilos.instanceMatrix.needsUpdate = true;

    // quimo escorre devagar
    quimo.position.x = calmo ? 0 : Math.sin(simTime * 0.4) * 0.02;

    // nutrientes: flutuam; ao absorver, descem para uma vilosidade e viram um ponto no sangue
    nutrientes.forEach((n, i) => {
      const absorvido = cur.nutrientsAbsorbed[i];
      const t = n.impulso.observar(absorvido ? 1 : 0, simTime);
      if (!absorvido) {
        n.impulso.reiniciar();
        n.mesh.visible = true;
        n.pontoSangue.visible = false;
        n.mesh.position.set(n.alvoX + Math.sin(simTime * 0.7 * vel + i) * 0.08, CENTRO_Y - 0.05 + Math.sin(simTime * 1.1 * vel + i * 2) * 0.05, Math.cos(simTime * 0.5 + i) * 0.1);
        n.mesh.scale.setScalar(1 + (calmo ? 0 : Math.sin(simTime * 2 + i) * 0.05));
        n.mat.emissiveIntensity = 0.15;
        return;
      }
      // fase 1 (0..0.45): desce até a vilosidade e encolhe
      // fase 2 (0.45..1): ponto brilhante corre pelo vaso
      const f1 = suave(t / 0.45);
      const yVilo = CENTRO_Y - RAIO + 0.12;
      n.mesh.position.set(n.alvoX, THREE.MathUtils.lerp(CENTRO_Y - 0.05, yVilo, f1), 0.02);
      n.mesh.scale.setScalar(1 - f1 * 0.75);
      n.mesh.visible = t < 0.45;
      n.mat.emissiveIntensity = 0.15 + f1 * 0.5;
      if (t >= 0.45) {
        const f2 = (t - 0.45) / 0.55;
        n.pontoSangue.visible = f2 < 1;
        const p = arteria.ponto(THREE.MathUtils.clamp((n.alvoX + COMPRIMENTO * 0.55) / (COMPRIMENTO * 1.1) + f2 * 0.6, 0, 1));
        n.pontoSangue.position.copy(p);
      } else {
        n.pontoSangue.visible = false;
      }
      if (t >= 1) {
        n.pontoSangue.visible = false;
      }
    });

    // vaso pulsa de leve
    const batida = calmo ? 1 : 1 + Math.max(0, Math.sin(simTime * 2.4)) * 0.12;
    arteria.mesh.scale.set(1, batida, batida);
    arteria.mesh.position.y = (1 - batida) * (CENTRO_Y - RAIO - 0.16);
  };

  return { group: pivo, update };
}
