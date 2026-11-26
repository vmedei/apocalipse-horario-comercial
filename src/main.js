// @ts-check
// Ponto de entrada do jogo.

// Importado primeiro: os módulos são avaliados em ordem, então o painel
// já está ouvindo quando os outros arquivos carregam.
import './debug/erros.js';

import './estilos/tema.css';
import './estilos/base.css';
import './estilos/telas.css';
import './estilos/jogo.css';
import './estilos/debug.css';

import { registrarTela, irPara } from './roteador.js';
import { telaMenu } from './telas/menu.js';
import { telaJogo } from './telas/jogo.js';
import { telaSobre } from './telas/sobre.js';
import { telaDemitido } from './telas/demitido.js';
import { telaFimDia } from './telas/fim_dia.js';
import { telaJornal } from './telas/jornal.js';
import { telaInvestimentos } from './telas/investimentos.js';
import { telaSemana } from './telas/semana.js';
import { novaSemana } from './fluxo.js';
import { ouvir } from './eventos.js';
import { instalarPainelDebug } from './debug/painel.js';
import { estado, parametros } from './estado.js';
import { textoVersao } from './versao.js';

registrarTela('menu', telaMenu);
registrarTela('jogo', telaJogo);
registrarTela('sobre', telaSobre);
registrarTela('demitido', telaDemitido);
registrarTela('fim_dia', telaFimDia);
registrarTela('jornal', telaJornal);
registrarTela('investimentos', telaInvestimentos);
registrarTela('semana', telaSemana);

// A classe dia-N no <body> muda as cores (esquentam a cada dia).
const aplicarClasseDoDia = () => {
  document.body.classList.remove('dia-1', 'dia-2', 'dia-3', 'dia-4', 'dia-5');
  document.body.classList.add(`dia-${estado.dia}`);
};
aplicarClasseDoDia();
ouvir('estado_mudou', aplicarClasseDoDia);

const rodape = document.getElementById('rodape-versao');
if (rodape) rodape.textContent = textoVersao();

instalarPainelDebug();

// ?dia=N pula o menu e começa a semana naquele dia (pelo jornal da manhã).
if (parametros.dia) novaSemana(parametros.dia);
else irPara('menu');
