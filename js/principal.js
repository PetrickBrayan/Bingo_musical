const comandosPorTecla = {
  " ": "avancar",
  "Enter": "avancar",
  "ArrowRight": "avancar",
  "PageDown": "avancar",
  "MediaPlayPause": "avancar",
  "Escape": "cancelar",
  "GoBack": "cancelar",
  "BrowserBack": "cancelar",
  "XF86Back": "cancelar",
  "ArrowLeft": "voltar",
  "PageUp": "voltar",
  "Backspace": "apagar",
  "ArrowUp": "cima",
  "ArrowDown": "baixo",
  "+": "maisMesas",
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
  "b": "barra",
  "l": "listaMusicas",
  "g": "guia",
  "c": "microfone",
  "x": "desistir",
  "j": "modoResposta",
  "n": "novoJogo"
};

const comandosPorCodigoDeTecla = {
  10009: "cancelar",
  461: "cancelar",
  403: "parar",
  404: "dica",
  405: "maisTempo",
  406: "placar",
  415: "avancar",
  19: "avancar"
};

const comandosQueFecham = ["avancar", "voltar", "cancelar", "placar", "comandos", "listaMusicas", "guia", "cima", "baixo"];

const acoesDosComandos = {
  avancar: () => Jogo.avancar(),
  voltar: () => Jogo.voltar(),
  cancelar: () => Jogo.voltar(),
  apagar: () => Jogo.apagarDigito(),
  cima: () => moverOuAbrirMenu(1),
  baixo: () => moverOuAbrirMenu(-1),
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
  barra: () => Jogo.alternarBarra(),
  listaMusicas: () => Jogo.alternarListaMusicas(),
  guia: () => Jogo.alternarGuia(),
  microfone: () => Jogo.iniciarMicrofone(),
  desistir: () => Jogo.errarMesa(),
  modoResposta: () => Jogo.alternarModoResposta(),
  novoJogo: () => Jogo.novoJogo()
};

function moverOuAbrirMenu(sentido) {
  const estado = Jogo.estadoAtual();
  if (estado === "boasvindas") {
    Jogo.moverBoasVindas(-sentido);
  } else if (estado === "inicio") {
    Jogo.alterarQuantidadeMesas(sentido);
  } else {
    Jogo.abrirMenu();
  }
}

function tratarComandoComComandos(comando) {
  if (comando === "avancar") {
    Tela.confirmarDispositivo();
  } else if (comando === "cima") {
    Tela.moverDispositivo(-1);
  } else if (comando === "baixo") {
    Tela.moverDispositivo(1);
  } else if (comando === "voltar" || comando === "cancelar") {
    Tela.voltarComandos();
  } else if (comando === "comandos") {
    Tela.fecharSobreposicoes();
  } else if (comando === "telaCheia") {
    acoesDosComandos.telaCheia();
  }
}

function tratarComandoComConfirmacao(comando) {
  if (comando === "avancar" || comando === "sim") {
    Jogo.confirmarEncerramento();
  } else if (["voltar", "cancelar", "parar"].indexOf(comando) !== -1) {
    Tela.fecharSobreposicoes();
  }
}

function tratarComandoComMenu(comando) {
  if (comando === "avancar") {
    Tela.executarMenu();
  } else if (comando === "cima") {
    Tela.moverMenu(-1);
  } else if (comando === "baixo") {
    Tela.moverMenu(1);
  } else if (comando === "voltar" || comando === "cancelar") {
    Tela.fecharSobreposicoes();
  }
}

function tratarComandoComGuia(comando) {
  if (comando === "avancar") {
    Tela.guiaProxima();
  } else if (comando === "voltar") {
    Tela.guiaAnterior();
  } else if (comando === "cancelar" || comando === "guia") {
    Tela.fecharSobreposicoes();
  }
}

function tratarComandoComSobreposicao(comando) {
  if (Tela.confirmacaoAberta()) {
    tratarComandoComConfirmacao(comando);
  } else if (Tela.menuAberto()) {
    tratarComandoComMenu(comando);
  } else if (Tela.guiaAberto()) {
    tratarComandoComGuia(comando);
  } else if (Tela.comandosAberto()) {
    tratarComandoComComandos(comando);
  } else if (comandosQueFecham.indexOf(comando) !== -1) {
    Tela.fecharSobreposicoes();
  } else if (comando === "telaCheia") {
    acoesDosComandos.telaCheia();
  }
}

function executarComando(comando) {
  if (Tela.sobreposicaoAberta()) {
    tratarComandoComSobreposicao(comando);
    return;
  }
  if (acoesDosComandos[comando]) {
    acoesDosComandos[comando]();
  }
}

function descobrirComando(evento) {
  const tecla = evento.key && evento.key.length === 1 ? evento.key.toLowerCase() : evento.key;
  return comandosPorTecla[tecla] || comandosPorCodigoDeTecla[evento.keyCode];
}

function tratarTecla(evento) {
  const comTeclaModificadora = evento.ctrlKey || evento.metaKey || evento.altKey;
  if (comTeclaModificadora || evento.repeat || Jogo.estaOcupado()) {
    return;
  }

  if (evento.key && /^[0-9]$/.test(evento.key)) {
    evento.preventDefault();
    if (!Tela.sobreposicaoAberta()) {
      Jogo.digitar(evento.key);
    }
    return;
  }

  const comando = descobrirComando(evento);
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

function ativarModoToqueSeNecessario() {
  const consultaToque = window.matchMedia ? window.matchMedia("(pointer: coarse) and (hover: none)") : null;
  if (consultaToque && consultaToque.matches) {
    Tela.ativarModoToque();
  }
  window.addEventListener("touchstart", () => Tela.ativarModoToque(), { once: true, passive: true });
}

document.addEventListener("keydown", tratarTecla);
document.addEventListener("pointermove", mostrarBarraPorAlgunsSegundos);
document.addEventListener("pointerdown", mostrarBarraPorAlgunsSegundos);

ativarModoToqueSeNecessario();
Jogo.iniciarAplicacao();
