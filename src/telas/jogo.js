// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import orgaos from '../dados/orgaos.json';
import bairros from '../dados/bairros.json';
import nomesEventos from '../dados/eventos.json';

/**
 * Tela de jogo PROVISÓRIA (Marco 0): confirma que os dados carregam.
 * A central de verdade (wireframe tela2_jogo_hud.png) chega no Marco 1.
 */
export function telaJogo(container) {
  container.append(
    el('div', { class: 'tela tela-jogo-provisoria' }, [
      el('header', { class: 'barra-superior' }, [
        el('span', { class: 'relogio', texto: '🕗 08:00' }),
        el('span', { class: 'etiqueta', texto: `Dia ${estado.dia} de 5` }),
        el('button', {
          type: 'button',
          class: 'botao-secundario',
          texto: '← Voltar ao menu',
          aoClicar: () => irPara('menu')
        })
      ]),
      el('h1', { texto: 'Central de Emergência de Porto Ameno' }),
      el('p', {
        class: 'nota',
        texto: 'Tela provisória do Marco 0. A central com fila de chamadas abre no Marco 1.'
      }),
      el('section', { 'aria-labelledby': 'titulo-orgaos' }, [
        el('h2', { id: 'titulo-orgaos', texto: 'Órgãos de atendimento' }),
        el(
          'ul',
          { class: 'grade-orgaos' },
          orgaos.map((o) =>
            el('li', { class: 'cartao-orgao' }, [
              el('span', { class: 'numero', texto: o.id }),
              el('span', { class: 'nome', texto: o.nome }),
              el('span', {
                class: 'detalhe',
                texto: `${o.frota_inicial} ${o.frota_inicial === 1 ? o.veiculo : plural(o.veiculo)} disponíve${o.frota_inicial === 1 ? 'l' : 'is'}`
              })
            ])
          )
        )
      ]),
      el('section', { 'aria-labelledby': 'titulo-bairros' }, [
        el('h2', { id: 'titulo-bairros', texto: 'Bairros de Porto Ameno' }),
        el(
          'ul',
          { class: 'lista-bairros' },
          bairros.map((b) => el('li', {}, [el('strong', { texto: b.nome }), ` · riscos: ${b.riscos.map((r) => nomesEventos[r] ?? r).join(', ')}`]))
        )
      ])
    ])
  );
}

/** Plural simples dos nomes de veículo. */
function plural(palavra) {
  return palavra.endsWith('ão') ? palavra.slice(0, -2) + 'ões' : palavra + 's';
}
