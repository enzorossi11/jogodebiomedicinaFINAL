/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROPOSTA 2 — MEU CORPO ESTÁ FALANDO COMIGO
 * Experiência espacial 3D em Three.js com Dock Inferior Retrátil (Zero Oclusão Central),
 * Cartão de Comunicação Alternativa (CAA) sem julgamento e Modo Painel Presencial.
 */

import React, { useState, useEffect } from 'react';
import {
  BodyRegionId,
  SensationId,
  CommunicationActionId,
  BODY_REGIONS_PROPOSTA_2,
  SENSATIONS_PROPOSTA_2,
  COMMUNICATION_ACTIONS_PROPOSTA_2
} from '../data/scriptData';
import { BodyInteroceptionScene3D } from './three/BodyInteroceptionScene3D';
import { calmAudio, CalmVoiceNarrator } from '../utils/audioSystem';
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  RotateCcw,
  HandHelping,
  PauseCircle,
  Compass,
  LayoutGrid,
  X
} from 'lucide-react';

interface Proposta2Props {
  isPaused: boolean;
  lowSensory: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  onRequestSensoryPause: () => void;
}

export const Proposta2Interocepcao: React.FC<Proposta2Props> = ({
  isPaused,
  lowSensory,
  fontSize,
  onRequestSensoryPause
}) => {
  const [selectedRegion, setSelectedRegion] = useState<BodyRegionId | null>(null);
  const [selectedSensation, setSelectedSensation] = useState<SensationId | null>(null);
  const [selectedAction, setSelectedAction] = useState<CommunicationActionId | null>(null);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [cameraResetCount, setCameraResetCount] = useState<number>(0);
  const [showPresencialBoard, setShowPresencialBoard] = useState<boolean>(false);

  const textSizeClass = {
    normal: 'text-xs sm:text-sm',
    large: 'text-sm sm:text-base',
    xlarge: 'text-base sm:text-lg'
  }[fontSize];

  // Atalho de teclado 'H' para recolher/expandir o dock 3D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const regionObj = BODY_REGIONS_PROPOSTA_2.find((r) => r.id === selectedRegion) || null;
  const sensationObj = SENSATIONS_PROPOSTA_2.find((s) => s.id === selectedSensation) || null;
  const actionObj = COMMUNICATION_ACTIONS_PROPOSTA_2.find((a) => a.id === selectedAction) || null;

  const handleSelectRegion = (reg: BodyRegionId) => {
    setSelectedRegion(reg);
    setSelectedAction(null);
    calmAudio.playSoftPlim(480);
  };

  const handleSelectSensation = (sens: SensationId) => {
    setSelectedSensation(sens);
    setSelectedAction(null);
    calmAudio.playSoftPlim(528);
  };

  const handleSelectAction = (act: CommunicationActionId) => {
    setSelectedAction(act);
    calmAudio.playSoftPlim(587.33);
    if (act === 'quero_pausa') {
      onRequestSensoryPause();
    }
  };

  const handleResetChoices = () => {
    setSelectedRegion(null);
    setSelectedSensation(null);
    setSelectedAction(null);
    setCameraResetCount((c) => c + 1);
  };

  const buildReturnSentence = () => {
    const regName = regionObj ? regionObj.label : 'Ainda escolhendo';
    const sensName = sensationObj ? sensationObj.label : 'Ainda escolhendo';
    return `Região: ${regName}. Sensação: ${sensName}. Você pode pedir ajuda, fazer uma pausa ou continuar explorando.`;
  };

  const handleSpeakChoice = () => {
    const base = buildReturnSentence();
    const extra = actionObj ? ` ${actionObj.spokenMessage}` : '';
    CalmVoiceNarrator.speak(`${base}${extra}`);
  };

  return (
    <div className="relative flex-1 w-full min-h-[calc(100vh-64px)] flex flex-col overflow-hidden bg-slate-100">
      {/* 1. CABEÇALHO FLUTUANTE DISCRETO (Sem backdrop-filter sobre WebGL) */}
      <div className="pointer-events-none absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto bg-white/95 border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs">
          <div className="text-[11px] font-medium text-teal-800">
            Proposta 2 · Interocepção e Comunicação 3D
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Meu Corpo Está Falando Comigo
          </h2>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setCameraResetCount((c) => c + 1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Enquadrar corpo inteiro na câmera 3D"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Visão 3D Completa</span>
          </button>

          <button
            onClick={() => setShowPresencialBoard(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Abrir painel de cartões visuais da versão presencial"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Painel de Cartões</span>
          </button>
        </div>
      </div>

      {/* 2. VIEWPORT 3D CENTRAL DESOBSTRUÍDO (85%+ da área livre) */}
      <div className="flex-1 w-full h-full flex flex-col">
        <BodyInteroceptionScene3D
          selectedRegion={selectedRegion}
          selectedSensation={selectedSensation}
          onSelectRegion={handleSelectRegion}
          isPaused={isPaused}
          lowSensory={lowSensory}
          cameraResetTrigger={cameraResetCount}
        />
      </div>

      {/* 3. DOCK INFERIOR RETRÁTIL UNIFICADO (Zero Oclusão Lateral e Sem backdrop-filter) */}
      <div
        className="pointer-events-none fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[min(960px,95vw)] transition-transform duration-200"
        style={{
          transform: dockCollapsed ? 'translate(-50%, calc(100% - 38px))' : 'translate(-50%, 0)'
        }}
      >
        {/* Botão de Recolher / Expandir (Modo Observação Limpa) */}
        <div className="flex justify-center mb-1">
          <button
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-t-xl rounded-b-md bg-slate-900 text-white text-xs font-semibold shadow-sm hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Mostrar Painel de Sensações (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Recolher Painel para Observar em 3D (H)</span>
              </>
            )}
          </button>
        </div>

        {/* Superfície Sólida do Dock (Sem backdrop-filter sobre WebGL) */}
        <div className="pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-lg p-3.5 sm:p-4 space-y-3 max-h-[52vh] overflow-y-auto">
          {/* Etapa 1: Região do Corpo */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-800">
                1. Escolha uma região do seu corpo (no modelo 3D ou abaixo):
              </span>
              {(selectedRegion || selectedSensation) && (
                <button
                  onClick={handleResetChoices}
                  className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Limpar seleção
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {BODY_REGIONS_PROPOSTA_2.map((reg) => {
                const active = selectedRegion === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => handleSelectRegion(reg.id)}
                    className={`px-2.5 py-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-teal-700 border-teal-800 text-white font-bold shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 font-medium'
                    } ${textSizeClass}`}
                  >
                    <span className="block whitespace-nowrap truncate">{reg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Etapa 2: O que você sente? */}
          <div>
            <div className="text-xs font-bold text-slate-800 mb-1.5">
              2. O que você sente? (Não há resposta certa ou errada):
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
              {SENSATIONS_PROPOSTA_2.map((sens) => {
                const active = selectedSensation === sens.id;
                return (
                  <button
                    key={sens.id}
                    onClick={() => handleSelectSensation(sens.id)}
                    className={`px-2.5 py-2 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-1.5 ${
                      active
                        ? `${sens.badgeStyle} font-bold ring-2 ring-teal-600/30`
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 font-medium'
                    }`}
                  >
                    <span className="text-xs truncate">{sens.label}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15"
                      style={{ backgroundColor: sens.hexColor }}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Etapa 3: Mostrar Minha Escolha & Ações de Comunicação */}
          {(selectedRegion || selectedSensation) && (
            <div className="pt-2 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 rounded-xl p-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>3. Minha Escolha</span>
                  <span aria-hidden="true">·</span>
                  <span>Comunicação de Necessidades</span>
                </div>
                <p className={`font-semibold text-slate-900 ${textSizeClass}`}>
                  Região: <span className="text-teal-800">{regionObj?.label ?? 'Não selecionada'}</span>
                  {' · '}
                  Sensação: <span className="text-teal-800">{sensationObj?.label ?? 'Não selecionada'}</span>.
                  {' '}
                  <span className="font-normal text-slate-700">
                    Você pode pedir ajuda, fazer uma pausa ou continuar explorando.
                  </span>
                </p>
                {actionObj && (
                  <p className="text-xs font-medium text-emerald-800 pt-0.5">
                    ✓ {actionObj.supportMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={handleSpeakChoice}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold cursor-pointer whitespace-nowrap"
                  title="Falar escolha em voz calma (opcional)"
                >
                  <Volume2 className="w-3.5 h-3.5 text-teal-700" />
                  <span>Ouvir Escolha</span>
                </button>

                <button
                  onClick={() => handleSelectAction('quero_ajuda')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors ${
                    selectedAction === 'quero_ajuda'
                      ? 'bg-amber-600 border-amber-700 text-white'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                  }`}
                >
                  <HandHelping className="w-3.5 h-3.5" />
                  <span>Quero ajuda</span>
                </button>

                <button
                  onClick={() => handleSelectAction('quero_pausa')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-950 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Quero uma pausa</span>
                </button>

                <button
                  onClick={() => handleSelectAction('continuar_explorando')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors ${
                    selectedAction === 'continuar_explorando'
                      ? 'bg-teal-700 border-teal-800 text-white'
                      : 'bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-950'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Continuar explorando</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL DO PAINEL DE COMUNICAÇÃO PRESENCIAL (Cartões Visuais CAA) */}
      {showPresencialBoard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[88vh] rounded-2xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Painel de Comunicação Alternativa (Versão Presencial & Digital)
                </h3>
                <p className="text-xs text-slate-600">
                  Cartões visuais para indicar regiões, sensações e necessidades mesmo sem usar palavras.
                </p>
              </div>
              <button
                onClick={() => setShowPresencialBoard(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                aria-label="Fechar painel de cartões"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 text-sm">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Cartões de Região do Corpo
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {BODY_REGIONS_PROPOSTA_2.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        handleSelectRegion(r.id);
                        setShowPresencialBoard(false);
                      }}
                      className="p-3 rounded-xl border border-slate-200 hover:border-teal-500 bg-slate-50 text-left cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-slate-900">{r.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{r.shortDesc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Cartões de Sensação Corporal
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {SENSATIONS_PROPOSTA_2.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        handleSelectSensation(s.id);
                        setShowPresencialBoard(false);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${s.badgeStyle}`}
                    >
                      <div className="font-bold">{s.label}</div>
                      <div className="text-xs opacity-85 mt-0.5">{s.shortDesc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Cartões de Ação Direta
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {COMMUNICATION_ACTIONS_PROPOSTA_2.map((act) => (
                    <button
                      key={act.id}
                      onClick={() => {
                        setShowPresencialBoard(false);
                        handleSelectAction(act.id);
                      }}
                      className="p-3.5 rounded-xl border border-teal-300 bg-teal-50/60 hover:bg-teal-50 text-left cursor-pointer"
                    >
                      <div className="font-bold text-teal-950">{act.label}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{act.supportMessage}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
