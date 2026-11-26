// @ts-check
// Ajudante para montar elementos sem innerHTML.

/**
 * Cria um elemento.
 * @param {string} tag  Ex.: "button" ou "h1"
 * @param {Record<string, any>} [props]  class, texto, aoClicar, e atributos (aria-*, type, disabled…)
 * @param {(Node|string|null|false|undefined)[]} [filhos]
 * @returns {HTMLElement}
 */
export function el(tag, props = {}, filhos = []) {
  const elemento = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (chave === 'class') elemento.className = valor;
    else if (chave === 'texto') elemento.textContent = valor;
    else if (chave === 'aoClicar') elemento.addEventListener('click', valor);
    else if (valor === true) elemento.setAttribute(chave, '');
    else elemento.setAttribute(chave, String(valor));
  }
  for (const filho of filhos) {
    if (filho === null || filho === undefined || filho === false) continue;
    elemento.append(typeof filho === 'string' ? document.createTextNode(filho) : filho);
  }
  return elemento;
}
