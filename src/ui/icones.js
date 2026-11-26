// @ts-check
// Ícones (emoji) por tipo de ocorrência e por órgão. Sempre usados com texto ao lado.

const PORTIPO = {
  gato: '🐈',
  vaca: '🐄',
  telefone: '☎️',
  som: '🔊',
  bolsa: '👜',
  mapa: '🧭',
  saude: '🩺',
  agua: '🌊',
  fogo: '🔥',
  calor: '🌡️',
  chuva: '🌧️',
  encosta: '⛰️',
  fumaca: '💨'
};

const PORORGAO = {
  190: '🚓',
  192: '🚑',
  193: '🚒',
  199: '🦺'
};

/** @param {string} tipo */
export const iconeOcorrencia = (tipo) => PORTIPO[tipo] ?? '📞';

/** @param {string} orgao */
export const iconeOrgao = (orgao) => PORORGAO[orgao] ?? '🚨';
