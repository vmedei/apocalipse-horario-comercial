// @ts-check
// Versão publicada: o GitHub Actions passa o commit em VITE_VERSAO.

/* global __DATA_BUILD__ */

const commitCompleto = import.meta.env.VITE_VERSAO || 'local';

export const versao = {
  commit: commitCompleto.slice(0, 7),
  dataBuild: typeof __DATA_BUILD__ === 'string' ? __DATA_BUILD__ : ''
};

/** Texto curto para o rodapé, por exemplo "v a1b2c3d · 26/11 14:32". */
export function textoVersao() {
  if (!versao.dataBuild) return `v ${versao.commit}`;
  const data = new Date(versao.dataBuild).toLocaleString('pt-BR', {
    timeZone: 'America/Fortaleza',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  return `v ${versao.commit} · ${data.replace(',', '')}`;
}
