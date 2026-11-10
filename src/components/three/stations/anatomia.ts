/**
 * Caixa de ferramentas comum às estações anatômicas:
 * materiais macios, tubos que mudam de forma a cada quadro (peristaltismo,
 * haustros, rugas), gotas com física simples e envelopes de animação.
 */
import * as THREE from 'three';
import type { FoodId } from '../../FoodSelector';
import type { StationBuildContext } from './types';

// ------------------------------------------------------------------ cores
export const COR = {
  mucosa: 0xf4a6b4,
  mucosaEscura: 0xd97b8e,
  mucosaClara: 0xfbd3da,
  musculo: 0xe07a8a,
  lingua: 0xe98a9a,
  pele: 0xf6d2c0,
  labio: 0xe3909c,
  dente: 0xfbfbf7,
  cartilagem: 0xbfe3f0,
  sangue: 0xe0575f,
  veia: 0x7aa7e0,
  agua: 0x8cc6f0,
  saliva: 0xcfe9ff,
  sucoGastrico: 0xf3e39a,
  quimo: 0xe8c98a,
  nutrienteEnergia: 0xf6c84c,
  nutrienteProteina: 0xa38bf0,
  nutrienteVitamina: 0x6fd1a5,
  fezes: 0xb98556
} as const;

export const ALIMENTO: Record<FoodId, { cor: number; casca: number; miolo: number }> = {
  maca: { cor: 0xe0453f, casca: 0xc0392b, miolo: 0xfff4d6 },
  pao: { cor: 0xd9a05b, casca: 0xb97a3a, miolo: 0xfbefd5 },
  cenoura: { cor: 0xf48c2a, casca: 0xe0761a, miolo: 0xffb366 },
  ovo: { cor: 0xfbe6b8, casca: 0xf4d37a, miolo: 0xfff8e6 }
};

// --------------------------------------------------------------- materiais
export function materialMacio(
  ctx: StationBuildContext,
  cor: number,
  extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}
): THREE.MeshPhysicalMaterial {
  return ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: cor,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.5,
      sheen: 0.4,
      sheenColor: new THREE.Color(0xffffff),
      ...extra
    })
  );
}

export function materialTranslucido(
  ctx: StationBuildContext,
  cor: number,
  opacidade: number,
  extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}
): THREE.MeshPhysicalMaterial {
  return ctx.trackMat(
    new THREE.MeshPhysicalMaterial({
      color: cor,
      roughness: 0.4,
      metalness: 0,
      transparent: true,
      opacity: opacidade,
      depthWrite: false,
      side: THREE.DoubleSide,
      ...extra
    })
  );
}

// ----------------------------------------------------------------- curvas
export const suave = (t: number) => {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};
export const sino = (x: number, largura: number) => Math.exp(-(x * x) / (2 * largura * largura));
/** 0 → 1 → 0 ao longo de t∈[0,1] */
export const pulso = (t: number) => (t <= 0 || t >= 1 ? 0 : Math.sin(t * Math.PI));

/** Dispara um envelope de animação sempre que um contador sobe. */
export class Impulso {
  private ultimo = -1;
  private inicio = -Infinity;
  constructor(private duracao: number) {}
  /** devolve o progresso 0..1 do impulso atual (1 = terminado / parado) */
  observar(valor: number, tempo: number): number {
    if (this.ultimo === -1) this.ultimo = valor;
    if (valor > this.ultimo) this.inicio = tempo;
    this.ultimo = valor;
    return THREE.MathUtils.clamp((tempo - this.inicio) / this.duracao, 0, 1);
  }
  reiniciar() {
    this.ultimo = -1;
    this.inicio = -Infinity;
  }
}

// ----------------------------------------------------------- tubo dinâmico
export type FuncaoRaio = (u: number, theta: number) => number;

/**
 * Tubo ao longo de uma curva cujo raio pode variar por posição (u) e por
 * ângulo (theta) a cada quadro. Serve para esôfago, estômago e intestinos.
 */
export class TuboDinamico {
  readonly mesh: THREE.Mesh;
  readonly geometria: THREE.BufferGeometry;
  private pontos: THREE.Vector3[] = [];
  private normais: THREE.Vector3[] = [];
  private binormais: THREE.Vector3[] = [];
  private pos: Float32Array;

