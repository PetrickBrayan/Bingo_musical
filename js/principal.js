const comandosPorTecla = {
  " ": "avancar",
  "Enter": "avancar",
  "ArrowRight": "avancar",
  "PageDown": "avancar",
  "Escape": "voltar",
  "ArrowLeft": "voltar",
  "PageUp": "voltar",
  "Backspace": "apagar",
  "ArrowUp": "maisMesas",
  "+": "maisMesas",
  "ArrowDown": "menosMesas",
  "-": "menosMesas",
  "d": "dica",
  "a": "maisTempo",
  "v": "revelar",
  "r": "repetir",
  "m": "som",
  "u": "desfazer",
  "p": "placar",
  "e": "parar",
  "s": "sim",
  "h": "comandos",
  "?": "comandos",
  "f": "telaCheia",
  "c": "barra",
  "l": "listaMusicas",
  "j": "modoResposta",
  "n": "novoJogo"
};

const comandosQueFecham = ["avancar", "voltar", "placar", "comandos", "listaMusicas"];

const acoesDosComandos = {
  avancar: () => Jogo.avancar(),
  voltar: () => Jogo.voltar(),
  apagar: () => Jogo.apagarDigito(),
  maisMesas: () => Jogo.alterarQuantidadeMesas(1),
  menosMesas: () => Jogo.alterarQuantidadeMesas(-1),
  dica: () => Jogo.alternarDica(),
  maisTempo: () => Jogo.pedirAjuda(),
  revelar: () => Jogo.revelarResposta(),
  repetir: () => Jogo.repetir(),
  som: () => Jogo.alternarSom(),
  desfazer: () => Jogo.desfazerPontuacao(),
  placar: () => Jogo.alternarPlacar(),
  parar: () => Jogo.pedirEncerramento(),
  comandos: () => Tela.alternarAjuda(),
  telaCheia: () => Tela.alternarTelaCheia(),
  barra: () => Tela.alternarBarra(),
  listaMusicas: () => Jogo.alternarListaMusicas(),
  modoResposta: () => Jogo.alternarModoResposta(),
  novoJogo: () => Jogo.novoJogo()
};

function executarComando(comando) {
  if (Tela.sobreposicaoAberta()) {
    if (comando === "sim" && Tela.confirmacaoAberta()) {
      Jogo.confirmarEncerramento();
    } else if (comandosQueFecham.includes(comando)) {
      Tela.fecharSobreposicoes();
    } else if (comando === "telaCheia") {
      acoesDosComandos.telaCheia();
    }
    return;
  }

  if (acoesDosComandos[comando]) {
    acoesDosComandos[comando]();
  }
}

function tratarTecla(evento) {
  const comTeclaModificadora = evento.ctrlKey || evento.metaKey || evento.altKey;
  if (comTeclaModificadora || evento.repeat || Jogo.estaJulgando()) {
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

const tempoParaEsconderBarraMilissegundos = 3000;
let temporizadorDaBarra = null;

function mostrarBarraPorAlgunsSegundos() {
  document.body.classList.add("mouse-ativo");
  clearTimeout(temporizadorDaBarra);
  temporizadorDaBarra = setTimeout(() => {
    document.body.classList.remove("mouse-ativo");
  }, tempoParaEsconderBarraMilissegundos);
}

document.addEventListener("keydown", tratarTecla);
document.addEventListener("pointermove", mostrarBarraPorAlgunsSegundos);
document.addEventListener("pointerdown", mostrarBarraPorAlgunsSegundos);

Jogo.iniciarAplicacao();
