// @ts-check

/**
 * Sorteios com semente (algoritmo mulberry32): a mesma semente gera
 * sempre a mesma sequência, o que torna uma partida repetível.
 * @param {number} semente
 */
export function criarAleatorio(semente) {
  let a = semente >>> 0;

  /** Número em [0, 1). */
  const proximo = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    semente: semente >>> 0,
    proximo,
    /** Inteiro entre min e max, inclusive. */
    inteiro: (min, max) => min + Math.floor(proximo() * (max - min + 1)),
    /** Verdadeiro com probabilidade p (0 a 1). */
    chance: (p) => proximo() < p,
    /**
     * Um item qualquer da lista.
     * @template T
     * @param {T[]} lista
     * @returns {T}
     */
    escolher: (lista) => lista[Math.floor(proximo() * lista.length)]
  };
}

/** Semente nova, para quando a URL não traz ?seed. */
export function sementeAleatoria() {
  return Math.floor(Math.random() * 2 ** 32);
}
