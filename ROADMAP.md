# Apocalipse em Horário Comercial · Roadmap

Roadmap para construir o jogo web **sem rodar nada no seu computador**. O código fica num repositório no GitHub, o Claude faz as mudanças e as envia para lá, e o GitHub publica o jogo sozinho num endereço público. Você testa direto no navegador, no PC ou no celular.

- **Jogo publicado:** `https://vmedei.github.io/apocalipse-horario-comercial/`
- **Repositório:** `https://github.com/vmedei/apocalipse-horario-comercial`
- **Design do jogo:** o GDD (documento "GDD · Apocalipse em Horário Comercial" no Claude). Para o Claude consultar o design direto do repositório, exporte o GDD em Markdown e salve como `docs/GDD.md`.

> **Como usar:** este arquivo fica na raiz do repositório. Peça ao Claude um marco de cada vez, por exemplo: *"Implemente o Marco 2 seguindo o ROADMAP.md e publique"*. Cerca de 1 a 2 minutos depois do envio, a nova versão está no link. Siga o "Como testar" do marco e só avance quando o "Pronto quando" estiver cumprido.

---

## 1. Resumo do jogo

Você é atendente da central de emergência de **Porto Ameno**, uma cidade brasileira fictícia. O expediente vai das 8h às 18h. As chamadas começam banais (gato na árvore, briga de vizinhos) e, dia após dia, viram ondas de calor, enchentes, deslizamentos e queimadas. Entre os dias, o jogador decide se gasta o orçamento em **resposta** (mais viaturas) ou em **adaptação** (drenagem, arborização, alertas, abrigos).

**Retórica procedimental:** o volume de chamadas e a proporção de chamadas climáticas crescem, os recursos não acompanham, e só quem investe em adaptação sobrevive à semana.

| Item | Decisão |
|---|---|
| Tecnologia | HTML + CSS + JavaScript (módulos ES), sem framework; Vite só para empacotar |
| Onde roda | Navegador (Chrome, Firefox, Edge), no PC e no celular |
| Publicação | GitHub Actions monta o site e publica no GitHub Pages a cada envio para a branch `main` |
| Desenvolvimento | O Claude edita, confere e envia o código; você só abre o link |
| Público | Ensino médio (15 a 18 anos), em sala de aula, partida de ~30 min |
| Modos | **Expediente** (5 dias, com vitória) e **Hora Extra** (infinito, termina sempre em colapso) |
| Conteúdo | Todo em JSON (`src/dados/`), separado do código |
| Vozes | Murmúrios sem palavras + transcrição na tela |

### Por que web puro, sem engine
- O jogo é quase todo **interface**: listas, botões, texto, um mapa e gráficos. HTML e CSS fazem isso nativamente, e com acessibilidade (zoom, teclado, leitor de tela) quase de graça.
- Um site estático pode ser publicado de graça pelo GitHub Pages, sem servidor.
- O jogo roda em qualquer computador de escola, ou no celular, só com o link.
- Não usamos React nem outra biblioteca de interface, para manter o código pequeno e fácil de entender.

---

## 2. Escopo

### Protótipo mínimo jogável (para apresentar)
Marcos **0 a 6**: os 5 dias do Modo Expediente com fila de chamadas, despacho, trotes, Medidor de Colapso, relatório do dia, jornal, investimentos, debriefing e telemetria. A arte é provisória (formas e texto), seguindo os wireframes de `referencias/`.

### Versão completa
Marcos **7 a 10**: Modo Hora Extra, acessibilidade completa, arte e áudio finais e testes com usuários.

### Fora do escopo do protótipo
Ranking online (com servidor), aplicativo nativo de celular, vozes gravadas e mapa com rotas reais.

---

## 3. Repositório, publicação e fluxo de trabalho

### 3.1 Configuração inicial (uma vez só, tudo no navegador)
- [ ] No GitHub, criar o repositório **`apocalipse-horario-comercial`**, **público** (o GitHub Pages gratuito exige repositório público) e vazio.
- [ ] Em **Settings → Pages**, em *Build and deployment → Source*, escolher **GitHub Actions**.
- [ ] Dar ao Claude acesso ao repositório (por exemplo, numa sessão do Claude conectada ao GitHub) e pedir: *"Faça o Marco 0 do ROADMAP.md"*.
- [ ] Depois do primeiro envio, abrir a aba **Actions** do repositório e conferir se o fluxo "Publicar no GitHub Pages" terminou com ✓ verde.
- [ ] Abrir o link do jogo e conferir a versão no rodapé.

### 3.2 Ciclo de trabalho
1. **Peça uma coisa de cada vez:** um marco, ou só algumas caixinhas de um marco grande.
2. **O Claude faz a mudança e confere** na nuvem (`npm run build`, e `npm test` quando houver testes) antes de enviar. Uma mudança que quebra o build não é enviada.
3. **O Claude faz o commit e o push** para a `main`. O GitHub Actions publica em 1 a 2 minutos.
4. **Abra o link** e confira no rodapé se o código da versão é o do último envio. Se ainda for o antigo, espere um pouco e recarregue com **Ctrl+Shift+R** (ou use uma aba anônima).
5. **Teste** seguindo o "Como testar" do marco. Use o painel de depuração (seção 10) para pular etapas.
6. **Se algo der errado**, o jogo mostra um painel vermelho com o erro e um botão **"Copiar erro"**. Cole o texto para o Claude, junto com o que você fez antes. No PC, o console (F12 → *Console*) mostra os mesmos erros.
7. **Se uma versão estragar tudo**, peça: *"Reverta o último commit e publique"*. O site volta à versão anterior em 1 a 2 minutos.

**Mudanças grandes, com mais segurança:** peça ao Claude para trabalhar numa branch e abrir um *pull request*. O site só muda quando você aprovar e fizer o *merge* pelo GitHub.

### 3.3 Fluxo de publicação (`.github/workflows/deploy.yml`, criado no Marco 0)
```yaml
name: Publicar no GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  publicar:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test --if-present
      - name: Build
        run: npm run build
        env:
          VITE_VERSAO: ${{ github.sha }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deploy
        uses: actions/deploy-pages@v4
```

