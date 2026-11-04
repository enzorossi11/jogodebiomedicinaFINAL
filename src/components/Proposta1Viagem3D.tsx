/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROPOSTA 1 — A VIAGEM DO ALIMENTO (ESTÚDIO ESPACIAL 3D HD-2D EM THREE.JS)
 * Orquestra todas as 9 estações 3D (Escolha do Alimento, Mordida com Braço Articulado 3D,
 * Boca, Garganta/Epiglote, Esôfago 16-Bit, Estômago, Intestino Delgado, Intestino Grosso
 * e Sequência Final no Tronco Translúcido) com Dock Inferior Retrátil, Modo "Observar sem tocar"
 * e navegação 100% livre sem bloqueios punitivos.
 */

import React, { useState, useEffect } from 'react';
import { FoodId, FoodOption, FOOD_OPTIONS } from './FoodSelector';
import { ActiveScreen } from './StageProgressBar';
import { Proposta1HD2DScene3D, Bite3DPhase } from './three/Proposta1HD2DScene3D';
import {
  PixelApple,
  PixelBread,
  PixelCarrot,
  PixelEgg,
  PixelDrop,
  PixelEsophagusThumb
} from './PixelArtAssets';
import {
  SCRIPT_ETAPAS,
  SCRIPT_ETAPA_6,
  VOCE_SABIA_POR_ALIMENTO
} from '../data/scriptData';
import { calmAudio, CalmVoiceNarrator } from '../utils/audioSystem';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Box,
  FileText
} from 'lucide-react';

export type Proposta1Stage = Exclude<ActiveScreen, 'hub'>;

