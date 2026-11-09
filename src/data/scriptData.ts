/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Base Científica, Pedagógica e de Acessibilidade Validada
 * Projeto: "Conhecendo Meu Corpo Por Dentro" & BioDesign Inclusivo (FMU 2026.2)
 * Proposta 1: A Viagem do Alimento (Three.js HD-2D: Órgãos 3D + Assets 16-Bit Recortados)
 * Proposta 2: Meu Corpo Está Falando Comigo (Interocepção 3D Three.js + CAA)
 */

export interface ScriptStage {
  id: number;
  key: 'mouth' | 'esophagus' | 'stomach' | 'small_intestine' | 'large_intestine';
  nomeDaEtapa: string;
  orgao: string;
  objetivoBiologico: string;
  instrucaoDireta: string;
  narracaoEmAudio: string;
  mecanicaVisualSugerida: string;
  recompensaSensorial: string;
  detalheBiologico: string;
  passosInterativos: string[];
}

export interface ScriptFinalActivity {
  id: 6;
  nomeDaEtapa: string;
  instrucaoDireta: string;
  narracaoEmAudio: string;
  logicaDeValidacao: string;
}

export type BodyRegionId = 'cabeca' | 'peito' | 'barriga' | 'maos' | 'pes' | 'nao_sei';

export type SensationId =
  | 'confortavel'
  | 'desconfortavel'
  | 'quente'
  | 'frio'
  | 'formigamento'
  | 'nao_sei_explicar';

export type CommunicationActionId = 'quero_ajuda' | 'quero_pausa' | 'continuar_explorando';

export interface BodyRegionSpec {
  id: BodyRegionId;
  label: string;
  shortDesc: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}

export interface SensationSpec {
  id: SensationId;
  label: string;
  shortDesc: string;
  hexColor: string;
  emissiveHex: string;
  badgeStyle: string;
  symbolText: string;
}

export interface CommunicationActionSpec {
  id: CommunicationActionId;
  label: string;
  supportMessage: string;
  spokenMessage: string;
}

export const PROJETO_PILARES = [
  'Aprender sobre o corpo',
  'Reconhecer sensações',
  'Comunicar necessidades'
];

export const VOCE_SABIA_POR_ALIMENTO: Record<
  string,
  { titulo: string; texto: string; focoOrgao: string }
> = {
  maca: {
    titulo: 'Você sabia?',
    texto: 'A maçã tem fibras, que ajudam o intestino a funcionar melhor e mantêm o caminho digestivo saudável.',
    focoOrgao: 'Intestino delgado e intestino grosso'
  },
  pao: {
    titulo: 'Você sabia?',
    texto: 'O pão fatiado é rico em amido. A digestão do amido começa logo na boca, com a ajuda da saliva durante a mastigação.',
    focoOrgao: 'Boca (saliva e amilase)'
  },
  cenoura: {
    titulo: 'Você sabia?',
    texto: 'A cenoura é crocante, rica em fibras e betacaroteno (vitamina A). Mastigá-la bem na boca facilita a absorção dos nutrientes no intestino.',
    focoOrgao: 'Boca (mastigação) e intestino delgado'
  },
  ovo: {
    titulo: 'Você sabia?',
    texto: 'O ovo é rico em proteínas, que fortalecem o corpo. A digestão das proteínas começa no estômago com os sucos gástricos.',
    focoOrgao: 'Estômago (sucos gástricos)'
  }
};

