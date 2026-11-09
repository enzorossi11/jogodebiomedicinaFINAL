/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CONHECENDO MEU CORPO POR DENTRO — Plataforma Educacional Inclusiva
 * Integra integralmente:
 * - Proposta 1: A Viagem do Alimento (Maçã, Pão e Ovo · 16-Bit + Modelo Anatômico 3D Three.js)
 * - Proposta 2: Meu Corpo Está Falando Comigo (Estúdio Espacial 3D Three.js + Comunicação CAA)
 * - Espaço de Pausa Tranquila ("Quero uma pausa") e Validação Científica / Guia Presencial
 */

import { useState, useEffect } from 'react';
import { FoodOption, FOOD_OPTIONS } from './components/FoodSelector';
import { Proposta1Viagem3D, Proposta1Stage } from './components/Proposta1Viagem3D';
import { StageProgressBar, ActiveScreen } from './components/StageProgressBar';
import { Proposta2Interocepcao } from './components/Proposta2Interocepcao';
import { SensoryPauseOverlay } from './components/SensoryPauseOverlay';
import { PedagogicalScriptModal } from './components/PedagogicalScriptModal';
import { ClosedCaptionBanner } from './components/ClosedCaptionBanner';
import { PROJETO_PILARES, CUIDADOS_IMPORTANTES_CHECKLIST } from './data/scriptData';
import { PixelApple, PixelBread, PixelCarrot, PixelEgg } from './components/PixelArtAssets';
import { calmAudio, CalmVoiceNarrator } from './utils/audioSystem';

const STORAGE_PREFS_KEY = 'conhecendo_meu_corpo_prefs_v1';

interface StoredPreferences {
  lowSensory: boolean;
  isMuted: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
}

function getStoredPreferences(): StoredPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        lowSensory: Boolean(parsed.lowSensory),
        isMuted: Boolean(parsed.isMuted),
        fontSize: ['normal', 'large', 'xlarge'].includes(parsed.fontSize) ? parsed.fontSize : 'normal'
      };
    }
  } catch {
    // Ignorado em ambientes restritos de cookies/localStorage
  }
  return { lowSensory: false, isMuted: false, fontSize: 'normal' };
}
import {
  Volume2,
  VolumeX,
  Eye,
  Type,
  FileText,
  PauseCircle,
  ArrowRight,
  Box,
  Utensils,
  CheckCircle2,
  Home
} from 'lucide-react';

type ActiveModule = 'hub' | 'proposta_1' | 'proposta_2';

