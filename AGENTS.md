# AGENTS.md — Diretrizes de Governança para Agentes de IA

> **Projeto:** Conhecendo Meu Corpo Por Dentro — Viagem do Lanche (Three.js HD-2D)  
> **Natureza:** Brownfield (Aplicação funcional em expansão)  
> **Stack Primária:** React 19, Three.js (WebGL), TypeScript, Vite, Tailwind CSS v4, Lucide React, Motion  
> **Vínculo Institucional:** Projeto BioDesign Inclusivo (FMU 2026.2)

---

## 1. Visão Geral e Propósito

Esta plataforma educacional interativa une visualização anatômica tridimensional (Three.js WebGL) e estética nostálgica/inclusiva em pixel art 16-bit com recorte alfa (HD-2D). O objetivo principal é ensinar fisiologia digestiva, promover a interocepção (reconhecimento de sinais corporais internos) e fornecer Comunicação Aumentativa e Alternativa (CAA) para crianças e adolescentes neurodivergentes (**TEA, TDAH, TOC, Dislexia e Deficiência Intelectual**).

---

## 2. Princípios Inegociáveis de Acessibilidade e Conforto Sensorial

Ao implementar código, refatorar ou adicionar novos componentes ou cenas 3D, **todo agente de IA deve seguir rigorosamente as regras abaixo**:

1. **Zero Luzes Piscantes / Flashes:**
   - Proibido o uso de luzes estroboscópicas, efeitos de tela piscante, transições agressivas ou animações em loop rápido.
   - Transições de cores devem ser graduais (mínimo de 300ms) e tons pastéis/calmos.

2. **Zero Sons Obrigatórios e Sem Sons Bruscos:**
   - Toda a aplicação deve funcionar de forma 100% autônoma e compreensível sem som.
   - Qualquer áudio implementado deve ser calmante (ex: ondas senoidais puras de 528 Hz ou narração acolhedora em velocidade reduzida).
   - O botão de mudo deve ser instantâneo e ter efeito global.

3. **Participação Voluntária e Sem Bloqueios:**
   - Botões de navegação (**Voltar** e **Próximo órgão**) devem estar **sempre desbloqueados**.
   - Toda etapa interativa deve disponibilizar o modo **"Observar sem tocar"**, executando a animação de forma passiva para usuários com sensibilidade motora ou tátil.

4. **Zero Julgamento Punitivo ("Sem Certo ou Errado"):**
   - Na ordenação do diorama 3D ou no reconhecimento de sensações corporais, nunca exibir mensagens em vermelho, sons de erro estridentes ("buzzer") ou animações de "X".
   - Use sugestões acolhedoras com contornos verdes-menta suaves e feedback afirmativo.

5. **Acolhimento da Incerteza:**
   - Mantenha sempre presentes as opções **"Não sei"** e **"Não sei explicar"**. Elas possuem o mesmo peso e valor pedagógico que qualquer outra resposta.

6. **Botão de Descanso Sempre Visível:**
   - O botão **"Quero uma pausa"** deve estar acessível em todas as telas, abrindo imediatamente a tela de descompressão sensorial.

---

## 3. Arquitetura Técnica e Padrões de Código

- **Linguagem & Tipagem:** TypeScript estrito (`strict: true`). Não utilizar `any` sem justificativa formal.
- **Renderização 3D:** Three.js utilizando `<canvas>` isolado, limpeza explícita de geometrias/materiais/texturas no `useEffect` de desmontagem para evitar vazamento de memória WebGL.
- **Estilização:** Tailwind CSS v4. Evitar `backdrop-filter` pesado sobre telas que sobreponham o canvas WebGL para não degradar a taxa de quadros (FPS).
- **Gerenciamento de Estado:** Estados locais do React combinados com interfaces tipadas centralizadas em [src/data/scriptData.ts](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/src/data/scriptData.ts).

---

## 4. Estrutura de Documentação e Segundo Cérebro

- [ROADMAP.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/ROADMAP.md): Planejamento estratégico e evolução das propostas.
- [TASKS.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/TASKS.md): Backlog operacional, bugs e melhorias ativas.
- `docs/domain/`:
  - [glossary.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/docs/domain/glossary.md): Glossário terminológico (biomedicina, acessibilidade, neurodivergência).
  - [business-rules.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/docs/domain/business-rules.md): Regras pedagógicas, biológicas e sensoriais.
  - [personas.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/docs/domain/personas.md): Personas atendidas e perfis sensoriais.
- `docs/architecture/`:
  - [system-overview.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/docs/architecture/system-overview.md): Visão geral do sistema e integração Three.js/React.
  - [data-model.md](file:///c:/Users/bruno/OneDrive/Área de Trabalho/jogodebiomedicina/docs/architecture/data-model.md): Modelos de dados e interfaces do sistema.
- `docs/adr/`: Registros de Decisões Arquiteturais (Architectural Decision Records).

---

## 5. Guia Rápido de Comandos

```bash
# Instalação com resolução de dependências
npm install --legacy-peer-deps

# Desenvolvimento local (porta 3000)
npm run dev

# Validação de tipos TypeScript
npm run lint

# Build de produção
npm run build
```
