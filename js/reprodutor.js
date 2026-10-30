const ReprodutorTrecho = (() => {
  const elemento = document.getElementById("reprodutor");
  const intervaloMilissegundos = 100;
  const margemFimSegundos = 0.05;
  const margemRevelacaoSegundos = 0.2;

  let ouvintes = {
    aoTempo() {},
    aoFimDoTrecho() {},
    aoFalhaAudio() {},
    aoBloqueioDoNavegador() {}
  };
  let temporizador = null;
  let modoSimulado = false;
  let tempoSimulado = 0;
  let segundosExtras = 0;
  let duracaoBaseSegundos = CONFIGURACAO.duracaoPadraoTrechoSegundos;
  let precarga = null;

  function definirOuvintes(novosOuvintes) {
    ouvintes = Object.assign({}, ouvintes, novosOuvintes);
  }

  function caminhoDoAudio(musica) {
    return CONFIGURACAO.pastaAudios + musica.arquivo;
  }

  function limiteDoTrecho() {
    const maximo = duracaoBaseSegundos + segundosExtras;
    if (modoSimulado || !Number.isFinite(elemento.duration)) {
      return maximo;
    }
    return Math.min(elemento.duration, maximo);
  }

  function tempoDecorrido() {
    return modoSimulado ? tempoSimulado : elemento.currentTime;
  }

  function pararTemporizador() {
    if (temporizador !== null) {
      clearInterval(temporizador);
      temporizador = null;
    }
  }

  function encerrarTrecho() {
    pararTemporizador();
    elemento.pause();
    ouvintes.aoFimDoTrecho();
  }

  function aCadaTique() {
    if (modoSimulado) {
      tempoSimulado += intervaloMilissegundos / 1000;
    }

    const limite = limiteDoTrecho();
    const decorrido = tempoDecorrido();
    ouvintes.aoTempo(Math.max(limite - decorrido, 0), limite);

    if (decorrido >= limite - margemFimSegundos || elemento.ended) {
      encerrarTrecho();
    }
  }

  function iniciarTemporizador() {
    pararTemporizador();
    temporizador = setInterval(aCadaTique, intervaloMilissegundos);
  }

  function ativarModoSimulado() {
    if (modoSimulado) {
      return;
    }
    modoSimulado = true;
    tempoSimulado = 0;
    ouvintes.aoFalhaAudio(elemento.getAttribute("src"));
  }

  function carregar(musica) {
    pararTemporizador();
    elemento.pause();
    modoSimulado = false;
    tempoSimulado = 0;
    segundosExtras = 0;
    duracaoBaseSegundos = musica.duracaoSegundos || CONFIGURACAO.duracaoPadraoTrechoSegundos;
    elemento.src = caminhoDoAudio(musica);
    elemento.load();
  }

  function precarregar(musica) {
    if (!musica) {
      return;
    }
    precarga = new Audio();
    precarga.preload = "auto";
    precarga.src = caminhoDoAudio(musica);
  }

  async function tocar() {
    iniciarTemporizador();

    if (modoSimulado) {
      return;
    }

    try {
      await elemento.play();
    } catch (erro) {
      if (erro.name === "NotAllowedError") {
        pararTemporizador();
        ouvintes.aoBloqueioDoNavegador();
      } else if (erro.name !== "AbortError") {
        ativarModoSimulado();
      }
    }
  }

  function adicionarSegundos(segundos) {
    if (!modoSimulado && elemento.ended) {
      return false;
    }

    segundosExtras += segundos;
    if (limiteDoTrecho() - tempoDecorrido() < 0.5) {
      segundosExtras -= segundos;
      return false;
    }
    return true;
  }

  function pausar() {
    pararTemporizador();
    elemento.pause();
  }

  function reiniciar() {
    tempoSimulado = 0;
    try {
      elemento.currentTime = 0;
    } catch (erro) {
      return;
    }
  }

  function terminouDeTocar() {
    const duracao = elemento.duration;
    return elemento.ended
      || (Number.isFinite(duracao) && elemento.currentTime >= duracao - margemRevelacaoSegundos);
  }

  function iniciarRevelacao() {
    pararTemporizador();

    if (modoSimulado) {
      return;
    }

    if (terminouDeTocar()) {
      reiniciar();
    }
    elemento.play().catch(() => {});
  }

  function repetirNaRevelacao() {
    if (modoSimulado) {
      return;
    }
    reiniciar();
    elemento.play().catch(() => {});
  }

  function alternarSom() {
    if (modoSimulado) {
      return;
    }
    if (elemento.paused) {
      elemento.play().catch(() => {});
    } else {
      elemento.pause();
    }
  }

  function parar() {
    pararTemporizador();
    elemento.pause();
  }

  elemento.addEventListener("error", ativarModoSimulado);

  return {
    definirOuvintes,
    carregar,
    precarregar,
    tocar,
    adicionarSegundos,
    pausar,
    reiniciar,
    iniciarRevelacao,
    repetirNaRevelacao,
    alternarSom,
    parar
  };
})();
