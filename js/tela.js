const Tela = (() => {
  const corpo = document.body;
  const rotuloRodada = document.getElementById("rotuloRodada");
  const rotuloProgresso = document.getElementById("rotuloProgresso");
  const titulo = document.getElementById("titulo");
  const subtitulo = document.getElementById("subtitulo");
  const textoDica = document.getElementById("textoDica");
  const resultado = document.getElementById("resultado");
  const centroDisco = document.getElementById("centroDisco");
  const anelProgresso = document.getElementById("anelProgresso");
  const areaAjusteMesas = document.getElementById("areaAjusteMesas");
  const quantidadeMesas = document.getElementById("quantidadeMesas");
  const botaoMenosMesas = document.getElementById("botaoMenosMesas");
  const botaoMaisMesas = document.getElementById("botaoMaisMesas");
  const mesaDigitada = document.getElementById("mesaDigitada");
  const gradeMesas = document.getElementById("gradeMesas");
  const botaoAcertou = document.getElementById("botaoAcertou");
  const botaoErrou = document.getElementById("botaoErrou");
  const legendaErro = document.getElementById("legendaErro");
  const botaoDica = document.getElementById("botaoDica");
  const botaoAjuda = document.getElementById("botaoAjuda");
  const botaoPlacar = document.getElementById("botaoPlacar");
  const botaoParar = document.getElementById("botaoParar");
  const botaoComandos = document.getElementById("botaoComandos");
  const botaoMusicas = document.getElementById("botaoMusicas");
  const areaAlternativas = document.getElementById("areaAlternativas");
  const areaModoResposta = document.getElementById("areaModoResposta");
  const botaoModoResposta = document.getElementById("botaoModoResposta");
  const listaDeMusicas = document.getElementById("listaDeMusicas");
  const corpoTabelaMusicas = document.getElementById("corpoTabelaMusicas");
  const botaoImprimirLista = document.getElementById("botaoImprimirLista");
  const botaoConfirmarParada = document.getElementById("botaoConfirmarParada");
  const botaoContinuarJogando = document.getElementById("botaoContinuarJogando");
  const podio = document.getElementById("podio");
  const placar = document.getElementById("placar");
  const listaPlacar = document.getElementById("listaPlacar");
  const ajuda = document.getElementById("ajuda");
  const confirmacao = document.getElementById("confirmacao");
  const aviso = document.getElementById("aviso");

  const mesasPorLinhaNoPlacar = 3;

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

  function calcularColunasDaGrade(quantidade) {
    return Math.min(10, Math.ceil(Math.sqrt(quantidade * 2.2)));
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
    gradeMesas.style.setProperty("--colunas", String(calcularColunasDaGrade(CONFIGURACAO.quantidadeMesas)));
    gradeMesas.replaceChildren(...botoesMesas);
  }

  function ligarControles(acoes) {
    const ligacoes = [
      [botaoAcertou, acoes.aoAcertar],
      [botaoErrou, acoes.aoErrar],
      [botaoDica, acoes.aoAlternarDica],
      [botaoAjuda, acoes.aoPedirAjuda],
      [botaoPlacar, acoes.aoAbrirPlacar],
      [botaoParar, acoes.aoPedirEncerramento],
      [botaoComandos, acoes.aoAbrirComandos],
      [botaoMusicas, acoes.aoAbrirListaMusicas],
      [botaoModoResposta, acoes.aoAlternarModoResposta],
      [botaoImprimirLista, acoes.aoImprimirLista],
      [botaoMenosMesas, acoes.aoDiminuirMesas],
      [botaoMaisMesas, acoes.aoAumentarMesas],
      [botaoConfirmarParada, acoes.aoConfirmarEncerramento],
      [botaoContinuarJogando, acoes.aoContinuarJogando]
    ];

    ligacoes.forEach(([botao, acao]) => {
      evitarFocoPeloMouse(botao);
      botao.addEventListener("click", acao);
    });
  }

  function definirLegendaErro(pontosPerdidos) {
    legendaErro.textContent = pontosPerdidos > 0 ? `ESC • perde ${pontosPerdidos}` : "ESC";
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

  function definirTextoDica(texto) {
    textoDica.textContent = texto;
    textoDica.hidden = !texto;
  }

  function atualizarBarra(situacao) {
    botaoDica.hidden = !situacao.mostrarDica;
    botaoDica.setAttribute("aria-pressed", String(situacao.dicaAtiva));
    botaoAjuda.hidden = !situacao.mostrarAjuda;
    botaoAjuda.disabled = !situacao.ajudaDisponivel;
    botaoParar.hidden = !situacao.mostrarParar;
  }

  function mostrarAjusteMesas(visivel, quantidade) {
    areaAjusteMesas.hidden = !visivel;
    quantidadeMesas.textContent = String(quantidade);
    botaoMenosMesas.disabled = quantidade <= CONFIGURACAO.quantidadeMinimaMesas;
    botaoMaisMesas.disabled = quantidade >= CONFIGURACAO.quantidadeMaximaMesas;
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
    return !placar.hidden || !ajuda.hidden || !confirmacao.hidden || !listaDeMusicas.hidden;
  }

  function confirmacaoAberta() {
    return !confirmacao.hidden;
  }

  function fecharSobreposicoes() {
    placar.hidden = true;
    ajuda.hidden = true;
    confirmacao.hidden = true;
    listaDeMusicas.hidden = true;
  }

  function alternarPlacar(classificacao) {
    const estavaAberto = !placar.hidden;
    fecharSobreposicoes();
    if (estavaAberto) {
      return;
    }
    const linhas = Math.ceil(classificacao.length / mesasPorLinhaNoPlacar);
    listaPlacar.style.setProperty("--linhas-placar", String(linhas));
    listaPlacar.replaceChildren(...classificacao.map(criarLinhaPlacar));
    placar.hidden = false;
  }

  function alternarAjuda() {
    const estavaAberta = !ajuda.hidden;
    fecharSobreposicoes();
    ajuda.hidden = estavaAberta;
  }

  function abrirConfirmacao() {
    fecharSobreposicoes();
    confirmacao.hidden = false;
  }

  function definirModoResposta(modo) {
    corpo.dataset.resposta = modo;
  }

  function mostrarAjusteModo(visivel, rotulo) {
    areaModoResposta.hidden = !visivel;
    botaoModoResposta.textContent = rotulo;
  }

  function montarAlternativas(textos, aoEscolher) {
    const botoes = textos.map((texto, indice) => {
      const botao = criarElemento("button", "alternativa", "");
      botao.type = "button";
      botao.append(
        criarElemento("span", "alternativa__numero", String(indice + 1)),
        criarElemento("span", "alternativa__texto", texto)
      );
      evitarFocoPeloMouse(botao);
      botao.addEventListener("click", () => aoEscolher(indice));
      return botao;
    });
    areaAlternativas.replaceChildren(...botoes);
  }

  function marcarResultadoAlternativa(indice, acertou) {
    const botao = areaAlternativas.children[indice];
    if (botao) {
      botao.classList.add(acertou ? "certa" : "errada");
    }
  }

  function criarLinhaTabelaMusica(linha) {
    const linhaTabela = document.createElement("tr");
    linhaTabela.dataset.situacao = linha.situacao;
    const valores = [
      linha.numero,
      linha.titulo,
      linha.interprete,
      linha.categoria,
      linha.decada,
      `${linha.duracao}s`,
      linha.pontos,
      linha.rotuloSituacao
    ];
    valores.forEach((valor) => linhaTabela.append(criarElemento("td", "", String(valor))));
    return linhaTabela;
  }

  function alternarListaMusicas(linhas) {
    const estavaAberta = !listaDeMusicas.hidden;
    fecharSobreposicoes();
    if (estavaAberta) {
      return;
    }
    corpoTabelaMusicas.replaceChildren(...linhas.map(criarLinhaTabelaMusica));
    listaDeMusicas.hidden = false;
  }

  function alternarBarra() {
    corpo.dataset.barra = corpo.dataset.barra === "oculta" ? "" : "oculta";
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
    ligarControles,
    definirLegendaErro,
    definirEstado,
    definirCabecalho,
    definirTextos,
    definirTextoDica,
    atualizarBarra,
    mostrarAjusteMesas,
    definirCentroDisco,
    definirProgressoAnel,
    atualizarCronometro,
    atualizarGradeMesas,
    mostrarPodio,
    sobreposicaoAberta,
    confirmacaoAberta,
    fecharSobreposicoes,
    alternarPlacar,
    alternarAjuda,
    abrirConfirmacao,
    definirModoResposta,
    mostrarAjusteModo,
    montarAlternativas,
    marcarResultadoAlternativa,
    alternarListaMusicas,
    alternarBarra,
    alternarTelaCheia,
    mostrarAviso
  };
})();
