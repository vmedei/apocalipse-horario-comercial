// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import { novaSemana } from '../fluxo.js';

const DESFECHO_JUNINHO = {
  resgatado: 'Você acreditou no Juninho no dia 5, e os Bombeiros o tiraram da água a tempo.',
  ignorado: 'Você encerrou a ligação real do Juninho como trote. Os vizinhos o resgataram horas depois.',
  orgao_errado: 'Você acreditou no Juninho, mas mandou o órgão errado. Os Bombeiros chegaram atrasados.',
  nao_atendido: 'A ligação real do Juninho ficou esperando na fila. Os vizinhos o resgataram horas depois.'
};

/** Fim da semana (provisório). O jornal especial e o debriefing chegam no Marco 6. */
export function telaSemana(container) {
  const p = estado.partida;
  const dias = p ? Object.entries(p.dias).sort(([a], [b]) => Number(a) - Number(b)) : [];
  container.append(
    el('div', { class: 'tela tela-resultado' }, [
      el('p', { class: 'sobretitulo', texto: 'Fim da semana' }),
      el('h1', { texto: 'Você sobreviveu à semana' }),
      dias.length
        ? el('table', { class: 'tabela-semana' }, [
            el('thead', {}, [el('tr', {}, ['Dia', 'Atendidas', 'Acertos', 'Colapso máx.'].map((t) => el('th', { scope: 'col', texto: t })))]),
            el(
              'tbody',
              {},
              dias.map(([dia, r]) =>
                el('tr', {}, [
                  el('th', { scope: 'row', texto: dia }),
                  el('td', { texto: String(r.atendidas) }),
                  el('td', { texto: `${r.acertoPct}%` }),
                  el('td', { texto: `${Math.round(r.colapsoMax)}%` })
                ])
              )
            )
          ])
        : null,
      p?.juninhoReal ? el('p', { class: 'destaque-texto', texto: DESFECHO_JUNINHO[p.juninhoReal] }) : null,
      el('p', { class: 'nota', texto: 'O jornal especial, as estrelas e as perguntas de debriefing chegam no Marco 6.' }),
      el('div', { class: 'acoes-resultado' }, [
        el('button', { type: 'button', class: 'botao-principal', texto: '↻ Jogar a semana de novo', aoClicar: () => novaSemana(1) }),
        el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
      ])
    ])
  );
}
