import { describe, expect, it } from 'vitest';
import {
  criarExpediente,
  avancar,
  atender,
  perguntar,
  despachar,
  livres,
  resumoDoDia
} from '../src/sistemas/expediente.js';
import { segundosDeHora, horaDoJogo, textoDuracao } from '../src/sistemas/relogio.js';
import { intervalosEstourados, cobrancaDeEspera } from '../src/sistemas/fila.js';
import { progressoTrajeto } from '../src/sistemas/frota.js';
import { BALANCO } from '../src/config/balanco.js';
import orgaos from '../src/dados/orgaos.json';
import dia1 from '../src/dados/chamadas/dia_1.json';

const novo = () => criarExpediente({ chamadas: dia1, orgaos });

/** Avança em passos pequenos, como o navegador faz. */
function rodar(exp, segundos, passo = 0.25) {
  const eventos = [];
  for (let t = 0; t < segundos && !exp.fim; t += passo) {
    const r = avancar(exp, passo);
    exp = r.exp;
    eventos.push(...r.eventos);
  }
  return { exp, eventos };
}

describe('relógio', () => {
  it('converte hora do jogo e segundos reais', () => {
    expect(segundosDeHora('08:00')).toBe(0);
    expect(segundosDeHora('08:20')).toBe(10);
    expect(segundosDeHora('18:00')).toBe(BALANCO.duracaoDiaSegundos);
    expect(horaDoJogo(10)).toBe('08:20');
    expect(horaDoJogo(255)).toBe('16:30');
    expect(horaDoJogo(9999)).toBe('18:00');
    expect(textoDuracao(92)).toBe('1:32');
  });
});

describe('espera na fila', () => {
  it('só cobra depois do limite, a cada 10 s', () => {
    expect(intervalosEstourados(60, 60)).toBe(0);
    expect(intervalosEstourados(69, 60)).toBe(0);
    expect(intervalosEstourados(70, 60)).toBe(1);
    expect(intervalosEstourados(95, 60)).toBe(3);
  });

  it('não cobra duas vezes o mesmo intervalo', () => {
    const ch = { tempo_limite: 60, gravidade: 2 };
    const a = cobrancaDeEspera(ch, 80, 0);
    expect(a).toEqual({ delta: 2 * BALANCO.colapso.esperaEstouradaPorGravidade * 2, cobrados: 2 });
    expect(cobrancaDeEspera(ch, 85, a.cobrados).delta).toBe(0);
  });
});

describe('trajeto do veículo', () => {
  it('vai, fica e volta', () => {
    const m = { orgao: '193', bairro: 'centro', inicio: 0, fim: 40 };
    expect(progressoTrajeto(m, 0)).toBe(0);
    expect(progressoTrajeto(m, 20)).toBe(1);
    expect(progressoTrajeto(m, 40)).toBe(0);
  });
});

// Faz as perguntas que um bom atendente faria (endereço, confirmação e essenciais),
// esperando cada resposta chegar.
function triar(exp) {
  const c = exp.ativa?.chamada;
  if (!c) return exp;
  const ids = ['onde', ...(c.endereco_vago ? ['confirmar'] : []), ...c.essenciais];
  for (const id of ids) {
    if (!exp.ativa) break;
    ({ exp } = perguntar(exp, id));
    ({ exp } = rodar(exp, BALANCO.triagem.segundosResposta));
  }
  return exp;
}

