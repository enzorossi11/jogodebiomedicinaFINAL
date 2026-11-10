import { describe, expect, it } from 'vitest';
import { FOOD_OPTIONS } from '../components/FoodSelector';
import { ETAPAS, ORDEM_CORRETA, ORGAOS, SEQUENCIA, TRILHA, acertosDaOrdem, ordemCompleta } from './etapas';
import { SCRIPT_ETAPAS, VOCE_SABIA_POR_ALIMENTO } from './scriptData';

describe('sequência da viagem', () => {
  it('começa na escolha do alimento e termina no caminho completo', () => {
    expect(SEQUENCIA[0]).toBe('food_select');
    expect(SEQUENCIA.at(-1)).toBe('final_ordering');
  });

  it('tem metadados para todas as etapas, sem repetição', () => {
    expect(new Set(SEQUENCIA).size).toBe(SEQUENCIA.length);
    for (const id of SEQUENCIA) {
      expect(ETAPAS[id].id).toBe(id);
      expect(ETAPAS[id].nome.length).toBeGreaterThan(0);
      expect(ETAPAS[id].resumo.length).toBeGreaterThan(0);
    }
  });

  it('a trilha cobre cada etapa exatamente uma vez e na ordem', () => {
    const achatada = TRILHA.flatMap((t) => t.etapas);
    expect(achatada).toEqual(SEQUENCIA);
  });
});

describe('ordem dos órgãos', () => {
  it('a ordem anatômica é boca → esôfago → estômago → delgado → grosso', () => {
    expect([...ORDEM_CORRETA]).toEqual(['boca', 'esofago', 'estomago', 'delgado', 'grosso']);
    expect(ORGAOS.map((o) => o.id).sort()).toEqual([...ORDEM_CORRETA].sort());
  });

  it('conta acertos por posição, sem punir erros', () => {
    expect(acertosDaOrdem([null, null, null, null, null])).toBe(0);
    expect(acertosDaOrdem(['boca', 'estomago', 'esofago', 'delgado', 'grosso'])).toBe(3);
    expect(acertosDaOrdem([...ORDEM_CORRETA])).toBe(5);
  });

  it('só considera completa a ordem inteiramente certa', () => {
    expect(ordemCompleta([...ORDEM_CORRETA])).toBe(true);
    expect(ordemCompleta(['boca', 'esofago', 'estomago', 'grosso', 'delgado'])).toBe(false);
  });
});

describe('conteúdo pedagógico', () => {
  it('cada alimento tem um "Você sabia?"', () => {
    for (const a of FOOD_OPTIONS) {
      expect(VOCE_SABIA_POR_ALIMENTO[a.id]?.texto.length).toBeGreaterThan(20);
    }
  });

  it('o roteiro cobre as cinco paradas do sistema digestório', () => {
    expect(SCRIPT_ETAPAS.map((s) => s.key)).toEqual(['mouth', 'esophagus', 'stomach', 'small_intestine', 'large_intestine']);
    for (const s of SCRIPT_ETAPAS) expect(s.narracaoEmAudio.length).toBeGreaterThan(20);
  });

  it('os alimentos têm nome, descrição e nutriente principal', () => {
    expect(FOOD_OPTIONS).toHaveLength(4);
    for (const a of FOOD_OPTIONS) {
      expect(a.name).toBeTruthy();
      expect(a.desc).toBeTruthy();
      expect(a.nutrientMain).toBeTruthy();
    }
  });
});
