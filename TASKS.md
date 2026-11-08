# Backlog Operacional e Tarefas (TASKS.md)

Quadro de tarefas operacionais, melhorias e débitos técnicos do projeto.

---

## Em Progresso (WIP)
- [x] **BOOTSTRAP-01:** Estruturar segundo cérebro e governança operacional via `INIT.md` / `guia_de_inicializa_o_do_reposit_rio.md`.
- [x] **BOOTSTRAP-02:** Documentar arquitetura do sistema e modelo de dados em `docs/architecture/`.
- [x] **BOOTSTRAP-03:** Documentar personas, regras de negócio e glossário em `docs/domain/`.

## A Fazer (To Do)

### Qualidade e Desempenho
- [ ] **PERF-01:** Auditar descarte de instâncias Three.js (`dispose()` em geometrias, materiais e texturas) nas trocas de tela da Proposta 1 e Proposta 2.
- [ ] **PERF-02:** Otimizar `vite.config.ts` substituindo `__dirname` por `import.meta.dirname` para conformidade com futuras versões do Vite.
- [ ] **PERF-03:** Configurar chunk splitting no Rollup/Vite para pacotes acima de 500 kB (Three.js e Lucide).

### Acessibilidade e Interação
- [ ] **A11Y-01:** Adicionar suporte a navegação completa via teclado (Tab e Enter) em todas as estações do modelo 3D.
- [ ] **A11Y-02:** Implementar legendas sincronizadas em tela durante a leitura por áudio do narrador calmo.

### Conteúdo Pedagógico
- [ ] **PEDAG-01:** Adicionar feedback visual sobre a digestão de água no intestino grosso para o alimento "Cenoura".
- [ ] **PEDAG-02:** Expandir a seleção de alimentos no [FoodSelector.tsx](file:///c:/Users/bruno/OneDrive/Área%20de%20Trabalho/jogodebiomedicina/src/components/FoodSelector.tsx) com propriedades nutricionais ampliadas.

## Concluído (Done)
- [x] Clonagem e configuração do repositório no ambiente local.
- [x] Resolução de conflito de dependências entre `vite` e `esbuild` com `--legacy-peer-deps`.
- [x] Validação do build de produção (`npm run build`) com sucesso em 608ms.
- [x] Criação de `AGENTS.md`, `ROADMAP.md` e esqueleto de documentação `docs/`.
