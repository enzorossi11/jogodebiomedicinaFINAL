/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Faixa de Legenda Acolhedora (Closed Caption / Narração Sincronizada)
 * Mostra o texto que o narrador calmo está lendo em tempo real,
 * essencial para crianças com TEA não-verbal, dislexia ou salas de aula silenciosas.
 */

import React, { useEffect, useState } from 'react';
import { CalmVoiceNarrator } from '../utils/audioSystem';
import { Volume2, X } from 'lucide-react';

interface ClosedCaptionBannerProps {
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const ClosedCaptionBanner: React.FC<ClosedCaptionBannerProps> = ({ fontSize }) => {
  const [activeText, setActiveText] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = CalmVoiceNarrator.addListener((speaking, text) => {
      if (speaking && text) {
        setActiveText(text);
        setDismissed(false);
      } else {
        setActiveText(null);
      }
    });
    return unsubscribe;
  }, []);

  if (!activeText || dismissed) {
    return null;
  }

  const textSize = {
    normal: 'text-xs sm:text-sm',
    large: 'text-sm sm:text-base',
    xlarge: 'text-base sm:text-lg'
  }[fontSize];

  return (
    <aside
      aria-label="Legenda de áudio em tempo real"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[92%] sm:w-auto px-4 py-3 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-slate-700/60 backdrop-blur-xs flex items-center gap-3 animate-fade-in"
    >
      <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
        <Volume2 className="w-4 h-4 animate-pulse" />
      </div>
      <p className={`flex-1 font-medium leading-relaxed tracking-wide text-slate-100 ${textSize}`}>
        {activeText}
      </p>
      <button
        onClick={() => {
          setDismissed(true);
          CalmVoiceNarrator.stop();
        }}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        title="Dispensar narração"
        aria-label="Dispensar legenda e pausar voz"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
};