- O código do commit (`VITE_VERSAO`) entra no build, e o rodapé do jogo mostra os 7 primeiros caracteres e a data do build.
- O Vite dá nomes únicos aos arquivos a cada build, então o navegador não fica preso numa versão antiga do código.
- Se um teste falhar, o site **não** é atualizado e a versão anterior continua no ar.

### 3.4 Arquivo `CLAUDE.md` (criar na raiz no Marco 0)
O Claude Code lê este arquivo automaticamente ao trabalhar no repositório. Ele garante que as regras do projeto sejam seguidas sem que você precise repeti-las.

```markdown
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
```

---

## 4. Convenções de código

- **JavaScript moderno com módulos ES** (`import`/`export`). Use `// @ts-check` no topo dos arquivos e comentários JSDoc nas funções, para pegar erros de tipo sem precisar de TypeScript.
- **Três camadas separadas:**
  - `sistemas/`: regras puras. Recebem dados e devolvem resultados (por exemplo, `resolverDespacho(chamada, escolha)` → `{ acertou, motivo, deltaColapso }`). São fáceis de testar.
  - `telas/` e `ui/`: só desenham e capturam cliques.
  - `dados/`: o conteúdo do jogo.
- **Estado único** em `estado.js`. As telas escutam mudanças pelo `eventos.js` (um "emitir/ouvir" simples).
- **CSS com variáveis**: o tema de cada dia, o tamanho do texto e o modo daltonismo mudam só variáveis (`--cor-fundo`, `--tamanho-texto` etc.), aplicadas por classes no `<body>`.
- **Commits pequenos e frequentes**, com mensagem `marco-N: descrição`; cada um vira uma versão publicada.

---

## 5. Estrutura do repositório

```
apocalipse-horario-comercial/
├── .github/
│   └── workflows/
│       └── deploy.yml          # publica no GitHub Pages (seção 3.3)
├── index.html
├── package.json
├── package-lock.json           # gerado pelo Claude; necessário para o npm ci
├── vite.config.js              # base: './' (o site fica numa subpasta do domínio)
├── CLAUDE.md
├── ROADMAP.md
├── README.md                   # link do jogo + como jogar, em poucas linhas
├── docs/
│   └── GDD.md                  # opcional: GDD exportado em Markdown
├── referencias/                # wireframes e ilustrações de referência (não vão para o site)
├── public/
│   └── assets/
│       ├── img/                # mapa, retratos, escritório (webp/png)
│       ├── audio/              # murmúrios, efeitos, trilhas
│       └── fontes/
├── src/
│   ├── main.js                 # ponto de entrada
│   ├── roteador.js             # mostra uma tela por vez
│   ├── estado.js               # estado da partida + salvar/carregar
│   ├── eventos.js              # emitir(nome, dados) / ouvir(nome, funcao)
│   ├── versao.js               # lê import.meta.env.VITE_VERSAO para o rodapé
│   ├── config/
│   │   └── balanco.js          # todos os números ajustáveis
│   ├── dados/
│   │   ├── orgaos.json
│   │   ├── bairros.json
│   │   ├── chamadas/           # dia_1.json … dia_5.json, modelos_hora_extra.json
│   │   ├── investimentos.json
│   │   ├── jornais.json
│   │   ├── dicas_socorro.json
│   │   └── eventos.json        # nome legível de cada tipo de evento
│   ├── sistemas/
│   │   ├── aleatorio.js        # sorteios com semente (partidas repetíveis)
│   │   ├── relogio.js
│   │   ├── fila.js
│   │   ├── frota.js
│   │   ├── colapso.js
│   │   ├── despacho.js
│   │   ├── dia.js              # monta as chamadas do dia e aplica a adaptação
│   │   ├── orcamento.js
│   │   ├── dificuldade.js
│   │   ├── gerador_hora_extra.js
│   │   └── telemetria.js
│   ├── telas/
│   │   ├── menu.js
│   │   ├── jogo.js
│   │   ├── jornal.js
│   │   ├── relatorio.js
│   │   ├── investimentos.js
│   │   ├── demitido.js
│   │   ├── sobre.js
│   │   ├── final.js            # jornal especial + debriefing
│   │   └── acessibilidade.js
│   ├── ui/                     # cartao_chamada.js, botao_orgao.js, balao_socorro.js, mapa.js, grafico.js
│   ├── debug/
│   │   ├── painel.js           # painel ?debug
│   │   └── erros.js            # painel vermelho com "Copiar erro"
│   └── estilos/                # base.css, tema.css, telas.css, acessibilidade.css
└── tests/                      # testes dos sistemas com Vitest (rodam no GitHub Actions)
```

O Vite importa JSON diretamente: `import orgaos from './dados/orgaos.json'`.

---

## 6. Modelo de dados (JSON)

### 6.1 `orgaos.json`
```json
[
  { "id": "190", "nome": "Polícia",      "veiculo": "viatura",    "frota_inicial": 3 },
  { "id": "192", "nome": "SAMU",         "veiculo": "ambulância", "frota_inicial": 2 },
  { "id": "193", "nome": "Bombeiros",    "veiculo": "caminhão",   "frota_inicial": 2 },
  { "id": "199", "nome": "Defesa Civil", "veiculo": "equipe",     "frota_inicial": 1 }
]
```

### 6.2 `bairros.json`
```json
[
  { "id": "orla",        "nome": "Orla (Praia do Sossego)", "riscos": ["ressaca", "erosao", "insolacao"] },
  { "id": "morro",       "nome": "Morro da Vista",          "riscos": ["deslizamento"] },
  { "id": "centro",      "nome": "Centro e Beira-Rio",      "riscos": ["alagamento", "enchente", "ilha_calor"] },
  { "id": "serra_seca",  "nome": "Serra Seca",              "riscos": ["seca", "queimada"] },
  { "id": "parque",      "nome": "Parque Estadual",         "riscos": ["incendio_florestal", "fumaca"] }
]
```