describe('expediente', () => {
  it('as chamadas chegam na hora marcada', () => {
    let { exp, eventos } = rodar(novo(), 9);
    expect(exp.fila).toHaveLength(0);
    ({ exp, eventos } = rodar(exp, 2));
    expect(exp.fila.map((i) => i.chamada.id)).toEqual(['d1_arlindo_gato']);
    expect(eventos.some((e) => e.tipo === 'chamada_chegou')).toBe(true);
  });

  it('só atende uma chamada por vez e registra perguntas', () => {
    let { exp } = rodar(novo(), 30); // gato (10 s) e Juninho (22,5 s) na fila
    expect(exp.fila).toHaveLength(2);
    ({ exp } = atender(exp, 'd1_arlindo_gato'));
    expect(exp.ativa?.chamada.id).toBe('d1_arlindo_gato');
    const tentativa = atender(exp, 'd1_juninho_jacare');
    expect(tentativa.exp).toBe(exp);
    ({ exp } = perguntar(exp, 'onde'));
    ({ exp } = perguntar(exp, 'onde'));
    expect(exp.ativa?.perguntas).toEqual(['onde']);
    // A próxima pergunta só depois da resposta chegar.
    expect(perguntar(exp, 'animal').erro).toBe('aguardando_resposta');
    const r = rodar(exp, BALANCO.triagem.segundosResposta);
    expect(r.eventos.some((e) => e.tipo === 'resposta_chegou')).toBe(true);
    ({ exp } = perguntar(r.exp, 'animal'));
    expect(exp.ativa?.perguntas).toEqual(['onde', 'animal']);
    // "confirmar" só aparece depois de "onde"; perguntas fora do catálogo são ignoradas.
    expect(perguntar(exp, 'inexistente').exp).toBe(exp);
  });

  it('despachar ocupa um veículo até a missão acabar', () => {
    let { exp } = rodar(novo(), 11);
    ({ exp } = atender(exp, 'd1_arlindo_gato'));
    exp = triar(exp);
    expect(livres(exp, '193')).toBe(2);
    ({ exp } = despachar(exp, '193'));
    expect(livres(exp, '193')).toBe(1);
    expect(exp.resolvidas[0].resultado.acertou).toBe(true);
    const { exp: depois, eventos } = rodar(exp, BALANCO.tempoMissaoSegundos + 1);
    expect(livres(depois, '193')).toBe(2);
    expect(eventos.some((e) => e.tipo === 'veiculo_voltou')).toBe(true);
  });

  it('recusa despacho sem veículo livre e encerrar trote não usa veículo', () => {
    let { exp } = rodar(novo(), 11);
    ({ exp } = atender(exp, 'd1_arlindo_gato'));
    exp = { ...exp, missoes: [{ orgao: '199', bairro: 'centro', inicio: 0, fim: 999 }] };
    expect(despachar(exp, '199').erro).toBe('sem_veiculo');
    const r = despachar(exp, 'trote');
    expect(r.erro).toBeUndefined();
    expect(r.exp.missoes).toHaveLength(1);
  });

  it('quem não atende ninguém é demitido', () => {
    const { exp, eventos } = rodar(novo(), BALANCO.duracaoDiaSegundos);
    expect(exp.fim).toBe('colapso');
    expect(eventos.some((e) => e.tipo === 'colapsou')).toBe(true);
    expect(eventos.some((e) => e.tipo === 'chamada_estourou')).toBe(true);
    expect(resumoDoDia(exp).naoAtendidas).toBeGreaterThan(0);
  });

  it('jogando perfeito, o dia termina sem colapso e com 100% de acerto', () => {
    let exp = novo();
    let fim = null;
    for (let t = 0; t < BALANCO.duracaoDiaSegundos + 5 && !exp.fim; t += 0.5) {
      ({ exp } = avancar(exp, 0.5));
      if (!exp.ativa && exp.fila.length) {
        const item = exp.fila[0];
        ({ exp } = atender(exp, item.chamada.id));
        exp = triar(exp);
        const escolha = item.chamada.trote ? 'trote' : item.chamada.orgao_correto;
        ({ exp } = despachar(exp, escolha));
      }
      fim = exp.fim;
    }
    expect(fim).toBe('expediente');
    const resumo = resumoDoDia(exp);
    expect(resumo.atendidas).toBe(dia1.length);
    expect(resumo.acertoPct).toBe(100);
    expect(resumo.trotesIdentificados).toBe(2);
    expect(exp.colapso).toBe(0);
  });
});

import { avaliarRitmo, reescalonar } from '../src/sistemas/dificuldade.js';
import { novaPartida, registrarDia, condicoesDaNoite, escolherJornal, desfechoJuninho } from '../src/sistemas/partida.js';
import { DIAS } from '../src/dados/chamadas.js';
import jornais from '../src/dados/jornais.json';

const acertos = (n, total) => Array.from({ length: total }, (_, i) => ({ resultado: { acertou: i < n } }));

