// @ts-check
// Tela da central (wireframe: referencias/wireframes/tela2_jogo_hud.png).
// Marco 2: o dia 1 inteiro — relógio, fila viva, veículos, Colapso, demissão e tutorial.

import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado, parametros, lerSalvo, salvar } from '../estado.js';
import { ouvir } from '../eventos.js';
import { iconeOcorrencia, iconeOrgao } from '../ui/icones.js';
import { criarMapa } from '../ui/mapa.js';
import { criarTutorial } from '../ui/tutorial.js';
import { horaDoJogo, textoDuracao } from '../sistemas/relogio.js';
import {
  criarExpediente,
  avancar,
  atender,
  perguntar,
  despachar,
  livres,
  resumoDoDia,
  definirColapso,
  dispararChamada,
  terminarAgora
} from '../sistemas/expediente.js';
import orgaos from '../dados/orgaos.json';
import bairros from '../dados/bairros.json';
import personagens from '../dados/personagens.json';
import rotulos from '../dados/rotulos.json';
import dicas from '../dados/dicas_socorro.json';
import tutorialPassos from '../dados/tutorial.json';
import dia1 from '../dados/chamadas/dia_1.json';

/** Maior passo de tempo por quadro (evita saltos se o navegador travar). */
const PASSO_MAXIMO = 0.25;

