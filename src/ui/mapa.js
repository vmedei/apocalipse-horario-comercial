// @ts-check
// Mapa de Porto Ameno em SVG: bairros, ocorrências na fila e veículos indo e voltando.
// Formas simples por enquanto; o mapa ilustrado chega no Marco 9.

import { s } from './svg.js';
import { iconeOrgao } from './icones.js';
import { progressoTrajeto } from '../sistemas/frota.js';

/** Centro de cada bairro (onde ficam marcadores e para onde vão os veículos). */
const CENTROS = {
  parque: { x: 105, y: 82 },
  serra_seca: { x: 295, y: 82 },
  morro: { x: 92, y: 250 },
  centro: { x: 272, y: 228 },
  orla: { x: 200, y: 404 }
};

const CENTRAL = { x: 330, y: 318 };

/** Nome curto do bairro no mapa. */
const NOMES = {
  parque: 'Parque Estadual',
  serra_seca: 'Serra Seca',
  morro: 'Morro da Vista',
  centro: 'Centro',
  orla: 'Orla'
};

/**
 * @param {{id: string, nome: string}[]} bairros
 */
export function criarMapa(bairros) {
  const camadaMarcadores = s('g', { class: 'mapa-marcadores' });
  const camadaVeiculos = s('g', { class: 'mapa-veiculos' });

  const svg = s('svg', { viewBox: '0 0 400 470', class: 'mapa-svg', role: 'img', 'aria-label': 'Mapa de Porto Ameno' }, [
    s('title', { texto: 'Mapa de Porto Ameno' }),
    // Mar
    s('rect', { x: 0, y: 432, width: 400, height: 38, class: 'mapa-mar' }),
    s('path', { d: 'M0 440 q 25 -8 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0', class: 'mapa-onda' }),
    // Bairros
    s('rect', { x: 16, y: 16, width: 178, height: 132, rx: 18, class: 'mapa-bairro parque' }),
    s('rect', { x: 206, y: 16, width: 178, height: 132, rx: 18, class: 'mapa-bairro serra_seca' }),
    s('path', { d: 'M16 360 L16 176 Q 92 150 168 176 L 168 360 Z', class: 'mapa-bairro morro' }),
    s('rect', { x: 180, y: 160, width: 204, height: 200, rx: 18, class: 'mapa-bairro centro' }),
    s('rect', { x: 16, y: 372, width: 368, height: 60, rx: 14, class: 'mapa-bairro orla' }),
    // Rio da Beira-Rio
    s('path', { d: 'M226 148 C 210 210, 250 260, 236 300 S 220 360, 210 372', class: 'mapa-rio' }),
    // Nomes
    ...bairros.map((b) => {
      const c = CENTROS[b.id];
      if (!c) return null;
      return s('text', { x: c.x, y: b.id === 'orla' ? 392 : c.y - 34, class: 'mapa-nome', 'text-anchor': 'middle', texto: NOMES[b.id] ?? b.nome });
    }),
    // Central
    s('g', { class: 'mapa-central' }, [
      s('rect', { x: CENTRAL.x - 22, y: CENTRAL.y - 14, width: 44, height: 28, rx: 6 }),
      s('text', { x: CENTRAL.x, y: CENTRAL.y + 5, 'text-anchor': 'middle', texto: 'Central' })
    ]),
    camadaMarcadores,
    camadaVeiculos
  ]);

  /** @type {Map<string, SVGElement>} */
  const veiculos = new Map();

  /**
   * Redesenha marcadores (chamam pouco) e move veículos (todo quadro).
   * @param {import('../sistemas/expediente.js').Expediente} exp
   */
  function atualizar(exp) {
    // Marcadores por bairro: quantas chamadas esperando, e se alguma estourou.
    const porBairro = new Map();
    for (const item of exp.fila) {
      const atual = porBairro.get(item.chamada.bairro) ?? { qtd: 0, estourou: false };
      porBairro.set(item.chamada.bairro, {
        qtd: atual.qtd + 1,
        estourou: atual.estourou || item.cobrados > 0 || exp.tempo - item.chegouEm > item.chamada.tempo_limite
      });
    }
    const chave = JSON.stringify([...porBairro]) + (exp.ativa?.chamada.bairro ?? '');
    if (chave !== camadaMarcadores.dataset.chave) {
      camadaMarcadores.dataset.chave = chave;
      camadaMarcadores.replaceChildren();
      if (exp.ativa) {
        const c = CENTROS[exp.ativa.chamada.bairro];
        if (c) camadaMarcadores.append(s('circle', { cx: c.x, cy: c.y, r: 26, class: 'mapa-em-linha' }));
      }
      for (const [bairro, info] of porBairro) {
        const c = CENTROS[bairro];
        if (!c) continue;
        camadaMarcadores.append(
          s('g', { class: info.estourou ? 'mapa-ocorrencia estourou' : 'mapa-ocorrencia' }, [
            s('circle', { cx: c.x, cy: c.y, r: 15 }),
            s('text', { x: c.x, y: c.y + 5, 'text-anchor': 'middle', texto: info.estourou ? `⚠${info.qtd}` : `!${info.qtd}` })
          ])
        );
      }
    }

    // Veículos em missão
    const ativos = new Set();
    for (const m of exp.missoes) {
      const id = `${m.orgao}-${m.inicio}`;
      ativos.add(id);
      let g = veiculos.get(id);
      if (!g) {
        g = s('g', { class: 'mapa-veiculo' }, [
          s('circle', { r: 13 }),
          s('text', { y: 5, 'text-anchor': 'middle', texto: iconeOrgao(m.orgao) })
        ]);
        veiculos.set(id, g);
        camadaVeiculos.append(g);
      }
      const destino = CENTROS[m.bairro] ?? CENTRAL;
      const p = progressoTrajeto(m, exp.tempo);
      const x = CENTRAL.x + (destino.x - CENTRAL.x) * p + 18;
      const y = CENTRAL.y + (destino.y - CENTRAL.y) * p - 18;
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    }
    for (const [id, g] of veiculos) {
      if (!ativos.has(id)) {
        g.remove();
        veiculos.delete(id);
      }
    }

    const emEspera = exp.fila.length;
    svg.setAttribute(
      'aria-label',
      `Mapa de Porto Ameno. ${emEspera} ${emEspera === 1 ? 'ocorrência esperando' : 'ocorrências esperando'}, ${exp.missoes.length} ${exp.missoes.length === 1 ? 'veículo na rua' : 'veículos na rua'}.`
    );
  }

  return { elemento: svg, atualizar };
}