### 6.3 Chamada (`chamadas/dia_N.json`)
```json
{
  "id": "d3_kelly_ressaca",
  "hora": "10:40",
  "personagem": "kelly",
  "bairro": "orla",
  "titulo_fila": "Água no quiosque",
  "icone": "agua",
  "emocao": "nervosa",
  "climatica": true,
  "evento": "ressaca",
  "trote": false,
  "orgao_correto": "193",
  "gravidade": 2,
  "tempo_limite": 60,
  "fala_inicial": "A maré tá subindo muito, a água já chegou no quiosque!",
  "perguntas": [
    { "id": "onde",    "texto": "Onde é?",            "resposta": "Quiosque 12, na Praia do Sossego." },
    { "id": "feridos", "texto": "Tem alguém ferido?", "resposta": "Não, mas tem gente lá dentro salvando as coisas." }
  ],
  "feedback_acerto": "Bombeiros retiraram todos do quiosque a tempo.",
  "feedback_erro": "Ressaca com pessoas em risco é com os Bombeiros (193).",
  "mitigada_por": "barreira_orla"
}
```

Campos:
- `gravidade` (1 a 3) define o impacto no Medidor de Colapso.
- `tempo_limite` são segundos reais antes de a chamada "estourar".
- `trote: true` exige `orgao_correto: null`.
- `mitigada_por` é o id de um investimento que reduz ou elimina esta chamada.

### 6.4 `investimentos.json`
```json
[
  { "id": "viatura_190",        "tipo": "responder", "nome": "+1 viatura (190)",          "custo": 60,  "libera_dia": 1,
    "efeito": { "frota": { "190": 1 } } },
  { "id": "arborizacao_centro", "tipo": "adaptar",   "nome": "Arborização no Centro",     "custo": 100, "libera_dia": 2,
    "efeito": { "bairro": "centro", "eventos": ["ilha_calor", "insolacao"], "reducao": 0.5, "atraso_dias": 1 } },
  { "id": "drenagem_beira_rio", "tipo": "adaptar",   "nome": "Drenagem na Beira-Rio",     "custo": 150, "libera_dia": 3,
    "efeito": { "bairro": "centro", "eventos": ["alagamento", "enchente"], "reducao": 0.6, "atraso_dias": 1 } },
  { "id": "alerta_sms_morro",   "tipo": "adaptar",   "nome": "Alerta por SMS no Morro",   "custo": 70,  "libera_dia": 3,
    "efeito": { "bairro": "morro", "eventos": ["deslizamento"], "reducao_gravidade": 1, "atraso_dias": 0 } }
]
```

Lista completa a criar, por dia de liberação:
- **Responder:** viaturas, ambulâncias, caminhões e equipes da Defesa Civil.
- **Dia 2:** arborização, pontos de hidratação e abrigos climatizados.
- **Dia 3:** drenagem e alerta por SMS.
- **Dia 4:** brigadas de incêndio e cisternas.
- **Dia 5:** barreira e contenção na orla.

### 6.5 `jornais.json`
```json
[
  { "dia": 1, "turno": "manha", "manchetes": ["Festa junina do Centro bate recorde de público", "Prefeitura promete tapar buraco da Av. Beira-Rio"], "nota": "Calor acima da média para a época." },
  { "dia": 3, "turno": "noite", "condicao": "colapso_alto", "manchetes": ["Central de emergência não dá conta das chamadas durante temporal"] },
  { "dia": 3, "turno": "noite", "condicao": "padrao",       "manchetes": ["Chuva de um mês cai em seis horas; Defesa Civil evacua parte do Morro da Vista"] }
]
```

Condições possíveis: `padrao`, `colapso_alto`, `investiu_adaptacao` e `nao_investiu`. O jornal usa a primeira condição verdadeira e, se nenhuma for, a `padrao`.

### 6.6 `dicas_socorro.json`
```json
{
  "erro_orgao_193": "Fogo, resgate e gente presa é com os Bombeiros. Anota aí, meu filho.",
  "erro_orgao_199": "Encosta encharcada ou risco de desabar é com a Defesa Civil, o 199.",
  "trote_despachado": "Jacaré no banheiro? Olha o histórico antes de mandar viatura.",
  "real_como_trote": "Escuta o fundo da ligação. Voz assustada e barulho de água não é brincadeira.",
  "fila_estourando": "Prioriza quem tem gente em risco. Gato pode esperar um pouco."
}
```

---

## 7. Regras e fórmulas iniciais

Todos os números ficam em `src/config/balanco.js` e são **valores de partida para ajustar nos testes**.

| Regra | Valor inicial |
|---|---|
| Duração de um dia | 300 s reais (relógio de 8:00 a 18:00 → 2 min de jogo por segundo) |
| Chamadas por dia (1 a 5) | 8 · 12 · 16 · 20 · 24 |
| % de chamadas climáticas (1 a 5) | 0 · 40 · 60 · 75 · 90 |
| Tempo de missão de um veículo | 40 s reais (depois volta a ficar disponível) |
| Orçamento por dia | R$ 300 mil (não acumula) |

**Relógio:** usa `requestAnimationFrame` e conta o tempo real entre quadros. Ele **pausa sozinho** quando a aba fica escondida (evento `visibilitychange`), para o aluno não ser punido por trocar de janela.

**Medidor de Colapso (0 a 100):**

| Evento | Efeito |
|---|---|
| Chamada passou do `tempo_limite` na fila | +4 × gravidade, a cada 10 s |
| Despacho para órgão errado | +10 × gravidade |
| Viatura despachada para trote | +5 e o veículo fica ocupado |
| Chamada real encerrada como trote | +15 × gravidade |
| Atendimento correto | −5 |
| Fim do dia | −30 (a equipe descansa) |
| Medidor chega a 100 | colapso: o jogador é "demitido" e pode repetir o dia |

