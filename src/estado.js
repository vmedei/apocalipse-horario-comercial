// @ts-check
// Estado único da partida e acesso seguro ao armazenamento do navegador.

import { lerParametros } from './parametros.js';
import { sementeAleatoria } from './sistemas/aleatorio.js';
import { emitir } from './eventos.js';

export const parametros = lerParametros(window.location.search);

export const estado = {
  tela: 'menu',
  dia: parametros.dia ?? 1,
  semente: parametros.seed ?? sementeAleatoria(),
  velocidade: parametros.vel,
  gabarito: false,
  /** @type {import('./sistemas/partida.js').Partida | null} */
  partida: null
};

/**
 * Altera o estado e avisa quem estiver ouvindo "estado_mudou".
 * @param {Partial<typeof estado>} mudancas
 */
export function atualizarEstado(mudancas) {
  Object.assign(estado, mudancas);
  emitir('estado_mudou', { ...estado });
}

const PREFIXO = 'aehc_';

/** Lê um valor salvo. Devolve `padrao` se não houver ou se o navegador bloquear. */
export function lerSalvo(chave, padrao = null) {
  try {
    const bruto = window.localStorage.getItem(PREFIXO + chave);
    return bruto === null ? padrao : JSON.parse(bruto);
  } catch {
    return padrao;
  }
}

/** Salva um valor. Falha em silêncio (janela anônima, armazenamento cheio). */
export function salvar(chave, valor) {
  try {
    window.localStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

/** Apaga tudo o que o jogo salvou neste navegador. */
export function apagarSalvos() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIXO))
      .forEach((k) => window.localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}
