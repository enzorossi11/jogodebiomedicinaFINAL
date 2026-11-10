/**
 * Metadados de apresentação das etapas da Viagem do Alimento.
 * As regras pedagógicas de cada etapa continuam em scriptData.ts; aqui ficam
 * só nome, ordem e como cada etapa aparece na interface.
 */
export type EtapaId =
  | 'food_select'
  | 'first_bite'
  | 'mouth'
  | 'swallow'
  | 'esophagus'
  | 'stomach'
  | 'small_intestine'
  | 'large_intestine'
  | 'final_ordering';

/** Mantido por compatibilidade com o palco 3D (inclui a antiga tela "hub"). */
export type ActiveScreen = EtapaId | 'hub';

export interface EtapaMeta {
  id: EtapaId;
  /** nome curto, como aparece na trilha de progresso */
  curto: string;
  /** nome do órgão ou momento, como aparece no painel */
  nome: string;
  /** o que acontece aqui, em uma frase */
  resumo: string;
  /** rótulo do botão principal da etapa (null = etapa só de observação/escolha) */
  acao: string | null;
  /** rótulo da ação quando a etapa já foi concluída */
  acaoConcluida?: string;
}

export const SEQUENCIA: EtapaId[] = [
  'food_select',
  'first_bite',
  'mouth',
  'swallow',
  'esophagus',
  'stomach',
  'small_intestine',
  'large_intestine',
  'final_ordering'
];

export const ETAPAS: Record<EtapaId, EtapaMeta> = {
  food_select: {
    id: 'food_select',
    curto: 'Escolha',
    nome: 'Escolha o alimento',
    resumo: 'Qual lanche vai fazer a viagem pelo corpo hoje?',
    acao: null
  },
  first_bite: {
    id: 'first_bite',
    curto: 'Mordida',
    nome: 'A primeira mordida',
    resumo: 'A mão leva o alimento até a boca e os dentes dão a primeira mordida.',
    acao: 'Dar a mordida',
    acaoConcluida: 'Morder de novo'
  },
  mouth: {
    id: 'mouth',
    curto: 'Boca',
    nome: 'Boca',
    resumo: 'Os dentes trituram e a saliva umedece: nasce o bolo alimentar.',
    acao: 'Mastigar',
    acaoConcluida: 'Mastigar de novo'
  },
  swallow: {
    id: 'swallow',
    curto: 'Garganta',
    nome: 'Garganta e epiglote',
    resumo: 'Ao engolir, a epiglote fecha o caminho do ar e guia o alimento ao esôfago.',
    acao: 'Engolir',
    acaoConcluida: 'Engolir de novo'
  },
  esophagus: {
    id: 'esophagus',
    curto: 'Esôfago',
    nome: 'Esôfago',
    resumo: 'Ondas musculares empurram o alimento para baixo, sem precisar da gravidade.',
    acao: 'Apertar o próximo anel',
    acaoConcluida: 'Repetir as ondas'
  },
  stomach: {
    id: 'stomach',
    curto: 'Estômago',
    nome: 'Estômago',
    resumo: 'Os sucos gástricos misturam tudo e começam a digerir as proteínas.',
    acao: 'Pingar suco gástrico',
    acaoConcluida: 'Misturar de novo'
  },
  small_intestine: {
    id: 'small_intestine',
    curto: 'Delgado',
    nome: 'Intestino delgado',
    resumo: 'As vilosidades absorvem os nutrientes e passam para o sangue.',
    acao: 'Absorver nutriente',
    acaoConcluida: 'Absorver de novo'
  },
  large_intestine: {
    id: 'large_intestine',
    curto: 'Grosso',
    nome: 'Intestino grosso',
    resumo: 'A água volta para o corpo e as fibras ajudam o que sobrou a seguir viagem.',
    acao: 'Reabsorver água',
    acaoConcluida: 'Reabsorver de novo'
  },
  final_ordering: {
    id: 'final_ordering',
    curto: 'Caminho',
    nome: 'O caminho completo',
    resumo: 'Monte a ordem dos órgãos e veja a viagem inteira dentro do corpo.',
    acao: null
  }
};

/** Trilha de progresso: agrupa a mordida e a boca num só passo. */
export const TRILHA: { rotulo: string; etapas: EtapaId[] }[] = [
  { rotulo: 'Escolha', etapas: ['food_select'] },
  { rotulo: 'Boca', etapas: ['first_bite', 'mouth'] },
  { rotulo: 'Garganta', etapas: ['swallow'] },
  { rotulo: 'Esôfago', etapas: ['esophagus'] },
  { rotulo: 'Estômago', etapas: ['stomach'] },
  { rotulo: 'Delgado', etapas: ['small_intestine'] },
  { rotulo: 'Grosso', etapas: ['large_intestine'] },
  { rotulo: 'Caminho', etapas: ['final_ordering'] }
];

export const ORDEM_CORRETA = ['boca', 'esofago', 'estomago', 'delgado', 'grosso'] as const;
export type OrgaoId = (typeof ORDEM_CORRETA)[number];

export const ORGAOS: { id: OrgaoId; rotulo: string }[] = [
  { id: 'boca', rotulo: 'Boca' },
  { id: 'esofago', rotulo: 'Esôfago' },
  { id: 'estomago', rotulo: 'Estômago' },
  { id: 'delgado', rotulo: 'Intestino delgado' },
  { id: 'grosso', rotulo: 'Intestino grosso' }
];

/** Quantas posições da ordem montada batem com a ordem anatômica. */
export function acertosDaOrdem(ordem: (string | null)[]): number {
  return ORDEM_CORRETA.reduce((n, id, i) => n + (ordem[i] === id ? 1 : 0), 0);
}

export function ordemCompleta(ordem: (string | null)[]): boolean {
  return acertosDaOrdem(ordem) === ORDEM_CORRETA.length;
}
