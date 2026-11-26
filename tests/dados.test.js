import { describe, expect, it } from 'vitest';
import { DIAS } from '../src/dados/chamadas.js';
import { BALANCO } from '../src/config/balanco.js';
import { segundosDeHora } from '../src/sistemas/relogio.js';
import bairros from '../src/dados/bairros.json';
import personagens from '../src/dados/personagens.json';
import eventos from '../src/dados/eventos.json';
import rotulos from '../src/dados/rotulos.json';
import jornais from '../src/dados/jornais.json';
import escritorio from '../src/dados/escritorio.json';

// Adaptações previstas para o Marco 5 (investimentos).
const ADAPTACOES = [
  'arborizacao_centro',
  'pontos_hidratacao_orla',
  'abrigos_climatizados',
  'drenagem_beira_rio',
  'alerta_sms_morro',
  'brigada_incendio',
  'cisternas_serra',
  'barreira_orla'
];
const ORGAOS = ['190', '192', '193', '199'];
const idsBairros = bairros.map((b) => b.id);
const todas = DIAS.flat();

describe('conteúdo das chamadas', () => {
  it('cada dia tem a quantidade do roteiro', () => {
    DIAS.forEach((dia, i) => expect(dia).toHaveLength(BALANCO.chamadasPorDia[i]));
  });

  it('a fatia de chamadas climáticas segue a escalada do roteiro (±10 pontos)', () => {
    DIAS.forEach((dia, i) => {
      const fracao = dia.filter((c) => c.climatica).length / dia.length;
      expect(Math.abs(fracao - BALANCO.fracaoClimaticaPorDia[i])).toBeLessThanOrEqual(0.1);
    });
  });

  it('os ids são únicos', () => {
    const ids = todas.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada chamada é coerente', () => {
    for (const c of todas) {
      const onde = `chamada ${c.id}`;
      expect(idsBairros, onde).toContain(c.bairro);
      expect(personagens[c.personagem], onde).toBeDefined();
      expect(rotulos.emocoes[c.emocao], onde).toBeDefined();
      expect(c.gravidade, onde).toBeGreaterThanOrEqual(1);
      expect(c.gravidade, onde).toBeLessThanOrEqual(3);
      expect(c.tempo_limite, onde).toBeGreaterThanOrEqual(40);
      expect(c.perguntas.length, onde).toBeGreaterThan(0);
      expect(c.fala_inicial.length, onde).toBeGreaterThan(10);
      expect(c.feedback_acerto.length, onde).toBeGreaterThan(5);
      expect(c.feedback_erro.length, onde).toBeGreaterThan(5);
      if (c.trote) expect(c.orgao_correto, onde).toBeNull();
      else expect(ORGAOS, onde).toContain(c.orgao_correto);
      expect(c.climatica, onde).toBe(c.evento !== null);
      if (c.evento) expect(eventos[c.evento], onde).toBeDefined();
      if (c.mitigada_por) expect(ADAPTACOES, onde).toContain(c.mitigada_por);
      const t = segundosDeHora(c.hora);
      expect(t, onde).toBeGreaterThan(0);
      expect(t, onde).toBeLessThan(BALANCO.duracaoDiaSegundos);
    }
  });

  it('as chamadas de cada dia estão em ordem de horário', () => {
    for (const dia of DIAS) {
      const horas = dia.map((c) => segundosDeHora(c.hora));
      expect([...horas].sort((a, b) => a - b)).toEqual(horas);
    }
  });

  it('o arco do Juninho: trotes nos dias 1 a 4 e a ligação real no dia 5', () => {
    DIAS.slice(0, 4).forEach((dia) => {
      expect(dia.some((c) => c.personagem === 'juninho' && c.trote)).toBe(true);
    });
    const real = DIAS[4].filter((c) => c.arco === 'juninho_real');
    expect(real).toHaveLength(1);
    expect(real[0].trote).toBe(false);
    expect(real[0].personagem).toBe('juninho');
  });

  it('os moradores recorrentes ligam por algo banal e depois por algo climático', () => {
    for (const p of ['seu_arlindo', 'kelly', 'seu_ze']) {
      const ligacoes = todas.filter((c) => c.personagem === p);
      expect(ligacoes.some((c) => !c.climatica), p).toBe(true);
      expect(ligacoes.some((c) => c.climatica), p).toBe(true);
    }
  });
});

describe('conteúdo dos jornais e do escritório', () => {
  it('todo dia tem jornal da manhã e um jornal da noite padrão', () => {
    for (let dia = 1; dia <= 5; dia++) {
      expect(jornais.some((j) => j.dia === dia && j.turno === 'manha')).toBe(true);
      expect(jornais.some((j) => j.dia === dia && j.turno === 'noite' && !j.condicao)).toBe(true);
      expect(escritorio[String(dia)]).toBeDefined();
    }
  });
});
