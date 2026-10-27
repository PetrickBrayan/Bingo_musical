const Jogo = (() => {
  const formatadorLista = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });
  const estadosComDica = ["tocando", "pausado", "respondendo"];

  let estado = "inicio";
  let indiceMusica = 0;
  let mesasBloqueadas = new Set();
  let mesaEmResposta = null;
  let numeroDigitado = "";
  let trechoAcabou = false;
  let dicaVisivel = false;
  let ajudaUsada = false;
  let textoResultado = "";
  let progressoSalvo = null;
  let proximaMusicaSalva = 0;

  function totalMusicas() {
    return MUSICAS.length;
  }

  function musicaAtual() {
    return MUSICAS[indiceMusica];
  }

  function ehUltimaMusica() {
    return indiceMusica === totalMusicas() - 1;
  }

  function ehRodadaDupla(indice) {
    return indice >= totalMusicas() - CONFIGURACAO.quantidadeRodadasDuplas;
  }

  function pontosDaMusica(indice) {
    return ehRodadaDupla(indice) ? CONFIGURACAO.pontosRodadaDupla : CONFIGURACAO.pontosPadrao;
  }

  function existeProgressoSalvo() {
    return Boolean(progressoSalvo)
      && Number.isInteger(progressoSalvo.proximaMusica)
      && progressoSalvo.proximaMusica > 0;
  }

  function salvarProgresso(proximaMusica) {
    proximaMusicaSalva = proximaMusica;
    progressoSalvo = {
      proximaMusica,
      quantidadeMesas: CONFIGURACAO.quantidadeMesas,
      placar: Placar.exportar()
    };
    Armazenamento.salvar(CONFIGURACAO.chaveProgresso, progressoSalvo);
  }

  function montarTextoDaDica(musica) {
    if (musica.dica) {
      return musica.dica;
    }
    const palavras = musica.titulo.split(" ").length;
    const inicial = musica.titulo.charAt(0).toUpperCase();
    const rotuloPalavras = palavras === 1 ? "palavra" : "palavras";
    return `${musica.decada} • título com ${palavras} ${rotuloPalavras} • começa com “${inicial}”`;
  }

  function calcularPontosPerdidos(mesa) {
    const perda = CONFIGURACAO.pontosPerdidosPorErro;
    if (CONFIGURACAO.permitirPontosNegativos) {
      return perda;
    }
    return Math.min(perda, Math.max(Placar.pontosDaMesa(mesa), 0));
  }

  function descreverCampeas() {
    const lideres = Placar.classificacao().filter((item) => item.posicao === 1);
    const pontos = lideres[0].pontos;

    if (pontos <= 0) {
      return "Nenhuma mesa pontuou";
    }
    if (lideres.length === 1) {
      return `Mesa ${lideres[0].mesa} é a campeã com ${pontos} pontos!`;
    }
    const numeros = formatadorLista.format(lideres.map((item) => String(item.mesa)));
    return `Empate entre as mesas ${numeros} com ${pontos} pontos!`;
  }

  const apresentacoes = {
    inicio() {
      const retomando = existeProgressoSalvo();
      const concluido = retomando && progressoSalvo.proximaMusica >= totalMusicas();
      let resultado = "";

      if (concluido) {
        resultado = "Jogo anterior concluído. ESPAÇO mostra o resultado final.";
      } else if (retomando) {
        resultado = `Jogo salvo: parou na música ${progressoSalvo.proximaMusica + 1} de ${totalMusicas()}, com ${CONFIGURACAO.quantidadeMesas} mesas. ESPAÇO continua.`;
      }

      return {
        titulo: "Bingo Musical",
        subtitulo: "Anos Dourados",
        resultado,
        centroDisco: "♪"
      };
    },

    preparando() {
      const pontos = pontosDaMusica(indiceMusica);
      const valor = ehRodadaDupla(indiceMusica)
        ? `Rodada dupla: vale ${pontos} pontos!`
        : `Vale ${pontos} pontos`;
      const penalidade = CONFIGURACAO.pontosPerdidosPorErro > 0
        ? ` • quem errar perde ${CONFIGURACAO.pontosPerdidosPorErro}`
        : "";
      return {
        titulo: "Prepare-se!",
        subtitulo: valor + penalidade,
        centroDisco: "♪"
      };
    },

    tocando() {
      return {
        titulo: "Que música é essa?",
        subtitulo: "Levantem a plaquinha da mesa!"
      };
    },

    pausado() {
      if (trechoAcabou) {
        return {
          titulo: "O trecho acabou!",
          subtitulo: "Alguém sabe? Digite o número da mesa ou clique"
        };
      }
      return {
        titulo: "Quem levantou primeiro?",
        subtitulo: "Digite o número da mesa e ENTER, ou clique"
      };
    },

    respondendo() {
      return {
        titulo: `Mesa ${mesaEmResposta}`,
        subtitulo: "Qual é a música?"
      };
    },

    revelado() {
      const musica = musicaAtual();
      return {
        titulo: musica.titulo,
        subtitulo: `${musica.interprete} • ${musica.decada}`,
        resultado: textoResultado,
        centroDisco: "♪"
      };
    },

    encerrado() {
      return {
        titulo: "Resultado final",
        subtitulo: descreverCampeas(),
        centroDisco: "♪"
      };
    }
  };

  function renderizar() {
    const emPartida = estado !== "inicio" && estado !== "encerrado";
    const comDica = estadosComDica.includes(estado);
    const apresentacao = apresentacoes[estado]();

    Tela.definirEstado(estado);
    Tela.definirCabecalho(
      emPartida ? musicaAtual().categoria : "",
      emPartida ? `Música ${indiceMusica + 1} de ${totalMusicas()}` : ""
    );
    Tela.definirTextos(apresentacao.titulo, apresentacao.subtitulo, apresentacao.resultado);
    Tela.definirTextoDica(comDica && dicaVisivel ? montarTextoDaDica(musicaAtual()) : "");
    Tela.atualizarBarra({
      mostrarDica: comDica,
      dicaAtiva: dicaVisivel,
      mostrarAjuda: estado === "tocando" || estado === "pausado",
      ajudaDisponivel: !ajudaUsada,
      mostrarParar: emPartida
    });
    Tela.mostrarAjusteMesas(estado === "inicio" && !existeProgressoSalvo(), CONFIGURACAO.quantidadeMesas);

    if (apresentacao.centroDisco !== undefined) {
      Tela.definirCentroDisco(apresentacao.centroDisco);
    }
    if (estado === "pausado") {
      Tela.atualizarGradeMesas(mesasBloqueadas, numeroDigitado);
    }
    if (estado === "encerrado") {
      Tela.mostrarPodio(Placar.classificacao());
    }
  }

  function prepararMusica(indice) {
    indiceMusica = indice;
    estado = "preparando";
    mesasBloqueadas = new Set();
    mesaEmResposta = null;
    numeroDigitado = "";
    trechoAcabou = false;
    dicaVisivel = false;
    ajudaUsada = false;
    textoResultado = "";

    ReprodutorTrecho.carregar(musicaAtual());
    ReprodutorTrecho.precarregar(MUSICAS[indice + 1]);
    Tela.definirProgressoAnel(1);
    salvarProgresso(indice);
    renderizar();
  }

  function encerrar() {
    estado = "encerrado";
    dicaVisivel = false;
    ReprodutorTrecho.parar();
    salvarProgresso(totalMusicas());
    renderizar();
  }

  function comecarJogo() {
    if (!existeProgressoSalvo()) {
      Placar.reiniciar();
      prepararMusica(0);
      return;
    }

    Placar.importar(progressoSalvo.placar);
    if (progressoSalvo.proximaMusica >= totalMusicas()) {
      encerrar();
      return;
    }
    prepararMusica(progressoSalvo.proximaMusica);
  }

  function novoJogo() {
    if (estado !== "inicio" && estado !== "encerrado") {
      Tela.mostrarAviso("Novo jogo só pode começar na abertura ou no final");
      return;
    }
    Armazenamento.limpar(CONFIGURACAO.chaveProgresso);
    progressoSalvo = null;
    proximaMusicaSalva = 0;
    Placar.reiniciar();
    estado = "inicio";
    Tela.definirProgressoAnel(1);
    renderizar();
    Tela.mostrarAviso("Novo jogo: progresso anterior apagado");
  }

  function alterarQuantidadeMesas(variacao) {
    if (estado !== "inicio" || existeProgressoSalvo()) {
      return;
    }
    Ajustes.definirQuantidadeMesas(CONFIGURACAO.quantidadeMesas + variacao);
    Placar.reiniciar();
    Tela.montarGradeMesas(escolherMesa);
    renderizar();
  }

  function tocarTrecho() {
    estado = "tocando";
    trechoAcabou = false;
    renderizar();
    ReprodutorTrecho.tocar();
  }

  function pausarParaMesa() {
    ReprodutorTrecho.pausar();
    estado = "pausado";
    numeroDigitado = "";
    renderizar();
  }

  function retomarTrecho() {
    estado = "tocando";
    numeroDigitado = "";
    renderizar();
    ReprodutorTrecho.tocar();
  }

  function repetirTrecho() {
    trechoAcabou = false;
    ReprodutorTrecho.reiniciar();
    Tela.definirProgressoAnel(1);
    retomarTrecho();
  }

  function revelar(mesaVencedora) {
    mesaEmResposta = null;
    numeroDigitado = "";
    textoResultado = mesaVencedora
      ? `Mesa ${mesaVencedora} ganhou +${pontosDaMusica(indiceMusica)} pontos!`
      : "Ninguém acertou dessa vez!";
    estado = "revelado";
    Tela.definirProgressoAnel(1);
    ReprodutorTrecho.iniciarRevelacao();
    salvarProgresso(indiceMusica + 1);
    renderizar();
  }

  function escolherMesa(numero) {
    const mesaValida = Number.isInteger(numero) && numero >= 1 && numero <= CONFIGURACAO.quantidadeMesas;
    if (estado !== "pausado" || !mesaValida) {
      return;
    }

    numeroDigitado = "";
    if (mesasBloqueadas.has(numero)) {
      Tela.mostrarAviso(`Mesa ${numero} já errou nesta música`);
      renderizar();
      return;
    }

    mesaEmResposta = numero;
    estado = "respondendo";
    renderizar();
  }

  function confirmarMesaDigitada() {
    if (numeroDigitado) {
      escolherMesa(Number(numeroDigitado));
    } else if (trechoAcabou) {
      revelar(null);
    }
  }

  function confirmarAcerto() {
    if (estado !== "respondendo") {
      return;
    }
    const mesa = mesaEmResposta;
    Placar.adicionar(mesa, pontosDaMusica(indiceMusica), indiceMusica, "acerto");
    revelar(mesa);
  }

  function registrarErro() {
    if (estado !== "respondendo") {
      return;
    }

    const mesa = mesaEmResposta;
    const pontosPerdidos = calcularPontosPerdidos(mesa);

    if (pontosPerdidos > 0) {
      Placar.adicionar(mesa, -pontosPerdidos, indiceMusica, "erro");
      salvarProgresso(proximaMusicaSalva);
      Tela.mostrarAviso(`Mesa ${mesa} perdeu ${pontosPerdidos} pontos`);
    }

    mesasBloqueadas.add(mesa);
    mesaEmResposta = null;

    if (mesasBloqueadas.size >= CONFIGURACAO.quantidadeMesas) {
      revelar(null);
      return;
    }
    if (trechoAcabou) {
      estado = "pausado";
      numeroDigitado = "";
      renderizar();
      return;
    }
    retomarTrecho();
  }

  function irParaProximaMusica() {
    if (ehUltimaMusica()) {
      encerrar();
    } else {
      prepararMusica(indiceMusica + 1);
    }
  }

  function avancar() {
    switch (estado) {
      case "inicio": return comecarJogo();
      case "preparando": return tocarTrecho();
      case "tocando": return pausarParaMesa();
      case "pausado": return confirmarMesaDigitada();
      case "respondendo": return confirmarAcerto();
      case "revelado": return irParaProximaMusica();
    }
  }

  function voltar() {
    if (estado === "respondendo") {
      registrarErro();
      return;
    }
    if (estado !== "pausado") {
      return;
    }
    if (numeroDigitado) {
      numeroDigitado = "";
      renderizar();
    } else if (trechoAcabou) {
      repetirTrecho();
    } else {
      retomarTrecho();
    }
  }

  function digitar(digito) {
    if (estado === "tocando") {
      pausarParaMesa();
    }
    if (estado !== "pausado") {
      return;
    }

    let novoNumero = numeroDigitado + digito;
    if (novoNumero.length > 2 || Number(novoNumero) > CONFIGURACAO.quantidadeMesas) {
      novoNumero = digito;
    }
    if (Number(novoNumero) === 0 || Number(novoNumero) > CONFIGURACAO.quantidadeMesas) {
      return;
    }

    numeroDigitado = novoNumero;
    renderizar();
  }

  function apagarDigito() {
    if (estado === "pausado" && numeroDigitado) {
      numeroDigitado = numeroDigitado.slice(0, -1);
      renderizar();
    }
  }

  function alternarDica() {
    if (!estadosComDica.includes(estado)) {
      return;
    }
    dicaVisivel = !dicaVisivel;
    renderizar();
  }

  function pedirAjuda() {
    if (estado !== "tocando" && estado !== "pausado") {
      return;
    }
    if (ajudaUsada) {
      Tela.mostrarAviso("A ajuda já foi usada nesta música");
      return;
    }
    if (!ReprodutorTrecho.adicionarSegundos(CONFIGURACAO.segundosDeAjuda)) {
      Tela.mostrarAviso("Este trecho não tem mais áudio. Use um arquivo mais longo.");
      return;
    }

    ajudaUsada = true;
    Tela.mostrarAviso(`+${CONFIGURACAO.segundosDeAjuda} segundos de música`);

    if (estado === "pausado" && trechoAcabou) {
      trechoAcabou = false;
      retomarTrecho();
      return;
    }
    renderizar();
  }

  function revelarResposta() {
    if (estado === "tocando" || estado === "pausado") {
      revelar(null);
    }
  }

  function repetir() {
    if (estado === "tocando" || estado === "pausado") {
      repetirTrecho();
    } else if (estado === "revelado") {
      ReprodutorTrecho.repetirNaRevelacao();
    }
  }

  function alternarSom() {
    if (estado === "revelado") {
      ReprodutorTrecho.alternarSom();
    }
  }

  function pedirEncerramento() {
    if (estado === "inicio" || estado === "encerrado") {
      return;
    }
    Tela.abrirConfirmacao();
  }

  function confirmarEncerramento() {
    Tela.fecharSobreposicoes();
    if (estado !== "inicio" && estado !== "encerrado") {
      encerrar();
    }
  }

  function descreverDesfeita(desfeita) {
    if (desfeita.pontos < 0) {
      return `Desfeito: mesa ${desfeita.mesa} recupera ${-desfeita.pontos} pontos`;
    }
    return `Desfeito: mesa ${desfeita.mesa} perde ${desfeita.pontos} pontos`;
  }

  function desfazerPontuacao() {
    const desfeita = Placar.desfazerUltimo();
    if (!desfeita) {
      Tela.mostrarAviso("Não há pontuação para desfazer");
      return;
    }

    salvarProgresso(proximaMusicaSalva);
    Tela.mostrarAviso(descreverDesfeita(desfeita));

    const ehDestaMusica = desfeita.indiceMusica === indiceMusica;
    if (desfeita.tipo === "erro" && ehDestaMusica) {
      mesasBloqueadas.delete(desfeita.mesa);
    }
    if (desfeita.tipo === "acerto" && ehDestaMusica && estado === "revelado") {
      textoResultado = `Pontuação da mesa ${desfeita.mesa} desfeita`;
    }
    renderizar();
  }

  function alternarPlacar() {
    Tela.alternarPlacar(Placar.classificacao());
  }

  function aoReceberTempo(segundosRestantes, limiteSegundos) {
    if (estado === "tocando") {
      Tela.atualizarCronometro(segundosRestantes, limiteSegundos);
    }
  }

  function aoTerminarTrecho() {
    if (estado !== "tocando") {
      return;
    }
    trechoAcabou = true;
    estado = "pausado";
    numeroDigitado = "";
    Tela.definirCentroDisco("0");
    Tela.definirProgressoAnel(0);
    renderizar();
  }

  function aoFalharAudio(arquivo) {
    Tela.mostrarAviso(`Áudio não encontrado (${arquivo}). Seguindo só com o cronômetro.`);
  }

  function aoBloquearNavegador() {
    estado = "preparando";
    renderizar();
    Tela.mostrarAviso("O navegador bloqueou o som. Pressione ESPAÇO novamente.");
  }

  function iniciarAplicacao() {
    Ajustes.carregar();
    progressoSalvo = Armazenamento.carregar(CONFIGURACAO.chaveProgresso);
    proximaMusicaSalva = existeProgressoSalvo() ? progressoSalvo.proximaMusica : 0;

    if (existeProgressoSalvo() && progressoSalvo.quantidadeMesas) {
      Ajustes.aplicarQuantidadeMesas(progressoSalvo.quantidadeMesas);
    }
    Placar.reiniciar();

    ReprodutorTrecho.definirOuvintes({
      aoTempo: aoReceberTempo,
      aoFimDoTrecho: aoTerminarTrecho,
      aoFalhaAudio: aoFalharAudio,
      aoBloqueioDoNavegador: aoBloquearNavegador
    });

    Tela.montarGradeMesas(escolherMesa);
    Tela.definirLegendaErro(CONFIGURACAO.pontosPerdidosPorErro);
    Tela.ligarControles({
      aoAcertar: confirmarAcerto,
      aoErrar: registrarErro,
      aoAlternarDica: alternarDica,
      aoPedirAjuda: pedirAjuda,
      aoAbrirPlacar: alternarPlacar,
      aoPedirEncerramento: pedirEncerramento,
      aoAbrirComandos: () => Tela.alternarAjuda(),
      aoDiminuirMesas: () => alterarQuantidadeMesas(-1),
      aoAumentarMesas: () => alterarQuantidadeMesas(1),
      aoConfirmarEncerramento: confirmarEncerramento,
      aoContinuarJogando: () => Tela.fecharSobreposicoes()
    });
    renderizar();
  }

  return {
    iniciarAplicacao,
    avancar,
    voltar,
    digitar,
    apagarDigito,
    alterarQuantidadeMesas,
    alternarDica,
    pedirAjuda,
    revelarResposta,
    repetir,
    alternarSom,
    pedirEncerramento,
    confirmarEncerramento,
    desfazerPontuacao,
    alternarPlacar,
    novoJogo
  };
})();