export const SCRIPT_ETAPAS: ScriptStage[] = [
  {
    id: 1,
    key: 'mouth',
    nomeDaEtapa: 'Boca 3D (Mastigação e Saliva 16-Bit)',
    orgao: 'Boca',
    objetivoBiologico:
      'Começa a mastigação que tritura o alimento. A saliva umedece o alimento e inicia a digestão do amido.',
    instrucaoDireta:
      'Toque na boca 3D ou no botão Mastigar (5 vezes) para triturar o alimento enquanto a saliva o umedece automaticamente.',
    narracaoEmAudio:
      'Na boca começa a mastigação. A cada mastigada, os dentes trituram o alimento em partes pequenas e a saliva vai sendo liberada para umedecer tudo e formar o bolo alimentar.',
    mecanicaVisualSugerida:
      'Cavidade bucal 3D clara em Three.js com o sprite 16-bit recortado do alimento e gotas de saliva 16-bit nítidas.',
    recompensaSensorial:
      'Som opcional suave em 528 Hz e formação tranquila do bolo alimentar 3D sem flashes.',
    detalheBiologico:
      'A enzima amilase salivar inicia a quebra química do amido ainda na cavidade bucal.',
    passosInterativos: [
      'Triturar o alimento em pedaços menores',
      'Umedecer com a gota de saliva 16-bit',
      'Formar o bolo alimentar macio'
    ]
  },
  {
    id: 2,
    key: 'esophagus',
    nomeDaEtapa: 'Esôfago 3D (Peristaltismo Muscular 16-Bit)',
    orgao: 'Esôfago',
    objetivoBiologico:
      'Após passar pela garganta com proteção da epiglote, o esôfago conduz o alimento com ondas musculares suaves até o estômago.',
    instrucaoDireta:
      'Toque nos 3 anéis musculares do túnel 3D do esôfago para conduzir o alimento até o estômago, ou apenas observe.',
    narracaoEmAudio:
      'O alimento desce pelo esôfago. As paredes musculares se contraem em ondas calmas e levam o alimento com segurança até o estômago.',
    mecanicaVisualSugerida:
      'Túnel muscular 3D texturizado com o ambiente interno 16-bit do esôfago acompanhado da referência anatômica 16-bit recortada.',
    recompensaSensorial:
      'Tom grave suave opcional e iluminação serena indicando caminho concluído.',
    detalheBiologico:
      'O peristaltismo conduz o bolo alimentar de forma coordenada da faringe até o cárdia estomacal.',
    passosInterativos: [
      'Contrair anel muscular superior',
      'Contrair anel muscular médio',
      'Contrair anel muscular inferior'
    ]
  },
  {
    id: 3,
    key: 'stomach',
    nomeDaEtapa: 'Estômago 3D (Sucos Gástricos e Proteínas)',
    orgao: 'Estômago',
    objetivoBiologico:
      'O alimento é misturado aos sucos gástricos. A digestão das proteínas começa aqui, formando uma mistura líquida chamada quimo.',
    instrucaoDireta:
      'Toque nas 3 gotas 16-bit de suco gástrico na cena 3D ou no painel para misturar o alimento, ou use Observar sem tocar.',
    narracaoEmAudio:
      'No estômago, o alimento é misturado aos sucos gástricos. A digestão das proteínas começa aqui, deixando o alimento bem macio e líquido.',
    mecanicaVisualSugerida:
      'Câmara estomacal 3D translúcida com gotas 16-bit recortadas e nível suave de quimo sem fumaça ou cores agressivas.',
    recompensaSensorial:
      'Som opcional de gota d’água calma e transição gradual para o quimo.',
    detalheBiologico:
      'A pepsina ativada pelo meio ácido inicia a hidrólise das cadeias proteicas (como as do ovo).',
    passosInterativos: [
      'Liberar primeira gota de suco gástrico',
      'Liberar enzimas para digerir proteínas',
      'Misturar suavemente formando o quimo'
    ]
  },
  {
    id: 4,
    key: 'small_intestine',
    nomeDaEtapa: 'Intestino Delgado 3D (Absorção de Nutrientes)',
    orgao: 'Intestino Delgado',
    objetivoBiologico:
      'A digestão continua e a maior parte dos nutrientes é absorvida pelas vilosidades para levar energia e saúde ao corpo.',
    instrucaoDireta:
      'Toque nos nutrientes luminosos 3D ou nos botões para que as vilosidades os absorvam para o sangue.',
    narracaoEmAudio:
      'No intestino delgado, a digestão continua e a maior parte dos nutrientes é absorvida. Assim o corpo aproveita os alimentos e ganha energia.',
    mecanicaVisualSugerida:
      'Canal 3D com vilosidades suaves (InstancedMesh) e três esferas nutritivas claramente identificadas.',
    recompensaSensorial:
      'Acorde pentatônico opcional suave e passagem calma dos nutrientes para o vaso sanguíneo 3D.',
    detalheBiologico:
      'As vilosidades intestinais transferem glicose, aminoácidos, vitaminas e minerais para a circulação.',
    passosInterativos: [
      'Absorver carboidratos (energia)',
      'Absorver proteínas (aminoácidos)',
      'Absorver vitaminas e minerais'
    ]
  },
  {
    id: 5,
    key: 'large_intestine',
    nomeDaEtapa: 'Intestino Grosso 3D (Água, Fibras e Eliminação)',
    orgao: 'Intestino Grosso',
    objetivoBiologico:
      'O corpo absorve água para se manter hidratado, e os resíduos com fibras seguem naturalmente para a eliminação.',
    instrucaoDireta:
      'Toque nas 3 gotas de água 16-bit no cólon 3D para o corpo absorvê-las e concluir o trajeto digestivo.',
    narracaoEmAudio:
      'No intestino grosso, o corpo absorve a água de que precisa. As fibras ajudam o intestino a funcionar melhor, e os resíduos seguem para a eliminação.',
    mecanicaVisualSugerida:
      'Moldura 3D serena do intestino grosso com gotas de água 16-bit recortadas sendo reabsorvidas sem imagens aversivas.',
    recompensaSensorial:
      'Som sereno opcional de gota d’água e confirmação visual tranquila.',
    detalheBiologico:
      'A absorção hídrica e o trânsito das fibras alimentares (como na maçã e na cenoura) regulam o funcionamento saudável.',
    passosInterativos: [
      'Reabsorver água para hidratar o corpo',
      'Aproveitar o auxílio das fibras alimentares',
      'Encaminhar os resíduos para eliminação'
    ]
  }
];

