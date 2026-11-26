// @ts-check

/**
 * @typedef {Object} Parametros
 * @property {boolean} debug  Mostra o painel de depuração (?debug)
 * @property {number|null} dia  Começa direto num dia de 1 a 5 (?dia=3)
 * @property {number|null} seed  Semente dos sorteios (?seed=42)
 * @property {number} vel  Multiplicador do relógio (?vel=4)
 */

/**
 * Lê os parâmetros de teste da URL. Valores inválidos são ignorados.
 * @param {string} busca  O `location.search`, por exemplo "?debug&dia=3"
 * @returns {Parametros}
 */
export function lerParametros(busca) {
  const p = new URLSearchParams(busca);

  const inteiro = (nome, min, max) => {
    if (!p.has(nome)) return null;
    const n = Number(p.get(nome));
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };

  return {
    debug: p.has('debug') && p.get('debug') !== '0',
    dia: inteiro('dia', 1, 5),
    seed: inteiro('seed', 0, 2 ** 32 - 1),
    vel: inteiro('vel', 1, 20) ?? 1
  };
}
