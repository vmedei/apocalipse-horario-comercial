// @ts-check
// Painel de depuração, visível só com ?debug na URL.
// Cada marco acrescenta controles aqui (gabarito, colapso, terminar o dia…).

import { el } from '../ui/dom.js';
import { estado, parametros, atualizarEstado, apagarSalvos } from '../estado.js';
import { textoVersao } from '../versao.js';
import { ouvir, emitir } from '../eventos.js';
import { irPara } from '../roteador.js';
import { chamadasDoDia } from '../dados/chamadas.js';
import { iniciarDia } from '../fluxo.js';

export function instalarPainelDebug() {
  if (!parametros.debug) return;

  // Acesso pelo console: window.jogo.estado
  Object.assign(window, { jogo: { estado, parametros } });

  const info = el('dl', { class: 'debug-info' });
  const atualizarInfo = () => {
    info.replaceChildren(
      ...linha('Tela', estado.tela),
      ...linha('Dia', String(estado.dia)),
      ...linha('Juninho', estado.partida ? `${estado.partida.trotesJuninho} trotes · ${estado.partida.juninhoReal ?? '—'}` : '—'),
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

  const seletorChamada = /** @type {HTMLSelectElement} */ (el('select', { 'aria-label': 'Chamada de teste' }));
  let diaDoSeletor = 0;
  const preencherSeletor = () => {
    if (diaDoSeletor === estado.dia) return;
    diaDoSeletor = estado.dia;
    seletorChamada.replaceChildren(
      ...chamadasDoDia(estado.dia).map((c) =>
        el('option', { value: c.id, texto: `${c.hora} · ${c.titulo_fila}${c.trote ? ' (trote)' : ''}${c.arco ? ' ★' : ''}` })
      )
    );
  };
  preencherSeletor();

  const seletorDia = /** @type {HTMLSelectElement} */ (
    el('select', { 'aria-label': 'Ir para o dia' }, [1, 2, 3, 4, 5].map((d) => el('option', { value: String(d), texto: `Dia ${d}` })))
  );

  const botaoGabarito = el('button', {
    type: 'button',
    texto: 'Gabarito',
    'aria-pressed': String(estado.gabarito),
    aoClicar: () => atualizarEstado({ gabarito: !estado.gabarito })
  });

  const corpo = el('div', { class: 'debug-corpo' }, [
    info,
    el('p', { class: 'debug-rotulo', texto: 'Velocidade do relógio' }),
    el('div', { class: 'debug-linha' }, botoesVelocidade),
    el('p', { class: 'debug-rotulo', texto: 'Ir para' }),
    el('div', { class: 'debug-linha' }, [
      el('button', { type: 'button', texto: 'Menu', aoClicar: () => irPara('menu') }),
      el('button', { type: 'button', texto: 'Recomeçar o dia', aoClicar: () => irPara('jogo') })
    ]),
    el('div', { class: 'debug-linha' }, [
      seletorDia,
      el('button', { type: 'button', texto: 'Ir (jornal da manhã)', aoClicar: () => iniciarDia(Number(seletorDia.value)) })
    ]),
    el('p', { class: 'debug-rotulo', texto: 'Expediente' }),
    el('div', { class: 'debug-linha' }, [
      botaoGabarito,
      el('button', { type: 'button', texto: 'Terminar o dia agora', aoClicar: () => emitir('debug', { comando: 'terminar' }) })
    ]),
    el('div', { class: 'debug-linha' }, [
      el('button', { type: 'button', texto: 'Colapso 0%', aoClicar: () => emitir('debug', { comando: 'colapso', valor: 0 }) }),
      el('button', { type: 'button', texto: 'Colapso 90%', aoClicar: () => emitir('debug', { comando: 'colapso', valor: 90 }) })
    ]),
    el('p', { class: 'debug-rotulo', texto: 'Colocar chamada na fila agora' }),
    el('div', { class: 'debug-linha' }, [
      seletorChamada,
      el('button', {
        type: 'button',
        texto: 'Disparar',
        aoClicar: () => emitir('debug', { comando: 'disparar', chamadaId: seletorChamada.value })
      })
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

  const painel = el('details', { class: 'painel-debug' }, [
    el('summary', { texto: '🛠 Depuração' }),
    corpo
  ]);
  document.body.append(painel);

  atualizarInfo();
  ouvir('estado_mudou', () => {
    atualizarInfo();
    preencherSeletor();
    seletorDia.value = String(estado.dia);
    botaoGabarito.setAttribute('aria-pressed', String(estado.gabarito));
    botoesVelocidade.forEach((b, i) =>
      b.setAttribute('aria-pressed', String([1, 4, 10].at(i) === estado.velocidade))
    );
  });
}

function linha(rotulo, valor) {
  return [el('dt', { texto: rotulo }), el('dd', { texto: valor })];
}
