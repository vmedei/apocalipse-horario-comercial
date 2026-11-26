# Apocalipse em Horário Comercial

Jogo sério web sobre mudanças climáticas: o jogador é atendente de uma central de
emergência em Porto Ameno (cidade fictícia) e as chamadas ficam cada vez mais climáticas.
O ROADMAP.md é a fonte da verdade para o que construir; docs/GDD.md (se existir) para o design.
Siga o marco pedido e não adiante marcos futuros.

## Stack
- HTML + CSS + JavaScript (módulos ES) com Vite. Sem frameworks.
- Não instale dependências novas sem perguntar.
- O site é publicado pelo GitHub Actions no GitHub Pages a cada push na main.
  O dono do projeto não roda nada localmente: ele testa só pelo link publicado.

## Regras de código
- Regras do jogo ficam em src/sistemas/ como funções puras, sem tocar no DOM.
- Telas ficam em src/telas/; componentes reutilizáveis em src/ui/.
- Todo conteúdo (chamadas, custos, manchetes, dicas) vem de src/dados/*.json.
- Todo número de balanceamento fica em src/config/balanco.js.
- Use textContent para inserir texto; evite innerHTML com dados.
- Cores e tamanhos via variáveis CSS (src/estilos/tema.css).
- Nenhuma informação pode depender só de cor: sempre ícone ou texto junto.
- localStorage sempre dentro de try/catch; o jogo funciona sem ele.
- Caminhos relativos (o site fica em /apocalipse-horario-comercial/, não na raiz).
- Textos da interface em português do Brasil; identificadores em português sem acento.

## Antes de enviar
- Rode npm run build (e npm test, se houver). Só faça push se passar.
- Commit em português, no formato "marco-N: o que mudou".

## Ao terminar uma tarefa
- Diga o que mudou e como testar no link publicado, passo a passo,
  incluindo os parâmetros de URL úteis (?debug, ?dia=N, ?seed=N, ?vel=N).
- Não quebre o que os marcos anteriores já fazem.
