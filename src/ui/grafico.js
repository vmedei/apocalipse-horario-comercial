// @ts-check
// Gráfico de evolução da semana (SVG): acerto no encaminhamento e fatia de chamadas climáticas.
// As duas séries usam a mesma escala (0 a 100%). A identidade não depende de cor:
// linha cheia × tracejada, marcador cheio × vazado, legenda e rótulo direto no último ponto.

import { el } from './dom.js';
import { s } from './svg.js';

const L = 480;
const A = 210;
const M = { esq: 56, dir: 100, topo: 16, base: 30 };

/**
 * @typedef {{ dia: number, acerto: number | null, climaticas: number | null }} Ponto
 * @typedef {{ chave: 'acerto' | 'climaticas', nome: string, rotulo: string, classe: string }} Serie
 */

/** @type {Serie[]} */
const SERIES = [
  { chave: 'acerto', nome: 'Acerto no encaminhamento', rotulo: 'acerto', classe: 'serie-acerto' },
  { chave: 'climaticas', nome: 'Chamadas climáticas', rotulo: 'climáticas', classe: 'serie-climaticas' }
];

/**
 * @param {Ponto[]} serie  um ponto por dia da semana (null = dia ainda não jogado)
 * @param {number} diaAtual
 */
export function graficoEvolucao(serie, diaAtual) {
  const n = serie.length;
  const x = (dia) => M.esq + ((dia - 1) * (L - M.esq - M.dir)) / Math.max(1, n - 1);
  const y = (v) => M.topo + ((100 - v) * (A - M.topo - M.base)) / 100;

  const grade = [0, 50, 100].map((v) =>
    s('g', { class: 'grafico-grade' }, [
      s('line', { x1: M.esq, x2: L - M.dir, y1: y(v), y2: y(v) }),
      s('text', { x: M.esq - 8, y: y(v) + 4, 'text-anchor': 'end', texto: `${v}%` })
    ])
  );
  const eixoX = serie.map((p) =>
    s('text', {
      class: p.dia > diaAtual ? 'grafico-dia futuro' : p.dia === diaAtual ? 'grafico-dia atual' : 'grafico-dia',
      x: x(p.dia),
      y: A - 8,
      'text-anchor': 'middle',
      texto: `Dia ${p.dia}`
    })
  );

  // Rótulos diretos no último ponto de cada série, afastados se ficarem colados.
  const ultimos = SERIES.map((se) => {
    const pts = serie.filter((p) => p[se.chave] !== null);
    const ult = pts[pts.length - 1];
    return ult ? { se, x: x(ult.dia), y: y(/** @type {number} */ (ult[se.chave])) } : null;
  });
  if (ultimos[0] && ultimos[1] && Math.abs(ultimos[0].y - ultimos[1].y) < 16) {
    const [cima, baixo] = ultimos[0].y <= ultimos[1].y ? [ultimos[0], ultimos[1]] : [ultimos[1], ultimos[0]];
    const meio = (cima.y + baixo.y) / 2;
    cima.yRotulo = meio - 8;
    baixo.yRotulo = meio + 8;
  }

  const desenhos = SERIES.map((se, i) => {
    const pts = serie.filter((p) => p[se.chave] !== null);
    const caminho = pts.map((p, j) => `${j ? 'L' : 'M'}${x(p.dia)},${y(/** @type {number} */ (p[se.chave]))}`).join(' ');
    const u = ultimos[i];
    return s('g', { class: `grafico-serie ${se.classe}` }, [
      pts.length > 1 ? s('path', { class: 'linha', d: caminho }) : null,
      ...pts.map((p) =>
        s('g', { class: 'ponto' }, [
          s('title', { texto: `Dia ${p.dia}: ${se.nome.toLowerCase()} ${p[se.chave]}%` }),
          s('circle', { class: 'alvo', cx: x(p.dia), cy: y(/** @type {number} */ (p[se.chave])), r: 12 }),
          s('circle', { class: 'marca', cx: x(p.dia), cy: y(/** @type {number} */ (p[se.chave])), r: 4.5 })
        ])
      ),
      u ? s('text', { class: 'rotulo-direto', x: u.x + 10, y: (u.yRotulo ?? u.y) + 4, texto: se.rotulo }) : null
    ]);
  });

  const jogados = serie.filter((p) => p.acerto !== null);
  const resumo = jogados.length
    ? `Evolução da semana. ${jogados.map((p) => `Dia ${p.dia}: acerto ${p.acerto}%, chamadas climáticas ${p.climaticas}%`).join('. ')}.`
    : 'Evolução da semana: nenhum dia registrado ainda.';

  const legenda = el(
    'ul',
    { class: 'grafico-legenda' },
    SERIES.map((se) =>
      el('li', {}, [
        el('span', { class: `amostra ${se.classe}`, 'aria-hidden': 'true' }),
        se.nome
      ])
    )
  );

  const tabela = el('details', { class: 'grafico-tabela' }, [
    el('summary', { texto: 'Ver os números' }),
    el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', { texto: 'Dia' }), ...SERIES.map((se) => el('th', { texto: se.nome }))])]),
      el(
        'tbody',
        {},
        jogados.map((p) =>
          el('tr', {}, [el('th', { texto: `Dia ${p.dia}` }), el('td', { texto: `${p.acerto}%` }), el('td', { texto: `${p.climaticas}%` })])
        )
      )
    ])
  ]);

  const svg = s('svg', { class: 'grafico', viewBox: `0 0 ${L} ${A}`, role: 'img', 'aria-label': resumo }, [
    ...grade,
    s('line', { class: 'grafico-eixo', x1: M.esq, x2: L - M.dir, y1: y(0), y2: y(0) }),
    ...eixoX,
    ...desenhos
  ]);

  return el('div', { class: 'grafico-evolucao' }, [legenda, svg, tabela]);
}
