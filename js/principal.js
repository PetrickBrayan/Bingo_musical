const comandosPorTecla = {
  " ": "avancar",
  "Enter": "avancar",
  "ArrowRight": "avancar",
  "PageDown": "avancar",
  "Escape": "voltar",
  "ArrowLeft": "voltar",
  "PageUp": "voltar",
  "Backspace": "apagar",
  "v": "revelar",
  "r": "repetir",
  "m": "som",
  "u": "desfazer",
  "p": "placar",
  "h": "ajuda",
  "?": "ajuda",
  "f": "telaCheia",
  "d": "dicas",
  "n": "novoJogo"
};

const comandosQueFecham = ["avancar", "voltar", "placar", "ajuda"];

const acoesDosComandos = {
  avancar: () => Jogo.avancar(),
  voltar: () => Jogo.voltar(),
  apagar: () => Jogo.apagarDigito(),
  revelar: () => Jogo.revelarResposta(),
  repetir: () => Jogo.repetir(),
  som: () => Jogo.alternarSom(),
  desfazer: () => Jogo.desfazerPontuacao(),
  placar: () => Jogo.alternarPlacar(),
  ajuda: () => Tela.alternarAjuda(),
  telaCheia: () => Tela.alternarTelaCheia(),
  dicas: () => Tela.alternarDicas(),
  novoJogo: () => Jogo.novoJogo()
};

function executarComando(comando) {
  if (Tela.sobreposicaoAberta()) {
    if (comandosQueFecham.includes(comando)) {
      Tela.fecharSobreposicoes();
    } else if (comando === "telaCheia") {
      acoesDosComandos.telaCheia();
    }
    return;
  }
  acoesDosComandos[comando]();
}

function tratarTecla(evento) {
  const comTeclaModificadora = evento.ctrlKey || evento.metaKey || evento.altKey;
  if (comTeclaModificadora || evento.repeat) {
    return;
  }

  const tecla = evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;

  if (/^[0-9]$/.test(tecla)) {
    evento.preventDefault();
    if (!Tela.sobreposicaoAberta()) {
      Jogo.digitar(tecla);
    }
    return;
  }

  const comando = comandosPorTecla[tecla];
  if (!comando) {
    return;
  }

  evento.preventDefault();
  executarComando(comando);
}

document.addEventListener("keydown", tratarTecla);

Jogo.iniciarAplicacao();
