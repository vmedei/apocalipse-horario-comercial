// @ts-check
// Triagem: o atendente escolhe perguntas de um catálogo único (src/dados/perguntas.json).
// Cada chamada só diz como responde a cada pergunta e quais são essenciais para ela.
// Daqui saem a resposta que a pessoa dá, o estado do endereço (e o efeito dele) e a nota de 0 a 100.

import { BALANCO } from '../config/balanco.js';
import catalogo from '../dados/perguntas.json';
import personagens from '../dados/personagens.json';

/**
 * @typedef {'endereco' | 'endereco_confirmar' | 'essencial' | 'util' | 'neutra' | 'irrelevante'} TipoPergunta
 * @typedef {{ id: string, grupo: string, texto: string, rotulo: string, padrao: string[], requer?: string, irrelevante?: boolean }} PerguntaCatalogo
 * @typedef {{ id: string, personagem?: string, trote: boolean, endereco_vago?: boolean,
 *   respostas: Record<string, string>, essenciais: string[], uteis?: string[] }} ChamadaTriagem
 * @typedef {'nenhum' | 'aproximado' | 'confirmado'} EstadoEndereco
 */

/** @type {PerguntaCatalogo[]} */
export const CATALOGO = catalogo.perguntas;
export const GRUPOS = catalogo.grupos;
const porId = new Map(CATALOGO.map((p) => [p.id, p]));

/** @param {string} id */
export function perguntaDoCatalogo(id) {
  return porId.get(id);
}

/**
 * Perguntas que o jogador pode fazer agora (as que dependem de outra só aparecem depois dela).
 * @param {string[]} feitas  ids já perguntados
 */
export function perguntasDisponiveis(feitas) {
  return CATALOGO.filter((p) => !p.requer || feitas.includes(p.requer));
}

/** Número estável a partir de um texto, para variar a resposta padrão sem sorteio. */
function hash(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * O que a pessoa responde: resposta da chamada; senão, o jeito do personagem
 * (em trote, o jeito de trote); senão, uma resposta padrão do catálogo.
 * @param {ChamadaTriagem} chamada
 * @param {string} id
 */
export function respostaPara(chamada, id) {
  if (chamada.respostas[id]) return chamada.respostas[id];
  const pessoa = chamada.personagem ? personagens[chamada.personagem] : undefined;
  const doPersonagem = (chamada.trote && pessoa?.respostas_trote?.[id]) || pessoa?.respostas?.[id];
  if (doPersonagem) return doPersonagem;
  const padrao = porId.get(id)?.padrao ?? ['...'];
  return padrao[hash(chamada.id + id) % padrao.length];
}

/**
 * Para que serve esta pergunta nesta chamada (escondido do jogador até o feedback).
 * @param {ChamadaTriagem} chamada
 * @param {string} id
 * @returns {TipoPergunta}
 */
export function tipoDaPergunta(chamada, id) {
  if (id === 'onde') return 'endereco';
  if (id === 'confirmar') return chamada.endereco_vago && chamada.respostas.confirmar ? 'endereco_confirmar' : 'neutra';
  if (chamada.essenciais.includes(id)) return 'essencial';
  if (chamada.uteis?.includes(id)) return 'util';
  if (porId.get(id)?.irrelevante) return 'irrelevante';
  return chamada.respostas[id] ? 'util' : 'neutra';
}

/**
 * @param {ChamadaTriagem} chamada
 * @param {string[]} feitas
 * @returns {EstadoEndereco}
 */
export function estadoEndereco(chamada, feitas) {
  if (!feitas.includes('onde')) return 'nenhum';
  if (!chamada.endereco_vago) return 'confirmado';
  return feitas.includes('confirmar') && chamada.respostas.confirmar ? 'confirmado' : 'aproximado';
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
 * @param {ChamadaTriagem} chamada
 * @param {string[]} feitas
 * @param {{ acertou: boolean }} resultado
 */
export function pontuarTriagem(chamada, feitas, resultado) {
  const t = BALANCO.triagem;
  const essenciais = chamada.essenciais;
  const feitasEssenciais = essenciais.filter((id) => feitas.includes(id));
  const irrelevantes = feitas.filter((id) => tipoDaPergunta(chamada, id) === 'irrelevante');
  const endereco = estadoEndereco(chamada, feitas);
  const texto = (id) => porId.get(id)?.texto ?? id;

  const encaminhamento = resultado.acertou ? t.pontosEncaminhamento : 0;
  const pontosEndereco = chamada.trote
    ? feitasEssenciais.length || endereco !== 'nenhum'
      ? t.pontosEndereco.confirmado
      : 0
    : t.pontosEndereco[endereco];
  const pontosEssenciais = essenciais.length
    ? Math.round((t.pontosEssenciais * feitasEssenciais.length) / essenciais.length)
    : t.pontosEssenciais;
  const penalidade = irrelevantes.length * t.penalidadeIrrelevante;

  return {
    total: Math.max(0, Math.min(100, encaminhamento + pontosEndereco + pontosEssenciais - penalidade)),
    encaminhamento,
    endereco: pontosEndereco,
    essenciais: pontosEssenciais,
    penalidade,
    estadoEndereco: endereco,
    faltaram: essenciais.filter((id) => !feitas.includes(id)).map(texto),
    desnecessarias: irrelevantes.map(texto)
  };
}
