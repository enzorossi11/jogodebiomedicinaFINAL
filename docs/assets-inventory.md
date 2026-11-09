# Inventário e Controle de Assets (assets-inventory.md)

Este documento registra o catálogo completo de assets visuais da plataforma **Conhecendo Meu Corpo Por Dentro**, especificando seu status de produção, formato, resolução recomendada e caminhos canônicos no repositório.

---

## 1. Convenção de Status

| Símbolo | Significado | Ação Necessária |
| :---: | :--- | :--- |
| 🟢 | **Oficial (Pronto)** | Asset final com canal alfa nativo em produção. |
| 🟡 | **Provisório (Teste)** | Asset temporário em uso (requer recorte ou substituição por PNG oficial). |
| 🔴 | **Pendente (Falta produzir)** | Asset ainda não existente no repositório. |

---

## 2. Inventário por Módulo

### A. Alimentos 16-Bit — Proposta 1 (`public/assets/2d/foods/`)
*Objetivo:* Representar os alimentos na mesa de escolha, no prato, na mão do braço 3D e na cavidade oral.

| Asset ID | Nome do Arquivo Oficial | Arquivo Atual (Fallback) | Status | Dimensões | Descrição / Estilo |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `food-apple` | `apple.png` | `apple-test.jpg` | 🟢 | 128×128 | Maçã vermelha com cabinho verde, contorno `#1E1B2E`, fundo transparente oficial. |
| `food-apple-bitten` | `apple-bitten.png` | `apple-bitten-test.jpg` | 🟢 | 128×128 | Maçã com mordida lateral revelando a polpa amarelada autoral. |
| `food-bread` | `bread.png` | `bread-test.jpg` | 🟢 | 128×128 | Pão fatiado com casca marrom-dourada e miolo claro oficial. |
| `food-bread-bitten` | `bread-bitten.png` | `bread-bitten-test.jpg` | 🟢 | 128×128 | Fatia de pão com mordida no canto superior autoral. |
| `food-carrot` | `carrot.png` | `carrot-test.jpg` | 🟢 | 128×128 | Cenoura cônica laranja com ramas verdes no topo oficial. |
| `food-carrot-bitten` | `carrot-bitten.png` | `carrot-bitten-test.jpg` | 🟢 | 128×128 | Cenoura com mordida na extremidade autoral. |
| `food-egg` | `egg.png` | `egg-test.jpg` | 🟢 | 128×128 | Metade de ovo cozido com clara branca e gema dourada oficial. |
| `food-egg-bitten` | `egg-bitten.png` | `egg-bitten-test.jpg` | 🟢 | 128×128 | Ovo cozido com mordida na clara autoral. |

*Fase Futura (Roadmap):*
- [ ] `banana.png` / `banana-bitten.png` (Potássio e energia)
- [ ] `beans.png` / `beans-bitten.png` (Ferro e fibras)
- [ ] `yogurt.png` / `yogurt-bitten.png` (Cálcio e probióticos)

---

### B. Fluidos e Partículas Fisiológicas (`public/assets/2d/fluids-particles/`)
*Objetivo:* Ilustrar secreções digestivas, enzimas e transporte de nutrientes sem cores aversivas ou agressivas.

| Asset ID | Nome do Arquivo Oficial | Arquivo Atual (Fallback) | Status | Dimensões | Descrição / Estilo |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `fluid-saliva` | `saliva-drop.png` | `saliva-drop-test.jpg` | 🟢 | 48×48 | Gota translúcida azul-celeste suave com brilho especular branco (amilase). |
| `fluid-gastric` | `gastric-drop.png` | `gastric-drop.jpg` | 🟢 | 48×48 | Gota translúcida âmbar/menta suave dedicada (pepsina e ácido gástrico). |
| `fluid-water` | `water-drop.png` | `water-drop-test.jpg` | 🟢 | 48×48 | Gota límpida azul-clara dedicada (reabsorção hídrica no intestino grosso). |
| `particle-carb` | `nutrient-energy.png` | `nutrient-energy-test.jpg` | 🟢 | 48×48 | Esfera radiante amarela/dourada suave autoral (amido/carboidrato). |
| `particle-protein` | `nutrient-protein.png` | `nutrient-protein-teste.jpg` | 🟢 | 48×48 | Esfera radiante lilás/azul autoral (proteínas/aminoácidos). |
| `particle-vitamin` | `nutrient-vitamin.png` | `nutrient-vitamin-test.jpg` | 🟢 | 48×48 | Esfera radiante verde-menta autoral (vitaminas e minerais). |

---

### C. Órgãos e Elementos de HUD (`public/assets/2d/organs-hud/`)
*Objetivo:* Identificação rápida das estações anatômicas no dock de navegação e no diorama final.

