### 1. Arquitetura Gráfica & Three.js

* **Modularização do Monólito 3D (`Proposta1HD2DScene3D.tsx`):**
  * *Diagnóstico:* O arquivo possui mais de **1.600 linhas** e constrói todas as 9 estações anatômicas dentro de um único `useEffect`. Embora a visibilidade seja alternada, todas as geometrias e materiais coexistem em memória na mesma cena.
  * *Proposta:* Decompor a construção dos órgãos em submódulos ou fábricas de cena isoladas (ex: `stages/buildMouthStage.ts`, `stages/buildStomachStage.ts`), facilitando manutenção, testes visuais isolados e carregamento sob demanda.
* **Hitboxes de Raycasting Acessíveis para Coordenação Motora:**
  * *Diagnóstico:* Elementos interativos pequenos (como as 3 gotas de suco gástrico ou esferas de nutrientes) usam sua própria malha visual para o raycast do clique/toque.
  * *Proposta:* Adicionar *hit proxies* invisíveis (esferas ou caixas com escala 1.5x a 2x maiores na camada de interação), facilitando o toque em tablets ou para crianças com tremores ou dificuldades de motricidade fina.
* **Variação Visual Sutil do Bolo Alimentar por Alimento:**
  * *Diagnóstico:* Independente de escolher Maçã, Pão, Cenoura ou Ovo, o bolo alimentar triturado e em trânsito assume sempre o mesmo material dourado genérico.
  * *Proposta:* Modular suavemente a tonalidade e microdetalhes do sprite/material do bolo de acordo com o alimento escolhido (ex: nuances alaranjadas na cenoura, avermelhadas na maçã), reforçando a conexão pedagógica sem gerar poluição visual.

---

### 2. Acessibilidade Sensorial, Voz & UX Neurodivergente

* **Sincronização do SpeechSynthesis (`getVoices`) & Legendas Dinâmicas:**
  * *Diagnóstico:* Em navegadores baseados em Chromium/WebKit, `window.speechSynthesis.getVoices()` retorna vazio na primeira execução até que o evento assíncrono `onvoiceschanged` dispare. Além disso, quando o narrador fala, não há um destaque sincronizado das palavras na interface.
  * *Proposta:* 
    1. Implementar um listener defensivo para `onvoiceschanged` garantindo a seleção da voz `pt-BR` natural.
    2. Adicionar uma barra de legendas flutuante ou destaque visual do texto em leitura (crucial para crianças com TEA não-verbal, dislexia ou surdez parcial).
* **Persistência de Preferências do Usuário (`localStorage`):**
  * *Diagnóstico:* Ao recarregar a página, configurações como "Modo Baixo Estímulo", tamanho da fonte (`normal | large | xlarge`) e estado de mudo são resetadas.
  * *Proposta:* Persistir as configurações de acessibilidade no navegador para que a criança ou o mediador não precise reconfigurar a cada sessão.
* **Navegação 100% por Teclado e Foco Acessível (WCAG 2.2):**
  * *Diagnóstico:* Os objetos 3D dependem do ponteiro (mouse/toque).
  * *Proposta:* Garantir que a seleção de órgãos e os passos interativos possam ser disparados perfeitamente via teclas direcionais (`Tab`, `Shift+Tab`, `Enter`, `Espaço`), com anel de foco bem definido.

---

### 3. Arquitetura React & Gerenciamento de Estado

* **Desacoplamento do Estado das 9 Estações (`useProposta1State`):**
  * *Diagnóstico:* Atualmente, `App.tsx` e `Proposta1Viagem3D.tsx` controlam dezenas de estados dispersos (`bitePhase`, `chewCount`, `salivaAdded`, `swallowed`, `throatProgress`, `esoRingStep`, `gastricDrops`, etc.).
  * *Proposta:* Encapsular a máquina de estados da Proposta 1 em um hook customizado (`useProposta1Machine`), deixando os componentes puramente declarativos e facilitando a reinicialização limpa dos estágios.
* **Resiliência do Autoplay do Web Audio API:**
  * *Diagnóstico:* Se o usuário não tiver interagido com o DOM antes do primeiro som, navegadores modernos suspendem o `AudioContext`.
  * *Proposta:* Adicionar um "desbloqueador" silencioso global no primeiro toque em qualquer ponto da aplicação.

---

### 4. Domínio Pedagógico, Interocepção & CAA (Proposta 2)

* **Exportação do "Cartão do Dia" (Comunicação Presencial):**
  * *Diagnóstico:* A Proposta 2 permite à criança escolher sua região corporal, sensação e necessidade (ex: "Barriga" + "Desconfortável" + "Quero ajuda"), mas essa informação existe apenas de forma volátil na tela.
  * *Proposta:* Criar um botão "Gerar Cartão de Comunicação" que gere um resumo visual limpo (ou botão de impressão/compartilhamento) para a criança mostrar presencialmente aos pais, cuidadores ou professores.
* **Presença da Microbiota Intestinal no Intestino Grosso:**
  * *Diagnóstico:* O intestino grosso foca em água e fibras, mas a relação entre as fibras alimentares e as bactérias benéficas da flora intestinal (saúde e bem-estar) poderia ser ilustrada de forma carinhosa e sem medo (bactérias amigáveis em pixel art 16-bit).

---

### 5. Qualidade de Código & Governança

* **Testes Automatizados (Vitest):**
  * *Diagnóstico:* Não há suíte de testes configurada no projeto.
  * *Proposta:* Implementar testes unitários para as regras biológicas de [src/data/scriptData.ts](file:///c:/Users/bruno/OneDrive/Área%20de%20Trabalho/jogodebiomedicina/src/data/scriptData.ts), para o gerador de frequências de áudio (garantindo que nunca gere tons estridentes acima do limiar) e para o fluxo de ordenação sem julgamento do diorama.

---

Como você já conhece as melhorias necessárias que tinha em mente:
**O que achou desses pontos? Quais deles batem com o que você já identificou, e o que mais você gostaria de acrescentar antes de definirmos a ordem de execução?**