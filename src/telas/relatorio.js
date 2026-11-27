// @ts-check
// Relatório do dia: os indicadores comparados com o dia anterior, o gráfico da semana,
// o jornal da noite e o comentário da Dona Socorro (escolhido pelo pior indicador).

import { el } from '../ui/dom.js';
import { irPara } from '../roteador.js';
import { estado } from '../estado.js';
import { textoDuracao } from '../sistemas/relogio.js';
import { condicoesDaNoite, escolherJornal } from '../sistemas/partida.js';
import { indicadoresDoDia, piorIndicador, estrelasDoDia, serieEvolucao, comentarioDoDia } from '../sistemas/relatorio.js';
import { cartaoJornal, falaSocorro } from '../ui/jornal.js';
import { graficoEvolucao } from '../ui/grafico.js';
import { resumoEmLista } from './demitido.js';
import jornais from '../dados/jornais.json';
import eventos from '../dados/eventos.json';
import textos from '../dados/relatorio.json';

/**
 * @param {HTMLElement} container
 * @param {{ resumo: ReturnType<typeof import('../sistemas/expediente.js').resumoDoDia>, hora?: string, dia: number }} dados
 */
export function telaRelatorio(container, dados) {
  const dia = dados?.dia ?? estado.dia;
  const partida = estado.partida ?? { dias: {}, diaInicial: dia };
  const resumo = dados?.resumo ?? partida.dias[dia];
  if (!resumo) {
    container.append(el('p', { texto: 'Nenhum dia registrado ainda.' }));
    return;
  }
  const anterior = partida.dias[dia - 1];
  // Investimentos em adaptação chegam com o orçamento; até lá, o indicador não é avaliado.
  const adaptacaoPct = partida.adaptacaoPct?.[dia] ?? null;
  const indicadores = indicadoresDoDia(resumo, anterior, {
    adaptacaoPct,
    adaptacaoAnteriorPct: partida.adaptacaoPct?.[dia - 1] ?? null
  });
  const pior = piorIndicador(indicadores);
  const estrelas = estrelasDoDia(resumo, adaptacaoPct);
  const edicao = escolherJornal(jornais, dia, 'noite', condicoesDaNoite(partida, dia));
  const subtitulo = resumo.eventoPrincipal ? capitalizar(eventos[resumo.eventoPrincipal] ?? resumo.eventoPrincipal) : textos.sem_evento;

  const comentario = comentarioDoDia(textos.comentarios, pior, dia);
  const socorro = edicao?.socorro ? `${edicao.socorro} ${comentario}` : comentario;

  container.append(
    el('div', { class: 'tela tela-relatorio' }, [
      el('header', { class: 'relatorio-topo' }, [
        el('div', {}, [
          el('h1', { texto: `Fim do expediente · Dia ${dia}` }),
          el('p', { class: 'sobretitulo', texto: `${subtitulo} · ${dados?.hora ?? '18:00'}` })
        ]),
        el('p', { class: 'estrelas', 'aria-label': `${estrelas} de 3 estrelas no dia`, title: textoEstrelas() }, [
          el('span', { 'aria-hidden': 'true', texto: '★'.repeat(estrelas) + '☆'.repeat(3 - estrelas) })
        ])
      ]),
      el('div', { class: 'relatorio-grade' }, [
        el('section', { class: 'relatorio-numeros', 'aria-label': 'Indicadores do dia' }, [
          el('div', { class: 'indicadores' }, indicadores.map((i) => cartaoIndicador(i, resumo, dia, partida.diaInicial ?? 1))),
          el('section', { class: 'cartao-grafico', 'aria-labelledby': 'titulo-evolucao' }, [
            el('h2', { id: 'titulo-evolucao', class: 'rotulo-indicador', texto: 'Sua evolução' }),
            graficoEvolucao(serieEvolucao(partida), dia)
          ]),
          el('details', { class: 'mais-numeros' }, [el('summary', { texto: 'Mais números do dia' }), resumoEmLista(resumo)])
        ]),
        el('div', { class: 'relatorio-lado' }, [
          cartaoJornal(edicao, { dia, turno: 'noite', compacto: true }),
          falaSocorro(socorro),
          el('div', { class: 'acoes-resultado' }, [
            dia < 5
              ? el('button', { type: 'button', class: 'botao-principal botao-largo', texto: 'Ir para investimentos →', aoClicar: () => irPara('investimentos', { dia }) })
              : el('button', { type: 'button', class: 'botao-principal botao-largo', texto: 'Encerrar a semana →', aoClicar: () => irPara('semana') }),
            el('button', { type: 'button', class: 'botao-secundario', texto: '☰ Menu', aoClicar: () => irPara('menu') })
          ])
        ])
      ])
    ])
  );
}

