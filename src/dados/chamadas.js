// @ts-check
// Reúne as chamadas de cada dia (o conteúdo fica nos arquivos JSON).

import dia1 from './chamadas/dia_1.json';
import dia2 from './chamadas/dia_2.json';
import dia3 from './chamadas/dia_3.json';
import dia4 from './chamadas/dia_4.json';
import dia5 from './chamadas/dia_5.json';

export const DIAS = Object.freeze([dia1, dia2, dia3, dia4, dia5]);

/** Chamadas do dia (1 a 5). */
export function chamadasDoDia(dia) {
  return DIAS[Math.min(5, Math.max(1, dia)) - 1];
}
