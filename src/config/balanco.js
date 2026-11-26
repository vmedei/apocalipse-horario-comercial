// @ts-check
// Todos os números de balanceamento do jogo. São valores de partida:
// ajuste aqui depois dos testes, nunca espalhados pelo código.

export const BALANCO = Object.freeze({
  // Relógio
  duracaoDiaSegundos: 300, // 8:00 → 18:00 em tempo real
  horaInicio: 8,
  horaFim: 18,

  // Volume de chamadas
  chamadasPorDia: [8, 12, 16, 20, 24],
  fracaoClimaticaPorDia: [0, 0.4, 0.6, 0.75, 0.9],

  // Frota
  tempoMissaoSegundos: 40,

  // Orçamento (em milhares de reais)
  orcamentoPorDia: 300,

  // Medidor de Colapso (0 a 100)
  colapso: Object.freeze({
    maximo: 100,
    esperaEstouradaPorGravidade: 4, // a cada 10 s depois do tempo limite
    intervaloEsperaSegundos: 10,
    despachoErradoPorGravidade: 10,
    viaturaEmTrote: 5,
    realComoTrotePorGravidade: 15,
    acerto: -5,
    fimDoDia: -30
  }),

  // Estrelas no fim do Modo Expediente
  estrelas: Object.freeze({
    duasAcertoMinimo: 0.7,
    tresAcertoMinimo: 0.8,
    tresAdaptacaoMinima: 0.3
  }),

  // Dificuldade adaptativa
  dificuldade: Object.freeze({
    janelaChamadas: 6,
    acertoAlto: 0.85,
    reducaoIntervaloAcertoAlto: 0.15,
    acertoBaixo: 0.5,
    aumentoIntervaloAcertoBaixo: 0.25,
    filaTranquila: 1 // só acelera se houver no máximo 1 ligação esperando
  }),

  // Modo Hora Extra
  horaExtra: Object.freeze({
    aumentoChamadasPorDia: 0.15,
    diasPorAumentoGravidade: 3,
    tetoReducaoAdaptacao: 0.6
  })
});
