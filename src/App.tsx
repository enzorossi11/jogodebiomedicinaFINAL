import { useEffect, useState } from 'react';
import { Cabecalho, type Modulo, type TamanhoFonte } from './components/Cabecalho';
import { Capa } from './components/Capa';
import { ClosedCaptionBanner } from './components/ClosedCaptionBanner';
import { FOOD_OPTIONS, type FoodOption } from './components/FoodSelector';
import { Jornada } from './components/Jornada';
import { PedagogicalScriptModal } from './components/PedagogicalScriptModal';
import { Proposta2Interocepcao } from './components/Proposta2Interocepcao';
import { SensoryPauseOverlay } from './components/SensoryPauseOverlay';
import type { EtapaId } from './data/etapas';
import { calmAudio, CalmVoiceNarrator } from './utils/audioSystem';

const CHAVE_PREFS = 'viagem_do_alimento_prefs_v1';

interface Prefs {
  baixoEstimulo: boolean;
  mudo: boolean;
  fonte: TamanhoFonte;
}

function lerPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(CHAVE_PREFS);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Prefs>;
      return {
        baixoEstimulo: Boolean(p.baixoEstimulo),
        mudo: Boolean(p.mudo),
        fonte: p.fonte === 'grande' || p.fonte === 'maior' ? p.fonte : 'normal'
      };
    }
  } catch {
    // armazenamento bloqueado: segue com o padrão
  }
  return { baixoEstimulo: false, mudo: false, fonte: 'normal' };
}

/** O tamanho de fonte dos componentes antigos usa outros nomes. */
const FONTE_LEGADA: Record<TamanhoFonte, 'normal' | 'large' | 'xlarge'> = {
  normal: 'normal',
  grande: 'large',
  maior: 'xlarge'
};

export default function App() {
  const [prefs] = useState(lerPrefs);
  const [modulo, setModulo] = useState<Modulo>('capa');
  const [etapa, setEtapa] = useState<EtapaId>('food_select');
  const [alimento, setAlimento] = useState<FoodOption>(FOOD_OPTIONS[0]);
  const [pausado, setPausado] = useState(false);
  const [roteiroAberto, setRoteiroAberto] = useState(false);
  const [baixoEstimulo, setBaixoEstimulo] = useState(prefs.baixoEstimulo);
  const [mudo, setMudo] = useState(prefs.mudo);
  const [fonte, setFonte] = useState<TamanhoFonte>(prefs.fonte);

  // preferências: aplicadas no <html> (CSS) e guardadas no navegador
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.fonte = fonte;
    raiz.dataset.baixoEstimulo = String(baixoEstimulo);
    try {
      localStorage.setItem(CHAVE_PREFS, JSON.stringify({ baixoEstimulo, mudo, fonte } satisfies Prefs));
    } catch {
      // sem armazenamento: tudo bem
    }
  }, [baixoEstimulo, mudo, fonte]);

  useEffect(() => {
    calmAudio.setMuted(mudo);
    if (mudo) CalmVoiceNarrator.stop();
  }, [mudo]);

  // o AudioContext só pode nascer depois de um gesto do usuário
  useEffect(() => {
    const destravar = () => {
      calmAudio.unlock();
      window.removeEventListener('pointerdown', destravar);
      window.removeEventListener('keydown', destravar);
    };
    window.addEventListener('pointerdown', destravar, { passive: true });
    window.addEventListener('keydown', destravar, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', destravar);
      window.removeEventListener('keydown', destravar);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    CalmVoiceNarrator.stop();
  }, [modulo]);

  const ir = (m: Modulo) => {
    setPausado(false);
    setModulo(m);
  };
  const comecar = (a: FoodOption) => {
    setAlimento(a);
    setEtapa('first_bite');
    ir('viagem');
  };

  return (
    <div className="min-h-screen">
      <Cabecalho
        modulo={modulo}
        onIr={ir}
        onPausa={() => setPausado(true)}
        onRoteiro={() => setRoteiroAberto(true)}
        mudo={mudo}
        onMudo={() => setMudo((v) => !v)}
        baixoEstimulo={baixoEstimulo}
        onBaixoEstimulo={setBaixoEstimulo}
        fonte={fonte}
        onFonte={setFonte}
      />

      {modulo === 'capa' && (
        <Capa onComecar={comecar} onMeuCorpo={() => ir('corpo')} onRoteiro={() => setRoteiroAberto(true)} />
      )}

      {modulo === 'viagem' && (
        <Jornada
          etapa={etapa}
          onEtapa={setEtapa}
          alimento={alimento}
          onAlimento={setAlimento}
          pausado={pausado || roteiroAberto}
          baixoEstimulo={baixoEstimulo}
          onVoltarCapa={() => ir('capa')}
          onMeuCorpo={() => ir('corpo')}
        />
      )}

      {modulo === 'corpo' && (
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Proposta2Interocepcao
            isPaused={pausado}
            lowSensory={baixoEstimulo}
            fontSize={FONTE_LEGADA[fonte]}
            onRequestSensoryPause={() => setPausado(true)}
          />
        </main>
      )}

      <SensoryPauseOverlay isOpen={pausado} onResume={() => setPausado(false)} onExitToHub={() => ir('capa')} />
      <PedagogicalScriptModal isOpen={roteiroAberto} onClose={() => setRoteiroAberto(false)} />
      <ClosedCaptionBanner fontSize={FONTE_LEGADA[fonte]} />
    </div>
  );
}