**Efeito da adaptação:** ao montar as chamadas de um dia, cada chamada com `mitigada_por` cujo investimento esteja ativo é removida com probabilidade `reducao`, ou tem a gravidade reduzida em `reducao_gravidade`. Cada remoção conta como **ocorrência evitada** e aparece no relatório. Os sorteios usam `aleatorio.js` com semente, para que a mesma semente gere sempre a mesma partida.

**Estrelas (fim do Modo Expediente):**
- ★: completou os 5 dias.
- ★★: acerto médio ≥ 70%.
- ★★★: acerto ≥ 80% **e** ≥ 30% do orçamento total em adaptação. Concede o título de "Funcionário do Mês".

**Dificuldade adaptativa:** a média móvel considera as últimas 6 chamadas.
- Acerto > 85%: o intervalo entre chamadas cai 15%.
- Acerto < 50%: o intervalo aumenta 25% e a Dona Socorro dá uma dica.
- No Modo Hora Extra, a dificuldade não é reduzida.

**Modo Hora Extra:** a cada dia, +15% de chamadas e +1 de gravidade média a cada 3 dias. A redução por adaptação tem teto de 60%. Como o volume cresce sem limite e a adaptação não, o colapso é inevitável. Esse é o argumento do jogo: só adaptar não basta, também é preciso mitigar.

---

## 8. Telemetria (registro de dados)

O módulo `telemetria.js` guarda os eventos da sessão no `localStorage` (chave `aehc_telemetria`). A tela final tem o botão **Baixar dados (CSV)**, que gera o arquivo no próprio navegador (com `Blob` e um link de download), para usar no plano de testes.

| Evento | Campos |
|---|---|
| `chamada_atendida` | dia, id, evento, climatica, segundos_na_fila, segundos_em_linha, perguntas_feitas, orgao_escolhido, orgao_correto, acertou, foi_trote, marcou_trote |
| `fim_do_dia` | dia, acerto_pct, tempo_medio, atendidas, evitadas, colapso_max, orcamento_adaptacao_pct |
| `investimento` | dia, id, tipo, custo |
| `colapso` | dia, hora_jogo |
| `sessao` | modo, duracao_total, estrelas, dias_sobrevividos, semente |

Cada sessão recebe um código curto (por exemplo, `AEHC-4F2K`), mostrado na tela final, para o aluno anotar no questionário e você cruzar com o CSV sem pedir nomes.

---

## 9. Layout da tela principal

```html
<div id="tela-jogo" class="tela">
  <header class="barra-superior">
    <span class="relogio">08:00</span>
    <span class="rotulo-dia">Dia 1 de 5</span>
    <div class="medidor-colapso"><progress max="100" value="0"></progress> <span>0%</span></div>
    <ul class="frota"><!-- 190 2/3 · 192 1/2 · 193 2/2 · 199 1/1 --></ul>
    <button class="ajuda" aria-label="Ajuda">?</button>
  </header>

  <main class="corpo">            <!-- grid: fila | chamada ativa | mapa -->
    <section class="fila" aria-label="Fila de chamadas"><ol></ol></section>
    <section class="chamada-ativa" aria-live="polite">
      <div class="cabecalho"><!-- retrato, nome, bairro, emoção --></div>
      <div class="transcricao"></div>
      <div class="perguntas"></div>
      <div class="despacho"><!-- 190 192 193 199 + Encerrar como trote --></div>
      <dl class="ficha"></dl>
    </section>
    <section class="mapa" aria-label="Mapa de Porto Ameno">
      <svg viewBox="0 0 400 500"><!-- bairros, marcadores, veículos --></svg>
    </section>
  </main>

  <aside class="balao-socorro" role="status"></aside>
  <div class="feedback" role="alert"></div>
</div>
```

- O mapa é um **SVG**: cada bairro é uma forma com `id` (`orla`, `morro`…), o que permite pintar alagamento e fumaça e animar os veículos com a Web Animations API (`elemento.animate`).
- Em telas estreitas (celular), as três colunas viram **abas** (Fila · Chamada · Mapa).

**Eventos principais (`eventos.js`):**
`chamada_chegou` · `chamada_selecionada` · `pergunta_feita` · `chamada_resolvida` · `veiculo_partiu` · `veiculo_voltou` · `colapso_mudou` · `colapsou` · `dia_terminou` · `investimento_comprado`

---

## 10. Ferramentas de teste no navegador

Estas ferramentas são criadas aos poucos, a partir do Marco 0, e tornam os testes no link publicado muito mais rápidos.

**Parâmetros na URL** (acrescente ao final do link do jogo):

| Exemplo | Efeito |
|---|---|
| `…/apocalipse-horario-comercial/?debug` | Mostra o painel de depuração |
| `?dia=3` | Começa direto no dia 3 (com investimentos padrão) |
| `?seed=42` | Usa a semente 42; a mesma semente gera sempre a mesma partida |
| `?vel=4` | Relógio 4× mais rápido |
| `?debug&dia=5&seed=7` | Combinações são permitidas |

**Painel de depuração (`?debug`):**
- Velocidade do relógio (1× · 4× · 10×) e botão "Terminar o dia agora".
- Colapso em 0 ou 90.
- Mostrar gabarito: o órgão correto aparece em cada cartão da fila.
- Disparar uma chamada específica pelo `id`.
- Ganhar R$ 1 milhão na tela de investimentos.
- Apagar o progresso salvo e a telemetria.
- Em modo debug, `window.jogo` expõe o estado para inspecionar no console.

**Sempre visíveis:**
- **Rodapé de versão:** código do commit e data do build (por exemplo, `v a1b2c3d · 26/11 14:32`). Serve para conferir se você está testando a versão nova.
- **Painel de erro:** qualquer erro de JavaScript abre um painel vermelho com a mensagem, o arquivo, a linha, a versão e um botão **"Copiar erro"**. Funciona também no celular, onde não há console.

**Ferramentas do navegador no PC (F12):**
- **Console:** mostra os erros e avisos.
- **Modo dispositivo** (Ctrl+Shift+M): simula a tela de um celular. Melhor ainda: abra o link no seu próprio celular.
- **Application → Local Storage:** mostra o progresso salvo e a telemetria.
- **Lighthouse → Acessibilidade:** dá uma nota e aponta problemas de contraste, rótulos e foco.