/**
 * @param {import('../sistemas/relatorio.js').Indicador} i
 * @param {any} resumo
 * @param {number} dia
 * @param {number} diaInicial
 */
function cartaoIndicador(i, resumo, dia, diaInicial) {
  const rotulo = textos.indicadores[i.id].rotulo;
  return el('div', { class: `indicador indicador-${i.id}` }, [
    el('h2', { class: 'rotulo-indicador', texto: rotulo }),
    el('p', { class: 'valor-indicador', texto: valorTexto(i) }),
    el('p', { class: 'detalhe-indicador', texto: detalheTexto(i, resumo) }),
    el('p', { class: `comparacao ${i.tendencia ? `tendencia-${i.tendencia}` : ''}`, texto: comparacaoTexto(i, dia, diaInicial) })
  ]);
}

function valorTexto(i) {
  if (i.valor === null) return i.id === 'adaptacao' ? '0%' : '—';
  if (i.id === 'acerto' || i.id === 'adaptacao') return `${i.valor}%`;
  if (i.id === 'triagem') return `${i.valor}/100`;
  if (i.id === 'tempo') return textoDuracao(i.valor);
  return String(i.valor);
}

function detalheTexto(i, r) {
  if (i.id === 'acerto') return `${r.acertos} de ${r.atendidas} encaminhamentos certos`;
  if (i.id === 'triagem') return `endereço confirmado em ${r.enderecoPct}% das chamadas reais`;
  if (i.id === 'tempo') return 'da chegada na fila até o despacho';
  if (i.id === 'atendidas') return r.naoAtendidas ? `${r.naoAtendidas} ficaram sem atendimento` : 'nenhuma ficou sem atendimento';
  return i.valor === null ? 'ainda sem obras de prevenção na cidade' : 'do orçamento do dia';
}

function comparacaoTexto(i, dia, diaInicial) {
  if (i.anterior === null || i.delta === null) {
    if (i.id === 'adaptacao') return '';
    return dia <= diaInicial ? 'Primeiro dia da semana' : 'Sem dia anterior para comparar';
  }
  const ontem = `dia ${dia - 1}`;
  if (i.tendencia === 'igual') return `= igual ao ${ontem}`;
  const seta = i.delta > 0 ? '▲' : '▼';
  const juizo = i.tendencia === 'melhor' ? 'melhor' : 'pior';
  const abs = Math.abs(i.delta);
  if (i.id === 'tempo') return `${seta} ${abs} s ${i.delta < 0 ? 'mais rápido' : 'mais lento'} que no ${ontem}`;
  if (i.id === 'atendidas') return `${seta} ${i.comparavel}% atendidas (${i.anterior}% no ${ontem}) · ${juizo}`;
  return `${seta} ${i.delta > 0 ? '+' : '−'}${abs} pontos · ${juizo} que no ${ontem}`;
}

function textoEstrelas() {
  return '1 estrela: sobreviveu ao dia. 2: acerto de 70% ou mais. 3: acerto de 80% ou mais.';
}

function capitalizar(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}
