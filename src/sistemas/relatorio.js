// @ts-check
// Relatório do dia: os indicadores de avaliação, a comparação com o dia anterior,
// o pior indicador (que escolhe o comentário da Dona Socorro), as estrelas e a série do gráfico.

import { BALANCO } from '../config/balanco.js';

/**
 * @typedef {ReturnType<typeof import('./expediente.js').resumoDoDia>} Resumo
 * @typedef {'acerto' | 'triagem' | 'tempo' | 'atendidas' | 'adaptacao'} IdIndicador
 * @typedef {Object} Indicador
 * @property {IdIndicador} id
 * @property {number | null} valor       o número mostrado (null = ainda não se aplica)
 * @property {number | null} comparavel  o número comparado com o dia anterior
 * @property {number | null} anterior    o mesmo número no dia anterior
 * @property {number | null} delta       comparavel − anterior
 * @property {'melhor' | 'pior' | 'igual' | null} tendencia
 * @property {number | null} nota        1 = bateu a meta; menos que 1 = abaixo (null = não avaliado)
 * @property {boolean} maiorMelhor
 */

/** Ordem em que os indicadores aparecem. */
export const ORDEM_INDICADORES = /** @type {IdIndicador[]} */ (['acerto', 'triagem', 'tempo', 'atendidas', 'adaptacao']);

const limitar = (n) => Math.max(0, Math.min(1, n));
const pct = (parte, todo) => (todo ? Math.round((parte / todo) * 100) : 0);

/**
 * @param {Resumo} r
 * @param {number | null} adaptacaoPct  % do orçamento em adaptação (null enquanto não há investimentos)
 * @returns {Record<IdIndicador, { valor: number | null, comparavel: number | null, nota: number | null, maiorMelhor: boolean }>}
 */
function medir(r, adaptacaoPct) {
  const m = BALANCO.relatorio;
  const atendidasPct = pct(r.atendidas, r.atendidas + r.naoAtendidas);
  const temAtendimento = r.atendidas > 0;
  return {
    acerto: {
      valor: r.acertoPct,
      comparavel: r.acertoPct,
      nota: temAtendimento ? limitar(r.acertoPct / m.metaAcertoPct) : 0,
      maiorMelhor: true
    },
    triagem: {
      valor: r.triagemMedia,
      comparavel: r.triagemMedia,
      nota: temAtendimento ? limitar(r.triagemMedia / m.metaTriagem) : 0,
      maiorMelhor: true
    },
    tempo: {
      valor: temAtendimento ? Math.round(r.tempoResposta) : null,
      comparavel: temAtendimento ? Math.round(r.tempoResposta) : null,
      nota: temAtendimento ? limitar(m.metaTempoRespostaSegundos / Math.max(1, r.tempoResposta)) : null,
      maiorMelhor: false
    },
    atendidas: {
      valor: r.atendidas,
      comparavel: atendidasPct,
      nota: limitar(atendidasPct / m.metaAtendidasPct),
      maiorMelhor: true
    },
    adaptacao: {
      valor: adaptacaoPct,
      comparavel: adaptacaoPct,
      nota: adaptacaoPct === null ? null : limitar(adaptacaoPct / m.metaAdaptacaoPct),
      maiorMelhor: true
    }
  };
}

/**
 * Indicadores de um dia, comparados com o dia anterior (se houver).
 * @param {Resumo} resumo
 * @param {Resumo | undefined} anterior
 * @param {{ adaptacaoPct?: number | null, adaptacaoAnteriorPct?: number | null }} [extra]
 * @returns {Indicador[]}
 */
export function indicadoresDoDia(resumo, anterior, extra = {}) {
  const hoje = medir(resumo, extra.adaptacaoPct ?? null);
  const ontem = anterior ? medir(anterior, extra.adaptacaoAnteriorPct ?? null) : null;
  return ORDEM_INDICADORES.map((id) => {
    const h = hoje[id];
    const a = ontem?.[id]?.comparavel ?? null;
    const delta = h.comparavel !== null && a !== null ? h.comparavel - a : null;
    let tendencia = null;
    if (delta !== null) tendencia = delta === 0 ? 'igual' : delta > 0 === h.maiorMelhor ? 'melhor' : 'pior';
    return { id, valor: h.valor, comparavel: h.comparavel, anterior: a, delta, tendencia, nota: h.nota, maiorMelhor: h.maiorMelhor };
  });
}

/**
 * O indicador mais abaixo da meta, ou 'tudo_bem' se todos bateram a meta.
 * Em empate, vale a ordem de ORDEM_INDICADORES (acerto primeiro).
 * @param {Indicador[]} indicadores
 * @returns {IdIndicador | 'tudo_bem'}
 */
export function piorIndicador(indicadores) {
  let pior = null;
  for (const i of indicadores) {
    if (i.nota === null || i.nota >= 1) continue;
    if (!pior || i.nota < pior.nota) pior = i;
  }
  return pior ? pior.id : 'tudo_bem';
}

/**
 * Estrelas do dia (o dia só chega aqui se a central não colapsou, então ao menos uma).
 * A terceira exige adaptação quando os investimentos existem.
 * @param {Resumo} resumo
 * @param {number | null} adaptacaoPct
 */
export function estrelasDoDia(resumo, adaptacaoPct = null) {
  const e = BALANCO.estrelas;
  const acerto = resumo.acertoPct / 100;
  let estrelas = 1;
  if (acerto >= e.duasAcertoMinimo) estrelas = 2;
  const adaptou = adaptacaoPct === null || adaptacaoPct / 100 >= e.tresAdaptacaoMinima;
  if (acerto >= e.tresAcertoMinimo && adaptou) estrelas = 3;
  return estrelas;
}

/**
 * Pontos do gráfico de evolução: acerto e fatia de chamadas climáticas por dia (null = dia não jogado).
 * @param {{ dias: Record<number, Resumo> }} partida
 * @param {number} [totalDias]
 */
export function serieEvolucao(partida, totalDias = 5) {
  return Array.from({ length: totalDias }, (_, i) => {
    const r = partida.dias[i + 1];
    return { dia: i + 1, acerto: r ? r.acertoPct : null, climaticas: r ? r.climaticasPct : null };
  });
}

/**
 * Escolhe a fala da Dona Socorro para o indicador, variando com o dia.
 * @param {Record<string, string[]>} comentarios
 * @param {IdIndicador | 'tudo_bem'} id
 * @param {number} dia
 */
export function comentarioDoDia(comentarios, id, dia) {
  const lista = comentarios[id] ?? comentarios.tudo_bem ?? [];
  return lista.length ? lista[(dia - 1) % lista.length] : '';
}
