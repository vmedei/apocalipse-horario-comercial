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
  });

  it('despachar ocupa um veículo até a missão acabar', () => {
    let { exp } = rodar(novo(), 11);
    ({ exp } = atender(exp, 'd1_arlindo_gato'));
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
