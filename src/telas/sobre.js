// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';

/** Sobre o jogo: propósito e fontes. */
export function telaSobre(container) {
  container.append(
    el('div', { class: 'tela tela-texto' }, [
      el('button', {
        type: 'button',
        class: 'botao-secundario',
        texto: '← Voltar ao menu',
        aoClicar: () => irPara('menu')
      }),
      el('h1', { texto: 'Sobre o jogo' }),
      el('p', {
        texto:
          'Você é atendente da central de emergência de Porto Ameno, uma cidade brasileira fictícia. ' +
          'As chamadas começam banais e, dia após dia, viram ondas de calor, enchentes, deslizamentos e queimadas. ' +
          'Entre um expediente e outro, você decide se gasta o orçamento respondendo às emergências ou se prepara para o que vem.'
      }),
      el('p', {
        texto:
          'O jogo foi feito para estudantes do ensino médio e mostra, pelas próprias regras, ' +
          'que investir em adaptação reduz danos, enquanto só reagir às emergências se torna insustentável.'
      }),
      el('h2', { texto: 'Para quem ligar' }),
      el('ul', {}, [
        el('li', { texto: '190 · Polícia: crimes, brigas, perturbação, riscos no trânsito.' }),
        el('li', { texto: '192 · SAMU: pessoas feridas ou passando mal.' }),
        el('li', { texto: '193 · Bombeiros: fogo, resgates, pessoas presas ou em risco.' }),
        el('li', { texto: '199 · Defesa Civil: risco de desabamento, deslizamento, evacuação.' })
      ]),
      el('h2', { texto: 'Fontes' }),
      el('ul', {}, [
        el('li', { texto: 'IPCC. Climate Change 2021: The Physical Science Basis. Cambridge University Press, 2021.' }),
        el('li', { texto: 'IPCC. Climate Change 2022: Impacts, Adaptation and Vulnerability. Cambridge University Press, 2022.' }),
        el('li', { texto: 'Cemaden – Centro Nacional de Monitoramento e Alertas de Desastres Naturais.' })
      ])
    ])
  );
}
