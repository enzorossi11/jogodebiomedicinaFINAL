# ADR 0001: Adoção do Three.js HD-2D e Governança de Conforto Sensorial

- **Status:** Aceita
- **Data:** 2026-11-08
- **Autores:** Equipe BioDesign Inclusivo & Antigravity

---

## Contexto
O projeto "Conhecendo Meu Corpo Por Dentro" requer visualizações espaciais anatômicas tridimensionais para o ensino do sistema digestório e interocepção corporal, mas atende um público sensível: crianças e adolescentes neurodivergentes (TEA, TDAH, TOC, Dislexia e Deficiência Intelectual). 

Modelos 3D puramente realistas ou hiper-detalhados podem ser visualmente aversivos ou sobrecarregar cognitivamente esse público. Por outro lado, ilustrações 2D estáticas não proporcionam a noção de profundidade e caminho espacial dos órgãos. Além disso, a aplicação precisa rodar em navegadores e tablets sem exigir hardware de jogos dedicado.

---

## Decisão Tomada
1. **Estilo Gráfico HD-2D:**
   - Combinar órgãos esculturais 3D renderizados em Three.js com iluminação PBR suave e sprites autorais em pixel art 16-bit com recorte alfa automático e `NearestFilter`.
   - Essa abordagem une clareza anatômica, estética acolhedora e nostálgica, e baixíssima carga sensorial.

2. **Integração Direta React 19 + Three.js:**
   - Utilizar canvas dedicado controlado por `useRef` e `useEffect`, dispensando abstrações pesadas para manter controle total sobre a taxa de quadros e o descarte de memória (`dispose`).

3. **Governança Sensorial Rígida:**
   - Proibição de flashes, sons agudos ou contagens regressivas.
   - Navegação sempre desbloqueada ("Voltar" e "Próximo órgão") e botão "Observar sem tocar" em todas as estações.
   - Validação sem punição ("sem certo ou errado").

---

## Consequências
- **Positivas:**
  - Experiência visual altamente acolhedora, inclusiva e lúdica.
  - Baixa sobrecarga de renderização na GPU (compatível com tablets escolares).
  - Controle explícito de acessibilidade sensorial.
- **Negativas / Riscos:**
  - Gerenciamento manual do ciclo de vida dos objetos Three.js (`dispose`) requerido em cada componente para evitar vazamento de memória WebGL.
  - Necessidade de manter compatibilidade de peer dependencies entre Vite e esbuild.
