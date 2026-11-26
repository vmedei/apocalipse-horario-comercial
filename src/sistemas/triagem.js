// @ts-check
// Triagem: o que o jogador perguntou antes de despachar.
// Define o estado do endereço (e o efeito dele no atendimento) e a nota de 0 a 100.

import { BALANCO } from '../config/balanco.js';

/**
 * @typedef {'endereco' | 'endereco_confirmar' | 'essencial' | 'util' | 'irrelevante'} TipoPergunta
 * @typedef {{ id: string, tipo?: TipoPergunta, requer?: string, texto: string, resposta: string }} Pergunta
 * @typedef {'nenhum' | 'aproximado' | 'confirmado'} EstadoEndereco
 */

/**
 * Perguntas que o jogador pode ver agora (as que dependem de outra só aparecem depois dela).
 * @param {{ perguntas: Pergunta[] }} chamada
 * @param {string[]} feitas  ids já perguntados
 */
export function perguntasDisponiveis(chamada, feitas) {
  return chamada.perguntas.filter((p) => !p.requer || feitas.includes(p.requer));
}

/**
 * @param {{ perguntas: Pergunta[], endereco_vago?: boolean }} chamada
 * @param {string[]} feitas
 * @returns {EstadoEndereco}
 */
export function estadoEndereco(chamada, feitas) {
  const tipos = chamada.perguntas.filter((p) => feitas.includes(p.id)).map((p) => p.tipo);
  if (tipos.includes('endereco_confirmar')) return 'confirmado';
  if (tipos.includes('endereco')) return chamada.endereco_vago ? 'aproximado' : 'confirmado';
  return 'nenhum';
}

/**
 * Efeito do endereço no despacho: veículo mais lento e ocorrência pior.
 * @param {EstadoEndereco} estado
 */
export function efeitoEndereco(estado) {
  const t = BALANCO.triagem;
  return { fatorMissao: t.fatorMissao[estado], colapsoPorGravidade: t.colapsoPorGravidade[estado] };
}

/**
 * Nota de triagem de uma chamada resolvida.
 * @param {{ perguntas: Pergunta[], endereco_vago?: boolean, trote: boolean }} chamada
 * @param {string[]} feitas
 * @param {{ acertou: boolean }} resultado
 */
export function pontuarTriagem(chamada, feitas, resultado) {
  const t = BALANCO.triagem;
  const feita = (p) => feitas.includes(p.id);
  const essenciais = chamada.perguntas.filter((p) => p.tipo === 'essencial');
  const irrelevantes = chamada.perguntas.filter((p) => p.tipo === 'irrelevante' && feita(p));
  const endereco = estadoEndereco(chamada, feitas);

  const encaminhamento = resultado.acertou ? t.pontosEncaminhamento : 0;
  const pontosEndereco = chamada.trote
    ? essenciais.some(feita) || endereco !== 'nenhum'
      ? t.pontosEndereco.confirmado
      : 0
    : t.pontosEndereco[endereco];
  const pontosEssenciais = essenciais.length
    ? Math.round((t.pontosEssenciais * essenciais.filter(feita).length) / essenciais.length)
    : t.pontosEssenciais;
  const penalidade = irrelevantes.length * t.penalidadeIrrelevante;

  return {
    total: Math.max(0, Math.min(100, encaminhamento + pontosEndereco + pontosEssenciais - penalidade)),
    encaminhamento,
    endereco: pontosEndereco,
    essenciais: pontosEssenciais,
    penalidade,
    estadoEndereco: endereco,
    faltaram: essenciais.filter((p) => !feita(p)).map((p) => p.texto),
    desnecessarias: irrelevantes.map((p) => p.texto)
  };
}
