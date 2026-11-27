// @ts-check
// Jornal Ameno da manhã: abre cada dia. As pautas começam leves e vão sendo tomadas pelo clima.
// A edição da noite aparece dentro do relatório do dia (telas/relatorio.js).

import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import { escolherJornal } from '../sistemas/partida.js';
import { cartaoJornal, falaSocorro } from '../ui/jornal.js';
import jornais from '../dados/jornais.json';

/**
 * @param {HTMLElement} container
 * @param {{ dia: number }} dados
 */
export function telaJornal(container, dados) {
  const dia = dados?.dia ?? estado.dia;
  const edicao = escolherJornal(jornais, dia, 'manha');

  container.append(
    el('div', { class: 'tela tela-jornal' }, [
      cartaoJornal(edicao, { dia, turno: 'manha' }),
      edicao?.socorro ? falaSocorro(edicao.socorro) : null,
      el('div', { class: 'acoes-resultado' }, [
        el('button', { type: 'button', class: 'botao-principal', texto: 'Ir para a central →', aoClicar: () => irPara('jogo') })
      ])
    ])
  );
}
