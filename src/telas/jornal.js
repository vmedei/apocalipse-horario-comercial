// @ts-check
// Jornal Ameno: abre e fecha cada dia. As pautas começam leves e vão sendo tomadas pelo clima.

import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import { condicoesDaNoite, escolherJornal } from '../sistemas/partida.js';
import jornais from '../dados/jornais.json';

/**
 * @param {HTMLElement} container
 * @param {{ dia: number, turno: 'manha' | 'noite', fim?: any }} dados
 */
export function telaJornal(container, dados) {
  const dia = dados?.dia ?? estado.dia;
  const turno = dados?.turno ?? 'manha';
  const condicoes = turno === 'noite' && estado.partida ? condicoesDaNoite(estado.partida, dia) : [];
  const edicao = escolherJornal(jornais, dia, turno, condicoes);
  const [principal, ...outras] = edicao?.manchetes ?? ['Sem notícias hoje'];

  container.append(
    el('div', { class: `tela tela-jornal tom-${dia}` }, [
      el('header', { class: 'vinheta' }, [
        el('span', { class: 'vinheta-marca', 'aria-hidden': 'true', texto: '📺' }),
        el('div', {}, [
          el('p', { class: 'vinheta-nome', texto: 'JORNAL AMENO' }),
          el('p', { class: 'vinheta-edicao', texto: `${turno === 'manha' ? 'Edição da manhã' : 'Edição da noite'} · Dia ${dia}` })
        ]),
        el('span', { class: 'ao-vivo', texto: dia >= 4 ? '● PLANTÃO' : '● AO VIVO' })
      ]),
      el('h1', { class: 'manchete', texto: principal }),
      outras.length ? el('ul', { class: 'outras-manchetes' }, outras.map((m) => el('li', { texto: m }))) : null,
      edicao?.nota ? el('p', { class: 'previsao' }, [el('span', { 'aria-hidden': 'true', texto: '🌡️ ' }), edicao.nota]) : null,
      edicao?.socorro
        ? el('aside', { class: 'fala-socorro' }, [
            el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
            el('p', {}, [el('strong', { texto: 'Dona Socorro: ' }), `“${edicao.socorro}”`])
          ])
        : null,
      el('div', { class: 'acoes-resultado' }, [
        turno === 'manha'
          ? el('button', { type: 'button', class: 'botao-principal', texto: 'Ir para a central →', aoClicar: () => irPara('jogo') })
          : el('button', {
              type: 'button',
              class: 'botao-principal',
              texto: 'Ver o resumo do dia →',
              aoClicar: () => irPara('fim_dia', dados?.fim ?? { dia })
            })
      ])
    ])
  );
}
