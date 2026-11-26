// @ts-check
// Veículos: cada despacho vira uma missão que ocupa um veículo por um tempo.

/**
 * @typedef {Object} Missao
 * @property {string} orgao
 * @property {string} bairro
 * @property {number} inicio  segundo real em que saiu
 * @property {number} fim     segundo real em que volta a ficar livre
 */

/**
 * Veículos livres de um órgão neste instante.
 * @param {Record<string, number>} frotaTotal  { "190": 3, … }
 * @param {Missao[]} missoes
 * @param {string} orgao
 * @param {number} tempo
 */
export function veiculosLivres(frotaTotal, missoes, orgao, tempo) {
  const ocupados = missoes.filter((m) => m.orgao === orgao && m.fim > tempo).length;
  return Math.max(0, (frotaTotal[orgao] ?? 0) - ocupados);
}

/**
 * Onde o veículo está no trajeto, de 0 (na central) a 1 (no local).
 * Vai nos primeiros 35% da missão, fica no local e volta nos últimos 35%.
 * @param {Missao} missao
 * @param {number} tempo
 */
export function progressoTrajeto(missao, tempo) {
  const duracao = missao.fim - missao.inicio;
  if (duracao <= 0) return 0;
  const p = Math.min(1, Math.max(0, (tempo - missao.inicio) / duracao));
  if (p < 0.35) return p / 0.35;
  if (p <= 0.65) return 1;
  return (1 - p) / 0.35;
}
