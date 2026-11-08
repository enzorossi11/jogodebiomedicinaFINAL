# Guia de Inicialização do Projeto (INIT.md)

Este documento orienta o desenvolvedor ou o agente de IA a configurar a estrutura padrão de **Segundo Cérebro e Governança Operacional** em um novo repositório.

---

## 1. Criação Rápida da Árvore de Pastas e Arquivos

Execute o script correspondente ao seu sistema operacional para montar a estrutura base em poucos segundos.

### Bash / Zsh (Linux / macOS / WSL / Git Bash)

```bash
mkdir -p .agents/rules docs/domain docs/architecture docs/adr

touch AGENTS.md ROADMAP.md TASKS.md
touch docs/domain/glossary.md docs/domain/business-rules.md docs/domain/personas.md
touch docs/architecture/system-overview.md docs/architecture/data-model.md
touch docs/adr/README.md docs/adr/0000-template.md
```

### PowerShell (Windows)

```powershell
New-Item -ItemType Directory -Force -Path .agents/rules, docs/domain, docs/architecture, docs/adr

@('AGENTS.md', 'ROADMAP.md', 'TASKS.md',
  'docs/domain/glossary.md', 'docs/domain/business-rules.md', 'docs/domain/personas.md',
  'docs/architecture/system-overview.md', 'docs/architecture/data-model.md',
  'docs/adr/README.md', 'docs/adr/0000-template.md') | ForEach-Object {
    New-Item -ItemType File -Force -Path $_
}
```

---

## 2. Conteúdo Padrão dos Arquivos Iniciais

Preencha os arquivos criados com os modelos abaixo:

### `ROADMAP.md`
```markdown
# Roadmap do Projeto

## Fase 1: Fundação e Alinhamento de Contexto
- [ ] Mapeamento do domínio em `docs/domain/`
- [ ] Mapeamento da arquitetura técnica em `docs/architecture/`
- [ ] Configuração do pipeline de tarefas em `TASKS.md`

## Fase 2: Operação e Desenvolvimento Ativo
- [ ] Implementação das automações e fluxos operacionais
- [ ] Validações de regras de negócio

## Fase 3: Estabilização e Manutenção
- [ ] Documentação de casos de borda
- [ ] Otimização de rotinas repetitivas
```

### `TASKS.md`
```markdown
# Backlog Operacional e Tarefas

## Em Progresso (WIP)
- [ ] **BOOTSTRAP-01:** Preencher `AGENTS.md` com as variáveis do projeto.

## A Fazer (To Do)
- [ ] **DOC-01:** Documentar termos chave em `docs/domain/glossary.md`.
- [ ] **DOC-02:** Documentar arquitetura inicial em `docs/architecture/system-overview.md`.

## Concluído (Done)
- [x] Estrutura inicial do repositório gerada via `INIT.md`.
```

### `docs/adr/0000-template.md`
```markdown
# ADR [Número]: [Título Sucinto da Decisão]

- **Status:** [Proposta | Aceita | Rejeitada | Depreciada]
- **Data:** AAAA-MM-DD
- **Autores:** [Nomes dos Envolvidos]

## Contexto
Qual problema estamos tentando resolver? Quais restrições operacionais ou técnicas existem?

## Decisão Tomada
Qual caminho foi escolhido e por quê?

## Consequências
- **Positivas:** Ganhos operacionais, de clareza ou arquiteturais.
- **Negativas / Riscos:** Débito técnico introduzido, novas dependências ou complexidade adicional.
```

---

## 3. Checklist de Configuração Inicial (5 Minutos)

1. [ ] Crie a árvore de arquivos usando o script da **Seção 1**.
2. [ ] Copie o template do `AGENTS.md` e substitua as tags:
   - `{{PROJECT_NAME}}`
   - `{{PROJECT_DESCRIPTION}}`
   - `{{PRIMARY_STACK}}`
   - Natureza do projeto (`Greenfield` ou `Brownfield`).
3. [ ] Cole os esqueletos em `ROADMAP.md`, `TASKS.md` e `docs/adr/0000-template.md`.
4. [ ] Realize o commit inicial de estrutura:
   ```bash
   git add .
   git commit -m "docs: bootstrap repo operational second brain"
   ```