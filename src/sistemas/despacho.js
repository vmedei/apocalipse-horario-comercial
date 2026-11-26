// @ts-check
// Regra do despacho: compara a escolha do jogador com a chamada.

import { BALANCO } from '../config/balanco.js';

export const ESCOLHAS_VALIDAS = Object.freeze(['190', '192', '193', '199', 'trote']);

/**
 * @typedef {Object} ResultadoDespacho
 * @property {boolean} acertou
 * @property {'acerto' | 'orgao_errado' | 'trote_despachado' | 'real_como_trote'} tipo
 * @property {string} motivo  Texto curto explicando o resultado, para o feedback
 * @property {number} deltaColapso  Quanto o Medidor de Colapso muda (negativo alivia)
 */

/**
 * Resolve um despacho.
 * @param {{ trote: boolean, orgao_correto: string | null, gravidade: number,
 *           feedback_acerto: string, feedback_erro: string }} chamada
 * @param {string} escolha  "190", "192", "193", "199" ou "trote"
 * @returns {ResultadoDespacho}
 */
export function resolverDespacho(chamada, escolha) {
  if (!ESCOLHAS_VALIDAS.includes(escolha)) {
    throw new Error(`Escolha de despacho inválida: "${escolha}"`);
  }

  const c = BALANCO.colapso;
  const gravidade = chamada.gravidade ?? 1;
  const marcouTrote = escolha === 'trote';

  if (chamada.trote) {
    return marcouTrote
      ? { acertou: true, tipo: 'acerto', motivo: chamada.feedback_acerto, deltaColapso: c.acerto }
      : { acertou: false, tipo: 'trote_despachado', motivo: chamada.feedback_erro, deltaColapso: c.viaturaEmTrote };
  }

  if (marcouTrote) {
    return {
      acertou: false,
      tipo: 'real_como_trote',
      motivo: chamada.feedback_erro,
      deltaColapso: c.realComoTrotePorGravidade * gravidade
    };
  }

  if (escolha === chamada.orgao_correto) {
    return { acertou: true, tipo: 'acerto', motivo: chamada.feedback_acerto, deltaColapso: c.acerto };
  }

  return {
    acertou: false,
    tipo: 'orgao_errado',
    motivo: chamada.feedback_erro,
    deltaColapso: c.despachoErradoPorGravidade * gravidade
  };
}