**Testes automáticos:** a partir do Marco 2, o Claude escreve testes (Vitest) para `src/sistemas/`. Eles rodam no GitHub Actions a cada envio, e um teste quebrado impede a publicação, protegendo a versão no ar.

---

## 11. Marcos

Cada marco termina em algo **jogável no link publicado**. Marque as caixas conforme avança.

### Marco 0 · Repositório publicando sozinho
- [ ] Configuração inicial no GitHub (seção 3.1), feita por você.
- [x] Projeto Vite sem framework, com `vite.config.js` usando `base: './'`.
- [x] Estrutura de pastas da seção 5, `CLAUDE.md` (seção 3.4), este `ROADMAP.md` e um `README.md` curto com o link do jogo.
- [x] Fluxo `.github/workflows/deploy.yml` (seção 3.3).
- [x] `roteador.js` com telas provisórias: menu → jogo → menu.
- [x] `tema.css` em tons de cinza, imitando os wireframes (fonte legível, botões com borda grossa).
- [x] Importar `orgaos.json` e mostrar a lista na tela de jogo provisória.
- [x] `balanco.js` com as constantes da seção 7 e `aleatorio.js` com sorteio por semente.
- [x] Rodapé de versão, painel de erro com "Copiar erro" e esqueleto do painel `?debug`.
- [x] Wireframes e ilustrações de referência em `referencias/`.

**Como testar:** abra o link do jogo, clique em "Começar Expediente" e veja a lista dos quatro órgãos. Abra o link com `?debug` e veja o painel. Confira no rodapé se a versão bate com o último commit no GitHub. Abra também no celular.

**Pronto quando:** o fluxo do GitHub Actions termina com ✓ verde, o jogo abre no link sem erros e troca de tela.

### Marco 1 · Uma chamada do começo ao fim
- [ ] Layout da tela de jogo (seção 9): barra superior, fila, chamada ativa e mapa (ainda um retângulo).
- [ ] Carregar **uma** chamada fixa (o gato do Seu Arlindo) e mostrá-la na chamada ativa: personagem, bairro, fala inicial e indicação de murmúrio com emoção.
- [ ] Botões de pergunta: ao clicar, a resposta entra na transcrição e preenche a **ficha da ocorrência**.
- [ ] Botões **190 · 192 · 193 · 199** e **Encerrar como trote**.
- [ ] `despacho.js`: `resolverDespacho(chamada, escolha)` devolve `{ acertou, motivo, deltaColapso }`.
- [ ] Mensagem de feedback (acerto ou erro, com motivo), sempre com **ícone + texto**, nunca só cor.

**Como testar:** atenda o gato, escolha 192 e leia a explicação do erro. Recarregue a página, escolha 193 e veja a mensagem de acerto. Teste as perguntas e confira a ficha sendo preenchida.

**Pronto quando:** dá para atender a chamada, errar, entender o motivo e acertar na tentativa seguinte.

### Marco 2 · Um dia completo (dia 1)
- [ ] `relogio.js`: 8:00 → 18:00 em 300 s, com pausa automática quando a aba fica escondida.
- [ ] `fila.js`: chamadas entram na fila no horário `hora`, com tempo de espera visível e alerta ⚠ ao passar do limite.
- [ ] `frota.js`: veículos por órgão, contador `disponíveis/total` na barra. Sem veículo livre, o botão fica desabilitado com o texto "sem veículo".
- [ ] Mapa em SVG com os 5 bairros (formas simples e nomes), marcador piscando no bairro da chamada e ícone do veículo indo e voltando.
- [ ] `colapso.js` com as regras da seção 7 e a barra na interface. Ao chegar a 100, a tela **"Você foi demitido!"** oferece "Repetir o dia".
- [ ] Conteúdo completo de `dia_1.json` (Apêndice A), com as chamadas banais dos personagens recorrentes e os trotes do Juninho.
- [ ] **Tutorial da Dona Socorro** no dia 1: balões que apresentam uma área da tela por vez (fila → chamada → perguntas → despacho → trote → mapa), com botão "Pular tutorial".
- [ ] Painel de depuração: velocidade do relógio, colapso em 90 e gabarito.
- [ ] Primeiros testes automáticos: `despacho.js` e `colapso.js`.

**Como testar:** jogue o dia 1 inteiro em velocidade normal pelo menos uma vez. Depois use `?debug&vel=10` para repetir rápido. Coloque o colapso em 90 e deixe uma chamada estourar para ver a demissão. Troque de aba por 10 s e confira se o relógio parou.

**Pronto quando:** o dia 1 é jogável do início ao fim, com vitória (18:00) e derrota (colapso).

### Marco 3 · Os cinco dias e a escalada
- [ ] `dia.js` e `roteador.js`: sequência jornal da manhã → expediente → relatório → investimentos → próximo dia. Por enquanto, o relatório e os investimentos podem ser telas provisórias com um botão "Continuar".
- [ ] Escrever `dia_2.json` a `dia_5.json` seguindo a progressão do GDD:
  - Dia 2: calor extremo (insolação na orla, mal-estar no Centro, quedas de energia).
  - Dia 3: chuvas intensas (alagamentos no Centro e na Beira-Rio, risco no Morro, evacuação preventiva com o 199).
  - Dia 4: seca e queimadas (poço do Seu Zé, incêndio na Serra Seca e no Parque, Seu Arlindo passa mal).
  - Dia 5: tempestade perfeita (ressaca no quiosque da Kelly, enchente, **ligação verdadeira do Juninho**).
