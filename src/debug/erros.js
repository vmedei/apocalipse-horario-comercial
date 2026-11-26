// @ts-check
// Painel vermelho que mostra qualquer erro de JavaScript, com botão "Copiar erro".
// Feito para testar no link publicado, inclusive no celular, onde não há console.

import { versao } from '../versao.js';

/** @type {HTMLElement | null} */
let painel = null;
/** @type {string[]} */
const relatos = [];

instalarPainelDeErros();

export function instalarPainelDeErros() {
  window.addEventListener('error', (evento) => {
    const arquivo = evento.filename ? evento.filename.split('/').pop() : '?';
    registrar(evento.message, `${arquivo}:${evento.lineno}:${evento.colno}`, evento.error?.stack);
  });
  window.addEventListener('unhandledrejection', (evento) => {
    const motivo = evento.reason;
    registrar(motivo?.message ?? String(motivo), 'promessa rejeitada', motivo?.stack);
  });
}

function registrar(mensagem, onde, pilha) {
  const relato = [
    `Erro: ${mensagem}`,
    `Onde: ${onde}`,
    `Versão: ${versao.commit} (${versao.dataBuild || 'sem data'})`,
    `Página: ${window.location.href}`,
    `Navegador: ${navigator.userAgent}`,
    pilha ? `Pilha:\n${String(pilha).split('\n').slice(0, 8).join('\n')}` : ''
  ]
    .filter(Boolean)
    .join('\n');
  relatos.push(relato);
  mostrar();
}

function mostrar() {
  if (!painel) {
    painel = document.createElement('aside');
    painel.className = 'painel-erro';
    painel.setAttribute('role', 'alert');
    document.body.append(painel);
  }
  painel.replaceChildren();

  const titulo = document.createElement('p');
  titulo.className = 'painel-erro-titulo';
  titulo.textContent = `⚠ Algo deu errado (${relatos.length} ${relatos.length === 1 ? 'erro' : 'erros'})`;

  const texto = document.createElement('pre');
  texto.textContent = relatos.join('\n\n---\n\n');

  const copiar = document.createElement('button');
  copiar.type = 'button';
  copiar.textContent = 'Copiar erro';
  copiar.addEventListener('click', async () => {
    const ok = await copiarTexto(texto.textContent ?? '');
    copiar.textContent = ok ? '✓ Copiado' : 'Selecione o texto e copie';
  });

  const fechar = document.createElement('button');
  fechar.type = 'button';
  fechar.textContent = 'Fechar';
  fechar.addEventListener('click', () => {
    painel?.remove();
    painel = null;
    relatos.length = 0;
  });

  const ajuda = document.createElement('p');
  ajuda.textContent = 'Cole este texto para o Claude, dizendo o que você fez antes do erro.';

  painel.append(titulo, ajuda, texto, copiar, fechar);
}

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Alternativa para navegadores sem permissão de área de transferência.
    const area = document.createElement('textarea');
    area.value = texto;
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