| Asset ID | Nome do Arquivo Oficial | Arquivo Atual (Fallback) | Status | Dimensões | Descrição / Estilo |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `hud-mouth` | `organ-mouth.png` | *(SVG inline)* | 🟡 | 32×32 ou SVG | Boca amigável com dentes claros e lábios serenos. |
| `hud-throat` | `organ-throat.png` | *(SVG inline)* | 🟡 | 32×32 ou SVG | Garganta evidenciando a epiglote protetora. |
| `hud-esophagus` | `organ-esophagus.png` | `esophagus-tube-test.jpg` | 🟡 | 32×32 ou SVG | Tubo muscular com anéis peristálticos suaves. |
| `hud-stomach` | `organ-stomach.png` | *(SVG inline)* | 🟡 | 32×32 ou SVG | Estômago em "J" com interior calmo. |
| `hud-small-intestine` | `organ-small-intestine.png` | *(SVG inline)* | 🟡 | 32×32 ou SVG | Alças do intestino delgado com padrão de vilosidades. |
| `hud-large-intestine` | `organ-large-intestine.png` | *(SVG inline)* | 🟡 | 32×32 ou SVG | Moldura do cólon (ascendente, transverso, descendente). |
| `hud-full-tract` | `organ-full-tract.png` | *(SVG inline)* | 🟡 | 48×48 ou SVG | Tronco translúcido integrando todos os 5 órgãos. |

---

### D. Cartões de Comunicação e Interocepção — CAA (`public/assets/2d/caa-cards/`)
*Objetivo:* Facilitar a expressão de sentimentos corporais e necessidades para crianças neurodivergentes.

| Asset ID | Nome do Arquivo Oficial | Status | Dimensões | Descrição / Estilo |
| :--- | :--- | :---: | :--- | :--- |
| `body-head` | `body-head.png` | 🔴 | 128×128 | Pictograma acolhedor da cabeça/mente. |
| `body-chest` | `body-chest.png` | 🔴 | 128×128 | Pictograma do peito/respiração e coração. |
| `body-belly` | `body-belly.png` | 🔴 | 128×128 | Pictograma da barriga/digestão. |
| `body-hands` | `body-hands.png` | 🔴 | 128×128 | Pictograma das mãos e dedos. |
| `body-feet` | `body-feet.png` | 🔴 | 128×128 | Pictograma dos pés e apoio no solo. |
| `body-unknown` | `body-unknown.png` | 🔴 | 128×128 | Símbolo neutro para "Não sei a região". |
| `sensation-calm` | `sensation-calm.png` | 🔴 | 128×128 | Sensação Confortável (verde-esmeralda suave). |
| `sensation-discomfort` | `sensation-discomfort.png` | 🔴 | 128×128 | Sensação Desconfortável (laranja acolhedor sem alarme). |
| `sensation-hot` | `sensation-hot.png` | 🔴 | 128×128 | Sensação de Calor (âmbar quente). |
| `sensation-cold` | `sensation-cold.png` | 🔴 | 128×128 | Sensação de Frio (azul-celeste). |
| `sensation-tingle` | `sensation-tingle.png` | 🔴 | 128×128 | Formigamento / vibração (lilás suave). |
| `sensation-unnamed` | `sensation-unnamed.png` | 🔴 | 128×128 | Não sei explicar (cinza ardósia acolhedor). |
| `action-help` | `action-help.png` | 🔴 | 128×128 | "Quero ajuda" (mão estendida serena). |
| `action-pause` | `action-pause.png` | 🔴 | 128×128 | "Quero uma pausa" (espaço calmo de descanso). |
| `action-explore` | `action-explore.png` | 🔴 | 128×128 | "Continuar explorando" (olho curioso amigável). |

---

### E. Texturas 3D — Three.js (`public/assets/3d/textures/`)
*Objetivo:* Mapeamento de materiais orgânicos com iluminação PBR.

| Asset ID | Nome do Arquivo Oficial | Arquivo Atual (Fallback) | Status | Dimensões | Descrição / Estilo |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `tex-esophagus-mucosa` | `esophagus-mucosa.png` | `esophagus-mucosa-test.jpg` | 🟡 | 512×512 | Textura contínua (*seamless*) de mucosa esofágica rosada. |
| `tex-stomach-lining` | `stomach-lining.png` | *(material procedural)* | 🔴 | 512×512 | Textura suave de rugas gástricas. |

---

### F. Documentos de Referência (`public/assets/docs/`)

| Nome do Arquivo | Status | Descrição |
| :--- | :---: | :--- |
| `projeto-biodesign-fmu.pdf` | 🟢 | Documento oficial de validação científica e pedagógica do projeto FMU. |

---

## 3. Como Substituir um Asset Provisório por um Oficial

1. Crie o arquivo PNG com fundo transparente seguindo as dimensões especificadas.
2. Salve o arquivo na pasta correspondente com o **Nome do Arquivo Oficial** (ex: `public/assets/2d/foods/apple.png`).
3. Abra este documento e altere o status de 🟡 para 🟢.
4. O sistema detectará e carregará automaticamente o novo arquivo com transparência nativa!