- [ ] Arco do Juninho: o estado guarda quantos trotes ele já passou. No dia 5, a ligação real tem pistas na transcrição (voz assustada, barulho de água, endereço em área de risco). Se o jogador encerrar como trote, o jornal da noite conta que **vizinhos resgataram o menino horas depois**, sem cena trágica, e a Dona Socorro comenta o ocorrido.
- [ ] Mudança visual por dia: classe `dia-1` … `dia-5` no `<body>` muda as variáveis CSS (azul → laranja → vermelho). O ícone do ar-condicionado vira ventilador no dia 3, e a luz pisca no dia 4 (com animação CSS que respeita a opção de desligar piscadas e o `prefers-reduced-motion`).
- [ ] `dificuldade.js` (seção 7).
- [ ] Parâmetros `?dia=N` e `?seed=N`.

**Como testar:** abra o link com `?debug&dia=5` e procure a ligação real do Juninho. Teste os dois caminhos: acreditar e encerrar como trote. Compare as cores de `?dia=1` e `?dia=4`. Jogue os cinco dias com `?vel=10` e observe a fila crescer.

**Pronto quando:** dá para jogar os cinco dias em sequência e sentir a fila crescer e as chamadas climáticas dominarem.

### Marco 4 · Relatório do dia e jornal
- [ ] `relatorio.js`: os quatro indicadores (acerto, tempo médio, atendidas, % do orçamento em adaptação), sempre comparados ao dia anterior.
- [ ] `grafico.js`: gráfico de linha em SVG com o acerto por dia.
- [ ] Comentário da Dona Socorro escolhido pelo pior indicador do dia.
- [ ] `jornal.js`: manchetes da manhã e da noite escolhidas pela condição (seção 6.5). A vinheta fica mais séria a cada dia (mudança de cor e de texto).

**Como testar:** jogue um dia acertando tudo (use o gabarito) e outro errando de propósito. Confira se os números, o gráfico, o comentário e a manchete mudam de acordo.

**Pronto quando:** ao fim de cada dia aparecem o relatório com números reais da partida e um jornal coerente com o desempenho.

### Marco 5 · Investimentos e adaptação
- [ ] `investimentos.js`: colunas **RESPONDER** e **ADAPTAR**, com custo, efeito em linguagem simples, itens bloqueados mostrando "libera no dia N" e saldo do orçamento.
- [ ] Faixa **"Previsão para amanhã"** listando os eventos do próximo dia, para orientar a escolha.
- [ ] Faixa **"Efeito esperado"** mostrando ocorrências previstas antes → depois das escolhas.
- [ ] `orcamento.js` aplica os efeitos: frota extra (imediata) e adaptações (a partir de `atraso_dias`).
- [ ] `dia.js` aplica `mitigada_por` (seção 7) e contabiliza as ocorrências evitadas, com testes automáticos.

**Como testar:** jogue duas partidas com a mesma semente (`?seed=1&vel=10`). Na primeira, compre só viaturas; na segunda, invista em adaptação. Compare as ocorrências evitadas e o colapso nos dias 4 e 5.

**Pronto quando:** as duas estratégias levam a resultados claramente diferentes nos dias 4 e 5.

### Marco 6 · Final, debriefing, telemetria, menu e salvamento
- [ ] `final.js`: **jornal especial** comparando "sua Porto Ameno" com "a Porto Ameno que poderia ter sido". Para isso, simular rapidamente os dias com a estratégia oposta, usando a mesma semente.
- [ ] Relatório completo dos 5 dias, com estrelas e o título "Funcionário do Mês".
- [ ] Tela de debriefing com as quatro perguntas e botão **"Modo projetor"** (texto grande, para o professor projetar):
  1. Quando você percebeu que algo estava mudando?
  2. Por que você investiu (ou não) em prevenção?
  3. Quais ocorrências do jogo você reconhece de notícias reais do Brasil?
  4. Que risco climático existe no seu bairro, e o que você faria para preveni-lo?
- [ ] `telemetria.js` completo (seção 8), código da sessão e botão **Baixar dados (CSV)**.
- [ ] `menu.js`: Começar Expediente, Continuar, Hora Extra (bloqueado até concluir o dia 1), Acessibilidade, Sobre o jogo, botão "?" e aviso de fotossensibilidade.
- [ ] Salvamento automático no `localStorage` ao fim de cada dia e botão **"Continuar"** no menu.

**Como testar:** jogue uma partida completa com `?vel=10`, baixe o CSV e abra numa planilha. No meio de outra partida, feche a aba, abra o link de novo e use "Continuar". Teste numa janela anônima (sem progresso salvo) para ver se nada quebra.

**Pronto quando:** um colega consegue jogar do menu até o debriefing sem ajuda, só com o link, e a sessão gera um CSV válido. **Aqui o protótipo mínimo está completo.**

### Marco 7 · Modo Hora Extra
- [ ] `modelos_hora_extra.json`: modelos de chamada por evento e bairro, com variações de fala.
- [ ] `gerador_hora_extra.js`: gera cada dia a partir dos modelos, com escalada (+15% chamadas/dia) e teto de 60% para a adaptação.
- [ ] Pontuação = dias sobrevividos. Ranking local no `localStorage` (top 10, com apelido).
- [ ] Tela final do modo: "A central colapsou no dia N", com a pergunta "Por que era impossível vencer?".
- [ ] Teste automático: com estratégia ótima simulada, o colapso acontece em algum dia.

**Como testar:** com `?debug&vel=10`, use o gabarito, acerte tudo e invista só em adaptação. Mesmo assim, a central deve colapsar em algum momento.

**Pronto quando:** o modo roda indefinidamente e sempre termina em colapso, mesmo com estratégia ótima.

### Marco 8 · Acessibilidade
- [ ] Tela de Acessibilidade com as opções salvas no `localStorage`.
- [ ] Texto em três tamanhos (variável `--tamanho-texto`).
- [ ] Modo daltonismo: paleta alternativa, mantendo ícones e formas distintos para urgência, acerto e erro.
- [ ] **Modo sem pressão:** o relógio e os tempos de espera param enquanto a chamada está aberta.
- [ ] Narração das transcrições com a fala do navegador (`speechSynthesis`, voz em português). Se o navegador não tiver voz em português, a opção fica desabilitada com uma explicação.
- [ ] Atalhos: 1 a 4 para os órgãos, T para trote, Q/W/E para perguntas, Tab para navegar e foco sempre visível.
- [ ] Desligar efeitos piscantes, respeitando também o `prefers-reduced-motion` do sistema.
- [ ] Avisos para leitor de tela: nova chamada e feedback anunciados por `aria-live`.

