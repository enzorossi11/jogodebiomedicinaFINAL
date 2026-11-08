# Modelo de Dados e Interfaces (data-model.md)

Este documento mapeia as estruturas de dados, tipos TypeScript e contratos que governam o estado da aplicação.

---

## 1. Módulo Proposta 1: A Viagem do Alimento

### `FoodOption` (Alimento Selecionado)
```typescript
export interface FoodOption {
  id: 'maca' | 'pao' | 'cenoura' | 'ovo';
  nome: string;
  nutrienteDestaque: string;
  corTag: string;
  descricaoCurta: string;
  icone: React.ComponentType<{ className?: string }>;
}
```

### `ScriptStage` (Estação Anatômica)
```typescript
export interface ScriptStage {
  id: number;
  key: 'mouth' | 'esophagus' | 'stomach' | 'small_intestine' | 'large_intestine';
  nomeDaEtapa: string;
  orgao: string;
  objetivoBiologico: string;
  instrucaoDireta: string;
  narracaoEmAudio: string;
  mecanicaVisualSugerida: string;
  recompensaSensorial: string;
  detalheBiologico: string;
  passosInterativos: string[];
}
```

### `ScriptFinalActivity` (Diorama de Ordenação 3D)
```typescript
export interface ScriptFinalActivity {
  id: 6;
  nomeDaEtapa: string;
  instrucaoDireta: string;
  narracaoEmAudio: string;
  logicaDeValidacao: string;
}
```

---

## 2. Módulo Proposta 2: Interocepção e CAA

### `BodyRegionSpec` (Região Anatômica do Corpo)
```typescript
export type BodyRegionId = 'cabeca' | 'peito' | 'barriga' | 'maos' | 'pes' | 'nao_sei';

export interface BodyRegionSpec {
  id: BodyRegionId;
  label: string;
  shortDesc: string;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
}
```

### `SensationSpec` (Sensação Corporal Identificada)
```typescript
export type SensationId =
  | 'confortavel'
  | 'desconfortavel'
  | 'quente'
  | 'frio'
  | 'formigamento'
  | 'nao_sei_explicar';

export interface SensationSpec {
  id: SensationId;
  label: string;
  shortDesc: string;
  hexColor: string;
  emissiveHex: string;
  badgeStyle: string;
  symbolText: string;
}
```

### `CommunicationActionSpec` (Ação de Comunicação Alternativa - CAA)
```typescript
export type CommunicationActionId = 'quero_ajuda' | 'quero_pausa' | 'continuar_explorando';

export interface CommunicationActionSpec {
  id: CommunicationActionId;
  label: string;
  supportMessage: string;
  spokenMessage: string;
}
```

---

## 3. Estado Global da Aplicação (`App.tsx`)

```typescript
type ActiveModule = 'hub' | 'proposta_1' | 'proposta_2';
type FontSizeSetting = 'normal' | 'large' | 'xlarge';

interface AppGlobalState {
  activeModule: ActiveModule;
  p1Screen: Proposta1Stage;
  selectedFood: FoodOption;
  lowSensory: boolean;
  isMuted: boolean;
  isPaused: boolean;
  fontSize: FontSizeSetting;
  sensoryPauseOpen: boolean;
  scriptModalOpen: boolean;
}
```
