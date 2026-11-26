import { describe, expect, it } from 'vitest';
import { perguntasDisponiveis, estadoEndereco, efeitoEndereco, pontuarTriagem } from '../src/sistemas/triagem.js';
import { criarExpediente, avancar, atender, perguntar, despachar } from '../src/sistemas/expediente.js';
import { BALANCO } from '../src/config/balanco.js';
import orgaos from '../src/dados/orgaos.json';

const chamada = {
  id: 'teste',
  hora: '08:20',
  bairro: 'orla',
  trote: false,
  orgao_correto: '193',
  gravidade: 2,
  tempo_limite: 60,
  endereco_vago: true,
  feedback_acerto: 'ok',
  feedback_erro: 'não',
  perguntas: [
    { id: 'onde', tipo: 'endereco', texto: 'Onde é?', resposta: 'Na praia!' },
    { id: 'numero', tipo: 'endereco_confirmar', requer: 'onde', texto: 'Qual o número?', resposta: 'Quiosque 12.' },
    { id: 'presos', tipo: 'essencial', texto: 'Tem gente em perigo?', resposta: 'Dois presos.' },
    { id: 'mar', tipo: 'essencial', texto: 'A água está subindo?', resposta: 'Sim.' },
    { id: 'aluguel', tipo: 'irrelevante', texto: 'É alugado?', resposta: 'Quê?' }
  ]
};
const trote = {
  ...chamada,
  id: 'trote',
  trote: true,
  orgao_correto: null,
  endereco_vago: false,
  perguntas: [
    { id: 'onde', tipo: 'endereco', texto: 'Onde é?', resposta: 'Ali.' },
    { id: 'fundo', tipo: 'essencial', texto: 'Quem está com você?', resposta: '(risadas)' }
  ]
};

describe('perguntas e endereço', () => {
  it('a confirmação do endereço só aparece depois de "Onde é?"', () => {
    expect(perguntasDisponiveis(chamada, []).map((p) => p.id)).not.toContain('numero');
    expect(perguntasDisponiveis(chamada, ['onde']).map((p) => p.id)).toContain('numero');
  });

  it('endereço vago fica aproximado até ser confirmado', () => {
    expect(estadoEndereco(chamada, [])).toBe('nenhum');
    expect(estadoEndereco(chamada, ['onde'])).toBe('aproximado');
    expect(estadoEndereco(chamada, ['onde', 'numero'])).toBe('confirmado');
    expect(estadoEndereco({ ...chamada, endereco_vago: false }, ['onde'])).toBe('confirmado');
  });

  it('sem endereço o veículo demora mais e a ocorrência piora', () => {
    expect(efeitoEndereco('nenhum').fatorMissao).toBeGreaterThan(efeitoEndereco('aproximado').fatorMissao);
    expect(efeitoEndereco('confirmado')).toEqual({ fatorMissao: 1, colapsoPorGravidade: 0 });
  });
});

describe('nota de triagem', () => {
  const certo = { acertou: true };

  it('atendimento completo vale 100', () => {
    expect(pontuarTriagem(chamada, ['onde', 'numero', 'presos', 'mar'], certo).total).toBe(100);
  });

  it('despachar sem perguntar nada só vale o encaminhamento', () => {
    const n = pontuarTriagem(chamada, [], certo);
    expect(n.total).toBe(BALANCO.triagem.pontosEncaminhamento);
    expect(n.faltaram).toEqual(['Tem gente em perigo?', 'A água está subindo?']);
    expect(n.estadoEndereco).toBe('nenhum');
  });

  it('pergunta irrelevante tira pontos e aparece no feedback', () => {
    const n = pontuarTriagem(chamada, ['onde', 'numero', 'presos', 'mar', 'aluguel'], certo);
    expect(n.total).toBe(100 - BALANCO.triagem.penalidadeIrrelevante);
    expect(n.desnecessarias).toEqual(['É alugado?']);
  });

  it('essenciais contam proporcionalmente e o endereço aproximado vale metade', () => {
    const n = pontuarTriagem(chamada, ['onde', 'presos'], { acertou: false });
    expect(n.encaminhamento).toBe(0);
    expect(n.endereco).toBe(10);
    expect(n.essenciais).toBe(15);
  });

  it('no trote, investigar antes de encerrar vale os pontos do endereço', () => {
    expect(pontuarTriagem(trote, ['fundo'], certo).total).toBe(100);
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

  it('não deixa fazer uma pergunta que ainda não apareceu', () => {
    const exp = pronto();
    expect(perguntar(exp, 'numero').exp).toBe(exp);
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
    ({ exp } = perguntar(exp, 'numero'));
    ({ exp } = despachar(exp, '193'));
    expect(exp.missoes[0].fim - exp.missoes[0].inicio).toBeCloseTo(BALANCO.tempoMissaoSegundos);
    expect(exp.colapso).toBe(0);
  });
});
