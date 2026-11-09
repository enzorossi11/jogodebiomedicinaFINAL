# Backlog Operacional e Tarefas (TASKS.md)

Quadro de tarefas operacionais, melhorias e débitos técnicos do projeto.

---

## Em Progresso (WIP)
- [x] **BOOTSTRAP-01:** Estruturar segundo cérebro e governança operacional via `INIT.md` / `guia_de_inicializa_o_do_reposit_rio.md`.
- [x] **BOOTSTRAP-02:** Documentar arquitetura do sistema e modelo de dados em `docs/architecture/`.
- [x] **BOOTSTRAP-03:** Documentar personas, regras de negócio e glossário em `docs/domain/`.

## A Fazer (To Do)

### Qualidade e Desempenho
- [x] **PERF-01:** Modularizar o monólito Three.js (`Proposta1HD2DScene3D.tsx`) em 9 submódulos dedicados em `src/components/three/stations/`.
- [x] **PERF-02:** Otimizar `vite.config.ts` substituindo `__dirname` por `import.meta.dirname` para conformidade com futuras versões do Vite.
- [x] **PERF-03:** Configurar chunk splitting no Rollup/Vite para pacotes acima de 500 kB (Three.js e Lucide).

### Acessibilidade e Interação
- [ ] **A11Y-01:** Adicionar suporte a navegação completa via teclado (Tab e Enter) em todas as estações do modelo 3D.
- [x] **A11Y-02:** Implementar legendas sincronizadas em tela durante a leitura por áudio do narrador calmo (`ClosedCaptionBanner.tsx`).
- [x] **A11Y-03:** Persistência de preferências de acessibilidade (`lowSensory`, `isMuted`, `fontSize`) no `localStorage`.

### Conteúdo Pedagógico
- [ ] **PEDAG-01:** Adicionar feedback visual sobre a digestão de água no intestino grosso para o alimento "Cenoura".
- [ ] **PEDAG-02:** Expandir a seleção de alimentos no [FoodSelector.tsx](file:///c:/Users/bruno/OneDrive/Área%20de%20Trabalho/jogodebiomedicina/src/components/FoodSelector.tsx) com propriedades nutricionais ampliadas.

## Concluído (Done)
- [x] Clonagem e configuração do repositório no ambiente local.
- [x] Resolução de conflito de dependências entre `vite` e `esbuild` com `--legacy-peer-deps`.
- [x] Validação do build de produção (`npm run build`) com sucesso em 608ms.
- [x] Criação de `AGENTS.md`, `ROADMAP.md` e esqueleto de documentação `docs/`.
- [x] **ASSETS-01:** Reestruturação da arquitetura de pastas de assets (`public/assets/2d/`, `3d/`, `docs/`) e remoção da pasta legada `aistudio`.
- [x] **ASSETS-02:** Criação do catálogo canônico tipado [src/data/assetCatalog.ts](file:///c:/Users/bruno/OneDrive/Área%20de%20Trabalho/jogodebiomedicina/src/data/assetCatalog.ts) e inventário de controle [docs/assets-inventory.md](file:///c:/Users/bruno/OneDrive/Área%20de%20Trabalho/jogodebiomedicina/docs/assets-inventory.md).

