// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { textoDuracao } from '../sistemas/relogio.js';

/**
 * A central entrou em colapso.
 * @param {HTMLElement} container
 * @param {{ resumo: ReturnType<typeof import('../sistemas/expediente.js').resumoDoDia>, hora: string, dia: number }} dados
 */
export function telaDemitido(container, dados) {
  const r = dados?.resumo;
  container.append(
    el('div', { class: 'tela tela-resultado demitido' }, [
      el('p', { class: 'carimbo', 'aria-hidden': 'true', texto: 'DEMITIDO' }),
      el('h1', { texto: 'Você foi demitido!' }),
      el('p', { class: 'destaque-texto', texto: `A central entrou em colapso às ${dados?.hora ?? '—'} do dia ${dados?.dia ?? 1}.` }),
      r ? resumoEmLista(r) : null,
      el('aside', { class: 'fala-socorro' }, [
        el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
        el('p', {}, [
          el('strong', { texto: 'Dona Socorro: ' }),
          '“Respira. Ninguém nasce sabendo. Atende primeiro quem está esperando há mais tempo e olha bem para quem você manda cada ligação.”'
        ])
      ]),
      el('div', { class: 'acoes-resultado' }, [
        el('button', { type: 'button', class: 'botao-principal', texto: '↻ Repetir o dia', aoClicar: () => irPara('jogo') }),
        el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
      ])
    ])
  );
}

/** Lista curta com os números do dia (também usada na tela de fim do dia). */
export function resumoEmLista(r) {
  const item = (rotulo, valor) => [el('dt', { texto: rotulo }), el('dd', { texto: valor })];
  return el('dl', { class: 'resumo-dia' }, [
    ...item('Chamadas atendidas', String(r.atendidas)),
    ...item('Encaminhamentos certos', `${r.acertos} de ${r.atendidas} (${r.acertoPct}%)`),
    ...item('Trotes identificados', String(r.trotesIdentificados)),
    ...item('Ficaram sem atendimento', String(r.naoAtendidas)),
    ...item('Espera média na fila', textoDuracao(r.esperaMedia)),
    ...item('Colapso máximo', `${Math.round(r.colapsoMax)}%`)
  ]);
}
