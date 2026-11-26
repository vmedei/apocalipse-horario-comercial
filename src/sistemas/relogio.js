// @ts-check
// Conversões entre o tempo real do expediente (segundos) e a hora do jogo (8:00 às 18:00).

import { BALANCO } from '../config/balanco.js';

const MINUTOS_DO_DIA = (BALANCO.horaFim - BALANCO.horaInicio) * 60;

/** Minutos de jogo que passam a cada segundo real (600 / 300 = 2). */
export const MINUTOS_POR_SEGUNDO = MINUTOS_DO_DIA / BALANCO.duracaoDiaSegundos;

/**
 * Segundo real do expediente em que o relógio marca esta hora.
 * @param {string} hora  "08:20"
 */
export function segundosDeHora(hora) {
  const [h, m] = hora.split(':').map(Number);
  const minutos = (h - BALANCO.horaInicio) * 60 + m;
  return minutos / MINUTOS_POR_SEGUNDO;
}

/**
 * Hora do relógio para um segundo real do expediente.
 * @param {number} segundos
 * @returns {string}  "08:20"
 */
export function horaDoJogo(segundos) {
  const minutos = Math.min(MINUTOS_DO_DIA, Math.max(0, Math.floor(segundos * MINUTOS_POR_SEGUNDO)));
  const h = BALANCO.horaInicio + Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Duração em segundos reais como "m:ss" (para tempos de espera).
 * @param {number} segundos
 */
export function textoDuracao(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
