// @ts-check
// O expediente de um dia: chegada das chamadas, fila, atendimento, despacho,
// veículos e Medidor de Colapso. Funções puras: recebem o estado e devolvem
// um estado novo e a lista de eventos que aconteceram (para a tela reagir).

import { BALANCO } from '../config/balanco.js';
import { segundosDeHora } from './relogio.js';
import { cobrancaDeEspera } from './fila.js';
import { veiculosLivres } from './frota.js';
import { resolverDespacho } from './despacho.js';
import { aplicarColapso, colapsou } from './colapso.js';
import { avaliarRitmo, reescalonar } from './dificuldade.js';
import { criarAleatorio } from './aleatorio.js';
import { perguntasDisponiveis, respostaPara, estadoEndereco, efeitoEndereco, pontuarTriagem } from './triagem.js';

/**
 * @typedef {Object} Chamada
 * @property {string} id
 * @property {string} hora
 * @property {string} bairro
 * @property {boolean} trote
 * @property {string|null} orgao_correto
 * @property {number} gravidade
 * @property {number} tempo_limite
 * @property {Record<string, string>} respostas  respostas às perguntas do catálogo
 * @property {string[]} essenciais
 * @property {string[]} [uteis]
 * @property {boolean} [endereco_vago]
 * @property {string} [personagem]
 * @property {string} feedback_acerto
 * @property {string} feedback_erro
 */

/**
 * @typedef {Object} ItemFila
 * @property {Chamada} chamada
 * @property {number} chegouEm   segundo real em que entrou na fila
 * @property {number} cobrados   intervalos de espera já cobrados no Colapso
 */

/**
 * @typedef {Object} Resolvida
 * @property {Chamada} chamada
 * @property {string} escolha
 * @property {ReturnType<typeof resolverDespacho>} resultado
 * @property {number} esperou   segundos na fila
 * @property {number} emLinha   segundos atendendo
 * @property {string[]} perguntas
 * @property {number} hora      segundo real em que foi resolvida
 * @property {ReturnType<typeof pontuarTriagem>} triagem
 * @property {number} deltaEndereco  Colapso extra por despachar sem endereço confirmado
 */

/**
 * @typedef {Object} Expediente
 * @property {number} tempo
 * @property {number} duracao
 * @property {(Chamada & {chegaEm: number})[]} pendentes
 * @property {ItemFila[]} fila
 * @property {(ItemFila & {atendidaEm: number, perguntas: string[], respondeEm: number}) | null} ativa
 *   `respondeEm`: quando a pessoa termina de responder a última pergunta
 * @property {Resolvida[]} resolvidas
 * @property {ItemFila[]} naoAtendidas
 * @property {import('./frota.js').Missao[]} missoes
 * @property {Record<string, number>} frotaTotal
 * @property {number} colapso
 * @property {number} colapsoMax
 * @property {null | 'expediente' | 'colapso'} fim
 * @property {number} ritmo   1 = horários do roteiro; menor = chamadas mais próximas
 * @property {boolean} adaptativo  se a dificuldade se ajusta ao desempenho
 */

/** @typedef {{ tipo: string, [k: string]: any }} Evento */

/** Variação máxima, em segundos reais, no horário de chegada quando há semente. */
const VARIACAO_CHEGADA = 3;

/**
 * @param {{ chamadas: Chamada[], orgaos: {id: string, frota_inicial: number}[],
 *           semente?: number, adaptativo?: boolean }} entrada
 *   `semente` varia um pouco os horários de chegada (a mesma semente gera sempre a mesma partida).
 * @returns {Expediente}
 */