/** @param {HTMLElement} container */
export function telaJogo(container) {
  /** @type {import('../sistemas/expediente.js').Expediente} */
  let exp = criarExpediente({ chamadas: dia1, orgaos });
  /** @type {{ resolvida: any } | null} */
  let ultimo = null;
  let encerrado = false;
  let rafId = 0;
  let anterior = performance.now();
  let estourouAlguma = false;
  let temporizadorDica = 0;

  const nomeBairro = (id) => bairros.find((b) => b.id === id)?.nome ?? id;
  const pessoaDe = (chamada) => personagens[chamada.personagem] ?? { nome: 'Pessoa', descricao: '' };

  // ---------- Barra superior ----------
  const relogio = el('span', { class: 'relogio', role: 'timer', 'aria-live': 'off' }, ['08:00']);
  const indicadorPausa = el('span', { class: 'etiqueta pausa', hidden: true, texto: '⏸ pausado' });
  const barraColapso = el('progress', { max: '100', value: '0', 'aria-label': 'Medidor de Colapso' });
  const textoColapso = el('span', { class: 'valor-colapso', texto: '0%' });
  const listaFrota = el('ul', { class: 'frota', 'aria-label': 'Veículos livres por órgão' });

  const barra = el('header', { class: 'barra-superior' }, [
    el('span', { class: 'relogio-caixa' }, [el('span', { 'aria-hidden': 'true', texto: '🕗' }), relogio]),
    el('span', { class: 'etiqueta', texto: `Dia ${estado.dia} de 5` }),
    indicadorPausa,
    el('div', { class: 'medidor-colapso' }, [el('span', { class: 'rotulo-pequeno', texto: 'Colapso' }), barraColapso, textoColapso]),
    listaFrota,
    el('div', { class: 'acoes-barra' }, [
      el('button', {
        type: 'button',
        class: 'botao-redondo',
        'aria-label': 'Ver o tutorial da Dona Socorro de novo',
        texto: '?',
        aoClicar: () => tutorial.iniciar([...tutorialPassos.inicio, ...(exp.ativa ? tutorialPassos.primeira_chamada : [])])
      }),
      el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
    ])
  ]);

  // ---------- Colunas ----------
  const tituloFila = el('h2', { class: 'rotulo-coluna', id: 'titulo-fila', texto: 'Fila de chamadas (0)' });
  const listaFila = el('ol', { class: 'lista-fila', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const filaVazia = el('p', { class: 'nota', texto: 'Nenhuma ligação esperando.' });
  const fila = el('section', { class: 'coluna fila', id: 'aba-fila', 'aria-labelledby': 'titulo-fila' }, [tituloFila, listaFila, filaVazia]);

  const painelChamada = el('div', { class: 'conteudo-chamada' });
  const chamadaAtiva = el('section', { class: 'coluna chamada-ativa', id: 'aba-chamada', 'aria-labelledby': 'titulo-chamada' }, [
    el('h2', { class: 'rotulo-coluna', id: 'titulo-chamada', texto: 'Chamada ativa' }),
    painelChamada
  ]);

  const mapa = criarMapa(bairros);
  const colunaMapa = el('section', { class: 'coluna mapa', id: 'aba-mapa', 'aria-labelledby': 'titulo-mapa' }, [
    el('h2', { class: 'rotulo-coluna', id: 'titulo-mapa', texto: 'Mapa de Porto Ameno' }),
    el('div', { class: 'mapa-area' }, [mapa.elemento])
  ]);

  // ---------- Abas (celular) ----------
  const corpo = el('div', { class: 'corpo', 'data-aba': 'chamada' }, [fila, chamadaAtiva, colunaMapa]);
  const botoesAba = /** @type {Record<string, HTMLElement>} */ ({});
  const abas = el(
    'div',
    { class: 'abas', role: 'tablist', 'aria-label': 'Áreas da central' },
    [
      ['fila', 'Fila'],
      ['chamada', 'Chamada'],
      ['mapa', 'Mapa']
    ].map(([id, rotulo]) => {
      const b = el('button', {
        type: 'button',
        role: 'tab',
        'aria-controls': `aba-${id}`,
        'aria-selected': String(id === 'chamada'),
        texto: rotulo,
        aoClicar: () => mudarAba(id)
      });
      botoesAba[id] = b;
      return b;
    })
  );

  function mudarAba(id) {
    corpo.dataset.aba = id;
    for (const [chave, b] of Object.entries(botoesAba)) b.setAttribute('aria-selected', String(chave === id));
  }

  // ---------- Balão de dicas da Dona Socorro ----------
  const textoDica = el('p', {});
  const balaoDica = el('aside', { class: 'balao-socorro', role: 'status', hidden: true }, [
    el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
    textoDica,
    el('button', { type: 'button', class: 'botao-fechar', 'aria-label': 'Fechar dica', texto: '✕', aoClicar: () => (balaoDica.hidden = true) })
  ]);

  function dar(chaveDica) {
    const frase = dicas[chaveDica];
    if (!frase) return;
    textoDica.replaceChildren(el('strong', { texto: 'Dona Socorro: ' }), `“${frase}”`);
    balaoDica.hidden = false;
    clearTimeout(temporizadorDica);
    temporizadorDica = window.setTimeout(() => (balaoDica.hidden = true), 7000);
  }

  const raiz = el('div', { class: 'tela tela-jogo' }, [
    el('h1', { class: 'visualmente-oculto', texto: 'Central de Emergência de Porto Ameno' }),
    barra,
    abas,
    corpo,
    balaoDica
  ]);
  const tutorial = criarTutorial(raiz, { aoMudarAba: mudarAba });
  raiz.append(tutorial.elemento);
  container.append(raiz);

  // ---------- Desenho ----------

  /** @type {Map<string, HTMLElement>} */
  const textosEspera = new Map();

  function desenharFila() {
    textosEspera.clear();
    tituloFila.textContent = `Fila de chamadas (${exp.fila.length})`;
    botoesAba.fila.textContent = exp.fila.length ? `Fila (${exp.fila.length})` : 'Fila';
    filaVazia.hidden = exp.fila.length > 0;
    listaFila.replaceChildren(
      ...exp.fila.map((item) => {
        const c = item.chamada;
        const espera = el('span', { class: 'espera' });
        textosEspera.set(c.id, espera);
        const estourou = exp.tempo - item.chegouEm > c.tempo_limite;
        return el('li', {}, [
          el(
            'button',
            {
              type: 'button',
              class: estourou ? 'cartao-chamada estourou' : 'cartao-chamada',
              disabled: Boolean(exp.ativa),
              'aria-label': `Atender: ${c.titulo_fila}, ${nomeBairro(c.bairro)}${estourou ? ', esperando demais' : ''}`,
              aoClicar: () => atenderChamada(c.id)
            },
            [
              el('span', { class: 'icone-cartao', 'aria-hidden': 'true', texto: iconeOcorrencia(c.icone) }),
              el('span', { class: 'texto-cartao' }, [
                el('strong', { texto: c.titulo_fila }),
                el('span', { class: 'suave', texto: nomeBairro(c.bairro) }),
                espera,
                estado.gabarito ? el('span', { class: 'gabarito', texto: `gabarito: ${c.trote ? 'trote' : c.orgao_correto}` }) : null
              ])
            ]
          )
        ]);
      })
    );
    atualizarEsperas();
  }

  function atualizarEsperas() {
    for (const item of exp.fila) {
      const span = textosEspera.get(item.chamada.id);
      if (!span) continue;
      const espera = exp.tempo - item.chegouEm;
      const estourou = espera > item.chamada.tempo_limite;
      const texto = `${estourou ? '⚠ ' : ''}esperando ${textoDuracao(espera)}`;
      if (span.textContent !== texto) span.textContent = texto;
      const cartao = span.closest('.cartao-chamada');
      if (cartao && estourou !== cartao.classList.contains('estourou')) cartao.classList.toggle('estourou', estourou);
    }
  }

  function desenharFrota() {
    listaFrota.replaceChildren(
      ...orgaos.map((o) => {
        const n = livres(exp, o.id);
        return el('li', { class: n === 0 ? 'etiqueta esgotado' : 'etiqueta', title: `${o.nome}: ${n} de ${o.frota_inicial} livres` }, [
          `${o.id} `,
          el('span', { 'aria-hidden': 'true', texto: iconeOrgao(o.id) }),
          ` ${n}/${o.frota_inicial}`
        ]);
      })
    );
  }

  function desenharColapso() {
    barraColapso.setAttribute('value', String(exp.colapso));
    textoColapso.textContent = `${Math.round(exp.colapso)}%`;
    barra.classList.toggle('colapso-alto', exp.colapso >= 70);
  }

  function desenharChamada() {
    const ativa = exp.ativa;
    if (!ativa) {
      const blocos = [];
      if (ultimo) blocos.push(feedbackDe(ultimo.resolvida));
      if (exp.fila.length) {
        const maisAntiga = exp.fila[0];
        blocos.push(
          el('div', { class: 'sem-chamada' }, [
            el('p', { texto: `${exp.fila.length === 1 ? 'Há 1 ligação' : `Há ${exp.fila.length} ligações`} na fila. Escolha qual atender.` }),
            el('button', {
              type: 'button',
              class: 'botao-principal',
              texto: '📞 Atender a mais antiga',
              aoClicar: () => atenderChamada(maisAntiga.chamada.id)
            })
          ])
        );
      } else {
        blocos.push(el('p', { class: 'sem-chamada suave', texto: 'Aguardando ligações…' }));
      }
      painelChamada.replaceChildren(...blocos);
      return;
    }

    const c = ativa.chamada;
    const pessoa = pessoaDe(c);
    const transcricao = el('ol', { class: 'transcricao', 'aria-live': 'polite', 'aria-label': 'Transcrição da ligação' }, [
      fala(pessoa.nome, `“${c.fala_inicial}”`, 'pessoa'),
      ...ativa.perguntas.flatMap((id) => {
        const p = c.perguntas.find((x) => x.id === id);
        return p ? [fala('Você', p.texto, 'atendente'), fala(pessoa.nome, `“${p.resposta}”`, 'pessoa')] : [];
      })
    ]);

    const perguntas = el(
      'div',
      { class: 'perguntas' },
      c.perguntas.map((p) => {
        const feita = ativa.perguntas.includes(p.id);
        return el('button', {
          type: 'button',
          class: feita ? 'chip feito' : 'chip',
          disabled: feita,
          texto: feita ? `✓ ${p.texto}` : p.texto,
          aoClicar: () => aplicar(perguntar(exp, p.id))
        });
      })
    );

    const ficha = el(
      'dl',
      { class: 'ficha' },
      [
        ['Bairro', nomeBairro(c.bairro), false],
        ...c.perguntas.map((p) => {
          const feita = ativa.perguntas.includes(p.id);
          return [rotulos.campos_ficha[p.id] ?? p.texto, feita ? p.resposta : '? (pergunte)', !feita];
        })
      ].flatMap(([rotulo, valor, pendente]) => [el('dt', { texto: rotulo }), el('dd', { class: pendente ? 'suave' : null, texto: valor })])
    );

    painelChamada.replaceChildren(
      el('div', { class: 'cabecalho-chamada' }, [
        el('span', { class: 'retrato', 'aria-hidden': 'true', texto: iniciais(pessoa.nome) }),
        el('div', {}, [
          el('p', { class: 'nome-pessoa' }, [el('strong', { texto: pessoa.nome }), el('span', { class: 'suave', texto: ` · ${nomeBairro(c.bairro)}` })]),
          el('p', { class: 'murmurio suave' }, [
            el('span', { 'aria-hidden': 'true', texto: '〰 ' }),
            `murmúrio · ${rotulos.emocoes[c.emocao] ?? c.emocao}`,
            el('span', { 'aria-hidden': 'true', texto: ' 〰' })
          ])
        ])
      ]),
      transcricao,
      el('h3', { class: 'rotulo-coluna', texto: 'Perguntar' }),
      perguntas,
      el('h3', { class: 'rotulo-coluna', texto: 'Despachar para' }),
      el('div', { class: 'despacho' }, [
        el(
          'div',
          { class: 'grade-despacho' },
          orgaos.map((o) => {
            const n = livres(exp, o.id);
            return el(
              'button',
              {
                type: 'button',
                class: 'botao-orgao',
                'data-orgao': o.id,
                disabled: n === 0,
                'aria-label': n === 0 ? `${o.nome}, ${o.id}: sem veículo livre` : `Despachar para ${o.nome}, ${o.id}`,
                aoClicar: () => despacharPara(o.id)
              },
              [
                el('span', { class: 'numero', texto: o.id }),
                el('span', { class: 'nome-orgao', texto: o.nome }),
                el('span', { class: 'livres-orgao', texto: n === 0 ? 'sem veículo' : `${n} ${n === 1 ? 'livre' : 'livres'}` })
              ]
            );
          })
        ),
        el('button', { type: 'button', class: 'botao-trote', texto: '✕ Encerrar como trote', aoClicar: () => despacharPara('trote') }),
        estado.gabarito ? el('p', { class: 'gabarito', texto: `Gabarito: ${c.trote ? 'trote' : c.orgao_correto}` }) : null
      ]),
      el('h3', { class: 'rotulo-coluna', texto: 'Ficha da ocorrência' }),
      ficha
    );
    transcricao.scrollTop = transcricao.scrollHeight;
  }

  function feedbackDe(r) {
    const sinal = r.resultado.deltaColapso > 0 ? `+${r.resultado.deltaColapso}` : String(r.resultado.deltaColapso);
    return el('div', { class: r.resultado.acertou ? 'feedback acerto' : 'feedback erro', role: 'alert' }, [
      el('p', { class: 'titulo-feedback' }, [
        el('span', { class: 'icone-feedback', 'aria-hidden': 'true', texto: r.resultado.acertou ? '✔' : '✖' }),
        r.resultado.acertou ? 'Acertou!' : tituloErro(r.resultado.tipo)
      ]),
      el('p', { class: 'suave', texto: `${r.chamada.titulo_fila} · ${pessoaDe(r.chamada).nome}` }),
      el('p', { texto: r.resultado.motivo }),
      el('p', { class: 'suave', texto: `Medidor de Colapso: ${sinal}` })
    ]);
  }

  // ---------- Ações do jogador ----------

  function atenderChamada(id) {
    aplicar(atender(exp, id));
    mudarAba('chamada');
    if (!lerSalvo('tutorial_chamada_visto', false)) {
      salvar('tutorial_chamada_visto', true);
      // Espera o desenho da chamada para destacar as partes certas.
      requestAnimationFrame(() => tutorial.iniciar(tutorialPassos.primeira_chamada));
    }
  }

  function despacharPara(escolha) {
    const r = despachar(exp, escolha);
    if (r.erro === 'sem_veiculo') {
      dar('sem_veiculo');
      return;
    }
    aplicar(r);
  }

  // ---------- Eventos do expediente ----------

  /** @param {{ exp: typeof exp, eventos: {tipo: string, [k: string]: any}[] }} r */
  function aplicar(r) {
    exp = r.exp;
    let fila = false;
    let chamada = false;
    let frota = false;
    let colapso = false;
    for (const e of r.eventos) {
      if (e.tipo === 'chamada_chegou') {
        fila = true;
        if (!exp.ativa) chamada = true;
        tocar();
      } else if (e.tipo === 'chamada_estourou') {
        fila = true;
        if (!estourouAlguma) {
          estourouAlguma = true;
          dar('fila_estourando');
        }
      } else if (e.tipo === 'chamada_atendida' || e.tipo === 'pergunta_feita') {
        fila = true;
        chamada = true;
      } else if (e.tipo === 'chamada_resolvida') {
        ultimo = { resolvida: e.resolvida };
        fila = chamada = frota = colapso = true;
        const res = e.resolvida.resultado;
        if (!res.acertou) {
          if (res.tipo === 'orgao_errado') dar(`erro_orgao_${e.resolvida.chamada.orgao_correto}`);
          else dar(res.tipo);
        }
      } else if (e.tipo === 'veiculo_partiu' || e.tipo === 'veiculo_voltou') {
        frota = true;
        if (exp.ativa) chamada = true;
      } else if (e.tipo === 'colapso_mudou') {
        colapso = true;
      } else if (e.tipo === 'colapsou') {
        encerrar('colapso');
      } else if (e.tipo === 'dia_terminou') {
        encerrar('expediente');
      }
    }
    if (fila) desenharFila();
    if (chamada) desenharChamada();
    if (frota) desenharFrota();
    if (colapso) desenharColapso();
  }

  function encerrar(motivo) {
    if (encerrado) return;
    encerrado = true;
    cancelAnimationFrame(rafId);
    const dados = { resumo: resumoDoDia(exp), hora: horaDoJogo(exp.tempo), dia: estado.dia };
    if (motivo === 'expediente') salvar('concluiu_dia_1', true);
    raiz.classList.add(motivo === 'colapso' ? 'encerrando-colapso' : 'encerrando');
    window.setTimeout(() => irPara(motivo === 'colapso' ? 'demitido' : 'fim_dia', dados), 1200);
  }

  function tocar() {
    relogio.closest('.relogio-caixa')?.classList.remove('tocando');
    // Força o navegador a reiniciar a animação.
    void relogio.offsetWidth;
    relogio.closest('.relogio-caixa')?.classList.add('tocando');
  }

  // ---------- Laço do jogo ----------

  const pausado = () => tutorial.ativo() || document.hidden;

  function quadro(agora) {
    const dt = Math.min(PASSO_MAXIMO, (agora - anterior) / 1000);
    anterior = agora;
    const parado = pausado();
    if (indicadorPausa.hidden !== !parado) indicadorPausa.hidden = !parado;
    if (!parado) aplicar(avancar(exp, dt * estado.velocidade));
    const hora = horaDoJogo(exp.tempo);
    if (relogio.textContent !== hora) relogio.textContent = hora;
    atualizarEsperas();
    mapa.atualizar(exp);
    if (!encerrado) rafId = requestAnimationFrame(quadro);
  }

  // ---------- Depuração e estado ----------

  const pararDeOuvirEstado = ouvir('estado_mudou', () => {
    desenharFila();
    desenharChamada();
  });

  const pararDeOuvirDebug = ouvir('debug', (cmd) => {
    if (encerrado) return;
    if (cmd.comando === 'colapso') aplicar(definirColapso(exp, cmd.valor));
    else if (cmd.comando === 'terminar') aplicar(terminarAgora(exp));
    else if (cmd.comando === 'disparar') {
      const c = dia1.find((x) => x.id === cmd.chamadaId);
      if (c) aplicar(dispararChamada(exp, c));
    }
  });

  if (parametros.debug) Object.assign(window, { jogo: { ...(/** @type {any} */ (window).jogo ?? {}), expediente: () => exp } });

  // ---------- Início ----------

  desenharFila();
  desenharFrota();
  desenharColapso();
  desenharChamada();
  mapa.atualizar(exp);

  if (!lerSalvo('tutorial_inicio_visto', false)) {
    salvar('tutorial_inicio_visto', true);
    tutorial.iniciar(tutorialPassos.inicio);
  }

  rafId = requestAnimationFrame((t) => {
    anterior = t;
    quadro(t);
  });

  return () => {
    encerrado = true;
    cancelAnimationFrame(rafId);
    clearTimeout(temporizadorDica);
    pararDeOuvirEstado();
    pararDeOuvirDebug();
  };
}

function fala(quem, texto, lado) {
  return el('li', { class: `fala ${lado}` }, [el('span', { class: 'quem', texto: quem }), el('span', { class: 'texto-fala', texto })]);
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
