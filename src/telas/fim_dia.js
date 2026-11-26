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
  const dia = dados?.dia ?? 1;
  const todas = r && r.naoAtendidas === 0;
  container.append(
    el('div', { class: 'tela tela-resultado' }, [
      el('p', { class: 'sobretitulo', texto: `Dia ${dia} de 5 · ${dados?.hora ?? '18:00'}` }),
      el('h1', { texto: 'Fim do expediente' }),
      el('p', {
        class: 'destaque-texto',
        texto: todas ? 'Você atendeu todas as ligações do dia. A central sobreviveu.' : 'Deu 18:00 e a central sobreviveu ao dia.'
      }),
      r ? resumoEmLista(r) : null,
      el('p', { class: 'nota', texto: 'O relatório completo do dia, com gráfico e comparação, chega no Marco 4.' }),
      el('div', { class: 'acoes-resultado' }, [
        dia < 5
          ? el('button', { type: 'button', class: 'botao-principal', texto: 'Continuar →', aoClicar: () => irPara('investimentos', { dia }) })
          : el('button', { type: 'button', class: 'botao-principal', texto: 'Encerrar a semana →', aoClicar: () => irPara('semana') }),
        el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
      ])
    ])
  );
}
