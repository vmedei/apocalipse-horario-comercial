// @ts-check
// Mostra uma tela por vez dentro de <main id="app">.

import { atualizarEstado } from './estado.js';

/**
 * Uma tela recebe o container e dados opcionais, desenha seu conteúdo
 * e pode devolver uma função de limpeza (parar relógios, ouvintes etc.).
 * @typedef {(container: HTMLElement, dados?: any) => (void | (() => void))} Tela
 */

/** @type {Map<string, Tela>} */
const telas = new Map();
/** @type {(() => void) | null} */
let limparTelaAtual = null;

/** @param {string} nome @param {Tela} tela */
export function registrarTela(nome, tela) {
  telas.set(nome, tela);
}

/**
 * Troca de tela.
 * @param {string} nome
 * @param {any} [dados]
 */
export function irPara(nome, dados) {
  const tela = telas.get(nome);
  if (!tela) throw new Error(`Tela desconhecida: "${nome}"`);

  if (limparTelaAtual) limparTelaAtual();
  limparTelaAtual = null;

  const container = /** @type {HTMLElement} */ (document.getElementById('app'));
  container.replaceChildren();
  container.dataset.tela = nome;

  const limpeza = tela(container, dados);
  if (typeof limpeza === 'function') limparTelaAtual = limpeza;

  atualizarEstado({ tela: nome });

  // Leva o foco ao título da nova tela, para teclado e leitor de tela.
  const titulo = container.querySelector('h1, h2');
  if (titulo instanceof HTMLElement) {
    titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}