export default function App() {
  const [initialPrefs] = useState<StoredPreferences>(getStoredPreferences);

  const [activeModule, setActiveModule] = useState<ActiveModule>('hub');
  const [p1Screen, setP1Screen] = useState<Proposta1Stage>('food_select');
  const [selectedFood, setSelectedFood] = useState<FoodOption>(FOOD_OPTIONS[0]); // Maçã

  const [lowSensory, setLowSensory] = useState<boolean>(initialPrefs.lowSensory);
  const [isMuted, setIsMuted] = useState<boolean>(initialPrefs.isMuted);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>(initialPrefs.fontSize);

  const [sensoryPauseOpen, setSensoryPauseOpen] = useState<boolean>(false);
  const [scriptModalOpen, setScriptModalOpen] = useState<boolean>(false);

  // Sincroniza estado de mudo com o CalmMiniAudio na inicialização
  useEffect(() => {
    calmAudio.setMuted(isMuted);
  }, []);

  // Persiste preferências do usuário em localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_PREFS_KEY,
        JSON.stringify({ lowSensory, isMuted, fontSize })
      );
    } catch {
      // Ignora erro de cota ou navegação anônima restritiva
    }
  }, [lowSensory, isMuted, fontSize]);

  // Destravamento silencioso do AudioContext no primeiro toque/clique global
  useEffect(() => {
    const unlock = () => {
      calmAudio.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    calmAudio.setMuted(next);
    if (next) {
      CalmVoiceNarrator.stop();
    }
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  const openProposta1 = (initialScreen: Proposta1Stage = 'food_select') => {
    calmAudio.playSoftPlim(528);
    setActiveModule('proposta_1');
    setP1Screen(initialScreen);
  };

  const openProposta2 = () => {
    calmAudio.playSoftPlim(528);
    setActiveModule('proposta_2');
  };

  const goToHub = () => {
    CalmVoiceNarrator.stop();
    setActiveModule('hub');
  };

  const handleNavigateProgress = (screen: ActiveScreen) => {
    if (screen === 'hub') {
      goToHub();
    } else {
      setP1Screen(screen);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        lowSensory ? 'bg-[#E2E8F0]/60 text-slate-900' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. BARRA SUPERIOR ACESSÍVEL E PREVISÍVEL (Sem backdrop-filter para proteger WebGL) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Identidade Principal */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goToHub}
              className="flex items-center gap-2 text-left cursor-pointer group"
              title="Voltar à página inicial do projeto"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-teal-800 transition-colors">
                CM
              </div>
              <div className="leading-tight">
                <h1 className="font-bold text-xs sm:text-sm md:text-base text-slate-900 whitespace-nowrap">
                  Conhecendo Meu Corpo
                </h1>
                <span className="text-[10px] text-slate-500 hidden lg:block whitespace-nowrap">
                  Educação em Saúde Inclusiva · FMU BioDesign
                </span>
              </div>
            </button>

            {/* Navegação Direta entre Início, Proposta 1 e Proposta 2 */}
            <nav className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                onClick={goToHub}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeModule === 'hub'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Início</span>
              </button>
              <button
                onClick={() => openProposta1(p1Screen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeModule === 'proposta_1'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Proposta 1: Digestão 3D</span>
              </button>
              <button
                onClick={openProposta2}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeModule === 'proposta_2'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>Proposta 2: Corpo 3D</span>
              </button>
            </nav>
          </div>

          {/* Controles Sensoriais e Pausa Acolhedora */}
          <div className="flex items-center gap-1.5">
            {/* Botão Permanente: Quero uma Pausa */}
            <button
              onClick={() => setSensoryPauseOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Pausar ou interromper a atividade em ambiente silencioso"
            >
              <PauseCircle className="w-3.5 h-3.5 text-sky-700" />
              <span>Quero uma pausa</span>
            </button>

            {/* Modo Baixo Estímulo */}
            <button
              onClick={() => setLowSensory(!lowSensory)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                lowSensory
                  ? 'bg-amber-100 text-amber-950 border-amber-400'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Reduzir contraste cromático e estímulos visuais"
              aria-label="Alternar modo de baixo estímulo"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Baixo Estímulo</span>
            </button>

            {/* Tamanho da Fonte */}
            <button
              onClick={cycleFontSize}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Ajustar tamanho do texto"
              aria-label="Ajustar tamanho da fonte"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{fontSize}</span>
            </button>

            {/* Som Opcional / Silêncio Imediato */}
            <button
              onClick={toggleMute}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isMuted
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isMuted ? 'Ativar áudio opcional' : 'Silenciar todos os sons'}
              aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Validação de Escopo & PDF */}
            <button
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Abrir validação completa do escopo, guia presencial e PDF oficial"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Escopo & PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BARRA DE PROGRESSO QUANDO NA PROPOSTA 1 */}
      {activeModule === 'proposta_1' && (
        <StageProgressBar
          currentScreen={p1Screen}
          onNavigateToStage={handleNavigateProgress}
          isPaused={isPaused}
          onTogglePause={togglePause}
          lowSensory={lowSensory}
        />
      )}

      {/* 3. ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col">
        {/* =================================================================
            HUB INICIAL: CONHECENDO MEU CORPO POR DENTRO (PROPOSTAS 1 E 2)
           ================================================================= */}
        {activeModule === 'hub' && (
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 flex-1 flex flex-col justify-between gap-8">
            {/* Cabeçalho Editorial */}
            <div className="max-w-3xl space-y-3">
              <div className="text-xs sm:text-sm font-semibold text-teal-800">
                {PROJETO_PILARES.join(' · ')}
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Conhecendo Meu Corpo Por Dentro
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Educação em saúde e ciência pensada com acolhimento para crianças e adolescentes neurodivergentes. Explore no seu próprio ritmo em cenários 3D interativos, sem pressa, sem sons obrigatórios e sem respostas erradas.
              </p>
            </div>

            {/* As Duas Propostas Oficiais do Projeto (Ambas em Three.js) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Proposta 1 (Three.js HD-2D + 6 Assets 16-Bit) */}
              <div className="bg-white border-2 border-slate-200 hover:border-teal-600 rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors shadow-2xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-teal-800">
                    <span>PROPOSTA 1 · SISTEMA DIGESTÓRIO</span>
                    <span>Three.js HD-2D + Sprites 16-Bit</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">
                      A Viagem do Alimento
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Escolha entre <strong>maçã</strong>, <strong>pão</strong>, <strong>cenoura</strong> ou <strong>ovo</strong> na mesa 3D, veja o braço levar o alimento até a boca e acompanhe em 3D a passagem pelo esôfago, estômago e intestinos.
                    </p>
                  </div>

                  {/* Preview dos 4 Alimentos HD-2D */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    <div className="flex items-center gap-2 bg-rose-50/70 border border-rose-200 rounded-xl px-2.5 py-2">
                      <PixelApple size={28} />
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-slate-900 truncate">Maçã</div>
                        <div className="text-slate-600 text-[11px] truncate">Fibras</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-xl px-2.5 py-2">
                      <PixelBread size={28} />
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-slate-900 truncate">Pão</div>
                        <div className="text-slate-600 text-[11px] truncate">Amido</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50/70 border border-orange-200 rounded-xl px-2.5 py-2">
                      <PixelCarrot size={28} />
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-slate-900 truncate">Cenoura</div>
                        <div className="text-slate-600 text-[11px] truncate">Vitamina A</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-sky-50/70 border border-sky-200 rounded-xl px-2.5 py-2">
                      <PixelEgg size={28} />
                      <div className="text-xs min-w-0">
                        <div className="font-bold text-slate-900 truncate">Ovo</div>
                        <div className="text-slate-600 text-[11px] truncate">Proteínas</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Com modo "Observar sem tocar"
                  </span>
                  <button
                    onClick={() => openProposta1('food_select')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Box className="w-4 h-4" />
                    <span>Explorar Proposta 1 (3D)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Proposta 2 (Three.js) */}
              <div className="bg-white border-2 border-slate-200 hover:border-teal-600 rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-colors shadow-2xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-teal-800">
                    <span>PROPOSTA 2 · INTEROCEPÇÃO & COMUNICAÇÃO</span>
                    <span>Estúdio Espacial Three.js</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Meu Corpo Está Falando Comigo
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Explore um modelo escultural 3D interativo para indicar uma região do corpo (cabeça, peito, barriga, mãos, pés ou "não sei"), reconhecer sensações e comunicar necessidades com tranquilidade.
                    </p>
                  </div>

                  {/* Destaques das Sensações e Ações */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">1. Região 3D</div>
                      <div className="text-slate-600 mt-0.5">Toque no corpo ou botão</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">2. Sensação</div>
                      <div className="text-slate-600 mt-0.5">Sem certo ou errado</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900">3. Expressão</div>
                      <div className="text-slate-600 mt-0.5">Ajuda · Pausa · Explorar</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Inclui Painel de Cartões Presencial
                  </span>
                  <button
                    onClick={openProposta2}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Box className="w-4 h-4" />
                    <span>Explorar Proposta 2 (3D)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Resumo dos Cuidados Importantes Validados */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Compromissos de Acessibilidade e Conforto Sensorial Ativos
                </h3>
                <button
                  onClick={() => setScriptModalOpen(true)}
                  className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                >
                  Ver matriz completa e PDF oficial →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-slate-700">
                {CUIDADOS_IMPORTANTES_CHECKLIST.map((c) => (
                  <div key={c.regra} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium">{c.regra}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            PROPOSTA 1: A VIAGEM DO ALIMENTO (ESTÚDIO 3D HD-2D THREE.JS)
           ================================================================= */}
        {activeModule === 'proposta_1' && (
          <Proposta1Viagem3D
            currentStage={p1Screen}
            onChangeStage={(next) => setP1Screen(next)}
            selectedFood={selectedFood}
            onSelectFood={(food) => setSelectedFood(food)}
            isPaused={isPaused}
            lowSensory={lowSensory}
            fontSize={fontSize}
            onBackToHub={goToHub}
            onGoToProposta2={openProposta2}
            onOpenScript={() => setScriptModalOpen(true)}
          />
        )}

        {/* =================================================================
            PROPOSTA 2: MEU CORPO ESTÁ FALANDO COMIGO (ESTÚDIO 3D THREE.JS)
           ================================================================= */}
        {activeModule === 'proposta_2' && (
          <Proposta2Interocepcao
            isPaused={isPaused}
            lowSensory={lowSensory}
            fontSize={fontSize}
            onRequestSensoryPause={() => setSensoryPauseOpen(true)}
          />
        )}
      </main>

      {/* 4. RODAPÉ DISCRETO (Exibido apenas no Hub para preservar 100% da área espacial 3D nas Propostas 1 e 2) */}
      {activeModule === 'hub' && (
        <footer className="border-t border-slate-200 bg-white py-2.5 px-4 text-xs text-slate-600">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Conhecendo Meu Corpo Por Dentro · Educação em Saúde Inclusiva (TEA, TDAH, TOC, Dislexia)
            </span>
            <div className="flex items-center gap-3 font-semibold text-teal-800">
              <button
                onClick={() => openProposta1('food_select')}
                className="hover:underline cursor-pointer"
              >
                Proposta 1 (Digestão 3D)
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={openProposta2}
                className="hover:underline cursor-pointer"
              >
                Proposta 2 (Corpo 3D)
              </button>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setScriptModalOpen(true)}
                className="hover:underline cursor-pointer"
              >
                Validação & PDF
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* 5. OVERLAY DE PAUSA SENSORIAL TRANQUILA */}
      <SensoryPauseOverlay
        isOpen={sensoryPauseOpen}
        onResume={() => setSensoryPauseOpen(false)}
        onExitToHub={() => {
          setSensoryPauseOpen(false);
          goToHub();
        }}
      />

      {/* 6. MODAL DE VALIDAÇÃO DE ESCOPO, VERSÃO PRESENCIAL E PDF OFICIAL */}
      <PedagogicalScriptModal
        isOpen={scriptModalOpen}
        onClose={() => setScriptModalOpen(false)}
      />

      {/* 7. FAIXA DE LEGENDA ACOLHEDORA EM TEMPO REAL (CLOSED CAPTION) */}
      <ClosedCaptionBanner fontSize={fontSize} />
    </div>
  );
}