**Como testar:** jogue um dia inteiro **só com o teclado**, com texto grande e sem piscadas. Rode o Lighthouse (F12 → Lighthouse → Acessibilidade) no link publicado e mande o relatório ao Claude.

**Pronto quando:** dá para jogar um dia inteiro só com teclado, e o Lighthouse dá nota de acessibilidade de 90 ou mais.

### Marco 9 · Arte, áudio e acabamento
- [ ] Substituir os placeholders pela arte 2D cartum (referência: ilustrações em `referencias/`), salva em `public/assets/img/` em WebP: mapa ilustrado, retratos dos personagens e fundo do escritório. Para enviar imagens novas, suba-as pelo próprio GitHub (*Add file → Upload files*) ou anexe na conversa com o Claude.
- [ ] Murmúrios: 3 ou 4 amostras curtas por emoção (calmo, irritado, nervoso, desesperado), sorteadas, com velocidade (`playbackRate`) diferente por personagem.
- [ ] Trilha em camadas com a Web Audio API (calma → percussão → tensão, ligadas por dia), efeitos (telefone, sirene, chuva, trovão) e o zumbido do ar-condicionado, que some quando ele quebra.
- [ ] O áudio só começa depois do primeiro clique (os navegadores bloqueiam som automático), com controle de volume e botão de mudo.
- [ ] Animações leves em CSS: cartões entrando na fila, veículo no mapa e carimbo de "DEMITIDO".
- [ ] Revisão de textos (ortografia, tom, humor sem estereótipos).

**Como testar:** jogue com o som ligado e depois no mudo, no PC e no celular. Confira se o jogo carrega rápido numa conexão lenta (F12 → *Network* → *Slow 4G*) e continua funcionando caso um arquivo falte.

**Pronto quando:** o jogo transmite a escalada só pelo visual e pelo som, mesmo sem ler as manchetes.

### Marco 10 · Versão final e testes com usuários
- [ ] Testar o link no Chrome, Firefox e Edge, num computador modesto (como o do laboratório da escola) e em celulares Android e iPhone.
- [ ] (Opcional) Publicar também no **itch.io**: baixar o pacote do site na aba *Actions* (ou pedir ao Claude um .zip de `dist/`) e enviar como projeto HTML.
- [ ] (Opcional) Domínio próprio: em *Settings → Pages → Custom domain*, com o DNS configurado no registrador.
- [ ] Rodada 1 com colegas (usabilidade): questionário **SUS**, tempo para concluir o tutorial e erros observados.
- [ ] Rodada 2 com 5 a 8 estudantes do ensino médio: **pré-teste**, partida jogada em voz alta, **pós-teste**, entrevista e análise dos CSVs da telemetria.
- [ ] Ajustar `balanco.js` com base nos dados (por exemplo, se ninguém investe em adaptação até o dia 3, deixar a previsão mais visível).

**Pronto quando:** o link abre e roda numa máquina da escola e num celular, e há dados dos testes para analisar.

---

## Apêndice A · Conteúdo do Dia 1 (`src/dados/chamadas/dia_1.json`)

O dia 1 não tem eventos climáticos e serve de tutorial. A única pista climática fica no jornal da manhã ("calor acima da média").