const STAGE_SEQUENCE: Proposta1Stage[] = [
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

const CORRECT_ORGAN_ORDER = ['boca', 'esofago', 'estomago', 'delgado', 'grosso'] as const;

const ORGAN_CHOICES: Array<{ id: (typeof CORRECT_ORGAN_ORDER)[number]; label: string }> = [
  { id: 'boca', label: 'Boca' },
  { id: 'esofago', label: 'Esôfago' },
  { id: 'estomago', label: 'Estômago' },
  { id: 'delgado', label: 'Int. Delgado' },
  { id: 'grosso', label: 'Int. Grosso' }
];

interface Proposta1Viagem3DProps {
  currentStage: Proposta1Stage;
  onChangeStage: (next: Proposta1Stage) => void;
  selectedFood: FoodOption;
  onSelectFood: (food: FoodOption) => void;
  isPaused: boolean;
  lowSensory: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  onBackToHub: () => void;
  onGoToProposta2: () => void;
  onOpenScript: () => void;
}

export const Proposta1Viagem3D: React.FC<Proposta1Viagem3DProps> = ({
  currentStage,
  onChangeStage,
  selectedFood,
  onSelectFood,
  isPaused,
  lowSensory,
  fontSize,
  onBackToHub,
  onGoToProposta2,
  onOpenScript
}) => {
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [cameraResetCount, setCameraResetCount] = useState<number>(0);
  const [autoObserveActive, setAutoObserveActive] = useState<boolean>(false);

  // Estados sincronizados das 9 estações 3D
  const [bitePhase, setBitePhase] = useState<Bite3DPhase>('idle');
  const [chewCount, setChewCount] = useState<number>(0);
  const [salivaAdded, setSalivaAdded] = useState<boolean>(false);
  const [swallowed, setSwallowed] = useState<boolean>(false);
  const [throatProgress, setThroatProgress] = useState<number>(0);
  const [esoRingStep, setEsoRingStep] = useState<number>(0);
  const [gastricDrops, setGastricDrops] = useState<boolean[]>([false, false, false]);
  const [nutrientsAbsorbed, setNutrientsAbsorbed] = useState<boolean[]>([false, false, false]);
  const [waterDropsAbsorbed, setWaterDropsAbsorbed] = useState<boolean[]>([false, false, false]);
  const [orderedOrganIds, setOrderedOrganIds] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
    null
  ]);

  const textSizeClass = {
    normal: 'text-xs sm:text-sm',
    large: 'text-sm sm:text-base',
    xlarge: 'text-base sm:text-lg'
  }[fontSize];

  // Atalho 'H' para recolher/expandir o painel inferior
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Desativa modo automático ao mudar manualmente de etapa
  useEffect(() => {
    setAutoObserveActive(false);
  }, [currentStage]);

  // Reinicia estados da jornada ao trocar de alimento na seleção
  const handleChooseFood = (food: FoodOption) => {
    onSelectFood(food);
    calmAudio.playSoftPlim(480);
    setBitePhase('idle');
    setChewCount(0);
    setSalivaAdded(false);
    setSwallowed(false);
    setThroatProgress(0);
    setEsoRingStep(0);
    setGastricDrops([false, false, false]);
    setNutrientsAbsorbed([false, false, false]);
    setWaterDropsAbsorbed([false, false, false]);
    setOrderedOrganIds([null, null, null, null, null]);
  };

  const handleSelectFoodById3D = (id: FoodId) => {
    const found = FOOD_OPTIONS.find((f) => f.id === id);
    if (found) {
      handleChooseFood(found);
    }
  };

  // Cinemática passo a passo da primeira mordida 3D (respeitando isPaused)
  useEffect(() => {
    if (isPaused) return;
    if (bitePhase === 'idle' || bitePhase === 'completed') return;

    const sequenceMap: Record<Exclude<Bite3DPhase, 'idle' | 'completed'>, Bite3DPhase> = {
      reaching: 'holding',
      holding: 'bringing_to_mouth',
      bringing_to_mouth: 'biting',
      biting: 'completed'
    };

    const timer = window.setTimeout(() => {
      const next = sequenceMap[bitePhase];
      setBitePhase(next);
      if (next === 'biting') {
        calmAudio.playSoftCrunch();
      } else if (next === 'completed') {
        calmAudio.playSereneCompletion();
      } else {
        calmAudio.playSoftPlim(460);
      }
    }, 1050);

    return () => window.clearTimeout(timer);
  }, [bitePhase, isPaused]);

  // Progresso suave da deglutição 3D na garganta/epiglote (respeitando isPaused)
  useEffect(() => {
    if (!swallowed || isPaused || throatProgress >= 100) return;

    const timer = window.setInterval(() => {
      setThroatProgress((prev) => {
        const next = Math.min(100, prev + 4);
        if (next === 100) {
          calmAudio.playSereneCompletion();
        }
        return next;
      });
    }, 85);

    return () => window.clearInterval(timer);
  }, [swallowed, isPaused, throatProgress]);

  // Modo "Observar sem tocar": executa calmamente a etapa atual sem exigir cliques
  useEffect(() => {
    if (!autoObserveActive || isPaused) return;

    const timer = window.setTimeout(() => {
      if (currentStage === 'food_select') {
        onChangeStage('first_bite');
        return;
      }

      if (currentStage === 'first_bite') {
        if (bitePhase === 'idle') {
          setBitePhase('reaching');
        } else if (bitePhase === 'completed') {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'mouth') {
        if (chewCount < 3) {
          calmAudio.playSoftCrunch();
          setChewCount((c) => Math.min(3, c + 1));
        } else if (!salivaAdded) {
          calmAudio.playSereneCompletion();
          setSalivaAdded(true);
          setAutoObserveActive(false);
        } else {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'swallow') {
        if (!swallowed) {
          calmAudio.playGentleSquish();
          setSwallowed(true);
        } else if (throatProgress >= 100) {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'esophagus') {
        if (esoRingStep < 3) {
          calmAudio.playGentleSquish();
          const next = esoRingStep + 1;
          setEsoRingStep(next);
          if (next === 3) {
            calmAudio.playSereneCompletion();
            setAutoObserveActive(false);
          }
        } else {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'stomach') {
        const nextIdx = gastricDrops.findIndex((d) => !d);
        if (nextIdx !== -1) {
          calmAudio.playSoftPlim(480 + nextIdx * 40);
          setGastricDrops((prev) => {
            const copy = [...prev];
            copy[nextIdx] = true;
            if (copy.every(Boolean)) calmAudio.playSereneCompletion();
            return copy;
          });
        } else {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'small_intestine') {
        const nextIdx = nutrientsAbsorbed.findIndex((n) => !n);
        if (nextIdx !== -1) {
          calmAudio.playSoftPlim(500 + nextIdx * 45);
          setNutrientsAbsorbed((prev) => {
            const copy = [...prev];
            copy[nextIdx] = true;
            if (copy.every(Boolean)) calmAudio.playSereneCompletion();
            return copy;
          });
        } else {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'large_intestine') {
        const nextIdx = waterDropsAbsorbed.findIndex((w) => !w);
        if (nextIdx !== -1) {
          calmAudio.playSoftPlim(490 + nextIdx * 40);
          setWaterDropsAbsorbed((prev) => {
            const copy = [...prev];
            copy[nextIdx] = true;
            if (copy.every(Boolean)) calmAudio.playSereneCompletion();
            return copy;
          });
        } else {
          setAutoObserveActive(false);
        }
        return;
      }

      if (currentStage === 'final_ordering') {
        // Preenche o próximo órgão correto passo a passo
        const mismatchOrEmptyIdx = CORRECT_ORGAN_ORDER.findIndex(
          (expectedId, idx) => orderedOrganIds[idx] !== expectedId
        );
        if (mismatchOrEmptyIdx !== -1) {
          calmAudio.playSoftPlim(500 + mismatchOrEmptyIdx * 30);
          setOrderedOrganIds((prev) => {
            const next = [...prev];
            const targetId = CORRECT_ORGAN_ORDER[mismatchOrEmptyIdx];
            const existingPos = next.indexOf(targetId);
            if (existingPos !== -1) {
              next[existingPos] = null;
            }
            next[mismatchOrEmptyIdx] = targetId;
            if (next.every((val, i) => val === CORRECT_ORGAN_ORDER[i])) {
              calmAudio.playSereneCompletion();
            }
            return next;
          });
        } else {
          setAutoObserveActive(false);
        }
      }
    }, 1050);

    return () => window.clearTimeout(timer);
  }, [
    autoObserveActive,
    isPaused,
    currentStage,
    bitePhase,
    chewCount,
    salivaAdded,
    swallowed,
    throatProgress,
    esoRingStep,
    gastricDrops,
    nutrientsAbsorbed,
    waterDropsAbsorbed,
    orderedOrganIds,
    onChangeStage
  ]);

  // Handlers de interação direta (3D Raycasting ou Botões do Dock)
  const triggerBite = () => {
    if (bitePhase === 'idle' || bitePhase === 'completed') {
      calmAudio.playSoftPlim(510);
      setBitePhase('reaching');
    }
  };

  const triggerChew = () => {
    if (chewCount < 3) {
      calmAudio.playSoftCrunch();
      const next = chewCount + 1;
      setChewCount(next);
      if (next === 3 && salivaAdded) calmAudio.playSereneCompletion();
    }
  };

  const triggerSaliva = () => {
    if (!salivaAdded) {
      calmAudio.playSoftPlim(528);
      setSalivaAdded(true);
      if (chewCount >= 3) calmAudio.playSereneCompletion();
    }
  };

  const triggerSwallow = () => {
    if (!swallowed) {
      calmAudio.playGentleSquish();
      setSwallowed(true);
      setThroatProgress(8);
    }
  };

  const triggerEsoRing = (ringIdx: number) => {
    // Permite tocar no próximo anel ou avançar sequencialmente sem erro punitivo
    const nextStep = ringIdx <= esoRingStep ? Math.min(3, esoRingStep + 1) : ringIdx + 1;
    calmAudio.playGentleSquish();
    setEsoRingStep(nextStep);
    if (nextStep === 3) {
      calmAudio.playSereneCompletion();
    }
  };

  const triggerGastricDrop = (idx: number) => {
    if (gastricDrops[idx]) return;
    calmAudio.playSoftPlim(490 + idx * 35);
    setGastricDrops((prev) => {
      const next = [...prev];
      next[idx] = true;
      if (next.every(Boolean)) calmAudio.playSereneCompletion();
      return next;
    });
  };

  const triggerAbsorbNutrient = (idx: number) => {
    if (nutrientsAbsorbed[idx]) return;
    calmAudio.playSoftPlim(510 + idx * 35);
    setNutrientsAbsorbed((prev) => {
      const next = [...prev];
      next[idx] = true;
      if (next.every(Boolean)) calmAudio.playSereneCompletion();
      return next;
    });
  };

  const triggerAbsorbWater = (idx: number) => {
    if (waterDropsAbsorbed[idx]) return;
    calmAudio.playSoftPlim(500 + idx * 35);
    setWaterDropsAbsorbed((prev) => {
      const next = [...prev];
      next[idx] = true;
      if (next.every(Boolean)) calmAudio.playSereneCompletion();
      return next;
    });
  };

  const handlePlaceOrgan = (organId: string) => {
    if (orderedOrganIds.includes(organId)) return;
    const emptyIdx = orderedOrganIds.findIndex((slot) => slot === null);
    if (emptyIdx === -1) return;
    calmAudio.playSoftPlim(495 + emptyIdx * 25);
    setOrderedOrganIds((prev) => {
      const next = [...prev];
      next[emptyIdx] = organId;
      if (next.every((val, i) => val === CORRECT_ORGAN_ORDER[i])) {
        calmAudio.playSereneCompletion();
      }
      return next;
    });
  };

  const handleClearOrganSlot = (slotIdx: number) => {
    if (orderedOrganIds[slotIdx] === null) return;
    calmAudio.playSoftPlim(430);
    setOrderedOrganIds((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  const handleResetCurrentStage = () => {
    setAutoObserveActive(false);
    calmAudio.playSoftPlim(440);
    setCameraResetCount((c) => c + 1);

    switch (currentStage) {
      case 'first_bite':
        setBitePhase('idle');
        break;
      case 'mouth':
        setChewCount(0);
        setSalivaAdded(false);
        break;
      case 'swallow':
        setSwallowed(false);
        setThroatProgress(0);
        break;
      case 'esophagus':
        setEsoRingStep(0);
        break;
      case 'stomach':
        setGastricDrops([false, false, false]);
        break;
      case 'small_intestine':
        setNutrientsAbsorbed([false, false, false]);
        break;
      case 'large_intestine':
        setWaterDropsAbsorbed([false, false, false]);
        break;
      case 'final_ordering':
        setOrderedOrganIds([null, null, null, null, null]);
        break;
      default:
        break;
    }
  };

  // Navegação Livre Anterior / Próximo
  const stageIdx = STAGE_SEQUENCE.indexOf(currentStage);
  const handlePrev = () => {
    CalmVoiceNarrator.stop();
    if (stageIdx <= 0) {
      onBackToHub();
    } else {
      onChangeStage(STAGE_SEQUENCE[stageIdx - 1]);
    }
  };

  const handleNext = () => {
    CalmVoiceNarrator.stop();
    if (stageIdx >= STAGE_SEQUENCE.length - 1) {
      onGoToProposta2();
    } else {
      onChangeStage(STAGE_SEQUENCE[stageIdx + 1]);
    }
  };

  // Metadados literais da etapa atual (título, instrução e narração opcional)
  const getStageCopy = (): { title: string; instruction: string; narration: string; done: boolean } => {
    switch (currentStage) {
      case 'food_select':
        return {
          title: 'Escolha o Alimento na Mesa 3D',
          instruction:
            'Toque em um prato na mesa 3D ou nos botões abaixo para escolher entre Maçã, Pão, Cenoura ou Ovo.',
          narration: `Escolha qual alimento vai fazer a viagem pelo corpo hoje. Você selecionou ${selectedFood.name}: ${selectedFood.desc}`,
          done: true
        };
      case 'first_bite':
        return {
          title: 'Primeira Mordida com Braço Articulado 3D',
          instruction:
            'Toque no alimento 3D ou no botão abaixo para ver o braço pegar o alimento no prato, levar até a boca e morder.',
          narration:
            'Observe o braço pegar o alimento no prato com calma, levá-lo até a boca e dar a primeira mordida para iniciar a digestão.',
          done: bitePhase === 'completed'
        };
      case 'mouth': {
        const s = SCRIPT_ETAPAS[0];
        return {
          title: s.nomeDaEtapa,
          instruction: s.instrucaoDireta,
          narration: s.narracaoEmAudio,
          done: chewCount >= 3 && salivaAdded
        };
      }
      case 'swallow':
        return {
          title: 'Garganta e Epiglote 3D (Deglutição Segura)',
          instruction:
            'Toque na epiglote 3D ou no botão Engolir para ver a válvula proteger a traqueia do ar e guiar o alimento ao esôfago.',
          narration:
            'Ao engolir, a epiglote fecha suavemente o caminho do ar na traqueia e conduz o bolo alimentar com segurança para o esôfago.',
          done: throatProgress >= 100
        };
      case 'esophagus': {
        const s = SCRIPT_ETAPAS[1];
        return {
          title: s.nomeDaEtapa,
          instruction: s.instrucaoDireta,
          narration: s.narracaoEmAudio,
          done: esoRingStep >= 3
        };
      }
      case 'stomach': {
        const s = SCRIPT_ETAPAS[2];
        return {
          title: s.nomeDaEtapa,
          instruction: s.instrucaoDireta,
          narration: s.narracaoEmAudio,
          done: gastricDrops.every(Boolean)
        };
      }
      case 'small_intestine': {
        const s = SCRIPT_ETAPAS[3];
        return {
          title: s.nomeDaEtapa,
          instruction: s.instrucaoDireta,
          narration: s.narracaoEmAudio,
          done: nutrientsAbsorbed.every(Boolean)
        };
      }
      case 'large_intestine': {
        const s = SCRIPT_ETAPAS[4];
        return {
          title: s.nomeDaEtapa,
          instruction: s.instrucaoDireta,
          narration: s.narracaoEmAudio,
          done: waterDropsAbsorbed.every(Boolean)
        };
      }
      case 'final_ordering':
        return {
          title: 'Caminho Digestivo Completo em 3D',
          instruction: SCRIPT_ETAPA_6.instrucaoDireta,
          narration: SCRIPT_ETAPA_6.narracaoEmAudio,
          done: orderedOrganIds.every((val, i) => val === CORRECT_ORGAN_ORDER[i])
        };
    }
  };

  const stageCopy = getStageCopy();
  const voceSabia = VOCE_SABIA_POR_ALIMENTO[selectedFood.id] || VOCE_SABIA_POR_ALIMENTO.maca;

  const renderFoodThumb = (id: FoodId, size = 28) => {
    switch (id) {
      case 'maca':
        return <PixelApple size={size} />;
      case 'pao':
        return <PixelBread size={size} />;
      case 'cenoura':
        return <PixelCarrot size={size} />;
      case 'ovo':
        return <PixelEgg size={size} />;
    }
  };

  const allSlotsFilled = orderedOrganIds.every((s) => s !== null);
  const isOrderExact = orderedOrganIds.every((val, i) => val === CORRECT_ORGAN_ORDER[i]);

  return (
    <div className="relative flex-1 w-full min-h-[calc(100vh-108px)] flex flex-col overflow-hidden bg-slate-100">
      {/* 1. BARRA FLUTUANTE SUPERIOR DISCRETA (Sem backdrop-filter sobre WebGL) */}
      <div className="pointer-events-none absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs flex items-center gap-2.5">
          {renderFoodThumb(selectedFood.id, 28)}
          <div className="leading-tight">
            <div className="text-[11px] font-semibold text-teal-800">
              Proposta 1 · Estúdio HD-2D Three.js
            </div>
            <div className="text-xs font-bold text-slate-900">
              {selectedFood.name} · {selectedFood.nutrientMain}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => setCameraResetCount((c) => c + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Centralizar câmera 3D na estação atual"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enquadrar 3D</span>
          </button>

          <button
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Atalho de teclado: tecla H"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Mostrar Controles (H)' : 'Recolher Painel (H)'}</span>
          </button>
        </div>
      </div>

      {/* 2. CENA PRINCIPAL 3D THREE.JS (HD-2D: ÓRGÃOS 3D + SPRITES 16-BIT RECORTADOS) */}
      <div className="flex-1 w-full relative min-h-[440px]">
        <Proposta1HD2DScene3D
          stage={currentStage}
          selectedFoodId={selectedFood.id}
          isPaused={isPaused}
          lowSensory={lowSensory}
          cameraResetTrigger={cameraResetCount}
          bitePhase={bitePhase}
          chewCount={chewCount}
          salivaAdded={salivaAdded}
          swallowed={swallowed}
          throatProgress={throatProgress}
          esoRingStep={esoRingStep}
          gastricDrops={gastricDrops}
          nutrientsAbsorbed={nutrientsAbsorbed}
          waterDropsAbsorbed={waterDropsAbsorbed}
          orderedOrganIds={orderedOrganIds}
          onSelectFood3D={handleSelectFoodById3D}
          onTriggerBite3D={triggerBite}
          onChew3D={triggerChew}
          onAddSaliva3D={triggerSaliva}
          onSwallow3D={triggerSwallow}
          onSqueezeEsoRing3D={triggerEsoRing}
          onAddGastricDrop3D={triggerGastricDrop}
          onAbsorbNutrient3D={triggerAbsorbNutrient}
          onAbsorbWaterDrop3D={triggerAbsorbWater}
        />
      </div>

      {/* 3. DOCK INFERIOR RETRÁTIL (Superfície sólida sem blur sobre WebGL) */}
      {!dockCollapsed && (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 z-20 w-[min(980px,95vw)] bg-white border border-slate-200 rounded-2xl shadow-lg p-3.5 sm:p-4 space-y-3">
          {/* Linha 1: Título da Etapa, Instrução Direta e Áudio Opcional */}
          <div className="flex flex-wrap items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="space-y-0.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {stageCopy.title}
                </h2>
                {stageCopy.done && currentStage !== 'food_select' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Etapa concluída</span>
                  </span>
                )}
              </div>
              <p className={`${textSizeClass} text-slate-600 leading-snug`}>
                {stageCopy.instruction}
              </p>
            </div>

            <button
              onClick={() => CalmVoiceNarrator.speak(stageCopy.narration)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Ouvir explicação calma desta etapa"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Ouvir etapa</span>
            </button>
          </div>

          {/* Linha 2: Controles Específicos da Estação 3D Atual */}
          <div>
            {currentStage === 'food_select' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FOOD_OPTIONS.map((food) => {
                  const active = selectedFood.id === food.id;
                  return (
                    <button
                      key={food.id}
                      onClick={() => handleChooseFood(food)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-teal-50 border-teal-700 text-teal-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {renderFoodThumb(food.id, 34)}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{food.name}</div>
                        <div className="text-[11px] text-slate-600 truncate">{food.nutrientMain}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStage === 'first_bite' && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">Estado da animação 3D: </span>
                  <span>
                    {bitePhase === 'idle' && 'Alimento 16-bit pronto no prato 3D.'}
                    {bitePhase === 'reaching' && 'Braço 3D alcançando o alimento no prato...'}
                    {bitePhase === 'holding' && 'Mão 3D segurando o alimento com firmeza suave...'}
                    {bitePhase === 'bringing_to_mouth' && 'Levando o alimento até a boca 3D...'}
                    {bitePhase === 'biting' && 'Dando a primeira mordida!'}
                    {bitePhase === 'completed' && 'Mordida concluída! Pronto para mastigar na boca.'}
                  </span>
                </div>
                <button
                  onClick={triggerBite}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {bitePhase === 'completed'
                    ? 'Ver mordida novamente em 3D'
                    : `Pegar ${selectedFood.name.toLowerCase()} e morder`}
                </button>
              </div>
            )}

            {currentStage === 'mouth' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={triggerChew}
                  disabled={chewCount >= 3}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    chewCount >= 3
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-teal-700 hover:bg-teal-800 border-teal-800 text-white'
                  }`}
                >
                  <span>1. Mastigar nos Dentes 3D ({chewCount}/3)</span>
                </button>

                <button
                  onClick={triggerSaliva}
                  disabled={salivaAdded}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    salivaAdded
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-950'
                  }`}
                >
                  <PixelDrop size={18} />
                  <span>
                    {salivaAdded ? 'Saliva 16-Bit Adicionada' : '2. Adicionar Gota de Saliva 16-Bit'}
                  </span>
                </button>
              </div>
            )}

            {currentStage === 'swallow' && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-semibold">
                      {swallowed
                        ? 'Epiglote fechou a traqueia do ar · Passagem segura ao esôfago'
                        : 'Traqueia aberta para respirar · Toque para engolir'}
                    </span>
                    <span className="font-bold text-teal-800">{throatProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-150"
                      style={{ width: `${throatProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={triggerSwallow}
                  disabled={swallowed && throatProgress < 100}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {throatProgress >= 100 ? 'Deglutição concluída' : 'Engolir com segurança'}
                </button>
              </div>
            )}

            {currentStage === 'esophagus' && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {['1. Anel Superior', '2. Anel Médio', '3. Anel Inferior'].map((label, idx) => {
                    const done = esoRingStep > idx;
                    return (
                      <button
                        key={label}
                        onClick={() => triggerEsoRing(idx)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          done
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <PixelEsophagusThumb size={26} />
                  <span>Textura e tubo 16-bit ativos no túnel 3D</span>
                </div>
              </div>
            )}

            {currentStage === 'stomach' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  '1. Suco Gástrico',
                  '2. Enzima das Proteínas',
                  '3. Formar Quimo Macio'
                ].map((label, idx) => {
                  const active = gastricDrops[idx];
                  return (
                    <button
                      key={label}
                      onClick={() => triggerGastricDrop(idx)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-950'
                      }`}
                    >
                      <PixelDrop size={18} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStage === 'small_intestine' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  '1. Absorver Carboidratos (Energia)',
                  '2. Absorver Proteínas (Força)',
                  '3. Absorver Vitaminas e Minerais'
                ].map((label, idx) => {
                  const active = nutrientsAbsorbed[idx];
                  return (
                    <button
                      key={label}
                      onClick={() => triggerAbsorbNutrient(idx)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStage === 'large_intestine' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  '1. Reabsorver Gota de Água 1',
                  '2. Reabsorver Gota de Água 2',
                  '3. Reabsorver Gota de Água 3'
                ].map((label, idx) => {
                  const active = waterDropsAbsorbed[idx];
                  return (
                    <button
                      key={label}
                      onClick={() => triggerAbsorbWater(idx)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-950'
                      }`}
                    >
                      <PixelDrop size={18} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentStage === 'final_ordering' && (
              <div className="space-y-2">
                {/* 5 Posições da Sequência */}
                <div className="grid grid-cols-5 gap-1.5">
                  {orderedOrganIds.map((placedId, slotIdx) => {
                    const organObj = ORGAN_CHOICES.find((o) => o.id === placedId);
                    const isSlotRight = placedId === CORRECT_ORGAN_ORDER[slotIdx];
                    return (
                      <button
                        key={slotIdx}
                        onClick={() => handleClearOrganSlot(slotIdx)}
                        className={`p-2 rounded-xl border text-center text-xs transition-colors cursor-pointer ${
                          placedId === null
                            ? 'bg-slate-50 border-dashed border-slate-300 text-slate-500'
                            : isSlotRight
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                            : 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                        }`}
                        title={placedId ? 'Toque para liberar esta posição' : `Posição ${slotIdx + 1}`}
                      >
                        <div className="text-[10px] text-slate-500">{slotIdx + 1}º lugar</div>
                        <div className="truncate">{organObj ? organObj.label : 'Vazio'}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Botões dos Órgãos Disponíveis + Feedback Acolhedor Sem Erro Punitivo */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ORGAN_CHOICES.map((org) => {
                      const used = orderedOrganIds.includes(org.id);
                      return (
                        <button
                          key={org.id}
                          onClick={() => handlePlaceOrgan(org.id)}
                          disabled={used}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            used
                              ? 'bg-slate-100 border-slate-200 text-slate-400'
                              : 'bg-white hover:bg-teal-50 border-slate-300 text-slate-800'
                          }`}
                        >
                          + {org.label}
                        </button>
                      );
                    })}
                  </div>

                  {allSlotsFilled && !isOrderExact && (
                    <div className="flex items-center gap-2 text-xs text-amber-900">
                      <span>
                        Dica calma: a ordem natural é Boca → Esôfago → Estômago → Int. Delgado → Int. Grosso.
                      </span>
                      <button
                        onClick={() => {
                          calmAudio.playSereneCompletion();
                          setOrderedOrganIds([...CORRECT_ORGAN_ORDER]);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Organizar juntos
                      </button>
                    </div>
                  )}

                  {isOrderExact && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onChangeStage('food_select')}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Escolher outro alimento
                      </button>
                      <button
                        onClick={onOpenScript}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Escopo & PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Linha 3: Curiosidade "Você sabia?" + Controles Livres do PDF */}
          <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="text-xs text-slate-600 leading-snug max-w-xl">
              <strong className="text-teal-900">{voceSabia.titulo} </strong>
              <span>{voceSabia.texto}</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{stageIdx === 0 ? 'Início' : 'Voltar'}</span>
              </button>

              {currentStage !== 'food_select' && (
                <button
                  onClick={handleResetCurrentStage}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="Reiniciar apenas esta estação 3D"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repetir</span>
                </button>
              )}

              <button
                onClick={() => setAutoObserveActive((prev) => !prev)}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  autoObserveActive
                    ? 'bg-amber-100 border-amber-400 text-amber-950'
                    : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-950'
                }`}
                title="Permite observar a etapa acontecendo sozinha sem precisar clicar nos órgãos"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{autoObserveActive ? 'Observando...' : 'Observar sem tocar'}</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {currentStage === 'final_ordering' ? (
                  <>
                    <Box className="w-3.5 h-3.5" />
                    <span>Ir para Proposta 2 (3D)</span>
                  </>
                ) : (
                  <>
                    <span>Próximo órgão</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
