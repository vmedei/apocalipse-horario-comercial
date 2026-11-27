// @ts-check
// A partida: a semana de cinco dias e o que cada dia deixou registrado
// (resumo, trotes do Juninho, o desfecho da ligação real dele).

import { resumoDoDia } from './expediente.js';
import { BALANCO } from '../config/balanco.js';

/**
 * @typedef {Object} Partida
 * @property {number} diaInicial
 * @property {Record<number, ReturnType<typeof resumoDoDia>>} dias
 * @property {number} trotesJuninho
 * @property {null | 'resgatado' | 'ignorado' | 'orgao_errado' | 'nao_atendido'} juninhoReal
 * @property {Record<number, number>} [adaptacaoPct]  % do orçamento em adaptação por dia (Marco 5)
 */

/** @returns {Partida} */
export function novaPartida(diaInicial = 1) {
  return { diaInicial, dias: {}, trotesJuninho: 0, juninhoReal: null };
}

/**
 * Registra o fim de um dia.
 * @param {Partida} partida
 * @param {number} dia
 * @param {import('./expediente.js').Expediente} exp
 * @returns {Partida}
 */
export function registrarDia(partida, dia, exp) {
  const chegaram = [...exp.resolvidas.map((r) => r.chamada), ...exp.naoAtendidas.map((i) => i.chamada)];
  const trotes = chegaram.filter((c) => c.personagem === 'juninho' && c.trote).length;
  return {
    ...partida,
    dias: { ...partida.dias, [dia]: resumoDoDia(exp) },
    trotesJuninho: partida.trotesJuninho + trotes,
    juninhoReal: desfechoJuninho(exp) ?? partida.juninhoReal
  };
}

/**
 * O que aconteceu com a ligação real do Juninho neste expediente (ou null se não houve).
 * @param {import('./expediente.js').Expediente} exp
 */
export function desfechoJuninho(exp) {
  const r = exp.resolvidas.find((x) => x.chamada.arco === 'juninho_real');
  if (r) {
    if (r.resultado.acertou) return 'resgatado';
    return r.escolha === 'trote' ? 'ignorado' : 'orgao_errado';
  }
  if (exp.naoAtendidas.some((i) => i.chamada.arco === 'juninho_real')) return 'nao_atendido';
  return null;
}

/**
 * Condições que escolhem o jornal da noite, em ordem de prioridade.
 * @param {Partida} partida
 * @param {number} dia
 */
export function condicoesDaNoite(partida, dia) {
  const m = BALANCO.relatorio;
  const r = partida.dias[dia];
  const condicoes = [];
  if (dia === 5 && (partida.juninhoReal === 'ignorado' || partida.juninhoReal === 'nao_atendido')) {
    condicoes.push('juninho_ignorado');
  }
  if ((r?.colapsoMax ?? 0) >= m.jornalColapsoAlto) condicoes.push('colapso_alto');
  if (r && r.atendidas && r.acertoPct < m.jornalAcertoBaixoPct) condicoes.push('acerto_baixo');
  if (r && r.atendidas && r.acertoPct >= m.jornalAcertoAltoPct && r.colapsoMax < m.jornalColapsoBaixo) condicoes.push('acerto_alto');
  return condicoes;
}

/**
 * Escolhe a edição do jornal: a primeira condição verdadeira que tenha edição própria,
 * senão a edição padrão (sem condição).
 * @template {{ dia: number, turno: string, condicao?: string }} J
 * @param {J[]} jornais
 * @param {number} dia
 * @param {'manha' | 'noite'} turno
 * @param {string[]} condicoes
 * @returns {J | undefined}
 */
export function escolherJornal(jornais, dia, turno, condicoes = []) {
  const doTurno = jornais.filter((j) => j.dia === dia && j.turno === turno);
  for (const c of condicoes) {
    const edicao = doTurno.find((j) => j.condicao === c);
    if (edicao) return edicao;
  }
  return doTurno.find((j) => !j.condicao);
}
