import { ArrowRight, Ear, Eye, HandHeart, Hourglass, MessageCircleHeart, Volume2 } from 'lucide-react';
import { FOOD_OPTIONS, type FoodOption } from './FoodSelector';

interface Props {
  onComecar: (alimento: FoodOption) => void;
  onMeuCorpo: () => void;
  onRoteiro: () => void;
}

const COMPROMISSOS = [
  { icone: Volume2, titulo: 'Sem som obrigatório', texto: 'Tudo funciona em silêncio. O áudio é opcional e desliga na hora.' },
  { icone: Eye, titulo: 'Sem luz piscante', texto: 'Cores calmas, movimentos lentos e nenhum flash.' },
  { icone: Hourglass, titulo: 'Sem pressa', texto: 'Não há cronômetro. Voltar e avançar ficam sempre livres.' },
  { icone: HandHeart, titulo: 'Sem certo ou errado', texto: 'Nenhuma resposta é punida. Dá para só observar, sem tocar.' }
];

export function Capa(p: Props) {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/* ------------------------------------------------------------ herói */}
      <section className="grid items-center gap-10 pt-10 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="surgir">
          <p className="rotulo">Sistema digestório · Educação em saúde inclusiva</p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-ameixa-900 sm:text-5xl lg:text-6xl">
            Acompanhe o seu lanche numa viagem por dentro do corpo.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ameixa-700">
            Escolha um alimento e veja, em 3D, o que acontece com ele da boca até o intestino. Cada etapa
            pode ser tocada ou só observada, no seu ritmo, sem pressa e sem respostas erradas.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={() => p.onComecar(FOOD_OPTIONS[0])} className="btn-primario btn-grande">
              Começar a viagem
              <ArrowRight className="h-5 w-5" />
            </button>
            <button onClick={p.onRoteiro} className="btn-fantasma btn-grande">
              Ver o roteiro pedagógico
            </button>
          </div>
          <p className="mt-4 text-sm text-ameixa-500">
            Feito para crianças e adolescentes neurodivergentes, com ou sem apoio de um mediador.
          </p>
        </div>

        {/* a mesa: escolha o alimento já na capa */}
        <div className="cartao surgir p-5 sm:p-7" style={{ animationDelay: '80ms' }}>
          <p className="rotulo">Escolha um alimento para começar</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {FOOD_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => p.onComecar(a)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-areia-200 bg-areia-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-mar-300 hover:bg-white hover:shadow-suave"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-suave">
                  {a.svgIcon}
                </span>
                <span>
                  <span className="block text-base font-bold text-ameixa-900">{a.name}</span>
                  <span className="block text-sm text-ameixa-500">{a.nutrientMain}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- como funciona */}
      <section className="mt-20">
        <p className="rotulo">Como funciona</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Uma viagem em seis paradas</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Boca', 'Os dentes trituram e a saliva começa a digerir o amido.'],
            ['Garganta', 'A epiglote fecha o caminho do ar para o alimento descer em segurança.'],
            ['Esôfago', 'Ondas musculares empurram o bolo alimentar até o estômago.'],
            ['Estômago', 'Os sucos gástricos misturam tudo e começam a quebrar as proteínas.'],
            ['Intestino delgado', 'As vilosidades absorvem os nutrientes e passam para o sangue.'],
            ['Intestino grosso', 'A água volta para o corpo e as fibras ajudam no resto do caminho.']
          ].map(([t, d], i) => (
            <li key={t} className="cartao flex gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mar-100 text-base font-bold text-mar-800">
                {i + 1}
              </span>
              <span>
                <span className="block font-bold text-ameixa-900">{t}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ameixa-700">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------- compromissos */}
      <section className="mt-20 rounded-3xl bg-ameixa-900 p-8 text-white sm:p-10">
        <p className="rotulo text-mar-300">Conforto sensorial</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">
          Pensado para quem precisa de calma e previsibilidade.
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMPROMISSOS.map(({ icone: Icone, titulo, texto }) => (
            <div key={titulo}>
              <Icone className="h-6 w-6 text-mar-300" />
              <p className="mt-3 font-bold">{titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- meu corpo */}
      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <button
          onClick={p.onMeuCorpo}
          className="cartao group flex items-start gap-5 p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-flutuante"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pessego-100 text-pessego-500">
            <MessageCircleHeart className="h-6 w-6" />
          </span>
          <span>
            <span className="rotulo">Atividade complementar</span>
            <span className="mt-1 block text-xl font-bold">Meu corpo está falando comigo</span>
            <span className="mt-1 block text-sm leading-relaxed text-ameixa-700">
              Tocar numa parte do corpo, reconhecer uma sensação e dizer do que precisa. Sem respostas
              certas ou erradas, com a opção “não sei” sempre à mão.
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-mar-700">
              Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>

        <button
          onClick={p.onRoteiro}
          className="cartao group flex items-start gap-5 p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-flutuante"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mar-100 text-mar-700">
            <Ear className="h-6 w-6" />
          </span>
          <span>
            <span className="rotulo">Para mediadores</span>
            <span className="mt-1 block text-xl font-bold">Roteiro pedagógico</span>
            <span className="mt-1 block text-sm leading-relaxed text-ameixa-700">
              Objetivo de cada etapa, o que dizer, os cuidados sensoriais e o documento do projeto
              BioDesign Inclusivo (FMU) para baixar.
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-mar-700">
              Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>
      </section>
    </main>
  );
}