describe('dificuldade adaptativa', () => {
  it('espera algumas chamadas antes de mudar', () => {
    expect(avaliarRitmo(acertos(3, 3)).ritmo).toBe(1);
  });
  it('acelera quem acerta muito e desacelera quem erra muito', () => {
    expect(avaliarRitmo(acertos(6, 6)).ritmo).toBeCloseTo(0.85);
    expect(avaliarRitmo(acertos(1, 6)).ritmo).toBeCloseTo(1.25);
    expect(avaliarRitmo(acertos(4, 6)).ritmo).toBe(1);
  });
  it('não acelera quem acerta mas já está com a fila cheia', () => {
    expect(avaliarRitmo(acertos(6, 6), 3).ritmo).toBe(1);
  });
  it('reescalona só o que ainda não chegou, a partir de agora', () => {
    const r = reescalonar([{ chegaEm: 120 }, { chegaEm: 200 }], 100, 1, 0.5);
    expect(r.map((c) => c.chegaEm)).toEqual([110, 150]);
  });
  it('no expediente adaptativo, quem acerta tudo recebe as chamadas mais cedo', () => {
    let exp = criarExpediente({ chamadas: DIAS[4], orgaos, adaptativo: true });
    const original = exp.pendentes.at(-1).chegaEm;
    let mudou = false;
    for (let t = 0; t < 200 && !exp.fim; t += 0.5) {
      ({ exp } = avancar(exp, 0.5));
      if (!exp.ativa && exp.fila.length) {
        ({ exp } = atender(exp, exp.fila[0].chamada.id));
        exp = triar(exp);
      }
      if (exp.ativa) {
        const c = exp.ativa.chamada;
        const r = despachar(exp, c.trote ? 'trote' : c.orgao_correto);
        if (r.erro) continue;
        exp = r.exp;
        if (r.eventos.some((e) => e.tipo === 'ritmo_mudou')) mudou = true;
      }
    }
    expect(mudou).toBe(true);
    expect(exp.ritmo).toBeLessThan(1);
    if (exp.pendentes.length) expect(exp.pendentes.at(-1).chegaEm).toBeLessThan(original);
  });
  it('a semente muda pouco os horários e é repetível', () => {
    const a = criarExpediente({ chamadas: dia1, orgaos, semente: 42 }).pendentes.map((c) => c.chegaEm);
    const b = criarExpediente({ chamadas: dia1, orgaos, semente: 42 }).pendentes.map((c) => c.chegaEm);
    const sem = criarExpediente({ chamadas: dia1, orgaos }).pendentes.map((c) => c.chegaEm);
    expect(a).toEqual(b);
    a.forEach((t, i) => expect(Math.abs(t - sem[i])).toBeLessThanOrEqual(3));
  });
});

describe('partida e jornais', () => {
  /** Joga um dia; `escolher` decide o despacho de cada chamada. */
  function jogarDia(chamadas, escolher) {
    let exp = criarExpediente({ chamadas, orgaos });
    for (let t = 0; t < 400 && !exp.fim; t += 0.5) {
      ({ exp } = avancar(exp, 0.5));
      if (!exp.ativa && exp.fila.length) ({ exp } = atender(exp, exp.fila[0].chamada.id));
      if (exp.ativa) {
        const r = despachar(exp, escolher(exp.ativa.chamada));
        if (!r.erro) exp = r.exp;
      }
    }
    return exp;
  }
  const certo = (c) => (c.trote ? 'trote' : c.orgao_correto);

  it('conta os trotes do Juninho e o resgate na ligação real', () => {
    let partida = novaPartida();
    partida = registrarDia(partida, 1, jogarDia(DIAS[0], certo));
    expect(partida.trotesJuninho).toBe(2);
    const dia5 = jogarDia(DIAS[4], certo);
    expect(desfechoJuninho(dia5)).toBe('resgatado');
  });

  it('quem desacredita o Juninho no dia 5 vê o jornal sobre o resgate pelos vizinhos', () => {
    const ignorar = (c) => (c.arco === 'juninho_real' || c.trote ? 'trote' : c.orgao_correto);
    let partida = registrarDia(novaPartida(5), 5, jogarDia(DIAS[4], ignorar));
    expect(partida.juninhoReal).toBe('ignorado');
    const condicoes = condicoesDaNoite(partida, 5);
    expect(condicoes[0]).toBe('juninho_ignorado');
    expect(escolherJornal(jornais, 5, 'noite', condicoes).condicao).toBe('juninho_ignorado');
  });

  it('sem condição especial, usa a edição padrão', () => {
    expect(escolherJornal(jornais, 2, 'noite', []).condicao).toBeUndefined();
    expect(escolherJornal(jornais, 2, 'manha', ['colapso_alto']).turno).toBe('manha');
  });

  it('jogando perfeito, todos os dias terminam sem colapso', () => {
    DIAS.forEach((dia, i) => {
      const exp = jogarDia(dia, certo);
      expect(exp.fim, `dia ${i + 1}`).toBe('expediente');
    });
  });
});
