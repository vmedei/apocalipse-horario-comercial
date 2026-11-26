// @ts-check
// Painel de depuração, visível só com ?debug na URL.
// Cada marco acrescenta controles aqui (gabarito, colapso, terminar o dia…).

import { el } from '../ui/dom.js';
import { estado, parametros, atualizarEstado, apagarSalvos } from '../estado.js';
import { textoVersao } from '../versao.js';
import { ouvir } from '../eventos.js';
import { irPara } from '../roteador.js';

export function instalarPainelDebug() {
  if (!parametros.debug) return;

  // Acesso pelo console: window.jogo.estado
  Object.assign(window, { jogo: { estado, parametros } });

  const info = el('dl', { class: 'debug-info' });
  const atualizarInfo = () => {
    info.replaceChildren(
      ...linha('Tela', estado.tela),
      ...linha('Dia', String(estado.dia)),
      ...linha('Semente', String(estado.semente)),
      ...linha('Velocidade', `${estado.velocidade}×`),
      ...linha('Versão', textoVersao())
    );
  };

  const botoesVelocidade = [1, 4, 10].map((v) =>
    el('button', {
      type: 'button',
      texto: `${v}×`,
      'aria-pressed': String(estado.velocidade === v),
      aoClicar: () => atualizarEstado({ velocidade: v })
    })
  );

  const corpo = el('div', { class: 'debug-corpo' }, [
    info,
    el('p', { class: 'debug-rotulo', texto: 'Velocidade do relógio' }),
    el('div', { class: 'debug-linha' }, botoesVelocidade),
    el('p', { class: 'debug-rotulo', texto: 'Ir para' }),
    el('div', { class: 'debug-linha' }, [
      el('button', { type: 'button', texto: 'Menu', aoClicar: () => irPara('menu') }),
      el('button', { type: 'button', texto: 'Jogo', aoClicar: () => irPara('jogo') })
    ]),
    el('p', { class: 'debug-rotulo', texto: 'Testes' }),
    el('div', { class: 'debug-linha' }, [
      el('button', {
        type: 'button',
        texto: 'Simular erro',
        aoClicar: () => {
          setTimeout(() => {
            throw new Error('Erro de teste disparado pelo painel de depuração');
          });
        }
      }),
      el('button', {
        type: 'button',
        texto: 'Apagar dados salvos',
        aoClicar: (e) => {
          const ok = apagarSalvos();
          e.currentTarget.textContent = ok ? '✓ Apagados' : 'Bloqueado neste navegador';
        }
      })
    ])
  ]);

  const painel = el('details', { class: 'painel-debug', open: true }, [
    el('summary', { texto: '🛠 Depuração' }),
    corpo
  ]);
  document.body.append(painel);

  atualizarInfo();
  ouvir('estado_mudou', () => {
    atualizarInfo();
    botoesVelocidade.forEach((b, i) =>
      b.setAttribute('aria-pressed', String([1, 4, 10].at(i) === estado.velocidade))
    );
  });
}

function linha(rotulo, valor) {
  return [el('dt', { texto: rotulo }), el('dd', { texto: valor })];
}
