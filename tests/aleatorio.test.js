import { describe, expect, it } from 'vitest';
import { criarAleatorio } from '../src/sistemas/aleatorio.js';

describe('criarAleatorio', () => {
  it('repete a mesma sequência com a mesma semente', () => {
    const a = criarAleatorio(42);
    const b = criarAleatorio(42);
    const seqA = Array.from({ length: 20 }, () => a.proximo());
    const seqB = Array.from({ length: 20 }, () => b.proximo());
    expect(seqA).toEqual(seqB);
  });

  it('gera sequências diferentes com sementes diferentes', () => {
    const a = criarAleatorio(1);
    const b = criarAleatorio(2);
    expect(a.proximo()).not.toEqual(b.proximo());
  });

  it('mantém proximo() entre 0 (inclusive) e 1 (exclusive)', () => {
    const r = criarAleatorio(7);
    for (let i = 0; i < 1000; i++) {
      const x = r.proximo();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('inteiro() respeita os limites, inclusive as pontas', () => {
    const r = criarAleatorio(99);
    const vistos = new Set();
    for (let i = 0; i < 500; i++) {
      const n = r.inteiro(1, 4);
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(4);
      vistos.add(n);
    }
    expect([...vistos].sort()).toEqual([1, 2, 3, 4]);
  });

  it('escolher() devolve um item da lista', () => {
    const r = criarAleatorio(3);
    const lista = ['190', '192', '193', '199'];
    for (let i = 0; i < 50; i++) expect(lista).toContain(r.escolher(lista));
  });
});
