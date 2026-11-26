# Apocalipse em Horário Comercial

Jogo sério web sobre mudanças climáticas. Você é atendente da central de emergência de Porto Ameno, uma cidade brasileira fictícia: as chamadas começam banais e, dia após dia, viram ondas de calor, enchentes, deslizamentos e queimadas.

**Jogar:** https://vmedei.github.io/apocalipse-horario-comercial/

## Testar

O jogo roda direto no navegador, no PC ou no celular. Parâmetros úteis no final do link:

| Parâmetro | Efeito |
|---|---|
| `?debug` | Painel de depuração |
| `?dia=3` | Começa direto no dia 3 |
| `?seed=42` | Repete a mesma partida |
| `?vel=4` | Relógio mais rápido |

O rodapé mostra a versão publicada (commit e data). Se aparecer um erro, o painel vermelho tem um botão **Copiar erro**.

## Desenvolvimento

- O que construir e em que ordem: [ROADMAP.md](ROADMAP.md)
- Regras do projeto para o Claude: [CLAUDE.md](CLAUDE.md)
- Wireframes e ilustrações de referência: [referencias/](referencias/)

Cada push na branch `main` roda os testes, monta o site e publica no GitHub Pages pelo fluxo [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
