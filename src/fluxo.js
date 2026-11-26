// @ts-check
// A sequência da semana: jornal da manhã → expediente → jornal da noite →
// resumo do dia → investimentos → próximo dia.

import { atualizarEstado, estado } from './estado.js';
import { irPara } from './roteador.js';
import { novaPartida } from './sistemas/partida.js';

/** Começa uma semana nova a partir de um dia (normalmente o 1). */
export function novaSemana(diaInicial = 1) {
  atualizarEstado({ partida: novaPartida(diaInicial) });
  iniciarDia(diaInicial);
}

/** Abre o jornal da manhã de um dia. */
export function iniciarDia(dia) {
  if (!estado.partida) atualizarEstado({ partida: novaPartida(dia) });
  atualizarEstado({ dia });
  irPara('jornal', { dia, turno: 'manha' });
}
