// @ts-check
// Canal simples de eventos: os sistemas emitem, as telas ouvem.

/** @type {Map<string, Set<(dados: any) => void>>} */
const ouvintes = new Map();

/**
 * Passa a ouvir um evento. Devolve uma função que para de ouvir.
 * @param {string} nome
 * @param {(dados: any) => void} funcao
 */
export function ouvir(nome, funcao) {
  if (!ouvintes.has(nome)) ouvintes.set(nome, new Set());
  ouvintes.get(nome)?.add(funcao);
  return () => ouvintes.get(nome)?.delete(funcao);
}

/**
 * Avisa todos que ouvem este evento.
 * @param {string} nome
 * @param {any} [dados]
 */
export function emitir(nome, dados) {
  for (const funcao of ouvintes.get(nome) ?? []) funcao(dados);
}