export const SCRIPT_ETAPA_6: ScriptFinalActivity = {
  id: 6,
  nomeDaEtapa: 'Diorama 3D — Sequência do Caminho Digestório',
  instrucaoDireta:
    'Organize os 5 órgãos no diorama 3D: Boca → Esôfago → Estômago → Intestino delgado → Intestino grosso, ou use Observar sem tocar.',
  narracaoEmAudio:
    'Vamos revisar o caminho completo do alimento pelo corpo em 3D, começando pela boca até o intestino grosso. Você pode organizar no seu ritmo ou tocar em Observar sem tocar.',
  logicaDeValidacao:
    'Sem certo ou errado punitivo: se a criança escolher outra posição, o sistema destaca suavemente o espaço correspondente com contorno estático verde-menta (sem luzes piscantes e sem som de erro) e ilumina cada órgão no modelo 3D.'
};

export const BODY_REGIONS_PROPOSTA_2: BodyRegionSpec[] = [
  {
    id: 'cabeca',
    label: 'Cabeça',
    shortDesc: 'Rosto, testa, ouvidos e pensamentos',
    cameraPos: [0, 1.58, 1.85],
    cameraTarget: [0, 1.52, 0]
  },
  {
    id: 'peito',
    label: 'Peito',
    shortDesc: 'Respiração e batimentos do coração',
    cameraPos: [0, 1.18, 2.05],
    cameraTarget: [0, 1.12, 0]
  },
  {
    id: 'barriga',
    label: 'Barriga',
    shortDesc: 'Fome, saciedade e digestão',
    cameraPos: [0, 0.85, 2.05],
    cameraTarget: [0, 0.82, 0]
  },
  {
    id: 'maos',
    label: 'Mãos',
    shortDesc: 'Toque, dedos, palmas e movimento',
    cameraPos: [0, 0.92, 2.35],
    cameraTarget: [0, 0.85, 0]
  },
  {
    id: 'pes',
    label: 'Pés',
    shortDesc: 'Apoio no chão, dedos dos pés e equilíbrio',
    cameraPos: [0, 0.35, 2.15],
    cameraTarget: [0, 0.16, 0]
  },
  {
    id: 'nao_sei',
    label: 'Não sei',
    shortDesc: 'Quando não consigo localizar onde está a sensação',
    cameraPos: [0, 1.0, 3.25],
    cameraTarget: [0, 0.9, 0]
  }
];

export const SENSATIONS_PROPOSTA_2: SensationSpec[] = [
  {
    id: 'confortavel',
    label: 'Confortável',
    shortDesc: 'Sensação calma, tranquila e agradável',
    hexColor: '#10B981',
    emissiveHex: '#059669',
    badgeStyle: 'border-emerald-400 bg-emerald-50 text-emerald-950',
    symbolText: 'Calmo'
  },
  {
    id: 'desconfortavel',
    label: 'Desconfortável',
    shortDesc: 'Algo incomoda, aperta ou dói um pouco',
    hexColor: '#F97316',
    emissiveHex: '#EA580C',
    badgeStyle: 'border-orange-400 bg-orange-50 text-orange-950',
    symbolText: 'Incômodo'
  },
  {
    id: 'quente',
    label: 'Quente',
    shortDesc: 'Sensação de calor na região',
    hexColor: '#F59E0B',
    emissiveHex: '#D97706',
    badgeStyle: 'border-amber-400 bg-amber-50 text-amber-950',
    symbolText: 'Calor'
  },
  {
    id: 'frio',
    label: 'Frio',
    shortDesc: 'Sensação gelada ou de arrepio frio',
    hexColor: '#0EA5E9',
    emissiveHex: '#0284C7',
    badgeStyle: 'border-sky-400 bg-sky-50 text-sky-950',
    symbolText: 'Gelado'
  },
  {
    id: 'formigamento',
    label: 'Formigamento',
    shortDesc: 'Pequenas cosquinhas ou vibração suave',
    hexColor: '#8B5CF6',
    emissiveHex: '#7C3AED',
    badgeStyle: 'border-violet-400 bg-violet-50 text-violet-950',
    symbolText: 'Vibrando'
  },
  {
    id: 'nao_sei_explicar',
    label: 'Não sei explicar',
    shortDesc: 'Sinto algo diferente, mas sem nome exato',
    hexColor: '#64748B',
    emissiveHex: '#475569',
    badgeStyle: 'border-slate-400 bg-slate-100 text-slate-900',
    symbolText: 'Indefinido'
  }
];