export function criarExpediente({ chamadas, orgaos, semente, adaptativo = false }) {
  const sorteio = semente === undefined ? null : criarAleatorio(semente);
  const variar = (t) => (sorteio ? Math.max(1, t + sorteio.inteiro(-VARIACAO_CHEGADA, VARIACAO_CHEGADA)) : t);
  return {
    tempo: 0,
    duracao: BALANCO.duracaoDiaSegundos,
    pendentes: chamadas
      .map((c) => ({ ...c, chegaEm: variar(segundosDeHora(c.hora)) }))
      .sort((a, b) => a.chegaEm - b.chegaEm),
    fila: [],
    ativa: null,
    resolvidas: [],
    naoAtendidas: [],
    missoes: [],
    frotaTotal: Object.fromEntries(orgaos.map((o) => [o.id, o.frota_inicial])),
    colapso: 0,
    colapsoMax: 0,
    fim: null,
    ritmo: 1,
    adaptativo
  };
}

/**
 * Avança o relógio do expediente.
 * @param {Expediente} exp
 * @param {number} dt  segundos reais (já multiplicados pela velocidade)
 * @returns {{ exp: Expediente, eventos: Evento[] }}
 */
export function avancar(exp, dt) {
  if (exp.fim || dt <= 0) return { exp, eventos: [] };

  /** @type {Evento[]} */
  const eventos = [];
  const tempo = Math.min(exp.duracao, exp.tempo + dt);

  // 1. Chegadas
  const chegam = exp.pendentes.filter((c) => c.chegaEm <= tempo);
  const pendentes = exp.pendentes.filter((c) => c.chegaEm > tempo);
  let fila = [...exp.fila];
  for (const c of chegam) {
    const { chegaEm, ...chamada } = c;
    fila.push({ chamada, chegouEm: chegaEm, cobrados: 0 });
    eventos.push({ tipo: 'chamada_chegou', chamada });
  }

  // 2. Veículos que voltaram
  const voltaram = exp.missoes.filter((m) => m.fim > exp.tempo && m.fim <= tempo);
  for (const m of voltaram) eventos.push({ tipo: 'veiculo_voltou', missao: m });
  const missoes = exp.missoes.filter((m) => m.fim > tempo);

  // 3. Espera na fila
  let colapso = exp.colapso;
  fila = fila.map((item) => {
    const { delta, cobrados } = cobrancaDeEspera(item.chamada, tempo - item.chegouEm, item.cobrados);
    if (delta > 0) {
      if (item.cobrados === 0) eventos.push({ tipo: 'chamada_estourou', chamada: item.chamada });
      colapso = aplicarColapso(colapso, delta);
      eventos.push({ tipo: 'colapso_mudou', delta, motivo: 'espera', chamada: item.chamada });
    }
    return cobrados === item.cobrados ? item : { ...item, cobrados };
  });

  // 4. Resposta da última pergunta chegou
  if (exp.ativa && exp.ativa.respondeEm > exp.tempo && exp.ativa.respondeEm <= tempo) {
    eventos.push({ tipo: 'resposta_chegou', chamada: exp.ativa.chamada });
  }

  /** @type {Expediente} */
  let novo = { ...exp, tempo, pendentes, fila, missoes, colapso, colapsoMax: Math.max(exp.colapsoMax, colapso) };

  // 5. Fim do dia
  if (colapsou(colapso)) {
    novo = encerrar(novo, 'colapso');
    eventos.push({ tipo: 'colapsou' });
  } else if (tempo >= exp.duracao) {
    novo = encerrar(novo);
    eventos.push({ tipo: 'dia_terminou', motivo: 'horario' });
  } else if (!pendentes.length && !fila.length && !novo.ativa && novo.resolvidas.length) {
    novo = encerrar(novo);
    eventos.push({ tipo: 'dia_terminou', motivo: 'todas_atendidas' });
  }

  return { exp: novo, eventos };
}

/**
 * Fecha o dia: o que estava na fila ou em linha conta como não atendido.
 * @param {Expediente} exp
 * @param {'expediente' | 'colapso'} [motivo]
 * @returns {Expediente}
 */
function encerrar(exp, motivo = 'expediente') {
  const naoAtendidas = [...exp.naoAtendidas, ...exp.fila, ...(exp.ativa ? [exp.ativa] : [])];
  return { ...exp, fila: [], ativa: null, naoAtendidas, fim: motivo };
}

/**
 * Atende uma chamada da fila (só se não houver outra em linha).
 * @param {Expediente} exp
 * @param {string} chamadaId
 * @returns {{ exp: Expediente, eventos: Evento[] }}
 */
