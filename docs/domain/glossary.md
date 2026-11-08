# Glossário do Domínio — Conhecendo Meu Corpo Por Dentro

Termos fundamentais das áreas de **Biomedicina**, **Pedagogia Inclusiva**, **Acessibilidade Sensorial** e **Tecnologia 3D** utilizados no projeto.

---

## 1. Biomedicina e Fisiologia Humana

- **Amido:** Carboidrato complexo presente em alimentos como o pão fatiado. Sua quebra inicial ocorre na boca pela enzima amilase salivar.
- **Bolo Alimentar:** Massa macia e úmida formada pelo alimento triturado pelos dentes e misturado com a saliva na cavidade bucal.
- **Cárdia:** Válvula muscular situada na transição entre o esôfago e o estômago, impedindo o refluxo gástrico.
- **Epiglote:** Estrutura cartilaginosa que fecha a traqueia durante a deglutição, direcionando o alimento com segurança para o esôfago.
- **Esôfago:** Tubo muscular que conduz o bolo alimentar da faringe até o estômago através de contrações coordenadas (peristaltismo).
- **Fibras Alimentares:** Componentes vegetais (ex: pectina da maçã, celulose da cenoura) não digeríveis pelas enzimas humanas, fundamentais para a formação adequada do bolo fecal e motilidade intestinal.
- **Interocepção:** Sentido responsável por perceber, decodificar e interpretar os sinais e sensações originados dentro do próprio corpo (fome, sede, dor, temperatura, cansaço, frequência cardíaca).
- **Intestino Delgado:** Principal órgão de digestão e absorção de macronutrientes (carboidratos, aminoácidos, lipídios) e micronutrientes (vitaminas e minerais), composto por duodeno, jejuno e íleo.
- **Intestino Grosso:** Segmento final do trato digestório responsável pela absorção de água, eletrólitos, ação da microbiota intestinal e direcionamento dos resíduos para eliminação.
- **Peristaltismo (Movimentos Peristálticos):** Ondas suaves e ritmadas de contração e relaxamento da musculatura lisa do trato digestório que empurram o alimento.
- **Quimo:** Mistura semilíquida e ácida formada no estômago após a ação dos sucos gástricos e enzimas digestivas sobre o bolo alimentar.
- **Vilosidades Intestinais:** Pequenas projeções microscópicas na mucosa do intestino delgado que multiplicam a área de contato com os nutrientes para facilitar a absorção sanguínea.

---

## 2. Acessibilidade, Neurodivergência e Comunicação

- **CAA (Comunicação Aumentativa e Alternativa):** Conjunto de ferramentas, recursos e estratégias visuais (como cartões, símbolos e aplicativos) que complementam ou substituem a fala falada.
- **Defesa Sensorial / Sobrecarga Sensorial (Sensory Overload):** Estado de exaustão ou desconforto agudo causado pelo excesso de estímulos visuais (luzes fortes, piscadas), auditivos (sons altos, alarmes) ou táteis.
- **Modo Baixo Estímulo:** Configuração da aplicação que reduz contrastes excessivos, desativa movimentos secundários e garante um fundo de menor intensidade luminosa.
- **Neurodivergência:** Variações naturais no funcionamento neurológico humano, abrangendo TEA (Transtorno do Espectro Autista), TDAH (Transtorno do Déficit de Atenção com Hiperatividade), TOC, Dislexia, entre outros.
- **Observar Sem Tocar:** Funcionalidade pedagógica que permite ao aprendiz assistir à animação biológica completa sem a necessidade de clicar, arrastar ou interagir diretamente, acolhendo sensibilidades motoras ou períodos de baixa energia.

---

## 3. Tecnologia e Computação Gráfica

- **HD-2D:** Estilo visual que mescla cenários e órgãos anatômicos tridimensionais (renderizados com Three.js e iluminação PBR) com sprites em pixel art 16-bit com recorte alfa nítido (`NearestFilter`).
- **InstancedMesh:** Técnica no Three.js para renderizar centenas ou milhares de geometrias idênticas (como as vilosidades intestinais) em uma única chamada de desenho (draw call), preservando o desempenho de GPU em dispositivos móveis.
- **PBR (Physically Based Rendering):** Modelo de sombreamento que simula a física real de reflexão e dispersão de luz em materiais anatômicos, conferindo profundidade sem necessidade de iluminação estroboscópica.
