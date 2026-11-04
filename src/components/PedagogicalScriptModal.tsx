/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modal de Validação Completa do Projeto, Matriz Multidisciplinar,
 * Guia das Versões Presenciais, PDF Oficial e Roteiro Pedagógico.
 * Sem backdrop-filter para compatibilidade de performance sobre cenas WebGL.
 */

import React, { useState } from 'react';
import {
  SCRIPT_ETAPAS,
  SCRIPT_ETAPA_6,
  CUIDADOS_IMPORTANTES_CHECKLIST,
  MATRIZ_MULTIDISCIPLINAR,
  PROJETO_PILARES,
  VOCE_SABIA_POR_ALIMENTO,
  BODY_REGIONS_PROPOSTA_2,
  SENSATIONS_PROPOSTA_2
} from '../data/scriptData';
import {
  X,
  Copy,
  Check,
  BookOpen,
  CheckCircle2,
  Download,
  Layers,
  Users
} from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'validacao' | 'multidisciplinar' | 'presencial' | 'roteiro';

const PDF_ASSET_PATH = '/assets/aistudio/PROJETO_CONHECENDO_MEU_CORPO_POR_58abb34b.pdf';

export const PedagogicalScriptModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('validacao');

  if (!isOpen) return null;

  const fullMarkdownScript = `# PROJETO: CONHECENDO MEU CORPO POR DENTRO
## Educação em Saúde e Ciência para Crianças Neurodivergentes
### Pilares: ${PROJETO_PILARES.join(' · ')}
### Alinhamento Acadêmico: BioDesign Inclusivo — Centro Universitário FMU 2026.2

---

## PROPOSTA 1 — A VIAGEM DO ALIMENTO (SISTEMA DIGESTÓRIO EM THREE.JS HD-2D + ASSETS 16-BIT)
Alimentos validados:
- Maçã: ${VOCE_SABIA_POR_ALIMENTO.maca.texto}
- Pão: ${VOCE_SABIA_POR_ALIMENTO.pao.texto}
- Cenoura: ${VOCE_SABIA_POR_ALIMENTO.cenoura.texto}
- Ovo: ${VOCE_SABIA_POR_ALIMENTO.ovo.texto}

${SCRIPT_ETAPAS.map(
  (etapa) => `### ETAPA ${etapa.id}: ${etapa.nomeDaEtapa.toUpperCase()}
