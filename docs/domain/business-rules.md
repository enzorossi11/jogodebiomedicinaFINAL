# Regras de Negócio e Diretrizes Pedagógicas (business-rules.md)

Este documento define as regras que regem a lógica das atividades, interações 3D e validações de conteúdo da plataforma.

---

## 1. Regras Pedagógicas e de Acessibilidade (Invioláveis)

### RN-A01: Sem Bloqueio de Navegação
- **Descrição:** O usuário nunca pode ficar "preso" em uma estação esperando uma ação obrigatória.
- **Implementação:** Os botões **"Voltar"** e **"Próximo órgão"** no dock de navegação devem permanecer habilitados em 100% do tempo.
- **Justificativa:** Crianças com TEA ou ansiedade podem se desregular se forem forçadas a executar tarefas sob pressão.

### RN-A02: Modo "Observar Sem Tocar"
- **Descrição:** Toda estação com mecânica interativa (ex: mastigar dentes, acionar anéis esofágicos, pingar suco gástrico) deve possuir um botão visível "Observar sem tocar".
- **Implementação:** Ao clicar em "Observar sem tocar", o sistema executa automaticamente a sequência visual completa de forma fluida, com duração suficiente para compreensão calma, marcando a etapa como concluída.

### RN-A03: Sem Julgamento Punitivo ("Sem Certo ou Errado")
- **Descrição:** Nenhuma tela da aplicação deve exibir símbolos de erro vermelho ("❌"), sons agudos de alerta ou mensagens de fracasso.
- **Implementação:**
  - Na atividade do Diorama Final (ordenação dos 5 órgãos), caso o usuário selecione uma posição fora da sequência anatômica, o sistema apenas realça o espaço correspondente com um contorno verde-menta estático e ilumina o modelo 3D correspondente, sem penalidades.
  - Nas sensações da Proposta 2, qualquer resposta escolhida é válida e acolhida.

### RN-A04: Acolhimento da Incerteza
- **Descrição:** Crianças neurodivergentes frequentemente têm dificuldade com alexitimia (dificuldade de nomear sentimentos) ou interocepção atípica.
- **Implementação:** A opção **"Não sei"** (para localização do corpo) e **"Não sei explicar"** (para tipo de sensação) deve ser tratada como uma resposta completa e de primeira classe, fornecendo validação positiva.

### RN-A05: Interrupção e Pausa Sensorial Imediata
- **Descrição:** O botão **"Quero uma pausa"** deve estar acessível e visível em todos os momentos na barra superior.
- **Implementação:** Ao ser clicado, sobrepõe imediatamente uma tela neutra de descanso, silencia qualquer áudio em reprodução e oferece respiração guiada ou saída calma.

---

## 2. Regras Biológicas e Sequenciamento Anatômico

### RN-B01: Sequência Canônica da Proposta 1
A jornada do alimento deve respeitar a ordem fisiológica exata:
1. **Boca:** Mastigação trituradora (dentes) + lubrificação e amilase (saliva).
2. **Esôfago:** Condução peristáltica em 3 zonas com proteção da epiglote.
3. **Estômago:** Ação do ácido clorídrico e pepsina (digestão proteica) formando o quimo.
4. **Intestino Delgado:** Absorção dos macronutrientes e micronutrientes pelas vilosidades para os vasos sanguíneos.
5. **Intestino Grosso:** Reabsorção de água e trânsito fecal auxiliado por fibras.
6. **Diorama Final:** Revisão integrada e espacial dos 5 órgãos no tronco translúcido.

### RN-B02: Especificidade dos Alimentos
Cada alimento selecionado na tela inicial altera os diálogos e destaques biológicos:
- **Maçã:** Foco nas fibras vegetais que auxiliam a formação do bolo e a motilidade intestinal.
- **Pão Fatiado:** Foco no amido e na digestão enzimática acelerada pela amilase na saliva da boca.
- **Cenoura:** Foco na textura crocante, fibras e betacaroteno (vitamina A) absorvido no intestino delgado.
- **Ovo:** Foco nas proteínas de alto valor biológico e sua quebra química prioritária no estômago.

---

## 3. Regras de Design Gráfico e Áudio

### RN-D01: Proibição de Estroboscópio e Flashes
- Coeficiente de contraste e transições de cor devem evitar oscilações em frequências perigosas para fotossensibilidade (entre 3 Hz e 50 Hz).

### RN-D02: Áudio em Frequência Harmoniosa
- Sfx de sucesso ou confirmação utilizam frequências suaves (528 Hz - frequência do tom do amor/calma) ou acordes pentatônicos sem ataque percussivo brusco.

