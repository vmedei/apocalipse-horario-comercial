import { describe, expect, it } from 'vitest';
import {
  ORDEM_INDICADORES,
  indicadoresDoDia,
  piorIndicador,
  estrelasDoDia,
  serieEvolucao,
  comentarioDoDia
} from '../src/sistemas/relatorio.js';
import { novaPartida, registrarDia, condicoesDaNoite, escolherJornal } from '../src/sistemas/partida.js';
import { criarExpediente, avancar, atender, despachar, resumoDoDia } from '../src/sistemas/expediente.js';
import { BALANCO } from '../src/config/balanco.js';
import { DIAS } from '../src/dados/chamadas.js';
import orgaos from '../src/dados/orgaos.json';
import jornais from '../src/dados/jornais.json';
import vinhetas from '../src/dados/vinhetas.json';
import textos from '../src/dados/relatorio.json';

/** Resumo de mentira, com os campos que o relatório usa. */
const resumo = (extra = {}) => ({
  atendidas: 10,
  acertos: 9,
  acertoPct: 90,
  naoAtendidas: 0,
  esperaMedia: 5,
  colapsoFinal: 0,
  colapsoMax: 10,
  trotesIdentificados: 1,
  triagemMedia: 90,
  enderecoPct: 100,
  tempoResposta: 15,
  chegaram: 10,
  climaticasPct: 40,
  eventoPrincipal: 'onda_calor',
  ...extra
});

describe('indicadores do dia', () => {
  it('tem os cinco indicadores, na ordem do relatório', () => {
    expect(indicadoresDoDia(resumo(), undefined).map((i) => i.id)).toEqual(ORDEM_INDICADORES);
  });

  it('compara com o dia anterior e sabe que tempo menor é melhor', () => {
    const hoje = resumo({ acertoPct: 82, tempoResposta: 20 });
    const ontem = resumo({ acertoPct: 68, tempoResposta: 29 });
    const [acerto, , tempo] = indicadoresDoDia(hoje, ontem);
    expect(acerto).toMatchObject({ delta: 14, tendencia: 'melhor' });
    expect(tempo).toMatchObject({ delta: -9, tendencia: 'melhor' });
    const piorou = indicadoresDoDia(ontem, hoje);
    expect(piorou[0].tendencia).toBe('pior');
    expect(piorou[2].tendencia).toBe('pior');
  });

  it('sem dia anterior, não há comparação', () => {
    const [acerto] = indicadoresDoDia(resumo(), undefined);
    expect(acerto).toMatchObject({ anterior: null, delta: null, tendencia: null });
  });

  it('chamadas atendidas comparam a porcentagem, porque cada dia tem mais ligações', () => {
    const atendidas = indicadoresDoDia(resumo({ atendidas: 18, naoAtendidas: 2 }), resumo({ atendidas: 12, naoAtendidas: 0 }))[3];
    expect(atendidas.valor).toBe(18);
    expect(atendidas.comparavel).toBe(90);
    expect(atendidas.tendencia).toBe('pior');
  });

  it('a adaptação só é avaliada quando existem investimentos', () => {
    expect(indicadoresDoDia(resumo(), undefined)[4].nota).toBeNull();
    expect(indicadoresDoDia(resumo(), undefined, { adaptacaoPct: 15 })[4].nota).toBeCloseTo(15 / BALANCO.relatorio.metaAdaptacaoPct);
  });
});

describe('pior indicador e comentário da Dona Socorro', () => {
  it('escolhe o mais longe da meta', () => {
    expect(piorIndicador(indicadoresDoDia(resumo({ acertoPct: 50 }), undefined))).toBe('acerto');
    expect(piorIndicador(indicadoresDoDia(resumo({ triagemMedia: 40 }), undefined))).toBe('triagem');
    expect(piorIndicador(indicadoresDoDia(resumo({ tempoResposta: 80 }), undefined))).toBe('tempo');
    expect(piorIndicador(indicadoresDoDia(resumo({ atendidas: 5, naoAtendidas: 5 }), undefined))).toBe('atendidas');
    expect(piorIndicador(indicadoresDoDia(resumo(), undefined, { adaptacaoPct: 0 }))).toBe('adaptacao');
  });

  it('dia que bate todas as metas recebe elogio', () => {
    expect(piorIndicador(indicadoresDoDia(resumo(), undefined))).toBe('tudo_bem');
  });

  it('todo indicador tem rótulo e comentários, e o comentário varia com o dia', () => {
    for (const id of [...ORDEM_INDICADORES, 'tudo_bem']) {
      expect(textos.comentarios[id]?.length, id).toBeGreaterThanOrEqual(3);
      if (id !== 'tudo_bem') expect(textos.indicadores[id]?.rotulo, id).toBeTruthy();
    }
    expect(comentarioDoDia(textos.comentarios, 'acerto', 1)).not.toBe(comentarioDoDia(textos.comentarios, 'acerto', 2));
  });
});

