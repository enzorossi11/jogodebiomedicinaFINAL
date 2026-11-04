/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Barra de Progresso em Trilha Suave com Ícones de Cada Órgão
 * Sem números de contagem regressiva, sem pontos piscantes, com alternância
 * para Visão Anatômica 3D (Three.js) e controle de Pausa.
 */

import React from 'react';
import { OrganMiniIcons } from './PixelArtAssets';
import { Pause, Play } from 'lucide-react';

export type ActiveScreen =
  | 'hub'
  | 'food_select'
  | 'first_bite'
  | 'mouth'
  | 'swallow'
  | 'esophagus'
  | 'stomach'
  | 'small_intestine'
  | 'large_intestine'
  | 'final_ordering';

interface StageProgressBarProps {
  currentScreen: ActiveScreen;
  onNavigateToStage: (screen: ActiveScreen) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  lowSensory: boolean;
}

interface StepNode {
  id: string;
  screenTarget: ActiveScreen;
  label: string;
  organName: string;
  icon: React.ReactNode;
}

const STEPS: StepNode[] = [
  {
    id: 'food',
    screenTarget: 'food_select',
    label: 'Escolha',
    organName: 'Mesa 3D de Alimentos',
    icon: OrganMiniIcons.food
  },
  {
    id: 'bite',
    screenTarget: 'first_bite',
    label: 'Mordida',
    organName: 'Braço 3D e 1ª Mordida',
    icon: OrganMiniIcons.food
  },
  {
    id: 'mouth',
    screenTarget: 'mouth',
    label: 'Boca',
    organName: 'Mastigação e Saliva',
    icon: OrganMiniIcons.mouth
  },
  {
    id: 'throat',
    screenTarget: 'swallow',
    label: 'Garganta',
    organName: 'Deglutição Segura',
    icon: OrganMiniIcons.throat
  },
  {
    id: 'esophagus',
    screenTarget: 'esophagus',
    label: 'Esôfago',
    organName: 'Túnel Muscular 16-Bit',
    icon: OrganMiniIcons.esophagus
  },
  {
    id: 'stomach',
    screenTarget: 'stomach',
    label: 'Estômago',
    organName: 'Sucos Gástricos',
    icon: OrganMiniIcons.stomach
  },
  {
    id: 'small_int',
    screenTarget: 'small_intestine',
    label: 'Int. Delgado',
    organName: 'Absorção de Nutrientes',
    icon: OrganMiniIcons.smallIntestine
  },
  {
    id: 'large_int',
    screenTarget: 'large_intestine',
    label: 'Int. Grosso',
    organName: 'Reabsorção de Água',
    icon: OrganMiniIcons.largeIntestine
  },
  {
    id: 'ordering',
    screenTarget: 'final_ordering',
    label: 'Sequência',
    organName: 'Tronco 3D Completo',
    icon: OrganMiniIcons.ordering
  }
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentScreen,
  onNavigateToStage,
  isPaused,
  onTogglePause,
  lowSensory
}) => {
  if (currentScreen === 'hub') return null;

  const activeIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.screenTarget === currentScreen)
  );
  const currentStepInfo = STEPS[activeIdx] || STEPS[0];

  return (
    <div
      className={`border-b border-slate-200 px-4 py-1.5 transition-colors ${
        lowSensory ? 'bg-slate-100' : 'bg-white'
      }`}
      aria-label="Indicadores de progresso 3D do sistema digestório"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Localização atual como texto limpo (Zero cápsulas estáticas ou pontos piscantes) */}
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-slate-900">{currentStepInfo.label}</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span>{currentStepInfo.organName}</span>
        </div>

        {/* Trilha de Órgãos Clicável (Navegação Livre) */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onNavigateToStage(step.screenTarget)}
                  title={`${step.label}: ${step.organName}`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isCurrent
                      ? 'bg-teal-50 border-teal-700 text-teal-950 font-bold'
                      : isCompleted
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    {step.icon}
                  </span>
                  <span className="hidden xl:inline text-[11px]">{step.label}</span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-1.5 sm:w-2.5 shrink-0 ${
                      idx < activeIdx ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Controle de Pausa de Animação 3D */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isPaused
                ? 'bg-amber-100 text-amber-950 border-amber-400'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title={isPaused ? 'Retomar animações 3D' : 'Pausar animações 3D'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Retomar' : 'Pausar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
