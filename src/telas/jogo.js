// @ts-check
// Tela da central (wireframe: referencias/wireframes/tela2_jogo_hud.png).
// Marco 1: UMA chamada do começo ao fim. Fila, relógio e frota de verdade chegam no Marco 2.

import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import { iconeOcorrencia, iconeOrgao } from '../ui/icones.js';
import { resolverDespacho } from '../sistemas/despacho.js';
import { aplicarColapso } from '../sistemas/colapso.js';
import orgaos from '../dados/orgaos.json';
import bairros from '../dados/bairros.json';
import personagens from '../dados/personagens.json';
import rotulos from '../dados/rotulos.json';
import dia1 from '../dados/chamadas/dia_1.json';

const CHAMADA_PADRAO = 'd1_arlindo_gato';

/** Posição de cada bairro no mapa provisório (em % do retângulo). */
const POSICAO_BAIRRO = {
  parque: { x: 28, y: 14 },
  serra_seca: { x: 72, y: 18 },
  morro: { x: 26, y: 46 },
  centro: { x: 62, y: 52 },
  orla: { x: 46, y: 84 }
};

/**
 * @param {HTMLElement} container
 * @param {{ chamadaId?: string }} [dados]
 */
export function telaJogo(container, dados = {}) {
  const chamada = dia1.find((c) => c.id === dados.chamadaId) ?? dia1.find((c) => c.id === CHAMADA_PADRAO);
  if (!chamada) throw new Error('Chamada não encontrada nos dados do dia 1');

  const pessoa = personagens[chamada.personagem] ?? { nome: 'Pessoa', descricao: '' };
  const bairro = bairros.find((b) => b.id === chamada.bairro);
  const nomeBairro = bairro?.nome ?? chamada.bairro;

  /** Estado só desta tela. */
  const s = {
    perguntasFeitas: /** @type {Set<string>} */ (new Set()),
    resultado: /** @type {ReturnType<typeof resolverDespacho> | null} */ (null),
    colapso: 0
  };

  // ---------- Barra superior ----------
  const barraColapso = el('progress', { max: '100', value: '0', 'aria-label': 'Medidor de Colapso' });
  const textoColapso = el('span', { class: 'valor-colapso', texto: '0%' });

  const barra = el('header', { class: 'barra-superior' }, [
    el('span', { class: 'relogio', 'aria-label': `Hora: ${chamada.hora}` }, [
      el('span', { 'aria-hidden': 'true', texto: '🕗 ' }),
      chamada.hora
    ]),
    el('span', { class: 'etiqueta', texto: `Dia ${estado.dia} de 5` }),
    el('div', { class: 'medidor-colapso' }, [
      el('span', { class: 'rotulo-pequeno', texto: 'Colapso' }),
      barraColapso,
      textoColapso
    ]),
    el(
      'ul',
      { class: 'frota', 'aria-label': 'Veículos disponíveis por órgão' },
      orgaos.map((o) =>
        el('li', { class: 'etiqueta', title: o.nome }, [
          `${o.id} `,
          el('span', { 'aria-hidden': 'true', texto: iconeOrgao(o.id) }),
          ` ${o.frota_inicial}/${o.frota_inicial}`
        ])
      )
    ),
    el('div', { class: 'acoes-barra' }, [
      el('button', {
        type: 'button',
        class: 'botao-redondo',
        'aria-label': 'Ajuda da Dona Socorro',
        'aria-expanded': 'false',
        texto: '?',
        aoClicar: (e) => alternarAjuda(e.currentTarget)
      }),
      el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
    ])
  ]);

  // ---------- Fila (por enquanto, só a chamada atual) ----------
  const fila = el('section', { class: 'coluna fila', id: 'aba-fila', 'aria-labelledby': 'titulo-fila' }, [
    el('h2', { class: 'rotulo-coluna', id: 'titulo-fila', texto: 'Fila de chamadas (1)' }),
    el('ol', { class: 'lista-fila' }, [
      el('li', { class: 'cartao-chamada ativo', 'aria-current': 'true' }, [
        el('span', { class: 'icone-cartao', 'aria-hidden': 'true', texto: iconeOcorrencia(chamada.icone) }),
        el('span', { class: 'texto-cartao' }, [
          el('strong', { texto: chamada.titulo_fila }),
          el('span', { class: 'suave', texto: `${nomeBairro} · em atendimento` })
        ])
      ])
    ]),
    el('p', { class: 'nota', texto: 'A fila com várias chamadas e o relógio andando chegam no Marco 2.' })
  ]);

  // ---------- Chamada ativa ----------
  const transcricao = el('ol', { class: 'transcricao', 'aria-live': 'polite', 'aria-label': 'Transcrição da ligação' });
  const perguntas = el('div', { class: 'perguntas' });
  const ficha = el('dl', { class: 'ficha' });
  const despacho = el('div', { class: 'despacho' });
  const feedback = el('div', { class: 'feedback', role: 'alert', hidden: true });

  const chamadaAtiva = el('section', { class: 'coluna chamada-ativa', id: 'aba-chamada', 'aria-labelledby': 'titulo-chamada' }, [
    el('h2', { class: 'rotulo-coluna', id: 'titulo-chamada', texto: 'Chamada ativa' }),
    el('div', { class: 'cabecalho-chamada' }, [
      el('span', { class: 'retrato', 'aria-hidden': 'true', texto: iniciais(pessoa.nome) }),
      el('div', {}, [
        el('p', { class: 'nome-pessoa' }, [el('strong', { texto: pessoa.nome }), el('span', { class: 'suave', texto: ` · ${nomeBairro}` })]),
        el('p', { class: 'murmurio suave' }, [
          el('span', { 'aria-hidden': 'true', texto: '〰 ' }),
          `murmúrio · ${rotulos.emocoes[chamada.emocao] ?? chamada.emocao}`,
          el('span', { 'aria-hidden': 'true', texto: ' 〰' })
        ])
      ])
    ]),
    transcricao,
    el('h3', { class: 'rotulo-coluna', texto: 'Perguntar' }),
    perguntas,
    el('h3', { class: 'rotulo-coluna', texto: 'Despachar para' }),
    despacho,
    feedback,
    el('h3', { class: 'rotulo-coluna', texto: 'Ficha da ocorrência' }),
    ficha
  ]);

  // ---------- Mapa provisório ----------
  const mapa = el('section', { class: 'coluna mapa', id: 'aba-mapa', 'aria-labelledby': 'titulo-mapa' }, [
    el('h2', { class: 'rotulo-coluna', id: 'titulo-mapa', texto: 'Mapa de Porto Ameno' }),
    el(
      'div',
      { class: 'mapa-area', role: 'img', 'aria-label': `Mapa provisório. Ocorrência em: ${nomeBairro}` },
      bairros.map((b) => {
        const pos = POSICAO_BAIRRO[b.id] ?? { x: 50, y: 50 };
        const ativo = b.id === chamada.bairro;
        return el('span', { class: ativo ? 'bairro ativo' : 'bairro', style: `left:${pos.x}%;top:${pos.y}%` }, [
          ativo ? el('span', { 'aria-hidden': 'true', texto: '📍 ' }) : null,
          b.nome.replace(' (Praia do Sossego)', '')
        ]);
      })
    ),
    el('p', { class: 'nota', texto: 'Mapa ilustrado e veículos em movimento chegam no Marco 2.' })
  ]);

  // ---------- Abas (só no celular) ----------
  const corpo = el('div', { class: 'corpo', 'data-aba': 'chamada' }, [fila, chamadaAtiva, mapa]);
  const abas = el(
    'div',
    { class: 'abas', role: 'tablist', 'aria-label': 'Áreas da central' },
    [
      ['fila', 'Fila'],
      ['chamada', 'Chamada'],
      ['mapa', 'Mapa']
    ].map(([id, rotulo]) =>
      el('button', {
        type: 'button',
        role: 'tab',
        'aria-controls': `aba-${id}`,
        'aria-selected': String(id === 'chamada'),
        texto: rotulo,
        aoClicar: (e) => {
          corpo.dataset.aba = id;
          abas.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(b === e.currentTarget)));
        }
      })
    )
  );

  const balao = el('aside', { class: 'balao-socorro', role: 'status', hidden: true }, [
    el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
    el('p', {}, [
      el('strong', { texto: 'Dona Socorro: ' }),
      '“Leia o que a pessoa diz, pergunte o que faltar e mande para o órgão certo. ' +
        'Se for brincadeira, encerre como trote e libere a linha.”'
    ])
  ]);

  container.append(
    el('div', { class: 'tela tela-jogo' }, [
      el('h1', { class: 'visualmente-oculto', texto: 'Central de Emergência' }),
      barra,
      abas,
      corpo,
      balao
    ])
  );

  // ---------- Comportamento ----------

  function adicionarFala(quem, texto, lado) {
    transcricao.append(
      el('li', { class: `fala ${lado}` }, [el('span', { class: 'quem', texto: quem }), el('span', { class: 'texto-fala', texto })])
    );
    transcricao.scrollTop = transcricao.scrollHeight;
  }

  function desenharPerguntas() {
    perguntas.replaceChildren(
      ...chamada.perguntas.map((p) => {
        const feita = s.perguntasFeitas.has(p.id);
        return el('button', {
          type: 'button',
          class: feita ? 'chip feito' : 'chip',
          disabled: feita || Boolean(s.resultado),
          texto: feita ? `✓ ${p.texto}` : p.texto,
          aoClicar: () => perguntar(p)
        });
      })
    );
  }

  function perguntar(p) {
    s.perguntasFeitas.add(p.id);
    adicionarFala('Você', p.texto, 'atendente');
    adicionarFala(pessoa.nome, `“${p.resposta}”`, 'pessoa');
    desenharPerguntas();
    desenharFicha();
  }

  function desenharFicha() {
    const linhas = [
      ['Bairro', nomeBairro, false],
      ...chamada.perguntas.map((p) => {
        const feita = s.perguntasFeitas.has(p.id);
        return [rotulos.campos_ficha[p.id] ?? p.texto, feita ? p.resposta : '? (pergunte)', !feita];
      })
    ];
    ficha.replaceChildren(
      ...linhas.flatMap(([rotulo, valor, pendente]) => [
        el('dt', { texto: rotulo }),
        el('dd', { class: pendente ? 'suave' : null, texto: valor })
      ])
    );
  }

  function desenharDespacho() {
    const bloqueado = Boolean(s.resultado);
    despacho.replaceChildren(
      el(
        'div',
        { class: 'grade-despacho' },
        orgaos.map((o) =>
          el(
            'button',
            {
              type: 'button',
              class: 'botao-orgao',
              disabled: bloqueado,
              'aria-label': `Despachar para ${o.nome}, ${o.id}`,
              aoClicar: () => despachar(o.id)
            },
            [el('span', { class: 'numero', texto: o.id }), el('span', { class: 'nome-orgao', texto: o.nome })]
          )
        )
      ),
      el('button', {
        type: 'button',
        class: 'botao-trote',
        disabled: bloqueado,
        texto: '✕ Encerrar como trote',
        aoClicar: () => despachar('trote')
      })
    );
  }

  function despachar(escolha) {
    if (s.resultado) return;
    const r = resolverDespacho(chamada, escolha);
    s.resultado = r;
    s.colapso = aplicarColapso(s.colapso, r.deltaColapso);

    const orgao = orgaos.find((o) => o.id === escolha);
    adicionarFala(
      'Você',
      escolha === 'trote' ? 'Encerrou a ligação como trote.' : `Despachou: ${orgao?.nome} (${escolha}).`,
      'atendente acao'
    );

    barraColapso.setAttribute('value', String(s.colapso));
    textoColapso.textContent = `${s.colapso}%`;

    const sinal = r.deltaColapso > 0 ? `+${r.deltaColapso}` : String(r.deltaColapso);
    feedback.hidden = false;
    feedback.className = r.acertou ? 'feedback acerto' : 'feedback erro';
    feedback.replaceChildren(
      el('p', { class: 'titulo-feedback' }, [
        el('span', { class: 'icone-feedback', 'aria-hidden': 'true', texto: r.acertou ? '✔' : '✖' }),
        r.acertou ? 'Acertou!' : tituloErro(r.tipo)
      ]),
      el('p', { texto: r.motivo }),
      el('p', { class: 'suave', texto: `Medidor de Colapso: ${sinal}` }),
      el('button', {
        type: 'button',
        class: 'botao-secundario',
        texto: '↻ Atender de novo',
        aoClicar: () => irPara('jogo', { chamadaId: chamada.id })
      })
    );

    desenharPerguntas();
    desenharDespacho();
  }

  function alternarAjuda(botao) {
    balao.hidden = !balao.hidden;
    botao.setAttribute('aria-expanded', String(!balao.hidden));
  }

  // Estado inicial: a pessoa já falou.
  adicionarFala(pessoa.nome, `“${chamada.fala_inicial}”`, 'pessoa');
  desenharPerguntas();
  desenharFicha();
  desenharDespacho();
}

function tituloErro(tipo) {
  if (tipo === 'trote_despachado') return 'Era trote!';
  if (tipo === 'real_como_trote') return 'Não era trote!';
  return 'Encaminhamento errado';
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
