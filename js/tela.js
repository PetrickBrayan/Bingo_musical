const Tela = (() => {
  const corpo = document.body;
  const rotuloRodada = document.getElementById("rotuloRodada");
  const rotuloProgresso = document.getElementById("rotuloProgresso");
  const titulo = document.getElementById("titulo");
  const subtitulo = document.getElementById("subtitulo");
  const resultado = document.getElementById("resultado");
  const dica = document.getElementById("dica");
  const centroDisco = document.getElementById("centroDisco");
  const anelProgresso = document.getElementById("anelProgresso");
  const mesaDigitada = document.getElementById("mesaDigitada");
  const gradeMesas = document.getElementById("gradeMesas");
  const botaoAcertou = document.getElementById("botaoAcertou");
  const botaoErrou = document.getElementById("botaoErrou");
  const podio = document.getElementById("podio");
  const placar = document.getElementById("placar");
  const listaPlacar = document.getElementById("listaPlacar");
  const ajuda = document.getElementById("ajuda");
  const aviso = document.getElementById("aviso");

  let botoesMesas = [];
  let temporizadorAviso = null;

  function criarElemento(etiqueta, classe, texto) {
    const elemento = document.createElement(etiqueta);
    if (classe) {
      elemento.className = classe;
    }
    elemento.textContent = texto;
    return elemento;
  }

  function normalizarParaIdentificador(texto) {
    return texto
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  function evitarFocoPeloMouse(botao) {
    botao.tabIndex = -1;
    botao.addEventListener("mousedown", (evento) => evento.preventDefault());
  }

  function montarGradeMesas(aoEscolherMesa) {
    botoesMesas = [];
    for (let numero = 1; numero <= CONFIGURACAO.quantidadeMesas; numero++) {
      const botao = criarElemento("button", "mesa", String(numero));
      botao.type = "button";
      evitarFocoPeloMouse(botao);
      botao.addEventListener("click", () => aoEscolherMesa(numero));
      botoesMesas.push(botao);
    }
    gradeMesas.replaceChildren(...botoesMesas);
  }

  function ligarBotoesResposta(aoAcertar, aoErrar) {
    evitarFocoPeloMouse(botaoAcertou);
    evitarFocoPeloMouse(botaoErrou);
    botaoAcertou.addEventListener("click", aoAcertar);
    botaoErrou.addEventListener("click", aoErrar);
  }

  function definirEstado(estado) {
    corpo.dataset.estado = estado;
  }

  function definirCabecalho(categoria, progresso) {
    rotuloRodada.textContent = categoria;
    rotuloRodada.hidden = !categoria;
    rotuloProgresso.textContent = progresso;
    corpo.dataset.categoria = categoria ? normalizarParaIdentificador(categoria) : "";
  }

  function definirTextos(textoTitulo, textoSubtitulo, textoResultado) {
    titulo.textContent = textoTitulo;
    subtitulo.textContent = textoSubtitulo;
    resultado.textContent = textoResultado || "";
  }

  function definirDica(texto) {
    dica.textContent = texto;
  }

  function definirCentroDisco(texto) {
    centroDisco.textContent = texto;
  }

  function definirProgressoAnel(fracaoRestante) {
    anelProgresso.style.strokeDashoffset = String(100 * (1 - fracaoRestante));
  }

  function atualizarCronometro(segundosRestantes, limiteSegundos) {
    centroDisco.textContent = String(Math.ceil(segundosRestantes));
    definirProgressoAnel(limiteSegundos > 0 ? segundosRestantes / limiteSegundos : 0);
  }

  function atualizarGradeMesas(mesasBloqueadas, numeroDigitado) {
    mesaDigitada.textContent = numeroDigitado ? `Mesa ${numeroDigitado}` : " ";
    botoesMesas.forEach((botao, indice) => {
      const numero = indice + 1;
      botao.classList.toggle("bloqueada", mesasBloqueadas.has(numero));
      botao.classList.toggle("pre-selecionada", String(numero) === numeroDigitado);
    });
  }

  function mostrarPodio(classificacao) {
    const premiadas = classificacao.filter((item) => item.posicao <= 3 && item.pontos > 0);
    const linhas = premiadas.map((item) =>
      criarElemento("li", "", `${item.posicao}º lugar: Mesa ${item.mesa} com ${item.pontos} pontos`)
    );
    podio.replaceChildren(...linhas);
  }

  function criarLinhaPlacar(item) {
    const linha = criarElemento("li", "linha-placar", "");
    if (item.posicao <= 3 && item.pontos > 0) {
      linha.dataset.destaque = String(item.posicao);
    }
    linha.append(
      criarElemento("span", "posicao", item.pontos > 0 ? `${item.posicao}º` : "–"),
      criarElemento("span", "nome", `Mesa ${item.mesa}`),
      criarElemento("span", "pontos", String(item.pontos))
    );
    return linha;
  }

  function sobreposicaoAberta() {
    return !placar.hidden || !ajuda.hidden;
  }

  function fecharSobreposicoes() {
    placar.hidden = true;
    ajuda.hidden = true;
  }

  function alternarPlacar(classificacao) {
    const estavaAberto = !placar.hidden;
    fecharSobreposicoes();
    if (estavaAberto) {
      return;
    }
    listaPlacar.replaceChildren(...classificacao.map(criarLinhaPlacar));
    placar.hidden = false;
  }

  function alternarAjuda() {
    const estavaAberta = !ajuda.hidden;
    fecharSobreposicoes();
    ajuda.hidden = estavaAberta;
  }

  function alternarDicas() {
    corpo.dataset.dicas = corpo.dataset.dicas === "ocultas" ? "" : "ocultas";
  }

  function alternarTelaCheia() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
      aviso.hidden = true;
    }, CONFIGURACAO.duracaoAvisoMilissegundos);
  }

  return {
    montarGradeMesas,
    ligarBotoesResposta,
    definirEstado,
    definirCabecalho,
    definirTextos,
    definirDica,
    definirCentroDisco,
    definirProgressoAnel,
    atualizarCronometro,
    atualizarGradeMesas,
    mostrarPodio,
    sobreposicaoAberta,
    fecharSobreposicoes,
    alternarPlacar,
    alternarAjuda,
    alternarDicas,
    alternarTelaCheia,
    mostrarAviso
  };
})();
