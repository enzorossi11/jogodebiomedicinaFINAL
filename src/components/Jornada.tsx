/**
 * A Viagem do Alimento: palco 3D em tela cheia e um painel com uma ação por vez.
 * Toda a navegação fica livre (voltar e avançar nunca travam) e cada etapa pode
 * ser só observada, sem tocar, respeitando as regras sensoriais do projeto.
 */
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, RotateCcw, Volume2, X } from 'lucide-react';
import { ETAPAS, ORDEM_CORRETA, ORGAOS, SEQUENCIA, TRILHA, acertosDaOrdem, ordemCompleta, type EtapaId, type OrgaoId } from '../data/etapas';
import { SCRIPT_ETAPAS, SCRIPT_ETAPA_6, VOCE_SABIA_POR_ALIMENTO } from '../data/scriptData';
import { calmAudio, CalmVoiceNarrator } from '../utils/audioSystem';
import { FOOD_OPTIONS, type FoodId, type FoodOption } from './FoodSelector';
import { Proposta1HD2DScene3D, type Bite3DPhase } from './three/Proposta1HD2DScene3D';

interface Props {
  etapa: EtapaId;
  onEtapa: (e: EtapaId) => void;
  alimento: FoodOption;
  onAlimento: (a: FoodOption) => void;
  pausado: boolean;
  baixoEstimulo: boolean;
  onVoltarCapa: () => void;
  onMeuCorpo: () => void;
}

const FASE_MORDIDA: Record<Bite3DPhase, string> = {
  idle: 'O alimento está no prato, esperando.',
  reaching: 'A mão vai até o prato…',
  holding: 'Pegou o alimento com cuidado.',
  bringing_to_mouth: 'Levando até a boca…',
  biting: 'Os dentes da frente cortam um pedaço.',
  completed: 'Primeira mordida dada. Agora é hora de mastigar.'
};

const NUTRIENTES = ['Energia (carboidratos)', 'Proteínas', 'Vitaminas e minerais'];
const SUCOS = ['Suco gástrico', 'Enzimas', 'Mistura: o quimo'];
const AGUA = ['Primeira gota', 'Segunda gota', 'Terceira gota'];

const vazio3 = () => [false, false, false];

