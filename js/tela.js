const Tela = (() => {
  const corpo = document.body;
  const pegar = (identificador) => document.getElementById(identificador);

  const rotuloRodada = pegar("rotuloRodada");
  const rotuloValor = pegar("rotuloValor");
  const rotuloProgresso = pegar("rotuloProgresso");
  const barraProgresso = pegar("barraProgresso");
  const titulo = pegar("titulo");
  const subtitulo = pegar("subtitulo");
  const textoDica = pegar("textoDica");
  const centroDisco = pegar("centroDisco");
  const anelProgresso = pegar("anelProgresso");
  const areaAjusteMesas = pegar("areaAjusteMesas");
  const quantidadeMesas = pegar("quantidadeMesas");
  const botaoMenosMesas = pegar("botaoMenosMesas");
  const botaoMaisMesas = pegar("botaoMaisMesas");
  const areaModoResposta = pegar("areaModoResposta");
  const botaoModoResposta = pegar("botaoModoResposta");
  const areaAtalhosInicio = pegar("areaAtalhosInicio");
  const botaoAbrirGuia = pegar("botaoAbrirGuia");
  const botaoAbrirLista = pegar("botaoAbrirLista");
  const mesaDigitada = pegar("mesaDigitada");
  const gradeMesas = pegar("gradeMesas");
  const areaAlternativas = pegar("areaAlternativas");
  const botaoMicrofone = pegar("botaoMicrofone");
  const rotuloMicrofone = pegar("rotuloMicrofone");
  const legendaMicrofone = pegar("legendaMicrofone");
  const botaoAcertou = pegar("botaoAcertou");
  const botaoErrou = pegar("botaoErrou");
  const rotuloAcertou = pegar("rotuloAcertou");
  const rotuloErrou = pegar("rotuloErrou");
  const legendaAcertou = pegar("legendaAcertou");
  const legendaErrou = pegar("legendaErrou");
  const faixaResultado = pegar("faixaResultado");
  const iconeResultado = pegar("iconeResultado");
  const tituloResultado = pegar("tituloResultado");
  const detalheResultado = pegar("detalheResultado");
  const comentarioResultado = pegar("comentarioResultado");
  const podio = pegar("podio");
  const botaoDica = pegar("botaoDica");
  const botaoAjuda = pegar("botaoAjuda");
  const botaoMusicas = pegar("botaoMusicas");
  const botaoPlacar = pegar("botaoPlacar");
  const botaoGuia = pegar("botaoGuia");
  const botaoParar = pegar("botaoParar");
  const botaoComandos = pegar("botaoComandos");
  const botaoVoltar = pegar("botaoVoltar");
  const botaoPrincipal = pegar("botaoPrincipal");
  const botaoMenu = pegar("botaoMenu");
  const placar = pegar("placar");
  const listaPlacar = pegar("listaPlacar");
  const listaDeMusicas = pegar("listaDeMusicas");
  const corpoTabelaMusicas = pegar("corpoTabelaMusicas");
  const botaoImprimirLista = pegar("botaoImprimirLista");
  const guia = pegar("guia");
  const paginasGuia = Array.prototype.slice.call(document.querySelectorAll(".pagina-guia"));
  const pontosGuia = pegar("pontosGuia");
  const botaoGuiaAnterior = pegar("botaoGuiaAnterior");
  const botaoGuiaProximo = pegar("botaoGuiaProximo");
  const painelBoasVindas = pegar("painelBoasVindas");
  const botaoBoasVindasGuia = pegar("botaoBoasVindasGuia");
  const botaoBoasVindasComandos = pegar("botaoBoasVindasComandos");
  const botaoPularParaJogo = pegar("botaoPularParaJogo");
  const areaAcoesInicio = pegar("areaAcoesInicio");
  const botaoContinuar = pegar("botaoContinuar");
  const botaoComecar = pegar("botaoComecar");
  const botaoVoltarGeral = pegar("botaoVoltarGeral");
  const botaoTelaCheia = pegar("botaoTelaCheia");
  const rotuloTelaCheia = pegar("rotuloTelaCheia");
  const escolhaDispositivo = pegar("escolhaDispositivo");
  const detalheDispositivo = pegar("detalheDispositivo");
  const menuAcoes = pegar("menuAcoes");
  const listaMenu = pegar("listaMenu");
  const ajuda = pegar("ajuda");
  const confirmacao = pegar("confirmacao");
  const botaoConfirmarParada = pegar("botaoConfirmarParada");
  const botaoContinuarJogando = pegar("botaoContinuarJogando");
  const aviso = pegar("aviso");

  const sobreposicoes = [placar, listaDeMusicas, guia, menuAcoes, ajuda, confirmacao];
  const sobreposicoesComBotaoFechar = [placar, listaDeMusicas, guia, ajuda];

  let botoesMesas = [];
  let temporizadorAviso = null;
  let paginaDoGuia = 0;
  let itensDoMenu = [];
  let indiceDoMenu = 0;
  let selecaoBoasVindas = 2;
  let dispositivoSelecionado = 0;
  let detalheDoDispositivoAberto = false;

  const botoesBoasVindas = [botaoBoasVindasGuia, botaoBoasVindasComandos, botaoPularParaJogo];
  const cartoesDispositivo = Array.prototype.slice.call(ajuda.querySelectorAll(".cartao-dispositivo"));
  const paineisDispositivo = Array.prototype.slice.call(ajuda.querySelectorAll(".painel-dispositivo"));

  function criarElemento(etiqueta, classe, texto) {
    const elemento = document.createElement(etiqueta);
    if (classe) {
      elemento.className = classe;
    }
    elemento.textContent = texto;
    return elemento;
  }

  function limpar(elemento) {
    while (elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }
  }

  function acrescentar(pai, filhos) {
    filhos.forEach((filho) => pai.appendChild(filho));
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
    limpar(gradeMesas);
    acrescentar(gradeMesas, botoesMesas);
  }

  function criarBotoesFechar() {
    sobreposicoesComBotaoFechar.forEach((sobreposicao) => {
      const botao = criarElemento("button", "botao-controle botao-fechar", "← Voltar");
      botao.type = "button";
      evitarFocoPeloMouse(botao);
      botao.addEventListener("click", voltarDaSobreposicao);
      sobreposicao.appendChild(botao);
    });
  }

  function montarPontosDoGuia() {
    limpar(pontosGuia);
    paginasGuia.forEach(() => pontosGuia.appendChild(criarElemento("span", "ponto-guia", "")));
  }

  function ligarControles(acoes) {
    const ligacoes = [
      [botaoAcertou, acoes.aoAcertar],
      [botaoErrou, acoes.aoErrar],
      [botaoMicrofone, acoes.aoCantar],
      [botaoDica, acoes.aoAlternarDica],
      [botaoAjuda, acoes.aoPedirAjuda],
      [botaoPlacar, acoes.aoAbrirPlacar],
      [botaoGuia, acoes.aoAbrirGuia],
      [botaoAbrirGuia, acoes.aoAbrirGuia],
      [botaoAbrirLista, acoes.aoAbrirListaMusicas],
      [botaoParar, acoes.aoPedirEncerramento],
      [botaoComandos, acoes.aoAbrirComandos],
      [botaoMusicas, acoes.aoAbrirListaMusicas],
      [botaoModoResposta, acoes.aoAlternarModoResposta],
      [botaoImprimirLista, acoes.aoImprimirLista],
      [botaoMenosMesas, acoes.aoDiminuirMesas],
      [botaoMaisMesas, acoes.aoAumentarMesas],
      [botaoConfirmarParada, acoes.aoConfirmarEncerramento],
      [botaoContinuarJogando, acoes.aoContinuarJogando],
      [botaoVoltar, acoes.aoVoltar],
      [botaoPrincipal, acoes.aoAvancar],
      [botaoMenu, acoes.aoAbrirMenu],
      [botaoBoasVindasGuia, acoes.aoAbrirGuia],
      [botaoBoasVindasComandos, acoes.aoAbrirComandos],
      [botaoPularParaJogo, acoes.aoPular],
      [botaoContinuar, acoes.aoContinuar],
      [botaoComecar, acoes.aoComecar],
      [botaoVoltarGeral, acoes.aoVoltar],
      [botaoTelaCheia, alternarTelaCheia],
      [botaoGuiaAnterior, guiaAnterior],
      [botaoGuiaProximo, guiaProxima]
    ];

    ligacoes.forEach((ligacao) => {
      evitarFocoPeloMouse(ligacao[0]);
      ligacao[0].addEventListener("click", ligacao[1]);
    });
    cartoesDispositivo.forEach((cartao, indice) => {
      evitarFocoPeloMouse(cartao);
      cartao.addEventListener("click", () => {
        dispositivoSelecionado = indice;
        detalheDoDispositivoAberto = true;
        mostrarEtapaDosComandos();
      });
    });
    criarBotoesFechar();
    montarPontosDoGuia();
    configurarTelaCheia();
  }

  function definirEstado(estado) {
    corpo.dataset.estado = estado;
  }

  function definirModoResposta(modo) {
    corpo.dataset.resposta = modo;
  }

  function definirCabecalho(categoria, progresso, fracaoConcluida) {
    rotuloRodada.textContent = categoria;
    rotuloRodada.hidden = !categoria;
    rotuloProgresso.textContent = progresso;
    corpo.dataset.categoria = categoria ? normalizarParaIdentificador(categoria) : "";
    barraProgresso.style.width = String(Math.round(fracaoConcluida * 100)) + "%";
  }

  function definirValor(texto, reduzido) {
    rotuloValor.textContent = texto;
    rotuloValor.hidden = !texto;
    rotuloValor.classList.toggle("reduzido", reduzido);
  }

  function definirTextos(textoTitulo, textoSubtitulo) {
    titulo.textContent = textoTitulo;
    subtitulo.textContent = textoSubtitulo;
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

  function definirBarraToque(situacao) {
    botaoPrincipal.textContent = situacao.principal;
    botaoPrincipal.disabled = !situacao.principalAtivo;
    botaoPrincipal.style.visibility = situacao.principal ? "visible" : "hidden";
    botaoVoltar.textContent = situacao.voltar;
    botaoVoltar.style.visibility = situacao.voltar ? "visible" : "hidden";
    botaoVoltarGeral.hidden = !situacao.voltar;
  }

  function mostrarBoasVindas(visivel) {
    painelBoasVindas.hidden = !visivel;
    marcarSelecaoBoasVindas();
  }

  function marcarSelecaoBoasVindas() {
    botoesBoasVindas.forEach((botao, indice) => {
      botao.classList.toggle("selecionado", indice === selecaoBoasVindas);
    });
  }

  function moverSelecaoBoasVindas(passo) {
    selecaoBoasVindas = (selecaoBoasVindas + passo + botoesBoasVindas.length) % botoesBoasVindas.length;
    marcarSelecaoBoasVindas();
  }

  function selecaoDasBoasVindas() {
    return selecaoBoasVindas;
  }

  function mostrarAcoesInicio(visivel, comProgressoSalvo) {
    areaAcoesInicio.hidden = !visivel;
    botaoContinuar.hidden = !comProgressoSalvo;
    botaoComecar.textContent = comProgressoSalvo ? "Começar do zero" : "Começar";
    botaoComecar.classList.toggle("botao-grande--principal", !comProgressoSalvo);
  }

  function telaCheiaAtiva() {
    return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  }

  function atualizarBotaoTelaCheia() {
    const ativa = telaCheiaAtiva();
    botaoTelaCheia.setAttribute("aria-pressed", String(ativa));
    rotuloTelaCheia.textContent = ativa ? "Sair da tela cheia" : "Tela cheia";
  }

  function configurarTelaCheia() {
    const elemento = document.documentElement;
    if (!elemento.requestFullscreen && !elemento.webkitRequestFullscreen) {
      botaoTelaCheia.hidden = true;
      return;
    }
    document.addEventListener("fullscreenchange", atualizarBotaoTelaCheia);
    document.addEventListener("webkitfullscreenchange", atualizarBotaoTelaCheia);
    atualizarBotaoTelaCheia();
  }

  function definirBarraAutomatica(automatica) {
    corpo.classList.toggle("barra-automatica", automatica);
    if (!automatica) {
      corpo.classList.remove("mouse-ativo");
    }
  }

  function mostrarAjusteMesas(visivel, quantidade) {
    areaAjusteMesas.hidden = !visivel;
    quantidadeMesas.textContent = String(quantidade);
    botaoMenosMesas.disabled = quantidade <= CONFIGURACAO.quantidadeMinimaMesas;
    botaoMaisMesas.disabled = quantidade >= CONFIGURACAO.quantidadeMaximaMesas;
  }

  function mostrarAjusteModo(visivel, rotulo) {
    areaModoResposta.hidden = !visivel;
    botaoModoResposta.textContent = rotulo;
  }

  function mostrarAtalhosInicio(visivel) {
    areaAtalhosInicio.hidden = !visivel;
  }

  function mostrarMicrofone(visivel, legenda) {
    botaoMicrofone.hidden = !visivel;
    legendaMicrofone.textContent = legenda;
  }

  function definirRotulosResposta(rotulos) {
    rotuloAcertou.textContent = rotulos.acertou;
    legendaAcertou.textContent = rotulos.legendaAcertou;
    rotuloErrou.textContent = rotulos.errou;
    legendaErrou.textContent = rotulos.legendaErrou;
  }

  function mostrarResultado(resultado) {
    if (!resultado) {
      faixaResultado.hidden = true;
      return;
    }
    faixaResultado.dataset.tipo = resultado.tipo;
    iconeResultado.textContent = resultado.icone;
    tituloResultado.textContent = resultado.titulo;
    detalheResultado.textContent = resultado.detalhe;
    comentarioResultado.textContent = resultado.comentario;
    faixaResultado.hidden = false;
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

  function atualizarGradeMesas(mesasBloqueadas, numeroDigitado, lideres) {
    mesaDigitada.textContent = numeroDigitado ? "Mesa " + numeroDigitado : " ";
    botoesMesas.forEach((botao, indice) => {
      const numero = indice + 1;
      botao.classList.toggle("bloqueada", mesasBloqueadas.has(numero));
      botao.classList.toggle("selecionada", String(numero) === numeroDigitado);
      botao.classList.toggle("lider", lideres.indexOf(numero) !== -1);
    });
  }

  function montarAlternativas(textos, aoEscolher) {
    limpar(areaAlternativas);
    textos.forEach((texto, indice) => {
      const botao = criarElemento("button", "alternativa", "");
      botao.type = "button";
      botao.appendChild(criarElemento("span", "alternativa__numero", String(indice + 1)));
      botao.appendChild(criarElemento("span", "alternativa__texto", texto));
      evitarFocoPeloMouse(botao);
      botao.addEventListener("click", () => aoEscolher(indice));
      areaAlternativas.appendChild(botao);
    });
  }

  function marcarResultadoAlternativa(indice, acertou) {
    Array.prototype.forEach.call(areaAlternativas.children, (botao, posicao) => {
      if (posicao === indice) {
        botao.classList.add(acertou ? "certa" : "errada");
      } else {
        botao.classList.add("apagada");
      }
    });
  }

  function mostrarPodio(classificacao) {
    const premiadas = classificacao.filter((item) => item.posicao <= 3 && item.pontos > 0);
    limpar(podio);
    premiadas.forEach((item) => {
      const linha = criarElemento("li", item.posicao === 1 ? "campea" : "", "");
      linha.appendChild(criarElemento("span", "podio__posicao", item.posicao + "º"));
      linha.appendChild(criarElemento("span", "podio__mesa", "Mesa " + item.mesa));
      linha.appendChild(criarElemento("span", "podio__pontos", item.pontos + " pts"));
      podio.appendChild(linha);
    });
  }

  function criarLinhaPlacar(item) {
    const linha = criarElemento("li", item.posicao === 1 && item.pontos > 0 ? "lider" : "", "");
    linha.appendChild(criarElemento("span", "lista-placar__posicao", item.pontos > 0 ? item.posicao + "º" : "–"));
    linha.appendChild(criarElemento("span", "lista-placar__mesa", "Mesa " + item.mesa));
    linha.appendChild(criarElemento("span", "lista-placar__pontos", String(item.pontos)));
    return linha;
  }

  function criarLinhaTabelaMusica(linha) {
    const linhaTabela = document.createElement("tr");
    if (linha.situacao === "atual") {
      linhaTabela.className = "atual";
    }
    [
      linha.numero,
      linha.titulo,
      linha.interprete,
      linha.categoria,
      linha.decada,
      linha.duracao + "s",
      linha.pontos,
      linha.rotuloSituacao
    ].forEach((valor) => linhaTabela.appendChild(criarElemento("td", "", String(valor))));
    return linhaTabela;
  }

  function sobreposicaoAberta() {
    return sobreposicoes.some((sobreposicao) => !sobreposicao.hidden);
  }

  function confirmacaoAberta() {
    return !confirmacao.hidden;
  }

  function menuAberto() {
    return !menuAcoes.hidden;
  }

  function guiaAberto() {
    return !guia.hidden;
  }

  function fecharSobreposicoes() {
    sobreposicoes.forEach((sobreposicao) => {
      sobreposicao.hidden = true;
    });
  }

  function alternarSobreposicao(sobreposicao, preparar) {
    const estavaAberta = !sobreposicao.hidden;
    fecharSobreposicoes();
    if (estavaAberta) {
      return;
    }
    if (preparar) {
      preparar();
    }
    sobreposicao.hidden = false;
  }

  function alternarPlacar(classificacao) {
    alternarSobreposicao(placar, () => {
      limpar(listaPlacar);
      acrescentar(listaPlacar, classificacao.map(criarLinhaPlacar));
    });
  }

  function alternarListaMusicas(linhas) {
    alternarSobreposicao(listaDeMusicas, () => {
      limpar(corpoTabelaMusicas);
      acrescentar(corpoTabelaMusicas, linhas.map(criarLinhaTabelaMusica));
    });
  }

  function mostrarEtapaDosComandos() {
    escolhaDispositivo.hidden = detalheDoDispositivoAberto;
    detalheDispositivo.hidden = !detalheDoDispositivoAberto;
    cartoesDispositivo.forEach((cartao, indice) => {
      cartao.classList.toggle("selecionado", indice === dispositivoSelecionado);
    });
    paineisDispositivo.forEach((painel, indice) => {
      painel.hidden = indice !== dispositivoSelecionado;
    });
  }

  function alternarAjuda() {
    alternarSobreposicao(ajuda, () => {
      detalheDoDispositivoAberto = false;
      dispositivoSelecionado = corpo.classList.contains("modo-toque") ? 2 : 0;
      mostrarEtapaDosComandos();
    });
  }

  function comandosAberto() {
    return !ajuda.hidden;
  }

  function moverDispositivo(passo) {
    if (detalheDoDispositivoAberto) {
      return;
    }
    dispositivoSelecionado = (dispositivoSelecionado + passo + cartoesDispositivo.length) % cartoesDispositivo.length;
    mostrarEtapaDosComandos();
  }

  function confirmarDispositivo() {
    detalheDoDispositivoAberto = !detalheDoDispositivoAberto;
    mostrarEtapaDosComandos();
  }

  function voltarComandos() {
    if (detalheDoDispositivoAberto) {
      detalheDoDispositivoAberto = false;
      mostrarEtapaDosComandos();
      return;
    }
    fecharSobreposicoes();
  }

  function voltarDaSobreposicao() {
    if (comandosAberto()) {
      voltarComandos();
    } else {
      fecharSobreposicoes();
    }
  }

  function abrirConfirmacao() {
    fecharSobreposicoes();
    confirmacao.hidden = false;
  }

  function mostrarPaginaDoGuia() {
    paginasGuia.forEach((pagina, indice) => {
      pagina.hidden = indice !== paginaDoGuia;
    });
    Array.prototype.forEach.call(pontosGuia.children, (ponto, indice) => {
      ponto.classList.toggle("ativo", indice === paginaDoGuia);
    });
    const ultima = paginaDoGuia === paginasGuia.length - 1;
    botaoGuiaProximo.textContent = ultima ? "Entendi!" : "Próxima";
    botaoGuiaAnterior.textContent = paginaDoGuia === 0 ? "Fechar" : "Anterior";
  }

  function alternarGuia() {
    alternarSobreposicao(guia, () => {
      paginaDoGuia = 0;
      mostrarPaginaDoGuia();
    });
  }

  function guiaProxima() {
    if (paginaDoGuia >= paginasGuia.length - 1) {
      fecharSobreposicoes();
      return;
    }
    paginaDoGuia += 1;
    mostrarPaginaDoGuia();
  }

  function guiaAnterior() {
    if (paginaDoGuia === 0) {
      fecharSobreposicoes();
      return;
    }
    paginaDoGuia -= 1;
    mostrarPaginaDoGuia();
  }

  function renderizarMenu() {
    limpar(listaMenu);
    itensDoMenu.forEach((item, indice) => {
      const classes = [];
      if (indice === indiceDoMenu) {
        classes.push("selecionado");
      }
      if (!item.ativo) {
        classes.push("desativado");
      }
      const linha = criarElemento("li", classes.join(" "), item.rotulo);
      linha.addEventListener("click", () => {
        indiceDoMenu = indice;
        executarMenu();
      });
      listaMenu.appendChild(linha);
    });
    const selecionado = listaMenu.children[indiceDoMenu];
    if (selecionado && selecionado.scrollIntoView) {
      selecionado.scrollIntoView(false);
    }
  }

  function abrirMenu(itens) {
    fecharSobreposicoes();
    itensDoMenu = itens;
    indiceDoMenu = Math.max(itens.findIndex((item) => item.ativo), 0);
    renderizarMenu();
    menuAcoes.hidden = false;
  }

  function moverMenu(passo) {
    const total = itensDoMenu.length;
    for (let tentativa = 1; tentativa <= total; tentativa++) {
      const candidato = (indiceDoMenu + passo * tentativa + total * tentativa) % total;
      if (itensDoMenu[candidato].ativo) {
        indiceDoMenu = candidato;
        break;
      }
    }
    renderizarMenu();
  }

  function executarMenu() {
    const item = itensDoMenu[indiceDoMenu];
    if (!item || !item.ativo) {
      return;
    }
    fecharSobreposicoes();
    if (item.acao) {
      item.acao();
    }
  }

  function ativarModoToque() {
    corpo.classList.add("modo-toque");
  }

  function alternarTelaCheia() {
    const elemento = document.documentElement;
    const pedir = elemento.requestFullscreen || elemento.webkitRequestFullscreen;
    const sair = document.exitFullscreen || document.webkitExitFullscreen;
    const ativa = document.fullscreenElement || document.webkitFullscreenElement;

    if (ativa && sair) {
      sair.call(document);
    } else if (pedir) {
      const promessa = pedir.call(elemento);
      if (promessa && promessa.catch) {
        promessa.catch(() => {});
      }
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
    mostrarBoasVindas,
    moverSelecaoBoasVindas,
    selecaoDasBoasVindas,
    mostrarAcoesInicio,
    definirBarraAutomatica,
    comandosAberto,
    moverDispositivo,
    confirmarDispositivo,
    voltarComandos,
    definirEstado,
    definirModoResposta,
    definirCabecalho,
    definirValor,
    definirTextos,
    definirTextoDica,
    atualizarBarra,
    definirBarraToque,
    mostrarAjusteMesas,
    mostrarAjusteModo,
    mostrarAtalhosInicio,
    mostrarMicrofone,
    definirRotulosResposta,
    mostrarResultado,
    definirCentroDisco,
    definirProgressoAnel,
    atualizarCronometro,
    atualizarGradeMesas,
    montarAlternativas,
    marcarResultadoAlternativa,
    mostrarPodio,
    sobreposicaoAberta,
    confirmacaoAberta,
    menuAberto,
    guiaAberto,
    fecharSobreposicoes,
    alternarPlacar,
    alternarListaMusicas,
    alternarAjuda,
    alternarGuia,
    guiaProxima,
    guiaAnterior,
    abrirConfirmacao,
    abrirMenu,
    moverMenu,
    executarMenu,
    ativarModoToque,
    alternarTelaCheia,
    mostrarAviso
  };
})();
