import { describe, expect, it } from 'vitest';
import { resolverDespacho } from '../src/sistemas/despacho.js';
import { aplicarColapso, colapsou } from '../src/sistemas/colapso.js';
import { BALANCO } from '../src/config/balanco.js';
import dia1 from '../src/dados/chamadas/dia_1.json';

const c = BALANCO.colapso;
const gato = dia1.find((x) => x.id === 'd1_arlindo_gato');
const trote = dia1.find((x) => x.id === 'd1_juninho_jacare');
const queda = dia1.find((x) => x.id === 'd1_centro_queda'); // gravidade 2

describe('resolverDespacho', () => {
  it('acerta quando o órgão é o correto', () => {
    const r = resolverDespacho(gato, '193');
    expect(r).toEqual({ acertou: true, tipo: 'acerto', motivo: gato.feedback_acerto, deltaColapso: c.acerto });
  });

  it('erra o órgão e pesa pela gravidade', () => {
    const r1 = resolverDespacho(gato, '192');
    expect(r1.acertou).toBe(false);
    expect(r1.tipo).toBe('orgao_errado');
    expect(r1.motivo).toBe(gato.feedback_erro);
    expect(r1.deltaColapso).toBe(c.despachoErradoPorGravidade * 1);

    const r2 = resolverDespacho(queda, '190');
    expect(r2.deltaColapso).toBe(c.despachoErradoPorGravidade * 2);
  });

  it('acerta ao encerrar um trote como trote', () => {
    const r = resolverDespacho(trote, 'trote');
    expect(r.acertou).toBe(true);
    expect(r.deltaColapso).toBe(c.acerto);
  });

  it('erra ao mandar viatura para um trote', () => {
    const r = resolverDespacho(trote, '193');
    expect(r.tipo).toBe('trote_despachado');
    expect(r.deltaColapso).toBe(c.viaturaEmTrote);
  });

  it('erra feio ao encerrar uma chamada real como trote', () => {
    const r = resolverDespacho(queda, 'trote');
    expect(r.tipo).toBe('real_como_trote');
    expect(r.motivo).toBe(queda.feedback_erro);
    expect(r.deltaColapso).toBe(c.realComoTrotePorGravidade * 2);
  });

  it('recusa escolhas inválidas', () => {
    expect(() => resolverDespacho(gato, '911')).toThrow();
  });

  it('toda chamada do dia 1 tem um órgão válido ou é trote', () => {
    for (const ch of dia1) {
      if (ch.trote) expect(ch.orgao_correto).toBeNull();
      else expect(['190', '192', '193', '199']).toContain(ch.orgao_correto);
      expect(resolverDespacho(ch, ch.trote ? 'trote' : ch.orgao_correto).acertou).toBe(true);
    }
  });
});

describe('aplicarColapso', () => {
  it('não passa de 0 nem do máximo', () => {
    expect(aplicarColapso(2, -5)).toBe(0);
    expect(aplicarColapso(95, 15)).toBe(c.maximo);
    expect(aplicarColapso(40, 10)).toBe(50);
  });

  it('indica colapso só no máximo', () => {
    expect(colapsou(99)).toBe(false);
    expect(colapsou(100)).toBe(true);
  });
});