- OBJETIVO_BIOLOGICO: ${etapa.objetivoBiologico}
- INSTRUCAO_DIRETA: "${etapa.instrucaoDireta}"
- NARRACAO_EM_AUDIO: "${etapa.narracaoEmAudio}"
- MECANICA_VISUAL_SUGERIDA: ${etapa.mecanicaVisualSugerida}
- RECOMPENSA_SENSORIAL: ${etapa.recompensaSensorial}
`
).join('\n')}

### ETAPA 6: ${SCRIPT_ETAPA_6.nomeDaEtapa.toUpperCase()}
- INSTRUCAO_DIRETA: "${SCRIPT_ETAPA_6.instrucaoDireta}"
- LOGICA_DE_VALIDACAO: ${SCRIPT_ETAPA_6.logicaDeValidacao}

---

## PROPOSTA 2 — MEU CORPO ESTÁ FALANDO COMIGO (INTEROCEPÇÃO 3D THREE.JS & CAA)
- Regiões corporais: ${BODY_REGIONS_PROPOSTA_2.map((r) => r.label).join(', ')}
- Sensações corporais: ${SENSATIONS_PROPOSTA_2.map((s) => s.label).join(', ')}
- Ações comunicativas: Quero ajuda · Quero uma pausa · Continuar explorando

---

## CHECKLIST DOS 8 CUIDADOS IMPORTANTES VALIDADOS
${CUIDADOS_IMPORTANTES_CHECKLIST.map((c) => `- [x] ${c.regra}: ${c.validacao}`).join('\n')}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMarkdownScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Topo do Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                Validação de Escopo: Conhecendo Meu Corpo Por Dentro
              </h2>
              <p className="text-xs text-slate-600">
                Propostas 1 e 2 · Checklist Neurodivergente · Versão Presencial · BioDesign FMU 2026.2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Roteiro Copiado!' : 'Copiar Documentação'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas de Navegação */}
        <div className="flex overflow-x-auto border-b border-slate-200 px-6 bg-white text-xs font-bold text-slate-600 gap-5">
          <button
            onClick={() => setActiveTab('validacao')}
            className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'validacao'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            1. Checklist de Validação do Escopo
          </button>
          <button
            onClick={() => setActiveTab('multidisciplinar')}
            className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'multidisciplinar'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            2. Saúde, Biomedicina & Engenharia
          </button>
          <button
            onClick={() => setActiveTab('presencial')}
            className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'presencial'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            3. Versão Presencial & PDF Oficial
          </button>
          <button
            onClick={() => setActiveTab('roteiro')}
            className={`py-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'roteiro'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            4. Roteiro Pedagógico Completo
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {activeTab === 'validacao' && (
            <div className="space-y-6">
              {/* Resumo Executivo das 2 Propostas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold text-teal-800">
                    PROPOSTA 1 · VALIDADA EM THREE.JS HD-2D
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    A Viagem do Alimento (Órgãos 3D + 6 Assets 16-Bit)
                  </h3>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• Alimentos em 3D HD-2D: <strong>Maçã</strong> (fibras), <strong>Pão</strong> (amido), <strong>Cenoura</strong> (vitamina A/fibras) e <strong>Ovo</strong> (proteínas).</li>
                    <li>• Jornada 3D completa: Mesa 3D → Mordida com Braço Articulado 3D → Boca → Garganta/Epiglote → Esôfago 16-Bit → Estômago → Intestino Delgado → Intestino Grosso → Sequência no Tronco 3D.</li>
                    <li>• Controles do PDF: <strong>Voltar · Indicadores de progresso · Próximo órgão · Observar sem tocar</strong>.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold text-teal-800">
                    PROPOSTA 2 · VALIDADA E IMPLEMENTADA EM THREE.JS
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Meu Corpo Está Falando Comigo (Estúdio 3D + CAA)
                  </h3>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li>• Escultura 3D interativa com raycasting em <strong>Cabeça, Peito, Barriga, Mãos, Pés</strong> + opção acolhedora <strong>Não sei</strong>.</li>
                    <li>• Sensações validadas: <strong>Confortável, Desconfortável, Quente, Frio, Formigamento, Não sei explicar</strong>.</li>
                    <li>• Retorno literal + ações: <strong>Quero ajuda · Quero uma pausa · Continuar explorando</strong> e Painel de Cartões.</li>
                  </ul>
                </div>
              </div>

              {/* Checklist dos 8 Cuidados Importantes do PDF */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">
                  Auditoria dos 8 Cuidados Importantes (Público Neurodivergente: TEA, TDAH, Dislexia, Deficiência Intelectual)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CUIDADOS_IMPORTANTES_CHECKLIST.map((item) => (
                    <div
                      key={item.regra}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">
                          {item.regra}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {item.validacao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'multidisciplinar' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-teal-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    O que os Alunos de Saúde e Biomedicina Trabalham
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MATRIZ_MULTIDISCIPLINAR.saudeBiomedicina.map((item) => (
                    <div
                      key={item.area}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-1"
                    >
                      <div className="font-bold text-sm text-teal-900">{item.area}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.foco}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    Integração com Engenharia, Tecnologia e Validação em 3 Camadas
                  </h3>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs leading-relaxed">
                  {MATRIZ_MULTIDISCIPLINAR.engenhariaModelagem.map((line, i) => (
                    <p key={i}>• {line}</p>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-200 text-slate-700">
                    <strong>Contexto Institucional FMU 2026.2:</strong> Programa Compartilhe Docência / Level Up — Prof.ª Dra. Raphaela Pascarelli (Processos Biológicos) & Prof. Hercules Ramos (Modelagem e Animação 3D | Inteligência Artificial) — Alinhado aos ODS 3 e ODS 4.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presencial' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Versão Presencial — Proposta 1 (Tabuleiro do Corpo Humano)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Em oficinas presenciais, utiliza-se um tabuleiro ilustrado do tronco humano com os órgãos demarcados. A criança conduz peças físicas de Maçã, Pão ou Ovo ao longo do caminho digestivo (Boca → Esôfago → Estômago → Intestinos) no seu próprio tempo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Versão Presencial — Proposta 2 (Painel Silhueta & Cartões CAA)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Utiliza um painel físico com a silhueta corporal e cartões destacáveis (velcro ou ímã) de regiões, sensações e necessidades ("Quero ajuda", "Quero uma pausa"), permitindo comunicação acolhedora mesmo sem fala oral.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">
                    Documento Oficial de Escopo (PDF Original Integrado)
                  </h4>
                  <a
                    href={PDF_ASSET_PATH}
                    download="PROJETO_CONHECENDO_MEU_CORPO_POR_DENTRO.pdf"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar PDF Oficial</span>
                  </a>
                </div>

                <div className="w-full h-[380px] rounded-xl border border-slate-300 overflow-hidden bg-slate-100">
                  <iframe
                    src={PDF_ASSET_PATH}
                    title="Documento PDF Conhecendo Meu Corpo Por Dentro"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roteiro' && (
            <div className="space-y-4">
              {SCRIPT_ETAPAS.map((etapa) => (
                <div
                  key={etapa.id}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-2"
                >
                  <div className="text-xs font-bold text-teal-800">
                    Etapa {etapa.id} · {etapa.orgao}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{etapa.nomeDaEtapa}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="block text-slate-800 mb-0.5">Objetivo Biológico:</strong>
                      <span>{etapa.objetivoBiologico}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="block text-slate-800 mb-0.5">Instrução Direta:</strong>
                      <span>{etapa.instrucaoDireta}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="block text-slate-800 mb-0.5">Narração Opcional:</strong>
                      <span className="italic">{etapa.narracaoEmAudio}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <strong className="block text-slate-800 mb-0.5">Cuidado Sensorial:</strong>
                      <span>{etapa.mecanicaVisualSugerida}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
