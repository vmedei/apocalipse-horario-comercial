// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { resumoEmLista } from './demitido.js';

/**
 * Fim do expediente (provisório). O relatório completo do dia chega no Marco 4.
 * @param {HTMLElement} container
 * @param {{ resumo: ReturnType<typeof import('../sistemas/expediente.js').resumoDoDia>, hora: string, dia: number }} dados
 */
export function telaFimDia(container, dados) {
  const r = dados?.resumo;
  const todas = r && r.naoAtendidas === 0;
  container.append(
    el('div', { class: 'tela tela-resultado' }, [
      el('p', { class: 'sobretitulo', texto: `Dia ${dados?.dia ?? 1} · ${dados?.hora ?? '18:00'}` }),
      el('h1', { texto: 'Fim do expediente' }),
      el('p', {
        class: 'destaque-texto',
        texto: todas ? 'Você atendeu todas as ligações do dia. A central sobreviveu.' : 'Deu 18:00 e a central sobreviveu ao dia.'
      }),
      r ? resumoEmLista(r) : null,
      el('p', { class: 'nota', texto: 'O relatório completo do dia e os dias 2 a 5 chegam nos próximos marcos.' }),
      el('div', { class: 'acoes-resultado' }, [
        el('button', { type: 'button', class: 'botao-principal', texto: '↻ Jogar o dia de novo', aoClicar: () => irPara('jogo') }),
        el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
      ])
    ])
  );
}
