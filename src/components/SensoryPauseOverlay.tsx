/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Espaço de Pausa Sensorial ("Quero uma pausa" / Interromper Atividade)
 * Atende diretamente aos Cuidados Importantes do projeto:
 * - Permitir pausar ou interromper a atividade a qualquer momento.
 * - Ambiente calmo, previsível, sem sons obrigatórios e sem luzes piscantes.
 */

import React, { useEffect } from 'react';
import { CalmVoiceNarrator } from '../utils/audioSystem';
import { Play, Home, HeartHandshake } from 'lucide-react';

interface SensoryPauseOverlayProps {
  isOpen: boolean;
  onResume: () => void;
  onExitToHub: () => void;
}

export const SensoryPauseOverlay: React.FC<SensoryPauseOverlayProps> = ({
  isOpen,
  onResume,
  onExitToHub
}) => {
  useEffect(() => {
    if (isOpen) {
      CalmVoiceNarrator.stop();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#F1F5F9] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
          <HeartHandshake className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            Momento de Pausa Tranquila
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A atividade está pausada e silenciosa. Respire com calma no seu próprio tempo. Você pode voltar quando se sentir confortável ou encerrar por agora.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700">
          Inspire devagar pelo nariz · Solte o ar devagar pela boca
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onResume}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Continuar de onde parei</span>
          </button>

          <button
            onClick={onExitToHub}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Encerrar e ir ao Início</span>
          </button>
        </div>
      </div>
    </div>
  );
};
