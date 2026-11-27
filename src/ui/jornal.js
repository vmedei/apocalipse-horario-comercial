// @ts-check
// Cartão do Jornal Ameno: vinheta (mais séria a cada dia) e manchetes da edição.
// Usado na tela do jornal da manhã e no relatório do dia (edição da noite).

import { el } from './dom.js';
import vinhetas from '../dados/vinhetas.json';

/**
 * @param {{ manchetes?: string[], nota?: string, socorro?: string } | undefined} edicao
 * @param {{ dia: number, turno: 'manha' | 'noite', compacto?: boolean }} opcoes
 */
export function cartaoJornal(edicao, { dia, turno, compacto = false }) {
  const vinheta = vinhetas.find((v) => v.dia === dia) ?? vinhetas[0];
  const [principal, ...outras] = edicao?.manchetes ?? ['Sem notícias hoje'];
  const nomeEdicao = turno === 'manha' ? 'Edição da manhã' : 'Edição da noite';
  const Titulo = compacto ? 'h2' : 'h1';

  return el('article', { class: `jornal tom-${dia}${compacto ? ' compacto' : ''}`, 'aria-label': `Jornal Ameno, ${nomeEdicao.toLowerCase()}` }, [
    el('header', { class: 'vinheta' }, [
      el('span', { class: 'vinheta-marca', 'aria-hidden': 'true', texto: '📺' }),
      el('div', {}, [
        el('p', { class: 'vinheta-nome', texto: 'JORNAL AMENO' }),
        el('p', { class: 'vinheta-edicao', texto: [nomeEdicao, `Dia ${dia}`, vinheta.cobertura].filter(Boolean).join(' · ') })
      ]),
      el('span', { class: 'ao-vivo', texto: `● ${vinheta.selo}` })
    ]),
    el('div', { class: 'jornal-corpo' }, [
      el(Titulo, { class: 'manchete', texto: principal }),
      outras.length ? el('ul', { class: 'outras-manchetes' }, outras.map((m) => el('li', { texto: m }))) : null,
      edicao?.nota ? el('p', { class: 'previsao' }, [el('span', { 'aria-hidden': 'true', texto: '🌡️ ' }), edicao.nota]) : null
    ])
  ]);
}

/** Balão da Dona Socorro. */
export function falaSocorro(texto) {
  return el('aside', { class: 'fala-socorro' }, [
    el('span', { class: 'retrato pequeno', 'aria-hidden': 'true', texto: 'DS' }),
    el('p', {}, [el('strong', { texto: 'Dona Socorro: ' }), `“${texto}”`])
  ]);
}
