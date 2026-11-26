// @ts-check
import { el } from '../ui/dom.js';
import { iniciarDia } from '../fluxo.js';
import jornais from '../dados/jornais.json';

/**
 * Investimentos (provisório). Responder × Adaptar chega no Marco 5.
 * @param {HTMLElement} container
 * @param {{ dia: number }} dados  o dia que acabou de terminar
 */
export function telaInvestimentos(container, dados) {
  const proximo = (dados?.dia ?? 1) + 1;
  const previsao = jornais.find((j) => j.dia === proximo && j.turno === 'manha')?.nota?.replace(/^Previsão:\s*/, '');
  container.append(
    el('div', { class: 'tela tela-resultado' }, [
      el('p', { class: 'sobretitulo', texto: `Antes do dia ${proximo}` }),
      el('h1', { texto: 'Investimentos' }),
      el('p', {
        texto: 'Aqui você vai decidir como gastar o orçamento da cidade: mais viaturas para responder ou obras de adaptação para prevenir. Essa fase chega no Marco 5.'
      }),
      previsao ? el('p', { class: 'previsao' }, [el('strong', { texto: 'Previsão para amanhã: ' }), previsao]) : null,
      el('div', { class: 'acoes-resultado' }, [
        el('button', { type: 'button', class: 'botao-principal', texto: `Começar o dia ${proximo} →`, aoClicar: () => iniciarDia(proximo) })
      ])
    ])
  );
}
