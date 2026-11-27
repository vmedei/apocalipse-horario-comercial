import { describe, expect, it } from 'vitest';
import {
  CATALOGO,
  GRUPOS,
  perguntasDisponiveis,
  perguntaDoCatalogo,
  respostaPara,
  tipoDaPergunta,
  estadoEndereco,
  efeitoEndereco,
  pontuarTriagem
} from '../src/sistemas/triagem.js';
import { criarExpediente, avancar, atender, perguntar, despachar } from '../src/sistemas/expediente.js';
import { BALANCO } from '../src/config/balanco.js';
import orgaos from '../src/dados/orgaos.json';

const chamada = {
  id: 'teste',
  hora: '08:20',
  bairro: 'orla',
  personagem: 'kelly',
  trote: false,
  orgao_correto: '193',
  gravidade: 2,
  tempo_limite: 60,
  endereco_vago: true,
  feedback_acerto: 'ok',
  feedback_erro: 'não',
  respostas: {
    onde: 'Na praia!',
    confirmar: 'Quiosque 12.',
    presos: 'Dois presos no deque.',
    agua: 'O mar tá subindo!',
    quantos: 'Eu e o Tiago.'
  },
  essenciais: ['presos', 'agua']
};
const trote = {
  ...chamada,
  id: 'trote',
  personagem: 'juninho',
  trote: true,
  orgao_correto: null,
  endereco_vago: false,
  respostas: { onde: 'Ali.', adulto: '(risadas) Tchau!' },
  essenciais: ['adulto']
};

describe('catálogo de perguntas', () => {
  it('toda pergunta tem grupo conhecido, texto, rótulo e resposta padrão', () => {
    const grupos = GRUPOS.map((g) => g.id);
    for (const p of CATALOGO) {
      expect(grupos, p.id).toContain(p.grupo);
      expect(p.texto.length, p.id).toBeGreaterThan(5);
      expect(p.rotulo.length, p.id).toBeGreaterThan(2);
      expect(p.padrao.length, p.id).toBeGreaterThan(0);
      if (p.requer) expect(perguntaDoCatalogo(p.requer), p.id).toBeTruthy();
    }
    expect(perguntaDoCatalogo('onde')).toBeTruthy();
    expect(perguntaDoCatalogo('confirmar')?.requer).toBe('onde');
  });

  it('as mesmas perguntas valem para qualquer chamada; a confirmação aparece depois de "onde"', () => {
    expect(perguntasDisponiveis([]).map((p) => p.id)).not.toContain('confirmar');
    expect(perguntasDisponiveis(['onde']).map((p) => p.id)).toContain('confirmar');
    expect(perguntasDisponiveis([]).length).toBe(CATALOGO.length - 1);
  });

  it('a resposta vem da chamada, do jeito do personagem ou do padrão do catálogo', () => {
    expect(respostaPara(chamada, 'presos')).toBe('Dois presos no deque.');
    expect(respostaPara(chamada, 'nome')).toMatch(/Kelly/);
    expect(perguntaDoCatalogo('fogo').padrao).toContain(respostaPara(chamada, 'fogo'));
    // a mesma chamada responde sempre igual
    expect(respostaPara(chamada, 'fogo')).toBe(respostaPara({ ...chamada }, 'fogo'));
    // em trote, o personagem responde do jeito de trote
    expect(respostaPara(trote, 'fogo')).toMatch(/risad/);
  });

  it('o tipo de cada pergunta depende da chamada', () => {
    expect(tipoDaPergunta(chamada, 'onde')).toBe('endereco');
    expect(tipoDaPergunta(chamada, 'confirmar')).toBe('endereco_confirmar');
    expect(tipoDaPergunta(trote, 'confirmar')).toBe('neutra');
    expect(tipoDaPergunta(chamada, 'presos')).toBe('essencial');
    expect(tipoDaPergunta(chamada, 'quantos')).toBe('util');
    expect(tipoDaPergunta(chamada, 'fogo')).toBe('neutra');
    expect(tipoDaPergunta(chamada, 'plano')).toBe('irrelevante');
    expect(tipoDaPergunta({ ...chamada, essenciais: ['nome'] }, 'nome')).toBe('essencial');
    expect(tipoDaPergunta({ ...chamada, uteis: ['nome'] }, 'nome')).toBe('util');
  });
});