  constructor(
    ctx: StationBuildContext,
    readonly curva: THREE.Curve<THREE.Vector3>,
    readonly segmentos: number,
    readonly radiais: number,
    material: THREE.Material,
    fechado = false
  ) {
    const frames = curva.computeFrenetFrames(segmentos, fechado);
    for (let i = 0; i <= segmentos; i++) {
      this.pontos.push(curva.getPointAt(i / segmentos));
      this.normais.push(frames.normals[i]);
      this.binormais.push(frames.binormals[i]);
    }
    const nv = (segmentos + 1) * (radiais + 1);
    this.pos = new Float32Array(nv * 3);
    const uv = new Float32Array(nv * 2);
    const idx: number[] = [];
    for (let i = 0; i <= segmentos; i++) {
      for (let j = 0; j <= radiais; j++) {
        const k = i * (radiais + 1) + j;
        uv[k * 2] = i / segmentos;
        uv[k * 2 + 1] = j / radiais;
        if (i < segmentos && j < radiais) {
          const a = k;
          const b = k + radiais + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    this.geometria = ctx.trackGeo(new THREE.BufferGeometry());
    this.geometria.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geometria.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.geometria.setIndex(idx);
    this.atualizar(() => 0.1);
    this.mesh = new THREE.Mesh(this.geometria, material);
  }

  atualizar(raio: FuncaoRaio) {
    const { segmentos, radiais, pos } = this;
    for (let i = 0; i <= segmentos; i++) {
      const p = this.pontos[i];
      const n = this.normais[i];
      const b = this.binormais[i];
      const u = i / segmentos;
      for (let j = 0; j <= radiais; j++) {
        const th = (j / radiais) * Math.PI * 2;
        const r = raio(u, th);
        const c = Math.cos(th) * r;
        const s = Math.sin(th) * r;
        const k = (i * (radiais + 1) + j) * 3;
        pos[k] = p.x + c * n.x + s * b.x;
        pos[k + 1] = p.y + c * n.y + s * b.y;
        pos[k + 2] = p.z + c * n.z + s * b.z;
      }
    }
    const attr = this.geometria.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
    this.geometria.computeVertexNormals();
  }

  ponto(u: number) {
    return this.curva.getPointAt(THREE.MathUtils.clamp(u, 0, 1));
  }
}

// -------------------------------------------------------------------- gotas
interface Gota {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  vida: number;
  alvo?: THREE.Vector3;
}

/** Pequeno sistema de gotas: caem com gravidade suave ou seguem até um alvo. */
export class Gotas {
  readonly group = new THREE.Group();
  private gotas: Gota[] = [];
  private geo: THREE.BufferGeometry;

  constructor(
    ctx: StationBuildContext,
    private material: THREE.Material,
    private max = 24,
    raio = 0.03
  ) {
    this.geo = ctx.trackGeo(new THREE.SphereGeometry(raio, 12, 10));
    for (let i = 0; i < max; i++) {
      const mesh = new THREE.Mesh(this.geo, this.material);
      mesh.visible = false;
      mesh.scale.set(1, 1.25, 1);
      this.group.add(mesh);
      this.gotas.push({ mesh, vel: new THREE.Vector3(), vida: 0 });
    }
  }

  emitir(origem: THREE.Vector3, velocidade = new THREE.Vector3(), alvo?: THREE.Vector3) {
    const g = this.gotas.find((x) => !x.mesh.visible) ?? this.gotas[0];
    g.mesh.position.copy(origem);
    g.vel.copy(velocidade);
    g.vida = 1;
    g.alvo = alvo?.clone();
    g.mesh.visible = true;
    g.mesh.scale.setScalar(1);
  }

  atualizar(dt: number, chao?: number) {
    for (const g of this.gotas) {
      if (!g.mesh.visible) continue;
      if (g.alvo) {
        const d = g.alvo.clone().sub(g.mesh.position);
        const dist = d.length();
        if (dist < 0.02) {
          g.mesh.visible = false;
          continue;
        }
        g.mesh.position.addScaledVector(d.normalize(), Math.min(dist, dt * 0.9));
      } else {
        g.vel.y -= dt * 1.6;
        g.mesh.position.addScaledVector(g.vel, dt);
        if (chao !== undefined && g.mesh.position.y <= chao) {
          g.vida -= dt * 4;
          g.mesh.position.y = chao;
          g.mesh.scale.set(1 + (1 - g.vida) * 0.6, Math.max(0.05, g.vida), 1 + (1 - g.vida) * 0.6);
          if (g.vida <= 0) g.mesh.visible = false;
        }
      }
    }
  }

  get ativas() {
    return this.gotas.filter((g) => g.mesh.visible).length;
  }
}

// ----------------------------------------------------- pedaço de alimento
/** Um pedaço irregular de alimento, com casca e miolo, que encolhe e arredonda. */
export function criarPedacoAlimento(ctx: StationBuildContext, raio: number) {
  const geo = ctx.trackGeo(new THREE.IcosahedronGeometry(raio, 2));
  const p = geo.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const ruido = 1 + 0.12 * Math.sin(v.x * 23 + v.y * 17) * Math.cos(v.z * 19);
    v.multiplyScalar(ruido);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = materialMacio(ctx, 0xffffff, { roughness: 0.55, sheen: 0, clearcoat: 0.25 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return { mesh, mat };
}

export function aplicarCorAlimento(mat: THREE.MeshPhysicalMaterial, id: FoodId, mistura = 0) {
  const a = new THREE.Color(ALIMENTO[id].cor);
  const b = new THREE.Color(COR.quimo);
  mat.color.copy(a.lerp(b, mistura));
}

/** Anel/aro liso (útil para lábios, cárdia, piloro, anéis de cartilagem). */
export function aro(ctx: StationBuildContext, raio: number, espessura: number, mat: THREE.Material, arco = Math.PI * 2) {
  return new THREE.Mesh(ctx.trackGeo(new THREE.TorusGeometry(raio, espessura, 14, 48, arco)), mat);
}

export function esfera(ctx: StationBuildContext, raio: number, mat: THREE.Material, seg = 24) {
  const m = new THREE.Mesh(ctx.trackGeo(new THREE.SphereGeometry(raio, seg, Math.round(seg * 0.75))), mat);
  m.castShadow = true;
  return m;
}

export function capsula(ctx: StationBuildContext, raio: number, comprimento: number, mat: THREE.Material) {
  const m = new THREE.Mesh(ctx.trackGeo(new THREE.CapsuleGeometry(raio, comprimento, 8, 16)), mat);
  m.castShadow = true;
  return m;
}
