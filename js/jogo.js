const Jogo = (() => {
  const formatadorLista = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

  let estado = "inicio";
  let indiceMusica = 0;
  let mesasBloqueadas = new Set();
  let mesaEmResposta = null;
  let numeroDigitado = "";
  let trechoAcabou = false;
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
    progressoSalvo = { proximaMusica, placar: Placar.exportar() };
    Armazenamento.salvar(progressoSalvo);
  }

  function descreverCampeas() {
    const lideres = Placar.classificacao().filter((item) => item.posicao === 1);
    const pontos = lideres[0].pontos;

    if (pontos === 0) {
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
        resultado = `Jogo salvo: parou na música ${progressoSalvo.proximaMusica + 1} de ${totalMusicas()}. ESPAÇO continua.`;
      }

      return {
        titulo: "Bingo Musical",
        subtitulo: "Anos Dourados",
        resultado,
        dica: retomando ? "ESPAÇO continua • N novo jogo • H comandos" : "ESPAÇO começa • H comandos",
        centroDisco: "♪"
      };
    },

    preparando() {
      const pontos = pontosDaMusica(indiceMusica);
      return {
        titulo: `Música ${indiceMusica + 1} de ${totalMusicas()}`,
        subtitulo: ehRodadaDupla(indiceMusica) ? `Rodada dupla: vale ${pontos} pontos!` : `Vale ${pontos} pontos`,
        dica: "ESPAÇO toca o trecho • P placar • H comandos",
        centroDisco: "♪"
      };
    },

    tocando() {
      return {
        titulo: "Que música é essa?",
        subtitulo: "Levantem a plaquinha da mesa!",
        dica: "ESPAÇO ou número da mesa: alguém levantou • V revela a resposta"
      };
    },

    pausado() {
      if (trechoAcabou) {
        return {
          titulo: "O trecho acabou!",
          subtitulo: "Alguém sabe? Digite o número da mesa ou clique",
          dica: "R repete o trecho • ESPAÇO revela a resposta • número + ENTER escolhe a mesa"
        };
      }
      return {
        titulo: "Quem levantou primeiro?",
        subtitulo: "Digite o número da mesa e ENTER, ou clique",
        dica: "Número + ENTER escolhe a mesa • ESC retoma a música • V revela a resposta"
      };
    },

    respondendo() {
      return {
        titulo: `Mesa ${mesaEmResposta}`,
        subtitulo: "Qual é a música?",
        dica: "ENTER acertou • ESC errou • U desfaz a última pontuação"
      };
    },

    revelado() {
      const musica = musicaAtual();
      return {
        titulo: musica.titulo,
        subtitulo: `${musica.interprete} • ${musica.decada}`,
        resultado: textoResultado,
        dica: ehUltimaMusica()
          ? "ESPAÇO mostra o resultado final • R toca de novo • M pausa o som • U desfaz pontuação"
          : "ESPAÇO próxima música • R toca de novo • M pausa o som • P placar",
        centroDisco: "♪"
      };
    },

    encerrado() {
      return {
        titulo: "Fim do Bingo Musical!",
        subtitulo: descreverCampeas(),
        dica: "P placar completo • N novo jogo",
        centroDisco: "♪"
      };
    }
  };

  function renderizar() {
    const emPartida = estado !== "inicio" && estado !== "encerrado";
    const apresentacao = apresentacoes[estado]();

    Tela.definirEstado(estado);
    Tela.definirCabecalho(
      emPartida ? musicaAtual().categoria : "",
      emPartida ? `Música ${indiceMusica + 1} de ${totalMusicas()}` : ""
    );
    Tela.definirTextos(apresentacao.titulo, apresentacao.subtitulo, apresentacao.resultado);
    Tela.definirDica(apresentacao.dica);

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
    textoResultado = "";

    ReprodutorTrecho.carregar(musicaAtual());
    ReprodutorTrecho.precarregar(MUSICAS[indice + 1]);
    Tela.definirProgressoAnel(1);
    salvarProgresso(indice);
    renderizar();
  }

  function encerrar() {
    estado = "encerrado";
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
    Armazenamento.limpar();
    progressoSalvo = null;
    proximaMusicaSalva = 0;
    Placar.reiniciar();
    estado = "inicio";
    Tela.definirProgressoAnel(1);
    renderizar();
    Tela.mostrarAviso("Novo jogo: progresso anterior apagado");
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
    const mesa = mesaEmResposta;
    Placar.adicionar(mesa, pontosDaMusica(indiceMusica), indiceMusica);
    revelar(mesa);
  }

  function registrarErro() {
    mesasBloqueadas.add(mesaEmResposta);
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
    if (Number(novoNumero) === 0) {
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

  function desfazerPontuacao() {
    const desfeita = Placar.desfazerUltimo();
    if (!desfeita) {
      Tela.mostrarAviso("Não há pontuação para desfazer");
      return;
    }

    salvarProgresso(proximaMusicaSalva);
    Tela.mostrarAviso(`Desfeito: mesa ${desfeita.mesa} perde ${desfeita.pontos} pontos`);

    if (estado === "revelado" && desfeita.indiceMusica === indiceMusica) {
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
    progressoSalvo = Armazenamento.carregar();
    proximaMusicaSalva = existeProgressoSalvo() ? progressoSalvo.proximaMusica : 0;

    ReprodutorTrecho.definirOuvintes({
      aoTempo: aoReceberTempo,
      aoFimDoTrecho: aoTerminarTrecho,
      aoFalhaAudio: aoFalharAudio,
      aoBloqueioDoNavegador: aoBloquearNavegador
    });

    Tela.montarGradeMesas(escolherMesa);
    Tela.ligarBotoesResposta(confirmarAcerto, registrarErro);
    renderizar();
  }

  return {
    iniciarAplicacao,
    avancar,
    voltar,
    digitar,
    apagarDigito,
    revelarResposta,
    repetir,
    alternarSom,
    desfazerPontuacao,
    alternarPlacar,
    novoJogo
  };
})();