describe('endereço', () => {
  it('endereço vago fica aproximado até ser confirmado', () => {
    expect(estadoEndereco(chamada, [])).toBe('nenhum');
    expect(estadoEndereco(chamada, ['onde'])).toBe('aproximado');
    expect(estadoEndereco(chamada, ['onde', 'confirmar'])).toBe('confirmado');
    expect(estadoEndereco({ ...chamada, endereco_vago: false }, ['onde'])).toBe('confirmado');
  });

  it('sem endereço o veículo demora mais e a ocorrência piora', () => {
    expect(efeitoEndereco('nenhum').fatorMissao).toBeGreaterThan(efeitoEndereco('aproximado').fatorMissao);
    expect(efeitoEndereco('confirmado')).toEqual({ fatorMissao: 1, colapsoPorGravidade: 0 });
  });
});

describe('nota de triagem', () => {
  const certo = { acertou: true };

  it('atendimento completo vale 100, e perguntas neutras não tiram pontos', () => {
    expect(pontuarTriagem(chamada, ['onde', 'confirmar', 'presos', 'agua'], certo).total).toBe(100);
    expect(pontuarTriagem(chamada, ['onde', 'confirmar', 'presos', 'agua', 'fogo', 'quantos'], certo).total).toBe(100);
  });

  it('despachar sem perguntar nada só vale o encaminhamento', () => {
    const n = pontuarTriagem(chamada, [], certo);
    expect(n.total).toBe(BALANCO.triagem.pontosEncaminhamento);
    expect(n.faltaram).toEqual([perguntaDoCatalogo('presos').texto, perguntaDoCatalogo('agua').texto]);
    expect(n.estadoEndereco).toBe('nenhum');
  });

  it('pergunta desnecessária tira pontos e aparece no feedback', () => {
    const n = pontuarTriagem(chamada, ['onde', 'confirmar', 'presos', 'agua', 'plano'], certo);
    expect(n.total).toBe(100 - BALANCO.triagem.penalidadeIrrelevante);
    expect(n.desnecessarias).toEqual([perguntaDoCatalogo('plano').texto]);
  });

  it('essenciais contam proporcionalmente e o endereço aproximado vale metade', () => {
    const n = pontuarTriagem(chamada, ['onde', 'presos'], { acertou: false });
    expect(n.encaminhamento).toBe(0);
    expect(n.endereco).toBe(10);
    expect(n.essenciais).toBe(15);
  });

  it('no trote, investigar antes de encerrar vale os pontos do endereço', () => {
    expect(pontuarTriagem(trote, ['adulto'], certo).total).toBe(100);
    expect(pontuarTriagem(trote, [], certo).total).toBe(50);
  });
});

describe('triagem no expediente', () => {
  function pronto() {
    let exp = criarExpediente({ chamadas: [chamada], orgaos });
    ({ exp } = avancar(exp, 11));
    ({ exp } = atender(exp, 'teste'));
    return exp;
  }
  const esperarResposta = (exp) => avancar(exp, BALANCO.triagem.segundosResposta).exp;

  it('não deixa fazer uma pergunta que ainda não apareceu', () => {
    const exp = pronto();
    expect(perguntar(exp, 'confirmar').exp).toBe(exp);
  });

  it('a resposta leva um tempo para chegar', () => {
    const { exp, eventos } = perguntar(pronto(), 'presos');
    expect(eventos[0].resposta).toBe('Dois presos no deque.');
    expect(perguntar(exp, 'agua').erro).toBe('aguardando_resposta');
    expect(perguntar(esperarResposta(exp), 'agua').exp.ativa.perguntas).toEqual(['presos', 'agua']);
  });

  it('sem endereço: veículo mais lento e Colapso extra, mesmo acertando o órgão', () => {
    const { exp, eventos } = despachar(pronto(), '193');
    const missao = exp.missoes[0];
    expect(missao.fim - missao.inicio).toBeCloseTo(BALANCO.tempoMissaoSegundos * BALANCO.triagem.fatorMissao.nenhum);
    expect(exp.colapso).toBe(BALANCO.triagem.colapsoPorGravidade.nenhum * 2 + BALANCO.colapso.acerto);
    const r = eventos.find((e) => e.tipo === 'chamada_resolvida').resolvida;
    expect(r.triagem.total).toBe(50);
  });

  it('com endereço confirmado: tempo normal e nenhum Colapso extra', () => {
    let exp = pronto();
    ({ exp } = perguntar(exp, 'onde'));
    exp = esperarResposta(exp);
    ({ exp } = perguntar(exp, 'confirmar'));
    exp = esperarResposta(exp);
    ({ exp } = despachar(exp, '193'));
    expect(exp.missoes[0].fim - exp.missoes[0].inicio).toBeCloseTo(BALANCO.tempoMissaoSegundos);
    expect(exp.colapso).toBe(0);
  });
});
