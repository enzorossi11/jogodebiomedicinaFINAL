# Conhecendo Meu Corpo Por Dentro — Viagem do Lanche (Three.js HD-2D)

Plataforma educacional interativa em **Three.js (WebGL 3D)** voltada à educação em saúde, ciências e comunicação acolhedora para crianças e adolescentes neurodivergentes (**TEA, TDAH, TOC, Dislexia e Deficiência Intelectual**), alinhada ao projeto **BioDesign Inclusivo (FMU)**.

---

## Módulos Interativos em Three.js

### 1. Proposta 1 — A Viagem do Alimento (Estilo HD-2D: Órgãos 3D + Assets 16-Bit)
Jornada espacial 3D completa por todas as etapas do sistema digestório combinando órgãos 3D esculpidos com iluminação PBR (`RoomEnvironment`) e os **6 assets 16-bit autorais** recortados com nitidez pixelada (`NearestFilter`):
- **Mesa 3D de Escolha:** Maçã (fibras), Pão fatiado (amido), Cenoura (vitamina A e fibras) e Ovo (proteínas).
- **Primeira Mordida em 3D:** Braço articulado 3D que pega o alimento no prato, leva até a boca 3D e realiza a mordida.
- **Boca, Garganta e Epiglote 3D:** Mastigação nos dentes 3D, gotas de saliva 16-bit e fechamento protetor da epiglote sobre a traqueia.
- **Esôfago 3D com Textura e Tubo 16-Bit:** Ondas peristálticas suaves em 3 anéis musculares.
- **Estômago, Intestino Delgado e Intestino Grosso 3D:** Sucos gástricos, 36 vilosidades intestinais (`InstancedMesh`) para absorção de nutrientes e reabsorção de gotas de água 16-bit.
- **Sequência Final no Tronco 3D Translúcido:** Organização acolhedora dos 5 órgãos sem mensagens punitivas de erro.

### 2. Proposta 2 — Meu Corpo Está Falando Comigo (Interocepção 3D & CAA)
- Modelo corporal escultural 3D em Three.js com seleção por toque/clique em **Cabeça, Peito, Barriga, Mãos, Pés** ou a opção acolhedora **"Não sei"**.
- Reconhecimento de sensações (**Confortável, Desconfortável, Quente, Frio, Formigamento, Não sei explicar**) sem respostas certas ou erradas.
- Expressão de necessidades (**Quero ajuda, Quero uma pausa, Continuar explorando**) + **Painel de Cartões Presencial**.

---

## Compromissos de Conforto Sensorial e Acessibilidade
- Zero luzes piscantes, zero cronômetros regressivos e zero sons bruscos.
- Modo **"Observar sem tocar"** em todas as estações e navegação **Voltar / Próximo órgão** sempre desbloqueada.
- Botão permanente **"Quero uma pausa"**, **Modo Baixo Estímulo**, ajuste de tamanho da fonte e narração em voz calma opcional (`pt-BR`).

---

## Como Executar Localmente

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

Para gerar a versão de produção:

```bash
npm run build
```