export const COMMUNICATION_ACTIONS_PROPOSTA_2: CommunicationActionSpec[] = [
  {
    id: 'quero_ajuda',
    label: 'Quero ajuda',
    supportMessage:
      'Mostre esta tela para um adulto, professor ou cuidador. Você pediu apoio com tranquilidade.',
    spokenMessage: 'Preciso de ajuda, por favor.'
  },
  {
    id: 'quero_pausa',
    label: 'Quero uma pausa',
    supportMessage:
      'Tudo bem parar um pouco. Vamos abrir um espaço calmo e silencioso para você descansar.',
    spokenMessage: 'Eu quero fazer uma pausa agora.'
  },
  {
    id: 'continuar_explorando',
    label: 'Continuar explorando',
    supportMessage:
      'Ótimo! Você pode continuar observando e explorando o corpo no seu próprio ritmo.',
    spokenMessage: 'Quero continuar explorando no meu ritmo.'
  }
];

export const CUIDADOS_IMPORTANTES_CHECKLIST = [
  {
    regra: 'Sem sons obrigatórios',
    validacao:
      'A experiência 3D HD-2D funciona 100% visualmente; áudio é opcional e possui botão imediato de silêncio.'
  },
  {
    regra: 'Sem luzes piscantes',
    validacao:
      'Zero animações estroboscópicas, flashes ou pontos pulsantes em toda a interface e nas cenas Three.js.'
  },
  {
    regra: 'Participação voluntária',
    validacao:
      'Botões Voltar e Próximo órgão estão sempre liberados em todas as estações 3D, sem bloquear etapas.'
  },
  {
    regra: 'Sem certo ou errado',
    validacao:
      'A criança nunca é julgada ou punida por sua resposta nas sensações nem na ordenação digestiva 3D.'
  },
  {
    regra: 'A criança pode observar sem tocar',
    validacao:
      'Botão dedicado "Observar sem tocar" executa suavemente cada animação 3D sem exigir cliques nos objetos.'
  },
  {
    regra: 'Permitir pausar ou interromper a atividade',
    validacao:
      'Botão permanente "Quero uma pausa" abre tela de descanso calmo e permite interromper quando quiser.'
  },
  {
    regra: 'Manter ambiente calmo e previsível',
    validacao:
      'Câmera amortecida sem cortes bruscos, dock inferior retrátil limpo e modo Baixo Estímulo.'
  },
  {
    regra: 'Respeitar as diferenças individuais',
    validacao:
      'Opções "Não sei" e "Não sei explicar" validadas, ajuste de fonte e comunicação alternativa por cartões.'
  }
];

export const MATRIZ_MULTIDISCIPLINAR = {
  saudeBiomedicina: [
    {
      area: 'Anatomia',
      foco: 'Onde ficam os órgãos do sistema digestório em 3D e as regiões externas do corpo.'
    },
    {
      area: 'Fisiologia',
      foco: 'Como os órgãos funcionam em conjunto da mastigação até a absorção de água.'
    },
    {
      area: 'Bioquímica',
      foco: 'Transformação de amido (pão), proteínas (ovo), betacaroteno (cenoura) e papel das fibras (maçã).'
    },
    {
      area: 'Neurociência',
      foco: 'Interocepção: como o cérebro percebe e interpreta sinais internos do corpo.'
    },
    {
      area: 'Educação em Saúde',
      foco: 'Autocuidado, relação entre alimentos e energia e comunicação de necessidades.'
    }
  ],
  engenhariaModelagem: [
    'Arquitetura espacial Three.js HD-2D unindo órgãos 3D PBR e assets autorais 16-bit com recorte alfa automático.',
    'Integração conceitual com painéis físicos e peças manipulativas para a Versão Presencial.',
    'Controles previsíveis em dock retrátil (Voltar, Indicadores de progresso, Próximo órgão, Observar sem tocar e Pausa).',
    'Validação em três camadas: científica, usabilidade/carga sensorial e aplicação institucional.'
  ]
};