export function atender(exp, chamadaId) {
  if (exp.fim || exp.ativa) return { exp, eventos: [] };
  const item = exp.fila.find((i) => i.chamada.id === chamadaId);
  if (!item) return { exp, eventos: [] };
  return {
    exp: {
      ...exp,
      fila: exp.fila.filter((i) => i !== item),
      ativa: { ...item, atendidaEm: exp.tempo, perguntas: [], respondeEm: exp.tempo }
    },
    eventos: [{ tipo: 'chamada_atendida', chamada: item.chamada }]
  };
}

/**
 * Faz uma pergunta do catálogo na chamada em linha. A pessoa leva um tempo para responder,
 * e só dá para fazer a próxima pergunta depois da resposta.
 * @param {Expediente} exp
 * @param {string} perguntaId
 * @returns {{ exp: Expediente, eventos: Evento[], erro?: 'aguardando_resposta' }}
 */
export function perguntar(exp, perguntaId) {
  const ativa = exp.ativa;
  if (!ativa || ativa.perguntas.includes(perguntaId)) return { exp, eventos: [] };
  if (respondendo(exp)) return { exp, eventos: [], erro: 'aguardando_resposta' };
  const pergunta = perguntasDisponiveis(ativa.perguntas).find((p) => p.id === perguntaId);
  if (!pergunta) return { exp, eventos: [] };
  const respondeEm = exp.tempo + BALANCO.triagem.segundosResposta;
  return {
    exp: { ...exp, ativa: { ...ativa, perguntas: [...ativa.perguntas, perguntaId], respondeEm } },
    eventos: [{ tipo: 'pergunta_feita', pergunta, resposta: respostaPara(ativa.chamada, perguntaId) }]
  };
}

/** Se a pessoa em linha ainda está respondendo a última pergunta. */
export function respondendo(exp) {
  return Boolean(exp.ativa && exp.tempo < exp.ativa.respondeEm);
}

/** Veículos livres de um órgão agora. */
export function livres(exp, orgao) {
  return veiculosLivres(exp.frotaTotal, exp.missoes, orgao, exp.tempo);
}

/**
 * Despacha a chamada em linha para um órgão, ou a encerra como trote.
 * @param {Expediente} exp
 * @param {string} escolha  "190" | "192" | "193" | "199" | "trote"
 * @returns {{ exp: Expediente, eventos: Evento[], erro?: 'sem_chamada' | 'sem_veiculo' }}
 */
export function despachar(exp, escolha) {
  const ativa = exp.ativa;
  if (exp.fim || !ativa) return { exp, eventos: [], erro: 'sem_chamada' };
  if (escolha !== 'trote' && livres(exp, escolha) === 0) return { exp, eventos: [], erro: 'sem_veiculo' };

  const resultado = resolverDespacho(ativa.chamada, escolha);
  const endereco = estadoEndereco(ativa.chamada, ativa.perguntas);
  const efeito = efeitoEndereco(endereco);
  // Sem endereço confirmado, a ocorrência piora enquanto o veículo procura o local.
  const deltaEndereco = escolha === 'trote' ? 0 : efeito.colapsoPorGravidade * (ativa.chamada.gravidade ?? 1);
  const colapso = aplicarColapso(exp.colapso, resultado.deltaColapso + deltaEndereco);

  /** @type {Evento[]} */
  const eventos = [];
  let missoes = exp.missoes;
  if (escolha !== 'trote') {
    const missao = {
      orgao: escolha,
      bairro: ativa.chamada.bairro,
      inicio: exp.tempo,
      fim: exp.tempo + BALANCO.tempoMissaoSegundos * efeito.fatorMissao,
      endereco
    };
    missoes = [...missoes, missao];
    eventos.push({ tipo: 'veiculo_partiu', missao });
  }

  /** @type {Resolvida} */
  const resolvida = {
    chamada: ativa.chamada,
    escolha,
    resultado,
    esperou: ativa.atendidaEm - ativa.chegouEm,
    emLinha: exp.tempo - ativa.atendidaEm,
    perguntas: ativa.perguntas,
    hora: exp.tempo,
    triagem: pontuarTriagem(ativa.chamada, ativa.perguntas, resultado),
    deltaEndereco
  };
  eventos.push({ tipo: 'chamada_resolvida', resolvida });
  eventos.push({ tipo: 'colapso_mudou', delta: resultado.deltaColapso + deltaEndereco, motivo: 'despacho' });

  /** @type {Expediente} */
  let novo = {
    ...exp,
    ativa: null,
    missoes,
    resolvidas: [...exp.resolvidas, resolvida],
    colapso,
    colapsoMax: Math.max(exp.colapsoMax, colapso)
  };

  // Dificuldade adaptativa: ajusta quando chegam as próximas ligações.
  if (novo.adaptativo) {
    const { ritmo, motivo } = avaliarRitmo(novo.resolvidas, novo.fila.length);
    if (ritmo !== novo.ritmo) {
      eventos.push({ tipo: 'ritmo_mudou', de: novo.ritmo, para: ritmo, motivo });
      novo = { ...novo, pendentes: reescalonar(novo.pendentes, novo.tempo, novo.ritmo, ritmo), ritmo };
    }
  }

  if (colapsou(colapso)) {
    novo = encerrar(novo, 'colapso');
    eventos.push({ tipo: 'colapsou' });
  }
  return { exp: novo, eventos };
}

