import { useEffect, useRef, useState } from 'react';
import { Accessibility, BookOpen, PauseCircle, Volume2, VolumeX } from 'lucide-react';

export type Modulo = 'capa' | 'viagem' | 'corpo';
export type TamanhoFonte = 'normal' | 'grande' | 'maior';

interface Props {
  modulo: Modulo;
  onIr: (m: Modulo) => void;
  onPausa: () => void;
  onRoteiro: () => void;
  mudo: boolean;
  onMudo: () => void;
  baixoEstimulo: boolean;
  onBaixoEstimulo: (v: boolean) => void;
  fonte: TamanhoFonte;
  onFonte: (f: TamanhoFonte) => void;
}

/** Logotipo: um círculo verde-mar com a silhueta do caminho do alimento. */
export function Logo({ tamanho = 36 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="var(--color-mar-600)" />
      <path
        d="M20 8c0 4-5 4-5 9s7 4 7 9-6 4-6 7"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="20" cy="8" r="3" fill="var(--color-pessego-300)" />
    </svg>
  );
}

export function Cabecalho(p: Props) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('pointerdown', fora);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', fora);
      window.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const aba = (m: Modulo, rotulo: string) => (
    <button
      onClick={() => p.onIr(m)}
      aria-current={p.modulo === m ? 'page' : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        p.modulo === m ? 'bg-ameixa-900 text-white' : 'text-ameixa-700 hover:bg-areia-200/70'
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-areia-200 bg-white/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <button onClick={() => p.onIr('capa')} className="flex min-w-0 items-center gap-2 text-left sm:gap-3">
          <Logo />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[0.95rem] font-bold text-ameixa-900">A Viagem do Alimento</span>
            <span className="hidden text-xs text-ameixa-500 sm:block">Conhecendo meu corpo por dentro</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Seções">
          {aba('capa', 'Início')}
          {aba('viagem', 'A viagem')}
          {aba('corpo', 'Meu corpo')}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button onClick={p.onRoteiro} className="btn-fantasma hidden px-3 lg:inline-flex" title="Roteiro pedagógico">
            <BookOpen className="h-4 w-4" />
            <span>Roteiro</span>
          </button>

          <button
            onClick={p.onMudo}
            className="btn-fantasma px-2.5"
            aria-pressed={p.mudo}
            aria-label={p.mudo ? 'Ativar som' : 'Desativar som'}
            title={p.mudo ? 'Som desligado' : 'Som ligado'}
          >
            {p.mudo ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setAberto((v) => !v)}
              className="btn-fantasma px-2.5"
              aria-expanded={aberto}
              aria-haspopup="dialog"
              aria-label="Opções de acessibilidade"
              title="Acessibilidade"
            >
              <Accessibility className="h-5 w-5" />
            </button>
            {aberto && (
              <div
                role="dialog"
                aria-label="Acessibilidade"
                className="cartao surgir absolute right-0 top-12 z-50 w-72 p-4 shadow-flutuante"
              >
                <p className="rotulo mb-3">Acessibilidade</p>

                <label className="flex items-center justify-between gap-3 py-2">
                  <span className="text-sm font-medium">Baixo estímulo</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-mar-600"
                    checked={p.baixoEstimulo}
                    onChange={(e) => p.onBaixoEstimulo(e.target.checked)}
                  />
                </label>
                <p className="-mt-1 pb-2 text-xs text-ameixa-500">Cores mais suaves e menos movimento.</p>

                <p className="pt-2 text-sm font-medium">Tamanho do texto</p>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-areia-100 p-1" role="radiogroup">
                  {(
                    [
                      ['normal', 'A'],
                      ['grande', 'A+'],
                      ['maior', 'A++']
                    ] as const
                  ).map(([f, r]) => (
                    <button
                      key={f}
                      role="radio"
                      aria-checked={p.fonte === f}
                      onClick={() => p.onFonte(f)}
                      className={`rounded-lg py-1.5 text-sm font-semibold ${
                        p.fonte === f ? 'bg-white shadow-suave' : 'text-ameixa-500'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={p.onPausa}
            className="btn-secundario ml-1 whitespace-nowrap px-2.5 sm:px-3.5"
            aria-label="Quero uma pausa"
            title="Quero uma pausa"
          >
            <PauseCircle className="h-5 w-5 text-mar-600 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Quero uma pausa</span>
          </button>
        </div>
      </div>

      {/* navegação no celular */}
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Seções">
        {aba('capa', 'Início')}
        {aba('viagem', 'A viagem')}
        {aba('corpo', 'Meu corpo')}
      </nav>
    </header>
  );
}