export function Jornada(p: Props) {
  const { etapa, onEtapa, alimento, pausado } = p;

  // --------------------------------------------------------------- estado
  const [fase, setFase] = useState<Bite3DPhase>('idle');
  const [mastigadas, setMastigadas] = useState(0);
  const [saliva, setSaliva] = useState(false);
  const [engoliu, setEngoliu] = useState(false);
  const [garganta, setGarganta] = useState(0);
  const [anel, setAnel] = useState(0);
  const [sucos, setSucos] = useState<boolean[]>(vazio3);
  const [nutrientes, setNutrientes] = useState<boolean[]>(vazio3);
  const [agua, setAgua] = useState<boolean[]>(vazio3);
  const [ordem, setOrdem] = useState<(string | null)[]>([null, null, null, null, null]);
  const [observando, setObservando] = useState(false);
  const [resetCamera, setResetCamera] = useState(0);

  const reiniciarTudo = () => {
    setFase('idle');
    setMastigadas(0);
    setSaliva(false);
    setEngoliu(false);
    setGarganta(0);
    setAnel(0);
    setSucos(vazio3());
    setNutrientes(vazio3());
    setAgua(vazio3());
    setOrdem([null, null, null, null, null]);
  };

  useEffect(() => setObservando(false), [etapa]);

  // ------------------------------------------------------------- animações
  useEffect(() => {
    if (pausado || fase === 'idle' || fase === 'completed') return;
    const prox: Record<string, Bite3DPhase> = {
      reaching: 'holding',
      holding: 'bringing_to_mouth',
      bringing_to_mouth: 'biting',
      biting: 'completed'
    };
    const t = window.setTimeout(() => {
      const n = prox[fase];
      setFase(n);
      if (n === 'biting') calmAudio.playSoftCrunch();
      else if (n === 'completed') calmAudio.playSereneCompletion();
      else calmAudio.playSoftPlim(460);
    }, 1050);
    return () => window.clearTimeout(t);
  }, [fase, pausado]);

  useEffect(() => {
    if (!engoliu || pausado || garganta >= 100) return;
    const t = window.setInterval(() => {
      setGarganta((v) => {
        const n = Math.min(100, v + 4);
        if (n === 100) calmAudio.playSereneCompletion();
        return n;
      });
    }, 85);
    return () => window.clearInterval(t);
  }, [engoliu, pausado, garganta]);

  // ----------------------------------------------------------------- ações
  const marcar = (set: React.Dispatch<React.SetStateAction<boolean[]>>, i: number, tom: number) => {
    set((prev) => {
      if (prev[i]) return prev;
      const n = [...prev];
      n[i] = true;
      calmAudio.playSoftPlim(tom);
      if (n.every(Boolean)) calmAudio.playSereneCompletion();
      return n;
    });
  };
  const proximoLivre = (lista: boolean[]) => lista.findIndex((v) => !v);

  const escolherAlimento = (a: FoodOption) => {
    p.onAlimento(a);
    calmAudio.playSoftPlim(480);
    reiniciarTudo();
  };
  const morder = () => {
    if (fase === 'idle' || fase === 'completed') {
      calmAudio.playSoftPlim(510);
      setFase('reaching');
    }
  };
  const mastigar = () => {
    calmAudio.playSoftCrunch();
    setSaliva(true);
    setMastigadas((v) => {
      const n = v >= 5 ? 1 : v + 1;
      if (n === 5) calmAudio.playSereneCompletion();
      return n;
    });
  };
  const engolir = () => {
    if (engoliu && garganta >= 100) {
      setGarganta(0);
    }
    calmAudio.playGentleSquish();
    setEngoliu(true);
    setGarganta((v) => (v >= 100 ? 8 : Math.max(v, 8)));
  };
  const apertarAnel = (i?: number) => {
    const n = i === undefined || i <= anel ? Math.min(3, anel + 1) : i + 1;
    calmAudio.playGentleSquish();
    setAnel(anel >= 3 && i === undefined ? 1 : n);
    if (n === 3) calmAudio.playSereneCompletion();
  };
  const pingarSuco = (i = proximoLivre(sucos)) => {
    if (i === -1) return setSucos(() => { const n = vazio3(); n[0] = true; return n; });
    marcar(setSucos, i, 490 + i * 35);
  };
  const absorver = (i = proximoLivre(nutrientes)) => {
    if (i === -1) return setNutrientes(() => { const n = vazio3(); n[0] = true; return n; });
    marcar(setNutrientes, i, 510 + i * 35);
  };
  const reabsorver = (i = proximoLivre(agua)) => {
    if (i === -1) return setAgua(() => { const n = vazio3(); n[0] = true; return n; });
    marcar(setAgua, i, 500 + i * 35);
  };
  const colocarOrgao = (id: OrgaoId) => {
    if (ordem.includes(id)) return;
    const vago = ordem.indexOf(null);
    if (vago === -1) return;
    calmAudio.playSoftPlim(495 + vago * 25);
    setOrdem((prev) => {
      const n = [...prev];
      n[vago] = id;
      if (ordemCompleta(n)) calmAudio.playSereneCompletion();
      return n;
    });
  };
  const tirarOrgao = (i: number) => {
    if (ordem[i] === null) return;
    calmAudio.playSoftPlim(430);
    setOrdem((prev) => {
      const n = [...prev];
      n[i] = null;
      return n;
    });
  };

  const repetirEtapa = () => {
    setObservando(false);
    calmAudio.playSoftPlim(440);
    setResetCamera((c) => c + 1);
    switch (etapa) {
      case 'first_bite': setFase('idle'); break;
      case 'mouth': setMastigadas(0); setSaliva(false); break;
      case 'swallow': setEngoliu(false); setGarganta(0); break;
      case 'esophagus': setAnel(0); break;
      case 'stomach': setSucos(vazio3()); break;
      case 'small_intestine': setNutrientes(vazio3()); break;
      case 'large_intestine': setAgua(vazio3()); break;
      case 'final_ordering': setOrdem([null, null, null, null, null]); break;
    }
  };

  // ------------------------------------------- "observar sem tocar" (automático)
  useEffect(() => {
    if (!observando || pausado) return;
    const t = window.setTimeout(() => {
      const parar = () => setObservando(false);
      switch (etapa) {
        case 'food_select': onEtapa('first_bite'); break;
        case 'first_bite': fase === 'idle' ? setFase('reaching') : fase === 'completed' && parar(); break;
        case 'mouth': mastigadas < 5 ? mastigar() : parar(); break;
        case 'swallow': !engoliu ? engolir() : garganta >= 100 && parar(); break;
        case 'esophagus': anel < 3 ? apertarAnel() : parar(); break;
        case 'stomach': proximoLivre(sucos) !== -1 ? pingarSuco() : parar(); break;
        case 'small_intestine': proximoLivre(nutrientes) !== -1 ? absorver() : parar(); break;
        case 'large_intestine': proximoLivre(agua) !== -1 ? reabsorver() : parar(); break;
        case 'final_ordering': {
          const i = ORDEM_CORRETA.findIndex((id, k) => ordem[k] !== id);
          if (i === -1) return parar();
          calmAudio.playSoftPlim(500 + i * 30);
          setOrdem((prev) => {
            const n = [...prev];
            const alvo = ORDEM_CORRETA[i];
            const onde = n.indexOf(alvo);
            if (onde !== -1) n[onde] = null;
            n[i] = alvo;
            if (ordemCompleta(n)) calmAudio.playSereneCompletion();
            return n;
          });
        }
      }
    }, 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observando, pausado, etapa, fase, mastigadas, engoliu, garganta, anel, sucos, nutrientes, agua, ordem]);

  // ------------------------------------------------------------ navegação
  const idx = SEQUENCIA.indexOf(etapa);
  const voltar = () => {
    CalmVoiceNarrator.stop();
    idx <= 0 ? p.onVoltarCapa() : onEtapa(SEQUENCIA[idx - 1]);
  };
  const avancar = () => {
    CalmVoiceNarrator.stop();
    idx >= SEQUENCIA.length - 1 ? p.onMeuCorpo() : onEtapa(SEQUENCIA[idx + 1]);
  };

  // --------------------------------------------------------------- textos
  const meta = ETAPAS[etapa];
  const script = (chave: string) => SCRIPT_ETAPAS.find((s) => s.key === chave);
  const narracao: Record<EtapaId, string> = {
    food_select: `Escolha qual alimento vai fazer a viagem pelo corpo hoje. Você selecionou ${alimento.name}: ${alimento.desc}`,
    first_bite: 'Observe a mão pegar o alimento no prato com calma, levar até a boca e dar a primeira mordida.',
    mouth: script('mouth')?.narracaoEmAudio ?? '',
    swallow: 'Ao engolir, a epiglote fecha suavemente o caminho do ar e conduz o alimento com segurança para o esôfago.',
    esophagus: script('esophagus')?.narracaoEmAudio ?? '',
    stomach: script('stomach')?.narracaoEmAudio ?? '',
    small_intestine: script('small_intestine')?.narracaoEmAudio ?? '',
    large_intestine: script('large_intestine')?.narracaoEmAudio ?? '',
    final_ordering: SCRIPT_ETAPA_6.narracaoEmAudio
  };
  const concluida: Record<EtapaId, boolean> = {
    food_select: true,
    first_bite: fase === 'completed',
    mouth: mastigadas >= 5,
    swallow: garganta >= 100,
    esophagus: anel >= 3,
    stomach: sucos.every(Boolean),
    small_intestine: nutrientes.every(Boolean),
    large_intestine: agua.every(Boolean),
    final_ordering: ordemCompleta(ordem)
  };
  const feita = concluida[etapa];
  const voceSabia = VOCE_SABIA_POR_ALIMENTO[alimento.id] ?? VOCE_SABIA_POR_ALIMENTO.maca;
  const numero = TRILHA.findIndex((t) => t.etapas.includes(etapa));

  // ------------------------------------------------------- miolo por etapa
  const Pontos = ({ lista }: { lista: boolean[] }) => (
    <div className="pontos-progresso flex gap-1.5" aria-hidden="true">
      {lista.map((v, i) => (
        <span key={i} data-feito={v} />
      ))}
    </div>
  );
  const Lista = ({ itens, feitos, ao }: { itens: string[]; feitos: boolean[]; ao: (i: number) => void }) => (
    <ul className="space-y-2">
      {itens.map((r, i) => (
        <li key={r}>
          <button
            onClick={() => ao(i)}
            aria-pressed={feitos[i]}
            className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
              feitos[i] ? 'border-mar-200 bg-mar-50 text-mar-800' : 'border-areia-200 bg-white hover:border-mar-300'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                feitos[i] ? 'bg-mar-500 text-white' : 'bg-areia-100 text-ameixa-500'
              }`}
            >
              {feitos[i] ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="font-medium">{r}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  let miolo: React.ReactNode = null;
  let acaoPrincipal: { rotulo: string; ao: () => void } | null = null;

  switch (etapa) {
    case 'food_select':
      miolo = (
        <div className="grid grid-cols-2 gap-2.5" role="radiogroup" aria-label="Alimento">
          {FOOD_OPTIONS.map((a) => (
            <button
              key={a.id}
              role="radio"
              aria-checked={alimento.id === a.id}
              onClick={() => escolherAlimento(a)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-colors ${
                alimento.id === a.id ? 'border-mar-500 bg-mar-50' : 'border-areia-200 bg-white hover:border-mar-300'
              }`}
            >
              <span className="scale-90">{a.svgIcon}</span>
              <span className="text-sm font-bold">{a.name}</span>
              <span className="-mt-1 text-xs text-ameixa-500">{a.nutrientMain}</span>
            </button>
          ))}
        </div>
      );
      acaoPrincipal = { rotulo: `Começar com ${alimento.name.toLowerCase()}`, ao: () => onEtapa('first_bite') };
      break;

    case 'first_bite':
      miolo = <p className="rounded-xl bg-areia-100 px-4 py-3 text-sm text-ameixa-700">{FASE_MORDIDA[fase]}</p>;
      acaoPrincipal = fase === 'idle' || fase === 'completed' ? { rotulo: fase === 'completed' ? 'Morder de novo' : 'Dar a mordida', ao: morder } : null;
      break;

    case 'mouth':
      miolo = (
        <div className="flex items-center justify-between rounded-xl bg-areia-100 px-4 py-3">
          <span className="text-sm text-ameixa-700">
            {mastigadas === 0 ? 'Nenhuma mastigada ainda' : `${mastigadas} de 5 mastigadas`}
            {saliva && mastigadas < 5 ? ' · a saliva já está umedecendo' : ''}
          </span>
          <Pontos lista={[0, 1, 2, 3, 4].map((i) => i < mastigadas)} />
        </div>
      );
      acaoPrincipal = { rotulo: mastigadas >= 5 ? 'Mastigar de novo' : 'Mastigar', ao: mastigar };
      break;

    case 'swallow':
      miolo = (
        <div className="rounded-xl bg-areia-100 px-4 py-3">
          <div className="flex justify-between text-sm text-ameixa-700">
            <span>{!engoliu ? 'A traqueia está aberta para o ar' : garganta < 100 ? 'A epiglote fechou. O alimento desce…' : 'Chegou ao esôfago em segurança'}</span>
            <span className="font-semibold">{garganta}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-areia-300/60">
            <div className="h-full rounded-full bg-mar-500 transition-[width] duration-200" style={{ width: `${garganta}%` }} />
          </div>
        </div>
      );
      acaoPrincipal = !engoliu || garganta >= 100 ? { rotulo: garganta >= 100 ? 'Engolir de novo' : 'Engolir', ao: engolir } : null;
      break;

    case 'esophagus':
      miolo = <Lista itens={['Anel superior', 'Anel do meio', 'Anel inferior']} feitos={[0, 1, 2].map((i) => i < anel)} ao={(i) => apertarAnel(i)} />;
      acaoPrincipal = { rotulo: anel >= 3 ? 'Repetir as ondas' : 'Apertar o próximo anel', ao: () => apertarAnel() };
      break;

    case 'stomach':
      miolo = <Lista itens={SUCOS} feitos={sucos} ao={(i) => pingarSuco(i)} />;
      acaoPrincipal = { rotulo: sucos.every(Boolean) ? 'Misturar de novo' : 'Pingar suco gástrico', ao: () => pingarSuco() };
      break;

    case 'small_intestine':
      miolo = <Lista itens={NUTRIENTES} feitos={nutrientes} ao={(i) => absorver(i)} />;
      acaoPrincipal = { rotulo: nutrientes.every(Boolean) ? 'Absorver de novo' : 'Absorver o próximo nutriente', ao: () => absorver() };
      break;

    case 'large_intestine':
      miolo = <Lista itens={AGUA} feitos={agua} ao={(i) => reabsorver(i)} />;
      acaoPrincipal = { rotulo: agua.every(Boolean) ? 'Reabsorver de novo' : 'Reabsorver água', ao: () => reabsorver() };
      break;

    case 'final_ordering': {
      const acertos = acertosDaOrdem(ordem);
      const cheio = ordem.every((o) => o !== null);
      miolo = (
        <div className="space-y-3">
          <ol className="space-y-1.5">
            {ordem.map((id, i) => {
              const org = ORGAOS.find((o) => o.id === id);
              const certo = id !== null && ORDEM_CORRETA[i] === id;
              return (
                <li key={i}>
                  <button
                    onClick={() => tirarOrgao(i)}
                    disabled={id === null}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors ${
                      id === null
                        ? 'border-dashed border-areia-300 text-ameixa-500'
                        : certo
                          ? 'border-mar-200 bg-mar-50 text-mar-800'
                          : 'border-areia-200 bg-white'
                    }`}
                    title={id ? 'Tirar daqui' : undefined}
                  >
                    <span className="w-5 text-xs font-bold text-ameixa-500">{i + 1}º</span>
                    <span className="flex-1 font-medium">{org ? org.rotulo : 'vazio'}</span>
                    {id && <X className="h-4 w-4 opacity-50" />}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2">
            {ORGAOS.filter((o) => !ordem.includes(o.id)).map((o) => (
              <button key={o.id} onClick={() => colocarOrgao(o.id)} className="chip border-areia-300 bg-white hover:border-mar-300 hover:bg-mar-50">
                + {o.rotulo}
              </button>
            ))}
          </div>
          {cheio && (
            <p className={`rounded-xl px-4 py-3 text-sm ${ordemCompleta(ordem) ? 'bg-mar-50 text-mar-800' : 'bg-areia-100 text-ameixa-700'}`}>
              {ordemCompleta(ordem)
                ? 'É esse o caminho: boca, esôfago, estômago, intestino delgado e intestino grosso.'
                : `${acertos} de 5 já estão no lugar. Os que acenderam em verde estão certos; os outros podem trocar de posição.`}
            </p>
          )}
        </div>
      );
      acaoPrincipal = ordemCompleta(ordem) ? { rotulo: 'Fazer a viagem de novo', ao: () => { reiniciarTudo(); onEtapa('food_select'); } } : null;
      break;
    }
  }

  // ---------------------------------------------------------------- tela
  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-0 lg:h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
      {/* palco 3D */}
      <section className="palco-3d relative h-[52vh] min-h-[340px] lg:h-full" aria-label="Cena 3D">
        <Proposta1HD2DScene3D
          stage={etapa}
          selectedFoodId={alimento.id}
          isPaused={pausado}
          lowSensory={p.baixoEstimulo}
          cameraResetTrigger={resetCamera}
          bitePhase={fase}
          chewCount={mastigadas}
          salivaAdded={saliva}
          swallowed={engoliu}
          throatProgress={garganta}
          esoRingStep={anel}
          gastricDrops={sucos}
          nutrientsAbsorbed={nutrientes}
          waterDropsAbsorbed={agua}
          orderedOrganIds={ordem}
          onSelectFood3D={(id: FoodId) => {
            const a = FOOD_OPTIONS.find((f) => f.id === id);
            if (a) escolherAlimento(a);
          }}
          onTriggerBite3D={morder}
          onChew3D={mastigar}
          onAddSaliva3D={mastigar}
          onSwallow3D={engolir}
          onSqueezeEsoRing3D={(i) => apertarAnel(i)}
          onAddGastricDrop3D={(i) => pingarSuco(i)}
          onAbsorbNutrient3D={(i) => absorver(i)}
          onAbsorbWaterDrop3D={(i) => reabsorver(i)}
        />

        {/* trilha de progresso sobre o palco */}
        <nav className="pointer-events-none absolute inset-x-0 top-0 p-3 sm:p-4" aria-label="Etapas da viagem">
          <ol className="pointer-events-auto flex gap-1 overflow-x-auto rounded-2xl border border-areia-200/80 bg-white/90 p-1.5 shadow-suave">
            {TRILHA.map((t, i) => {
              const ativa = t.etapas.includes(etapa);
              const passada = i < numero;
              return (
                <li key={t.rotulo} className="shrink-0">
                  <button
                    onClick={() => onEtapa(t.etapas[0])}
                    aria-current={ativa ? 'step' : undefined}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors sm:text-sm ${
                      ativa ? 'bg-ameixa-900 text-white' : passada ? 'text-mar-700 hover:bg-mar-50' : 'text-ameixa-500 hover:bg-areia-100'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.68rem] ${
                        ativa ? 'bg-white/20' : passada ? 'bg-mar-100' : 'bg-areia-100'
                      }`}
                    >
                      {passada ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {t.rotulo}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <button
          onClick={() => setResetCamera((c) => c + 1)}
          className="btn-secundario absolute bottom-3 right-3 px-3 py-2 text-xs shadow-suave sm:bottom-4 sm:right-4"
          title="Voltar a câmera para o lugar"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Enquadrar
        </button>
      </section>

      {/* painel da etapa */}
      <aside className="flex min-h-0 flex-col border-t border-areia-200 bg-white lg:overflow-hidden lg:border-l lg:border-t-0" key={etapa}>
        <div className="surgir flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <p className="rotulo">
            Parada {numero + 1} de {TRILHA.length} · {alimento.name}
          </p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-ameixa-900 sm:text-[1.7rem]">{meta.nome}</h2>
            {feita && etapa !== 'food_select' && (
              <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-mar-100 px-2.5 py-1 text-xs font-bold text-mar-800">
                <Check className="h-3.5 w-3.5" /> feito
              </span>
            )}
          </div>
          <p className="mt-2 leading-relaxed text-ameixa-700">{meta.resumo}</p>

          <div className="mt-5">{miolo}</div>

          <div className="mt-5 flex flex-col gap-2">
            {acaoPrincipal && (
              <button onClick={acaoPrincipal.ao} className="btn-primario btn-grande w-full">
                {acaoPrincipal.rotulo}
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setObservando((v) => !v)}
                aria-pressed={observando}
                className={`btn ${observando ? 'bg-mar-100 text-mar-800' : 'btn-secundario'}`}
              >
                <Eye className="h-4 w-4" />
                {observando ? 'Observando…' : 'Observar sem tocar'}
              </button>
              <button onClick={() => CalmVoiceNarrator.speak(narracao[etapa])} className="btn-secundario">
                <Volume2 className="h-4 w-4" />
                Ouvir
              </button>
            </div>
            {etapa !== 'food_select' && (
              <button onClick={repetirEtapa} className="btn-fantasma text-ameixa-500">
                <RotateCcw className="h-4 w-4" />
                Repetir esta parada
              </button>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-pessego-300/60 bg-pessego-100/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-pessego-500">Você sabia?</p>
            <p className="mt-1 text-sm leading-relaxed text-ameixa-700">{voceSabia.texto}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-areia-200 px-5 py-3 sm:px-7">
          <button onClick={voltar} className="btn-fantasma">
            <ArrowLeft className="h-4 w-4" />
            {idx === 0 ? 'Início' : 'Voltar'}
          </button>
          <button onClick={avancar} className={feita ? 'btn-primario' : 'btn-secundario'}>
            {idx === SEQUENCIA.length - 1 ? 'Meu corpo está falando' : 'Próxima parada'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </div>
  );
}
