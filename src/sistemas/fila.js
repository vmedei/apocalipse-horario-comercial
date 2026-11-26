// @ts-check
// Regras de espera na fila: quando uma chamada "estoura" e quanto isso custa.

import { BALANCO } from '../config/balanco.js';

/**
 * Quantos intervalos de punição já se completaram depois do tempo limite.
 * Ex.: limite 60 s, intervalo 10 s → aos 75 s de espera, 1 intervalo; aos 90 s, 3.
 * @param {number} espera  segundos na fila
 * @param {number} limite  tempo_limite da chamada
 */
export function intervalosEstourados(espera, limite) {
  if (espera <= limite) return 0;
  return Math.floor((espera - limite) / BALANCO.colapso.intervaloEsperaSegundos);
}

/**
 * Colapso a somar agora, dado quantos intervalos já foram cobrados.
 * @param {{ tempo_limite: number, gravidade: number }} chamada
 * @param {number} espera
 * @param {number} jaCobrados
 * @returns {{ delta: number, cobrados: number }}
 */
export function cobrancaDeEspera(chamada, espera, jaCobrados) {
  const total = intervalosEstourados(espera, chamada.tempo_limite);
  const novos = Math.max(0, total - jaCobrados);
  return {
    delta: novos * BALANCO.colapso.esperaEstouradaPorGravidade * (chamada.gravidade ?? 1),
    cobrados: Math.max(total, jaCobrados)
  };
}
