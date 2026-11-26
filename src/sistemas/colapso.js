// @ts-check
// Medidor de Colapso (0 a 100). As regras de tempo de espera chegam no Marco 2.

import { BALANCO } from '../config/balanco.js';

/**
 * Aplica uma variação ao medidor, sem passar de 0 nem do máximo.
 * @param {number} atual
 * @param {number} delta
 */
export function aplicarColapso(atual, delta) {
  return Math.min(BALANCO.colapso.maximo, Math.max(0, atual + delta));
}

/** O medidor chegou ao máximo? */
export function colapsou(valor) {
  return valor >= BALANCO.colapso.maximo;
}