/**
 * Números do dia, para a tela de fim do expediente.
 * @param {Expediente} exp
 */
export function resumoDoDia(exp) {
  const atendidas = exp.resolvidas.length;
  const acertos = exp.resolvidas.filter((r) => r.resultado.acertou).length;
  const esperaMedia = atendidas ? exp.resolvidas.reduce((s, r) => s + r.esperou, 0) / atendidas : 0;
  const triagemMedia = atendidas ? Math.round(exp.resolvidas.reduce((s, r) => s + (r.triagem?.total ?? 0), 0) / atendidas) : 0;
  const enderecosConfirmados = exp.resolvidas.filter((r) => !r.chamada.trote && r.triagem?.estadoEndereco === 'confirmado').length;
  const reais = exp.resolvidas.filter((r) => !r.chamada.trote).length;
  return {
    atendidas,
    acertos,
    acertoPct: atendidas ? Math.round((acertos / atendidas) * 100) : 0,
    naoAtendidas: exp.naoAtendidas.length,
    esperaMedia,
    colapsoFinal: exp.colapso,
    colapsoMax: exp.colapsoMax,
    trotesIdentificados: exp.resolvidas.filter((r) => r.chamada.trote && r.escolha === 'trote').length,
    triagemMedia,
    enderecoPct: reais ? Math.round((enderecosConfirmados / reais) * 100) : 0
  };
}

// ---------- Comandos de depuração ----------

/** Define o Colapso diretamente (painel ?debug). */
export function definirColapso(exp, valor) {
  const colapso = aplicarColapso(0, valor);
  return { exp: { ...exp, colapso, colapsoMax: Math.max(exp.colapsoMax, colapso) }, eventos: [{ tipo: 'colapso_mudou', delta: colapso - exp.colapso, motivo: 'debug' }] };
}

/** Coloca uma chamada na fila agora (painel ?debug). */
export function dispararChamada(exp, chamada) {
  const copia = { ...chamada, id: `${chamada.id}#${Math.round(exp.tempo * 1000)}` };
  return {
    exp: { ...exp, fila: [...exp.fila, { chamada: copia, chegouEm: exp.tempo, cobrados: 0 }] },
    eventos: [{ tipo: 'chamada_chegou', chamada: copia }]
  };
}

/** Encerra o expediente agora, como se tivesse dado 18:00 (painel ?debug). */
export function terminarAgora(exp) {
  if (exp.fim) return { exp, eventos: [] };
  return { exp: encerrar({ ...exp, tempo: exp.duracao }), eventos: [{ tipo: 'dia_terminou', motivo: 'debug' }] };
}