describe('estrelas e gráfico', () => {
  it('estrelas seguem o acerto (e a adaptação, quando existir)', () => {
    expect(estrelasDoDia(resumo({ acertoPct: 60 }))).toBe(1);
    expect(estrelasDoDia(resumo({ acertoPct: 75 }))).toBe(2);
    expect(estrelasDoDia(resumo({ acertoPct: 85 }))).toBe(3);
    expect(estrelasDoDia(resumo({ acertoPct: 85 }), 10)).toBe(2);
    expect(estrelasDoDia(resumo({ acertoPct: 85 }), 40)).toBe(3);
  });

  it('a série tem os cinco dias, com vazio nos dias não jogados', () => {
    const serie = serieEvolucao({ dias: { 1: resumo({ acertoPct: 70, climaticasPct: 0 }), 2: resumo({ acertoPct: 80 }) } });
    expect(serie).toHaveLength(5);
    expect(serie[0]).toEqual({ dia: 1, acerto: 70, climaticas: 0 });
    expect(serie[2]).toEqual({ dia: 3, acerto: null, climaticas: null });
  });
});

describe('resumo do dia para o relatório', () => {
  it('mede o tempo de resposta e a fatia de chamadas climáticas', () => {
    let exp = criarExpediente({ chamadas: DIAS[2], orgaos });
    for (let t = 0; t < 400 && !exp.fim; t += 0.5) {
      ({ exp } = avancar(exp, 0.5));
      if (!exp.ativa && exp.fila.length) ({ exp } = atender(exp, exp.fila[0].chamada.id));
      if (exp.ativa && exp.tempo - exp.ativa.atendidaEm >= 5) {
        const c = exp.ativa.chamada;
        const r = despachar(exp, c.trote ? 'trote' : c.orgao_correto);
        if (!r.erro) exp = r.exp;
      }
    }
    const r = resumoDoDia(exp);
    expect(r.tempoResposta).toBeGreaterThanOrEqual(5);
    expect(r.chegaram).toBe(DIAS[2].length);
    expect(r.climaticasPct).toBe(Math.round((DIAS[2].filter((c) => c.climatica).length / DIAS[2].length) * 100));
    expect(r.eventoPrincipal).toBeTruthy();
  });
});

describe('jornal da noite pelo desempenho', () => {
  const partidaCom = (dia, extra) => ({ ...novaPartida(1), dias: { [dia]: resumo(extra) } });

  it('dia bom vira elogio; dia de erros vira crítica; Colapso alto vem antes', () => {
    expect(condicoesDaNoite(partidaCom(3, { acertoPct: 95, colapsoMax: 10 }), 3)).toContain('acerto_alto');
    expect(condicoesDaNoite(partidaCom(3, { acertoPct: 95, colapsoMax: 50 }), 3)).not.toContain('acerto_alto');
    expect(condicoesDaNoite(partidaCom(3, { acertoPct: 40, colapsoMax: 50 }), 3)).toEqual(['acerto_baixo']);
    expect(condicoesDaNoite(partidaCom(3, { acertoPct: 40, colapsoMax: 80 }), 3)).toEqual(['colapso_alto', 'acerto_baixo']);
  });

  it('todo dia tem edição da manhã, padrão da noite e as edições por desempenho', () => {
    for (let dia = 1; dia <= 5; dia++) {
      expect(escolherJornal(jornais, dia, 'manha'), `dia ${dia}`).toBeTruthy();
      expect(escolherJornal(jornais, dia, 'noite').condicao, `dia ${dia}`).toBeUndefined();
      for (const c of ['colapso_alto', 'acerto_alto', 'acerto_baixo']) {
        expect(escolherJornal(jornais, dia, 'noite', [c]).condicao, `dia ${dia} · ${c}`).toBe(c);
      }
    }
  });

  it('a vinheta existe para os cinco dias e fica mais séria', () => {
    expect(vinhetas.map((v) => v.dia)).toEqual([1, 2, 3, 4, 5]);
    expect(vinhetas[0].selo).not.toBe(vinhetas[4].selo);
  });

  it('o resumo registrado na partida alimenta o jornal', () => {
    const exp = criarExpediente({ chamadas: DIAS[0], orgaos });
    const partida = registrarDia(novaPartida(1), 1, { ...exp, fim: 'expediente' });
    expect(partida.dias[1].chegaram).toBe(0);
    expect(condicoesDaNoite(partida, 1)).toEqual([]);
  });
});
