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
import { instalarPainelDebug } from './debug/painel.js';
import { estado, parametros } from './estado.js';
import { textoVersao } from './versao.js';

registrarTela('menu', telaMenu);
registrarTela('jogo', telaJogo);
registrarTela('sobre', telaSobre);
registrarTela('demitido', telaDemitido);
registrarTela('fim_dia', telaFimDia);

document.body.className = `dia-${estado.dia}`;

const rodape = document.getElementById('rodape-versao');
if (rodape) rodape.textContent = textoVersao();

instalarPainelDebug();

// ?dia=N pula o menu e abre o jogo direto naquele dia.
irPara(parametros.dia ? 'jogo' : 'menu');