```json
[
  {
    "id": "d1_arlindo_gato", "hora": "08:20", "personagem": "seu_arlindo", "bairro": "centro",
    "titulo_fila": "Gato na árvore", "icone": "gato", "emocao": "calmo",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "193", "gravidade": 1, "tempo_limite": 90,
    "fala_inicial": "Bom dia, minha filha... o Bolinha subiu na mangueira e não desce de jeito nenhum.",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "Rua das Acácias, 40, no Centro." },
      { "id": "risco", "texto": "Alguém tentou subir?", "resposta": "Eu ia pegar a escada, mas a minha filha não deixou." }
    ],
    "feedback_acerto": "Gato resgatado! Seu Arlindo agradece com um bolo de fubá.",
    "feedback_erro": "Resgate de animal em altura é com os Bombeiros (193).",
    "mitigada_por": null
  },
  {
    "id": "d1_juninho_jacare", "hora": "08:45", "personagem": "juninho", "bairro": "centro",
    "titulo_fila": "Animal em casa", "icone": "telefone", "emocao": "risonho",
    "climatica": false, "evento": null, "trote": true, "orgao_correto": null, "gravidade": 1, "tempo_limite": 60,
    "fala_inicial": "Socorro! Tem um JACARÉ no meu banheiro! (risadas ao fundo)",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "Na minha casa, ué! (mais risadas)" },
      { "id": "adulto", "texto": "Tem um adulto aí?", "resposta": "...tchau!" }
    ],
    "feedback_acerto": "Trote identificado. A linha ficou livre para quem precisa.",
    "feedback_erro": "Risadas, endereço vago e criança fugindo da pergunta: sinais de trote.",
    "mitigada_por": null
  },
  {
    "id": "d1_ze_vaca", "hora": "09:30", "personagem": "seu_ze", "bairro": "serra_seca",
    "titulo_fila": "Animal na pista", "icone": "vaca", "emocao": "calmo",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "190", "gravidade": 1, "tempo_limite": 90,
    "fala_inicial": "A Mimosa fugiu da cerca e tá parada no meio da estrada da Serra. Já quase bateram nela.",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "No quilômetro 8 da estrada da Serra Seca." },
      { "id": "acidente", "texto": "Houve acidente?", "resposta": "Ainda não, graças a Deus." }
    ],
    "feedback_acerto": "A Polícia sinalizou a pista e Seu Zé levou a Mimosa de volta.",
    "feedback_erro": "Animal na pista é risco de trânsito: Polícia (190).",
    "mitigada_por": null
  },
  {
    "id": "d1_morro_som", "hora": "10:15", "personagem": "vizinha_morro", "bairro": "morro",
    "titulo_fila": "Som alto", "icone": "som", "emocao": "irritada",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "190", "gravidade": 1, "tempo_limite": 120,
    "fala_inicial": "O vizinho tá com o som no último desde as seis da manhã. Já pedi, ele me xingou.",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "Beco 3 do Morro da Vista, casa azul." },
      { "id": "violencia", "texto": "Houve agressão?", "resposta": "Só xingamento, mas o clima tá feio." }
    ],
    "feedback_acerto": "A Polícia conversou com o vizinho. O som baixou.",
    "feedback_erro": "Perturbação e ameaça entre vizinhos é com a Polícia (190).",
    "mitigada_por": null
  },
  {
    "id": "d1_kelly_furto", "hora": "11:40", "personagem": "kelly", "bairro": "orla",
    "titulo_fila": "Furto no quiosque", "icone": "bolsa", "emocao": "irritada",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "190", "gravidade": 1, "tempo_limite": 90,
    "fala_inicial": "Levaram a caixinha do troco do meu quiosque! O cara correu pela areia.",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "Quiosque 12, Praia do Sossego." },
      { "id": "feridos", "texto": "Alguém se machucou?", "resposta": "Não, só o meu prejuízo." }
    ],
    "feedback_acerto": "A Polícia registrou a ocorrência e fez uma ronda na orla.",
    "feedback_erro": "Furto é com a Polícia (190).",
    "mitigada_por": null
  },
  {
    "id": "d1_parque_trilheiro", "hora": "13:10", "personagem": "turista", "bairro": "parque",
    "titulo_fila": "Pessoa perdida", "icone": "mapa", "emocao": "nervoso",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "193", "gravidade": 2, "tempo_limite": 75,
    "fala_inicial": "Me perdi na trilha do Parque Estadual e a bateria do celular tá acabando.",
    "perguntas": [
      { "id": "onde", "texto": "O que você vê ao redor?", "resposta": "Uma cachoeira pequena e uma placa quebrada." },
      { "id": "feridos", "texto": "Está ferido?", "resposta": "Torci o pé, mas consigo andar devagar." }
    ],
    "feedback_acerto": "Os Bombeiros encontraram o trilheiro perto da cachoeira.",
    "feedback_erro": "Busca e resgate em mata é com os Bombeiros (193).",
    "mitigada_por": null
  },
  {
    "id": "d1_centro_queda", "hora": "15:00", "personagem": "transeunte", "bairro": "centro",
    "titulo_fila": "Pessoa caída", "icone": "saude", "emocao": "nervoso",
    "climatica": false, "evento": null, "trote": false, "orgao_correto": "192", "gravidade": 2, "tempo_limite": 60,
    "fala_inicial": "Um senhor escorregou na calçada e bateu a cabeça. Tá consciente, mas sangrando.",
    "perguntas": [
      { "id": "onde", "texto": "Onde é?", "resposta": "Em frente à farmácia da Praça Central." },
      { "id": "consciente", "texto": "Ele está consciente?", "resposta": "Tá, mas meio confuso." }
    ],
    "feedback_acerto": "O SAMU atendeu o senhor na praça e o levou para avaliação.",
    "feedback_erro": "Pessoa ferida precisa de atendimento médico: SAMU (192).",
    "mitigada_por": null
  },
  {
    "id": "d1_juninho_disco", "hora": "16:30", "personagem": "juninho", "bairro": "centro",
    "titulo_fila": "Objeto no céu", "icone": "telefone", "emocao": "risonho",
    "climatica": false, "evento": null, "trote": true, "orgao_correto": null, "gravidade": 1, "tempo_limite": 60,
    "fala_inicial": "Moço, tem um disco voador pousando na escola! Manda o exército! (risada abafada)",
    "perguntas": [
      { "id": "onde", "texto": "Qual escola?", "resposta": "A... a escola do... ah, esquece." }
    ],
    "feedback_acerto": "Trote identificado de novo. A Dona Socorro anota o número do Juninho.",
    "feedback_erro": "Mesmo número, mesma risada: é o Juninho de novo.",
    "mitigada_por": null
  }
]
```

---

## Apêndice B · Referências de tela

Os wireframes ficam em `referencias/`. Vale citá-los ao pedir cada tela ao Claude.

| Módulo | Wireframe | Elementos obrigatórios |
|---|---|---|
| `telas/menu.js` | `tela1_menu_inicial.png` | Logo, Começar Expediente, Continuar, Hora Extra (bloqueado), Acessibilidade, Sobre o jogo, "?", aviso de fotossensibilidade |
| `telas/jogo.js` | `tela2_jogo_hud.png` | Barra superior (relógio, dia, colapso, frota), fila, chamada ativa com perguntas, despacho, trote, ficha, mapa, balão da Dona Socorro |
| `telas/relatorio.js` | `tela3_fim_do_dia.png` | 4 indicadores com comparação, gráfico de evolução, jornal da noite, comentário da Dona Socorro, botão para investimentos |
| `telas/investimentos.js` | `tela4_investimentos.png` | Colunas Responder × Adaptar, custos, bloqueios, previsão para amanhã, efeito esperado, saldo |

---

## Apêndice C · Checklist antes de apresentar

- [ ] Os 4 objetivos de aprendizagem têm uma mecânica que os exercita (identificar, relacionar, comparar, aplicar).
- [ ] Os 4 indicadores de avaliação aparecem no relatório do dia.
- [ ] A telemetria registra cada chamada, cada investimento e o resumo de cada dia, e o CSV abre numa planilha.
- [ ] O Modo Hora Extra sempre termina em colapso.
- [ ] O arco do Juninho e as ligações recorrentes (Arlindo, Kelly, Seu Zé) existem do dia 1 ao 5.
- [ ] Nenhuma informação depende só de cor, e há modo sem pressão.
- [ ] O debriefing final traz as 4 perguntas, incluindo a do risco no bairro.
- [ ] O link abre e roda num computador da escola e num celular, sem instalar nada.
