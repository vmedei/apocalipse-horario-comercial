// @ts-check
// Dificuldade adaptativa: olha as últimas chamadas e acelera ou desacelera o ritmo
// em que as próximas chegam. Ritmo 1 = horários do roteiro; 0,85 = 15% mais rápido.

import { BALANCO } from '../config/balanco.js';

const MINIMO_PARA_AVALIAR = 4;

/**
 * Ritmo desejado a partir das chamadas já resolvidas.
 * Só acelera quem acerta muito E está com a fila tranquila; desacelera quem erra muito.
 * @param {{ resultado: { acertou: boolean } }[]} resolvidas
 * @param {number} [tamanhoFila]  ligações esperando agora
 * @returns {{ ritmo: number, motivo: 'poucas' | 'acertando' | 'errando' | 'normal', acerto: number }}
 */
export function avaliarRitmo(resolvidas, tamanhoFila = 0) {
  const d = BALANCO.dificuldade;
  const janela = resolvidas.slice(-d.janelaChamadas);
  if (janela.length < MINIMO_PARA_AVALIAR) return { ritmo: 1, motivo: 'poucas', acerto: 0 };
  const acerto = janela.filter((r) => r.resultado.acertou).length / janela.length;
  if (acerto > d.acertoAlto && tamanhoFila <= d.filaTranquila) return { ritmo: 1 - d.reducaoIntervaloAcertoAlto, motivo: 'acertando', acerto };
  if (acerto < d.acertoBaixo) return { ritmo: 1 + d.aumentoIntervaloAcertoBaixo, motivo: 'errando', acerto };
  return { ritmo: 1, motivo: 'normal', acerto };
}

/**
 * Reescalona a chegada das chamadas que ainda não chegaram.
 * O intervalo entre agora e cada chegada é multiplicado por (ritmoNovo / ritmoAtual).
 * @template {{ chegaEm: number }} T
 * @param {T[]} pendentes
 * @param {number} agora
 * @param {number} ritmoAtual
 * @param {number} ritmoNovo
 * @returns {T[]}
 */
export function reescalonar(pendentes, agora, ritmoAtual, ritmoNovo) {
  if (ritmoAtual === ritmoNovo) return pendentes;
  const fator = ritmoNovo / ritmoAtual;
  return pendentes.map((c) => ({ ...c, chegaEm: agora + (c.chegaEm - agora) * fator }));
}
