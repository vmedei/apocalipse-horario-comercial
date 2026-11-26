// @ts-check
import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { lerSalvo } from '../estado.js';

/** Menu inicial (wireframe: referencias/wireframes/tela1_menu_inicial.png). */
export function telaMenu(container) {
  const concluiuDia1 = Boolean(lerSalvo('concluiu_dia_1', false));

  const botao = (texto, icone, props = {}, extra = null) =>
    el('button', { type: 'button', class: 'botao-menu', ...props }, [
      el('span', { class: 'icone', 'aria-hidden': 'true', texto: icone }),
      el('span', { class: 'rotulo', texto }),
      extra
    ]);

  container.append(
    el('div', { class: 'tela tela-menu' }, [
      el('div', { class: 'barra-menu' }, [
        el('button', {
          type: 'button',
          class: 'botao-ajuda',
          'aria-label': 'Ajuda: sobre o jogo',
          texto: '?',
          aoClicar: () => irPara('sobre')
        })
      ]),
      el('header', { class: 'logo' }, [
        el('p', { class: 'sobretitulo', texto: 'Central de Emergência de Porto Ameno · turno 8h–18h' }),
        el('h1', {}, ['Apocalipse', el('br'), 'em Horário', el('br'), 'Comercial'])
      ]),
      el('nav', { class: 'menu-botoes', 'aria-label': 'Menu principal' }, [
        botao('Começar Expediente', '▶', {
          class: 'botao-menu principal',
          aoClicar: () => irPara('jogo')
        }),
        botao(
          'Hora Extra',
          '⏱',
          concluiuDia1 ? { aoClicar: () => irPara('jogo', { modo: 'hora_extra' }) } : { disabled: true },
          concluiuDia1 ? null : el('span', { class: 'etiqueta', texto: '🔒 libera após o dia 1' })
        ),
        el('div', { class: 'linha-botoes' }, [
          botao('Acessibilidade', 'Aa', { disabled: true }, el('span', { class: 'etiqueta', texto: 'em breve' })),
          botao('Sobre o jogo', 'i', { aoClicar: () => irPara('sobre') })
        ])
      ]),
      el('p', { class: 'aviso', role: 'note' }, [
        el('span', { class: 'icone', 'aria-hidden': 'true', texto: '!' }),
        'Este jogo terá luzes piscantes em alguns momentos. Elas poderão ser desligadas em Acessibilidade.'
      ])
    ])
  );
}
