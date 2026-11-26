// @ts-check
// Tutorial da Dona Socorro: destaca uma área da tela por vez, com um balão de explicação.

import { el } from './dom.js';

/**
 * @typedef {{ alvo: string, aba?: string, texto: string }} Passo
 */

/**
 * Mostra uma sequência de passos. Enquanto estiver aberto, `ativo()` é verdadeiro
 * (a tela de jogo pausa o relógio).
 * @param {HTMLElement} raiz  onde procurar os alvos
 * @param {{ aoMudarAba?: (aba: string) => void }} [opcoes]
 */
export function criarTutorial(raiz, opcoes = {}) {
  /** @type {Passo[]} */
  let passos = [];
  let indice = 0;
  /** @type {(() => void) | null} */
  let aoTerminar = null;
  /** @type {Element | null} */
  let destacado = null;

  const texto = el('p', { class: 'tutorial-texto' });
  const contador = el('span', { class: 'tutorial-contador suave' });
  const botaoProximo = el('button', { type: 'button', class: 'botao-principal', aoClicar: () => avancar() });
  const balao = el('aside', { class: 'tutorial', role: 'dialog', 'aria-label': 'Dica da Dona Socorro', hidden: true }, [
    el('div', { class: 'tutorial-cabecalho' }, [
      el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
      el('strong', { texto: 'Dona Socorro' }),
      contador
    ]),
    texto,
    el('div', { class: 'tutorial-acoes' }, [
      el('button', { type: 'button', class: 'botao-link', texto: 'Pular tutorial', aoClicar: () => fechar() }),
      botaoProximo
    ])
  ]);

  function mostrar() {
    const passo = passos[indice];
    if (passo.aba && opcoes.aoMudarAba) opcoes.aoMudarAba(passo.aba);
    destacado?.classList.remove('destaque-tutorial');
    destacado = raiz.querySelector(passo.alvo);
    destacado?.classList.add('destaque-tutorial');
    destacado?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    texto.textContent = `“${passo.texto}”`;
    contador.textContent = `${indice + 1} de ${passos.length}`;
    botaoProximo.textContent = indice === passos.length - 1 ? 'Entendi' : 'Próximo →';
    balao.hidden = false;
    botaoProximo.focus({ preventScroll: true });
  }

  function avancar() {
    indice += 1;
    if (indice >= passos.length) fechar();
    else mostrar();
  }

  function fechar() {
    destacado?.classList.remove('destaque-tutorial');
    destacado = null;
    balao.hidden = true;
    passos = [];
    const fim = aoTerminar;
    aoTerminar = null;
    fim?.();
  }

  return {
    elemento: balao,
    /** @param {Passo[]} novosPassos @param {() => void} [quandoTerminar] */
    iniciar(novosPassos, quandoTerminar) {
      if (!novosPassos.length) return;
      passos = novosPassos;
      indice = 0;
      aoTerminar = quandoTerminar ?? null;
      mostrar();
    },
    ativo: () => passos.length > 0,
    fechar
  };
}
