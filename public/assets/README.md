# Estrutura Oficial de Assets (public/assets/)

Este diretório contém os assets estáticos do projeto **A Viagem do Alimento**.

---

## Estrutura de Pastas

```text
public/assets/
├── 2d/
│   ├── foods/            # Sprites 16-bit de alimentos (apple, bread, carrot, egg)
│   ├── fluids-particles/ # Partículas fisiológicas (saliva, suco gástrico, água, nutrientes)
│   ├── organs-hud/       # Sprites/ícones 16-bit dos órgãos para o dock e diorama
│   └── caa-cards/        # Pictogramas da Proposta 2 (CAA / Interocepção)
├── 3d/
│   └── textures/         # Texturas contínuas (seamless) para shaders Three.js
└── docs/                 # Documentos PDF institucionais e pedagógicos (FMU)
```

---

## Controle e Inventário
Para verificar o status de cada asset (🟢 Oficial, 🟡 Provisório de Teste, 🔴 Pendente de Produção) e as especificações de resolução e cores recomendadas, consulte:

👉 **[docs/assets-inventory.md](../../docs/assets-inventory.md)**

---

## Regra de Criação de Novos Assets
- **Formato obrigatório:** PNG-32 com canal alfa real (fundo 100% transparente) ou SVG otimizado.
- **Pixel Art:** Escala 1x, contorno escuro e sem compressão com perdas.
- O sistema detecta automaticamente extensões `.png` e aplica carregamento direto com `THREE.NearestFilter`, dispensando algoritmos pesados de remoção de fundo em runtime.

