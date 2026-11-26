// @ts-check
// Ajudante para montar SVG sem innerHTML.

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {string} tag
 * @param {Record<string, string | number | null | undefined>} [attrs]
 * @param {(Node | string | null | undefined | false)[]} [filhos]
 * @returns {SVGElement}
 */
export function s(tag, attrs = {}, filhos = []) {
  const elemento = document.createElementNS(NS, tag);
  for (const [chave, valor] of Object.entries(attrs)) {
    if (valor === null || valor === undefined) continue;
    if (chave === 'texto') elemento.textContent = String(valor);
    else elemento.setAttribute(chave, String(valor));
  }
  for (const filho of filhos) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(typeof filho === 'string' ? document.createTextNode(filho) : filho);
  }
  return elemento;
}
