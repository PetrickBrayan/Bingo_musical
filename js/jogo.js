const Jogo = (() => {
  const estadosComDica = ["tocando", "pausado", "respondendo"];

  let estado = "boasvindas";
  let indiceMusica = 0;
  let mesasBloqueadas = new Set();
  let mesaEmResposta = null;
  let numeroDigitado = "";
  let trechoAcabou = false;
  let dicaVisivel = false;
  let ajudaUsada = false;
  let resultado = null;
  let alternativas = [];
  let ocupado = false;
  let repeticoes = 0;
  let progressoSalvo = null;
  let proximaMusicaSalva = 0;
  let sequenciasPorMesa = {};
  let segundosDoMicrofone = 0;
  let temporizadorDoMicrofone = null;
  let temporizadorDoInterludio = null;
  let modoDesempate = false;
  let mesasDoDesempate = [];
  let desempateRealizado = false;
  let vencedorDoDesempate = false;
  let coringasUsados = new Set();
  let coringaAtivo = false;
  let ocorrenciaPendente = null;
  let alternativasCantor = [];
  let emTensao = false;
  let ultimoSegundoAvisado = null;

  function listaAtual() {
    return modoDesempate ? MUSICAS_DESEMPATE : MUSICAS;
  }

  function totalDaPartida() {
    return MUSICAS.length;
  }

  function totalMusicas() {
    return listaAtual().length;
  }

  function musicaAtual() {
    return listaAtual()[indiceMusica];
  }

  function especialDaMusica() {
    return modoDesempate ? "" : (musicaAtual().especial || "");
  }

  function ehUltimaMusica() {
    return indiceMusica === totalMusicas() - 1;
  }

  function emPartida() {
    return estado !== "boasvindas" && estado !== "inicio" && estado !== "encerrado";
  }

  function modoComJuiz() {
    return CONFIGURACAO.modoResposta === "juiz";
  }

  function pontosDaMusica(indice) {
    const musica = listaAtual()[indice];
    const base = musica.pontos || CONFIGURACAO.pontosPadrao;
    const dobrada = !modoDesempate && (musica.especial === "dobro" || musica.especial === "relampago");
    return dobrada ? base * CONFIGURACAO.multiplicadorEspecial : base;
  }

  function pontosDaMusicaDoCatalogo(indice) {
    const musica = MUSICAS[indice];
    const base = musica.pontos || CONFIGURACAO.pontosPadrao;
    const dobrada = musica.especial === "dobro" || musica.especial === "relampago";
    return dobrada ? base * CONFIGURACAO.multiplicadorEspecial : base;
  }

  function multiplicador() {
    return coringaAtivo ? CONFIGURACAO.multiplicadorCoringa : 1;
  }

  function coringaDisponivel(mesa) {
    return !modoDesempate && Boolean(mesa) && !coringasUsados.has(mesa);
  }

  function consumirCoringa(mesa) {
    if (coringaAtivo) {
      coringasUsados.add(mesa);
      coringaAtivo = false;
    }
  }

  function valeMaisQueOPadrao(indice) {
    return pontosDaMusica(indice) > CONFIGURACAO.pontosPadrao;
  }

  function custoDaAjuda() {
    return ajudaUsada && !modoDesempate ? CONFIGURACAO.pontosPerdidosPorAjuda : 0;
  }

  function valorAtual() {
    return Math.max(pontosDaMusica(indiceMusica) - custoDaAjuda(), 0);
  }

  function pontosDoMicrofone() {
    return Math.round(valorAtual() * CONFIGURACAO.fracaoPontosMicrofone);
  }

  function textoDoValor() {
    const base = pontosDaMusica(indiceMusica);
    if (!ajudaUsada) {
      return `Vale ${base} pts`;
    }
    return `Vale ${valorAtual()} pts · ajuda −${custoDaAjuda()}`;
  }

  function parteParaCantar() {
    return musicaAtual().parteParaCantar || CONFIGURACAO.parteParaCantarPadrao;
  }

  function existeProgressoSalvo() {
    return Boolean(progressoSalvo)
      && Number.isInteger(progressoSalvo.proximaMusica)
      && progressoSalvo.proximaMusica > 0;
  }

  function salvarProgresso(proximaMusica) {
    const proximaReal = modoDesempate ? totalDaPartida() : proximaMusica;
    proximaMusicaSalva = proximaReal;
    progressoSalvo = {
      proximaMusica: proximaReal,
      quantidadeMesas: CONFIGURACAO.quantidadeMesas,
      placar: Placar.exportar(),
      coringasUsados: Array.from(coringasUsados),
      desempateRealizado
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
    if (modoDesempate) {
      return 0;
    }
    const perda = CONFIGURACAO.pontosPerdidosPorErro;
    if (CONFIGURACAO.permitirPontosNegativos) {
      return perda;
    }
    return Math.min(perda, Math.max(Placar.pontosDaMesa(mesa), 0));
  }

  function situacaoDaLideranca() {
    const classificacao = Placar.classificacao();
    return {
      lideres: classificacao.filter((item) => item.posicao === 1).map((item) => item.mesa),
      pontos: classificacao[0].pontos
    };
  }

  function lideresComPontos() {
    const situacao = situacaoDaLideranca();
    return situacao.pontos > 0 ? situacao.lideres : [];
  }

  function embaralhar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const sorteado = Math.floor(Math.random() * (i + 1));
      const guardado = copia[i];
      copia[i] = copia[sorteado];
      copia[sorteado] = guardado;
    }
    return copia;
  }

  function escolherTitulosErrados(musica) {
    const quantidadeNecessaria = CONFIGURACAO.quantidadeAlternativas - 1;
    const escolhidosPorVoce = musica.alternativasErradas || [];
    const outras = MUSICAS.filter((outra) => outra.titulo !== musica.titulo);
    const mesmaCategoria = outras.filter((outra) => outra.categoria === musica.categoria);
    const mesmaDecada = outras.filter((outra) => outra.decada === musica.decada && outra.categoria !== musica.categoria);
    const demais = outras.filter((outra) => outra.decada !== musica.decada && outra.categoria !== musica.categoria);

    const candidatos = escolhidosPorVoce
      .concat(embaralhar(mesmaCategoria).map((outra) => outra.titulo))
      .concat(embaralhar(mesmaDecada).map((outra) => outra.titulo))
      .concat(embaralhar(demais).map((outra) => outra.titulo));
    return Array.from(new Set(candidatos)).slice(0, quantidadeNecessaria);
  }

  function sortearCantores(musica) {
    const quantidadeNecessaria = CONFIGURACAO.quantidadeAlternativas - 1;
    const erradas = embaralhar(Array.from(new Set(
      MUSICAS.map((outra) => outra.interprete).filter((nome) => nome !== musica.interprete)
    ))).slice(0, quantidadeNecessaria);
    if (erradas.length < quantidadeNecessaria) {
      return [];
    }
    const corretas = [{ texto: musica.interprete, correta: true }];
    return embaralhar(corretas.concat(erradas.map((texto) => ({ texto, correta: false }))));
  }

  function sortearAlternativas(musica) {
    const corretas = [{ texto: musica.titulo, correta: true }];
    const erradas = escolherTitulosErrados(musica).map((texto) => ({ texto, correta: false }));
    return embaralhar(corretas.concat(erradas));
  }

  function descreverSituacao(indice) {
    if (emPartida() && indice === indiceMusica && estado !== "revelado") {
      return { situacao: "atual", rotulo: "Tocando agora" };
    }
    if (indice < proximaMusicaSalva) {
      return { situacao: "tocada", rotulo: "Já tocou" };
    }
    return { situacao: "pendente", rotulo: "Falta tocar" };
  }

  function limparTemporizadores() {
    clearInterval(temporizadorDoMicrofone);
    clearTimeout(temporizadorDoInterludio);
    temporizadorDoMicrofone = null;
    temporizadorDoInterludio = null;
  }

  function mensagemDoInicio() {
    if (!existeProgressoSalvo()) {
      return "";
    }
    if (progressoSalvo.proximaMusica >= totalDaPartida()) {
      return "Jogo anterior concluído. Continuar mostra o resultado final.";
    }
    return `Jogo salvo: parou na música ${progressoSalvo.proximaMusica + 1} de ${totalDaPartida()}, com ${CONFIGURACAO.quantidadeMesas} mesas.`;
  }

  const apresentacoes = {
    boasvindas() {
      return { titulo: "Bingo Musical", subtitulo: "Bem-vindos aos Anos Dourados!", centroDisco: "♪" };
    },

    inicio() {
      return { titulo: "Bingo Musical", subtitulo: "Anos Dourados", centroDisco: "♪" };
    },

    preparando() {
      const lideranca = situacaoDaLideranca();
      const frase = Narrador.preparo({
        indice: indiceMusica,
        ultima: ehUltimaMusica(),
        lideres: lideranca.lideres,
        pontos: lideranca.pontos
      });
      if (modoDesempate) {
        return { titulo: "Morte súbita!", subtitulo: Narrador.desempate(mesasDoDesempate).subtitulo, centroDisco: "♪" };
      }
      const penalidade = CONFIGURACAO.pontosPerdidosPorErro > 0
        ? ` Quem errar perde ${CONFIGURACAO.pontosPerdidosPorErro}.`
        : "";
      const titulosEspeciais = { dobro: "Vale o dobro!", relampago: "Música relâmpago!" };
      return {
        titulo: titulosEspeciais[especialDaMusica()] || (valeMaisQueOPadrao(indiceMusica) ? "Valendo mais!" : "Prepare-se!"),
        subtitulo: frase + penalidade,
        centroDisco: "♪"
      };
    },

    tocando() {
      return { titulo: "Que música é essa?", subtitulo: "Levantem a plaquinha da mesa!" };
    },

    pausado() {
      if (trechoAcabou) {
        return { titulo: "O trecho acabou!", subtitulo: "Alguém sabe? Digite ou toque no número da mesa" };
      }
      return { titulo: "Quem levantou primeiro?", subtitulo: "Digite ou toque no número da mesa" };
    },

    respondendo() {
      const base = modoComJuiz() ? "Qual é a música?" : "Qual é a música? Diga ou toque no número";
      return {
        titulo: Mesas.rotulo(mesaEmResposta),
        subtitulo: coringaAtivo ? `${base} • Coringa: vale o dobro` : base
      };
    },

    cantor() {
      return {
        titulo: "Agora o bônus!",
        subtitulo: `Quem canta essa música? Vale +${CONFIGURACAO.pontosBonusCantor * (ocorrenciaPendente && ocorrenciaPendente.coringa ? CONFIGURACAO.multiplicadorCoringa : 1)}`
      };
    },

    cantando() {
      return {
        titulo: `${Mesas.rotulo(mesaEmResposta)}, é com vocês!`,
        subtitulo: `Cantem ${parteParaCantar()}! A plateia decide.`
      };
    },

    errou() {
      return { titulo: "Segue o jogo!", subtitulo: "A música continua já já…" };
    },

    revelado() {
      const musica = musicaAtual();
      return { titulo: musica.titulo, subtitulo: `${musica.interprete} • ${musica.decada}`, centroDisco: "♪" };
    },

    encerrado() {
      const lideranca = situacaoDaLideranca();
      if (desempatePossivel()) {
        return {
          titulo: "Empate na ponta!",
          subtitulo: `${Narrador.maiuscula(Mesas.listar(lideranca.lideres))} com ${lideranca.pontos} pontos. Vamos desempatar?`,
          centroDisco: "★"
        };
      }
      const final = Narrador.final(lideranca.lideres, lideranca.pontos);
      return { titulo: final.titulo, subtitulo: final.subtitulo, centroDisco: "★" };
    }
  };

  function desempatePossivel() {
    return estado === "encerrado" && !desempateRealizado && lideresComPontos().length > 1;
  }

  function rotulosDaBarraDeToque() {
    const porEstado = {
      boasvindas: { principal: "", voltar: "", principalAtivo: false },
      inicio: { principal: existeProgressoSalvo() ? "Continuar" : "Começar", voltar: "Voltar", principalAtivo: true },
      preparando: { principal: "Tocar ▶", voltar: "Voltar", principalAtivo: true },
      tocando: { principal: "Alguém levantou!", voltar: "Voltar", principalAtivo: true },
      pausado: {
        principal: numeroDigitado ? `Confirmar mesa ${numeroDigitado}` : "Revelar resposta",
        voltar: trechoAcabou ? "Ouvir de novo" : "Voltar",
        principalAtivo: Boolean(numeroDigitado) || trechoAcabou
      },
      respondendo: modoComJuiz()
        ? { principal: "Acertou", voltar: "Errou", principalAtivo: true }
        : { principal: "Escolha uma resposta", voltar: "Voltar", principalAtivo: false },
      cantando: { principal: "Mandou bem!", voltar: "Voltar", principalAtivo: true },
      cantor: { principal: "Escolha o cantor", voltar: "Pular bônus", principalAtivo: false },
      errou: { principal: "Continuar", voltar: "Voltar", principalAtivo: true },
      revelado: {
        principal: ehUltimaMusica() ? "Ver resultado" : "Próxima música",
        voltar: "Voltar",
        principalAtivo: true
      },
      encerrado: { principal: desempatePossivel() ? "Desempate!" : "Novo jogo", voltar: "Voltar", principalAtivo: true }
    };
    return porEstado[estado];
  }

  function rotulosDaResposta() {
    if (estado === "cantando") {
      return {
        acertou: "Mandou bem!",
        legendaAcertou: `ENTER • +${pontosDoMicrofone()}`,
        errou: "Não rolou",
        legendaErrou: "X"
      };
    }
    const perda = CONFIGURACAO.pontosPerdidosPorErro;
    return {
      acertou: "Acertou",
      legendaAcertou: "ENTER",
      errou: modoComJuiz() ? "Errou" : "Desistir",
      legendaErrou: perda > 0 ? `X • perde ${perda}` : "X"
    };
  }

  function renderizar() {
    const comDica = estadosComDica.includes(estado);
    const apresentacao = apresentacoes[estado]();
    const concluidas = emPartida() && !modoDesempate ? indiceMusica : (estado === "encerrado" || modoDesempate ? totalDaPartida() : 0);
    const progressoTexto = modoDesempate ? `Desempate ${indiceMusica + 1} de ${totalMusicas()}` : `Música ${indiceMusica + 1} de ${totalMusicas()}`;
    const especial = especialDaMusica();
    const textoDeApoio = estado === "inicio" ? mensagemDoInicio() : "";
    const textoDaDica = comDica && dicaVisivel ? montarTextoDaDica(musicaAtual()) : textoDeApoio;

    Tela.definirEstado(estado);
    Tela.definirModoResposta(CONFIGURACAO.modoResposta);
    Tela.definirCabecalho(
      emPartida() ? musicaAtual().categoria : "",
      emPartida() ? progressoTexto : "",
      concluidas / totalDaPartida(),
      emPartida() ? musicaAtual().decada : ""
    );
    Tela.definirEspecial(emPartida() && especial ? especial : "");
    Tela.definirCorDaMesa(mesaEmResposta ? Mesas.cor(mesaEmResposta) : "");
    Tela.definirTensao(estado === "tocando" && emTensao);
    Tela.definirValor(emPartida() ? textoDoValor() : "", ajudaUsada);
    Tela.definirTextos(apresentacao.titulo, apresentacao.subtitulo);
    Tela.definirTextoDica(textoDaDica);
    Tela.atualizarBarra({
      mostrarDica: comDica,
      dicaAtiva: dicaVisivel,
      mostrarAjuda: estado === "tocando" || estado === "pausado",
      ajudaDisponivel: !ajudaUsada,
      mostrarParar: emPartida()
    });
    Tela.definirBarraToque(rotulosDaBarraDeToque());
    Tela.mostrarAjusteMesas(estado === "inicio" && !existeProgressoSalvo(), CONFIGURACAO.quantidadeMesas);
    Tela.mostrarAjusteModo(estado === "inicio", CONFIGURACAO.rotulosModoResposta[CONFIGURACAO.modoResposta]);
    Tela.mostrarAtalhosInicio(estado === "inicio");
    Tela.mostrarBoasVindas(estado === "boasvindas");
    Tela.mostrarAcoesInicio(estado === "inicio", existeProgressoSalvo());
    Tela.mostrarMicrofone(estado === "respondendo", modoComJuiz() ? "C" : `${alternativas.length + 1} ou C`);
    Tela.mostrarCoringa(estado === "respondendo" && coringaDisponivel(mesaEmResposta), coringaAtivo, CONFIGURACAO.multiplicadorCoringa);
    Tela.mostrarMiniPlacar(CONFIGURACAO.placarNoCanto && emPartida() ? placarDoCanto() : []);
    Tela.definirRotulosResposta(rotulosDaResposta());
    Tela.mostrarResultado(estado === "revelado" || estado === "errou" ? resultado : null);

    if (apresentacao.centroDisco !== undefined) {
      Tela.definirCentroDisco(apresentacao.centroDisco);
    }
    if (estado === "pausado") {
      Tela.atualizarGradeMesas(mesasBloqueadas, numeroDigitado, lideresComPontos());
    }
    if (estado === "encerrado") {
      Tela.mostrarPodio(Placar.classificacao());
      Tela.mostrarTrofeus(Trofeus.calcular(Placar.exportar().historico, CONFIGURACAO.quantidadeMesas));
    } else {
      Tela.mostrarPodio([]);
      Tela.mostrarTrofeus([]);
    }
    Tela.mostrarAreaFinal({
      visivel: estado === "encerrado",
      desempate: desempatePossivel(),
      certificado: lideresComPontos().length > 0 && !desempatePossivel()
    });
  }

  function placarDoCanto() {
    return Placar.classificacao()
      .filter((item) => item.posicao <= 3 && item.pontos > 0)
      .slice(0, 3);
  }

  function prepararMusica(indice) {
    limparTemporizadores();
    indiceMusica = indice;
    estado = "preparando";
    mesasBloqueadas = new Set();
    mesaEmResposta = null;
    numeroDigitado = "";
    trechoAcabou = false;
    dicaVisivel = false;
    ajudaUsada = false;
    coringaAtivo = false;
    ocorrenciaPendente = null;
    emTensao = false;
    repeticoes = 0;
    ocupado = false;
    resultado = null;
    alternativas = sortearAlternativas(musicaAtual());

    if (modoDesempate) {
      for (let mesa = 1; mesa <= CONFIGURACAO.quantidadeMesas; mesa++) {
        if (mesasDoDesempate.indexOf(mesa) === -1) {
          mesasBloqueadas.add(mesa);
        }
      }
    }

    const musica = musicaAtual();
    const duracaoRelampago = Math.min(musica.duracaoSegundos || CONFIGURACAO.duracaoPadraoTrechoSegundos, CONFIGURACAO.duracaoRelampagoSegundos);
    ReprodutorTrecho.carregar(especialDaMusica() === "relampago" ? Object.assign({}, musica, { duracaoSegundos: duracaoRelampago }) : musica);
    ReprodutorTrecho.precarregar(listaAtual()[indice + 1]);
    Tela.definirProgressoAnel(1);
    salvarProgresso(indice);
    renderizar();
    Tela.animarEntrada();
    anunciarEspecial();
  }

  function anunciarEspecial() {
    if (modoDesempate) {
      Tela.anunciarEspecial("Morte súbita!", Narrador.desempate(mesasDoDesempate).subtitulo, "dobro");
    } else if (especialDaMusica() === "dobro") {
      Tela.anunciarEspecial("Vale o dobro!", `Esta música vale ${pontosDaMusica(indiceMusica)} pontos`, "dobro");
    } else if (especialDaMusica() === "relampago") {
      Tela.anunciarEspecial("Relâmpago!", `Trecho curtinho e vale ${pontosDaMusica(indiceMusica)} pontos`, "relampago");
    }
  }

  function encerrar() {
    limparTemporizadores();
    estado = "encerrado";
    dicaVisivel = false;
    resultado = null;
    ReprodutorTrecho.parar();
    modoDesempate = false;
    salvarProgresso(totalDaPartida());
    Tela.definirProgressoAnel(1);
    renderizar();

    if (lideresComPontos().length > 0 && !desempatePossivel()) {
      Efeitos.vitoria();
      Confete.disparar(260);
    }
  }

  function comecarDoZero() {
    if (existeProgressoSalvo()) {
      Armazenamento.limpar(CONFIGURACAO.chaveProgresso);
      progressoSalvo = null;
      proximaMusicaSalva = 0;
      reiniciarRegrasDoJogo();
      renderizar();
      Tela.mostrarAviso("Progresso apagado. Ajuste as mesas e toque em Começar.");
      return;
    }
    Efeitos.preparar();
    reiniciarRegrasDoJogo();
    prepararMusica(0);
  }

  function reiniciarRegrasDoJogo() {
    Placar.reiniciar();
    sequenciasPorMesa = {};
    coringasUsados = new Set();
    coringaAtivo = false;
    modoDesempate = false;
    desempateRealizado = false;
    vencedorDoDesempate = false;
  }

  function pularParaJogo() {
    if (estado === "boasvindas") {
      estado = "inicio";
      renderizar();
    }
  }

  function moverBoasVindas(passo) {
    if (estado === "boasvindas") {
      Tela.moverSelecaoBoasVindas(passo);
    }
  }

  function acionarBoasVindas() {
    const selecao = Tela.selecaoDasBoasVindas();
    if (selecao === 0) {
      alternarGuia();
    } else if (selecao === 1) {
      Tela.alternarAjuda();
    } else {
      pularParaJogo();
    }
  }

  function comecarJogo() {
    Efeitos.preparar();
    Placar.importar(progressoSalvo.placar);
    coringasUsados = new Set(Array.isArray(progressoSalvo.coringasUsados) ? progressoSalvo.coringasUsados : []);
    desempateRealizado = Boolean(progressoSalvo.desempateRealizado);
    if (progressoSalvo.proximaMusica >= totalDaPartida()) {
      encerrar();
      return;
    }
    prepararMusica(progressoSalvo.proximaMusica);
  }

  function novoJogo() {
    if (emPartida()) {
      Tela.mostrarAviso("Novo jogo só pode começar na abertura ou no final");
      return;
    }
    limparTemporizadores();
    Armazenamento.limpar(CONFIGURACAO.chaveProgresso);
    progressoSalvo = null;
    proximaMusicaSalva = 0;
    reiniciarRegrasDoJogo();
    estado = "inicio";
    resultado = null;
    Tela.definirProgressoAnel(1);
    renderizar();
    Tela.mostrarAviso("Novo jogo: progresso anterior apagado");
  }

  function aplicarNovoCatalogo() {
    Armazenamento.limpar(CONFIGURACAO.chaveProgresso);
    progressoSalvo = null;
    proximaMusicaSalva = 0;
    reiniciarRegrasDoJogo();
    if (!emPartida()) {
      estado = estado === "boasvindas" ? "boasvindas" : "inicio";
    }
    renderizar();
  }

  function alterarQuantidadeMesas(variacao) {
    if (estado !== "inicio" || existeProgressoSalvo()) {
      return;
    }
    Ajustes.definirQuantidadeMesas(CONFIGURACAO.quantidadeMesas + variacao);
    reiniciarRegrasDoJogo();
    Tela.montarGradeMesas(escolherMesa);
    renderizar();
  }

  function tocarTrecho() {
    Efeitos.preparar();
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
    resultado = null;
    renderizar();
    ReprodutorTrecho.tocar();
  }

  function anunciarRepeticao() {
    repeticoes += 1;
    Tela.mostrarAviso(Narrador.repeticao(repeticoes));
  }

  function repetirRevelacao() {
    anunciarRepeticao();
    ReprodutorTrecho.repetirNaRevelacao();
  }

  function repetirTrecho() {
    anunciarRepeticao();
    trechoAcabou = false;
    ReprodutorTrecho.reiniciar();
    Tela.definirProgressoAnel(1);
    retomarTrecho();
  }

  function revelar(ocorrencia) {
    limparTemporizadores();
    mesaEmResposta = null;
    numeroDigitado = "";
    ocupado = false;
    resultado = Narrador.revelacao(ocorrencia);
    estado = "revelado";
    Tela.definirProgressoAnel(1);
    ReprodutorTrecho.iniciarRevelacao();
    salvarProgresso(indiceMusica + 1);
    renderizar();

    if (ocorrencia.tipo === "acerto") {
      Efeitos.acerto();
      Confete.disparar(110);
    } else if (ocorrencia.tipo === "microfone") {
      Efeitos.microfone();
      Confete.disparar(60);
    } else {
      Efeitos.erro();
    }
  }

  function revelarSemVencedor() {
    revelar({ tipo: "ninguem" });
  }

  function escolherMesa(numero) {
    const mesaValida = Number.isInteger(numero) && numero >= 1 && numero <= CONFIGURACAO.quantidadeMesas;
    if (estado !== "pausado" || !mesaValida) {
      return;
    }

    numeroDigitado = "";
    if (mesasBloqueadas.has(numero)) {
      Tela.mostrarAviso(`${Narrador.maiuscula(Mesas.apelido(numero))} já ficou fora desta música`);
      renderizar();
      return;
    }

    mesaEmResposta = numero;
    coringaAtivo = false;
    estado = "respondendo";
    if (!modoComJuiz()) {
      Tela.montarAlternativas(alternativas.map((alternativa) => alternativa.texto), escolherAlternativa);
    }
    renderizar();
  }

  function confirmarMesaDigitada() {
    if (numeroDigitado) {
      escolherMesa(Number(numeroDigitado));
    } else if (trechoAcabou) {
      revelarSemVencedor();
    }
  }

  function confirmarAcerto() {
    if (estado !== "respondendo") {
      return;
    }
    const mesa = mesaEmResposta;
    const usouCoringa = coringaAtivo;
    const pontos = valorAtual() * multiplicador();
    const lideresAntes = lideresComPontos();

    sequenciasPorMesa[mesa] = (sequenciasPorMesa[mesa] || 0) + 1;
    Placar.adicionar(mesa, pontos, indiceMusica, modoDesempate ? "desempate" : "acerto", usouCoringa);
    consumirCoringa(mesa);
    vencedorDoDesempate = modoDesempate;
    const lideresDepois = lideresComPontos();
    const estaNaPonta = lideresDepois.indexOf(mesa) !== -1;
    const jaEstavaNaPonta = lideresAntes.indexOf(mesa) !== -1;

    const ocorrencia = {
      tipo: "acerto",
      mesa,
      pontos,
      coringa: usouCoringa,
      sequencia: sequenciasPorMesa[mesa],
      virouLider: estaNaPonta && !jaEstavaNaPonta && lideresDepois.length === 1,
      empatouNaPonta: estaNaPonta && !jaEstavaNaPonta && lideresDepois.length > 1,
      ajudou: ajudaUsada
    };

    if (modoComJuiz() || modoDesempate) {
      revelar(ocorrencia);
      return;
    }
    alternativasCantor = sortearCantores(musicaAtual());
    if (alternativasCantor.length === 0) {
      revelar(ocorrencia);
      return;
    }
    ocorrenciaPendente = ocorrencia;
    estado = "cantor";
    Tela.montarAlternativas(alternativasCantor.map((alternativa) => alternativa.texto), escolherCantor);
    renderizar();
  }

  function escolherCantor(indice) {
    const alternativa = alternativasCantor[indice];
    if (estado !== "cantor" || ocupado || !alternativa) {
      return;
    }
    ocupado = true;
    Tela.marcarResultadoAlternativa(indice, alternativa.correta);
    setTimeout(() => {
      ocupado = false;
      finalizarCantor(alternativa.correta);
    }, CONFIGURACAO.atrasoAposRespostaMilissegundos);
  }

  function finalizarCantor(acertouCantor) {
    if (estado !== "cantor" || !ocorrenciaPendente) {
      return;
    }
    const ocorrencia = ocorrenciaPendente;
    ocorrenciaPendente = null;
    if (acertouCantor === true) {
      const bonus = CONFIGURACAO.pontosBonusCantor * (ocorrencia.coringa ? CONFIGURACAO.multiplicadorCoringa : 1);
      Placar.adicionar(ocorrencia.mesa, bonus, indiceMusica, "bonus", ocorrencia.coringa);
      ocorrencia.bonus = bonus;
      ocorrencia.cantorAcertou = true;
    } else if (acertouCantor === false) {
      ocorrencia.cantorAcertou = false;
    }
    revelar(ocorrencia);
  }

  function alternarCoringa() {
    if (estado !== "respondendo" || !coringaDisponivel(mesaEmResposta)) {
      return;
    }
    coringaAtivo = !coringaAtivo;
    if (coringaAtivo) {
      Tela.mostrarAviso(Narrador.coringa());
    }
    renderizar();
  }

  function iniciarInterludio(novoResultado) {
    resultado = novoResultado;
    estado = "errou";
    renderizar();
    clearTimeout(temporizadorDoInterludio);
    temporizadorDoInterludio = setTimeout(continuarAposInterludio, CONFIGURACAO.duracaoInterludioMilissegundos);
  }

  function continuarAposInterludio() {
    clearTimeout(temporizadorDoInterludio);
    temporizadorDoInterludio = null;
    ocupado = false;
    resultado = null;
    if (trechoAcabou) {
      estado = "pausado";
      numeroDigitado = "";
      renderizar();
      return;
    }
    retomarTrecho();
  }

  function tirarMesaDaDisputa(mesa, novoResultado) {
    mesasBloqueadas.add(mesa);
    mesaEmResposta = null;

    if (mesasBloqueadas.size >= CONFIGURACAO.quantidadeMesas) {
      revelarSemVencedor();
      return;
    }
    iniciarInterludio(novoResultado);
  }

  function registrarErro(desistiu) {
    if (estado !== "respondendo") {
      return;
    }

    const mesa = mesaEmResposta;
    const usouCoringa = coringaAtivo;
    const pontosPerdidos = calcularPontosPerdidos(mesa) * multiplicador();
    sequenciasPorMesa[mesa] = 0;

    if (pontosPerdidos > 0) {
      Placar.adicionar(mesa, -pontosPerdidos, indiceMusica, "erro", usouCoringa);
    }
    consumirCoringa(mesa);
    salvarProgresso(proximaMusicaSalva);
    Efeitos.erro();

    const dados = { mesa, pontos: pontosPerdidos, coringa: usouCoringa };
    tirarMesaDaDisputa(mesa, desistiu ? Narrador.desistencia(dados) : Narrador.erro(dados));
  }

  function escolherAlternativa(indice) {
    const alternativa = alternativas[indice];
    const podeResponder = estado === "respondendo" && !modoComJuiz() && !ocupado && alternativa;
    if (!podeResponder) {
      return;
    }

    ocupado = true;
    Tela.marcarResultadoAlternativa(indice, alternativa.correta);
    setTimeout(() => {
      ocupado = false;
      if (alternativa.correta) {
        confirmarAcerto();
      } else {
        registrarErro(false);
      }
    }, CONFIGURACAO.atrasoAposRespostaMilissegundos);
  }

  function desistir() {
    registrarErro(true);
  }

  function errarMesa() {
    if (estado === "cantando") {
      microfoneReprovado();
    } else if (modoComJuiz()) {
      registrarErro(false);
    } else {
      desistir();
    }
  }

  function alternarBarra() {
    const automatica = !CONFIGURACAO.barraAutomatica;
    Ajustes.definirBarraAutomatica(automatica);
    Tela.definirBarraAutomatica(automatica);
    Tela.mostrarAviso(automatica ? "Botões escondem quando parados. B mostra sempre." : "Botões sempre visíveis.");
  }

  function atualizarContagemDoMicrofone() {
    segundosDoMicrofone -= 1;
    Tela.atualizarCronometro(Math.max(segundosDoMicrofone, 0), CONFIGURACAO.duracaoMicrofoneSegundos);
    if (segundosDoMicrofone > 0 && segundosDoMicrofone <= 3) {
      Efeitos.tique();
    }
    if (segundosDoMicrofone <= 0) {
      clearInterval(temporizadorDoMicrofone);
      temporizadorDoMicrofone = null;
    }
  }

  function iniciarMicrofone() {
    if (estado !== "respondendo" || ocupado) {
      return;
    }
    estado = "cantando";
    segundosDoMicrofone = CONFIGURACAO.duracaoMicrofoneSegundos;
    renderizar();
    Tela.atualizarCronometro(segundosDoMicrofone, CONFIGURACAO.duracaoMicrofoneSegundos);
    clearInterval(temporizadorDoMicrofone);
    temporizadorDoMicrofone = setInterval(atualizarContagemDoMicrofone, 1000);
  }

  function microfoneAprovado() {
    if (estado !== "cantando") {
      return;
    }
    const mesa = mesaEmResposta;
    const usouCoringa = coringaAtivo;
    const pontos = pontosDoMicrofone() * multiplicador();
    sequenciasPorMesa[mesa] = 0;
    Placar.adicionar(mesa, pontos, indiceMusica, modoDesempate ? "desempate" : "microfone", usouCoringa);
    consumirCoringa(mesa);
    vencedorDoDesempate = modoDesempate;
    revelar({ tipo: "microfone", mesa, pontos, coringa: usouCoringa });
  }

  function microfoneReprovado() {
    if (estado !== "cantando") {
      return;
    }
    clearInterval(temporizadorDoMicrofone);
    temporizadorDoMicrofone = null;
    sequenciasPorMesa[mesaEmResposta] = 0;
    coringaAtivo = false;
    Placar.adicionar(mesaEmResposta, 0, indiceMusica, "microfone-falhou");
    Tela.definirProgressoAnel(1);
    tirarMesaDaDisputa(mesaEmResposta, Narrador.microfoneRuim({ mesa: mesaEmResposta }));
  }

  function alternarModoResposta() {
    if (estado !== "inicio") {
      return;
    }
    const modos = Object.keys(CONFIGURACAO.rotulosModoResposta);
    const proximoModo = modos[(modos.indexOf(CONFIGURACAO.modoResposta) + 1) % modos.length];
    Ajustes.definirModoResposta(proximoModo);
    renderizar();
  }

  function alternarListaMusicas() {
    const linhas = MUSICAS.map((musica, indice) => {
      const situacao = descreverSituacao(indice);
      return {
        numero: indice + 1,
        titulo: musica.titulo,
        interprete: musica.interprete,
        categoria: musica.categoria,
        decada: musica.decada,
        duracao: musica.duracaoSegundos || CONFIGURACAO.duracaoPadraoTrechoSegundos,
        pontos: pontosDaMusicaDoCatalogo(indice),
        especial: Catalogo.especiais[musica.especial || ""] || "Normal",
        situacao: situacao.situacao,
        rotuloSituacao: situacao.rotulo
      };
    });
    Tela.alternarListaMusicas(linhas);
  }

  function alternarPlacar() {
    Tela.alternarPlacar(Placar.classificacao());
  }

  function alternarGuia() {
    Tela.alternarGuia();
  }

  function irParaProximaMusica() {
    if (modoDesempate && (vencedorDoDesempate || ehUltimaMusica())) {
      encerrar();
    } else if (ehUltimaMusica()) {
      encerrar();
    } else {
      prepararMusica(indiceMusica + 1);
    }
  }

  function iniciarDesempate() {
    if (!desempatePossivel()) {
      return;
    }
    mesasDoDesempate = lideresComPontos();
    modoDesempate = true;
    desempateRealizado = true;
    vencedorDoDesempate = false;
    Efeitos.preparar();
    prepararMusica(0);
  }

  function avancar() {
    switch (estado) {
      case "boasvindas": return acionarBoasVindas();
      case "inicio": return existeProgressoSalvo() ? comecarJogo() : comecarDoZero();
      case "preparando": return tocarTrecho();
      case "tocando": return pausarParaMesa();
      case "pausado": return confirmarMesaDigitada();
      case "respondendo": return modoComJuiz() ? confirmarAcerto() : undefined;
      case "cantando": return microfoneAprovado();
      case "errou": return continuarAposInterludio();
      case "revelado": return irParaProximaMusica();
      case "encerrado": return desempatePossivel() ? iniciarDesempate() : novoJogo();
    }
  }

  function voltarParaAbertura() {
    limparTemporizadores();
    modoDesempate = false;
    ReprodutorTrecho.parar();
    ocupado = false;
    estado = "inicio";
    Tela.definirProgressoAnel(1);
    renderizar();
  }

  function interromperTrecho() {
    ReprodutorTrecho.pausar();
    ReprodutorTrecho.reiniciar();
    Tela.definirProgressoAnel(1);
    estado = "preparando";
    renderizar();
    Tela.definirCentroDisco("♪");
  }

  function cancelarEscolhaDaMesa() {
    if (ocupado) {
      return;
    }
    mesaEmResposta = null;
    coringaAtivo = false;
    numeroDigitado = "";
    estado = "pausado";
    renderizar();
  }

  function cancelarMicrofone() {
    clearInterval(temporizadorDoMicrofone);
    temporizadorDoMicrofone = null;
    Tela.definirProgressoAnel(1);
    estado = "respondendo";
    renderizar();
    Tela.definirCentroDisco("♪");
  }

  function voltarParaPergunta() {
    const tiposDaRevelacao = ["bonus", "acerto", "microfone", "desempate"];
    let ultimo = Placar.ultimo();
    while (ultimo && ultimo.indiceMusica === indiceMusica && tiposDaRevelacao.indexOf(ultimo.tipo) !== -1) {
      Placar.desfazerUltimo();
      if (ultimo.coringa) {
        coringasUsados.delete(ultimo.mesa);
      }
      if (ultimo.tipo !== "bonus") {
        sequenciasPorMesa[ultimo.mesa] = Math.max((sequenciasPorMesa[ultimo.mesa] || 1) - 1, 0);
        vencedorDoDesempate = false;
      }
      ultimo = Placar.ultimo();
    }
    ReprodutorTrecho.parar();
    resultado = null;
    numeroDigitado = "";
    mesaEmResposta = null;
    ocupado = false;
    trechoAcabou = true;
    estado = "pausado";
    salvarProgresso(indiceMusica);
    renderizar();
    Tela.definirProgressoAnel(0);
    Tela.definirCentroDisco("0");
  }

  function irParaBoasVindas() {
    estado = "boasvindas";
    renderizar();
  }

  function voltar() {
    switch (estado) {
      case "inicio": return irParaBoasVindas();
      case "preparando": return voltarParaAbertura();
      case "tocando": return interromperTrecho();
      case "respondendo": return cancelarEscolhaDaMesa();
      case "cantando": return cancelarMicrofone();
      case "cantor": return finalizarCantor(null);
      case "errou": return continuarAposInterludio();
      case "revelado": return voltarParaPergunta();
      case "encerrado": return voltarParaAbertura();
      case "pausado":
        if (numeroDigitado) {
          numeroDigitado = "";
          renderizar();
        } else if (trechoAcabou) {
          repetirTrecho();
        } else {
          retomarTrecho();
        }
    }
  }

  function digitar(digito) {
    if (estado === "cantor") {
      escolherCantor(Number(digito) - 1);
      return;
    }
    if (estado === "respondendo" && !modoComJuiz()) {
      const posicao = Number(digito);
      if (posicao === alternativas.length + 1) {
        iniciarMicrofone();
      } else {
        escolherAlternativa(posicao - 1);
      }
      return;
    }
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
    Tela.mostrarAviso(Narrador.ajuda(CONFIGURACAO.segundosDeAjuda, CONFIGURACAO.pontosPerdidosPorAjuda));

    if (estado === "pausado" && trechoAcabou) {
      trechoAcabou = false;
      retomarTrecho();
      return;
    }
    renderizar();
  }

  function revelarResposta() {
    if (estado === "tocando" || estado === "pausado") {
      revelarSemVencedor();
    }
  }

  function repetir() {
    if (estado === "tocando" || estado === "pausado") {
      repetirTrecho();
    } else if (estado === "revelado") {
      repetirRevelacao();
    }
  }

  function alternarSom() {
    if (estado === "revelado") {
      ReprodutorTrecho.alternarSom();
    }
  }

  function pedirEncerramento() {
    if (emPartida()) {
      Tela.abrirConfirmacao();
    }
  }

  function confirmarEncerramento() {
    Tela.fecharSobreposicoes();
    if (emPartida()) {
      encerrar();
    }
  }

  function descreverDesfeita(desfeita) {
    if (desfeita.pontos === 0) {
      return `Desfeito: tentativa de microfone da mesa ${desfeita.mesa}`;
    }
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

    if (desfeita.coringa) {
      coringasUsados.delete(desfeita.mesa);
    }
    const ehDestaMusica = desfeita.indiceMusica === indiceMusica;
    if (desfeita.tipo === "erro" && ehDestaMusica) {
      mesasBloqueadas.delete(desfeita.mesa);
    }
    if (desfeita.pontos > 0 && ehDestaMusica && estado === "revelado") {
      resultado = {
        tipo: "ninguem",
        icone: "↩",
        titulo: "Pontuação desfeita",
        detalhe: `Mesa ${desfeita.mesa} voltou atrás`,
        comentario: "O apresentador mandou voltar. Ordens são ordens."
      };
    }
    renderizar();
  }

  function abrirMenu() {
    const naMusica = estado === "tocando" || estado === "pausado";
    const itens = [
      { rotulo: "Dica", ativo: estadosComDica.includes(estado), acao: alternarDica },
      {
        rotulo: `+${CONFIGURACAO.segundosDeAjuda} segundos (−${CONFIGURACAO.pontosPerdidosPorAjuda} pontos)`,
        ativo: naMusica && !ajudaUsada,
        acao: pedirAjuda
      },
      { rotulo: "Repetir trecho", ativo: naMusica || estado === "revelado", acao: repetir },
      { rotulo: "Revelar resposta", ativo: naMusica, acao: revelarResposta },
      { rotulo: "Desfazer última pontuação", ativo: true, acao: desfazerPontuacao },
      { rotulo: "Placar", ativo: true, acao: alternarPlacar },
      { rotulo: "Lista de músicas", ativo: true, acao: alternarListaMusicas },
      { rotulo: "Como jogar", ativo: true, acao: alternarGuia },
      { rotulo: "Comandos", ativo: true, acao: () => Tela.alternarAjuda() },
      { rotulo: "Tela cheia", ativo: true, acao: () => Tela.alternarTelaCheia() },
      { rotulo: "Intervalo (voltamos já)", ativo: !["tocando", "respondendo", "cantando", "cantor"].includes(estado), acao: () => Preparacao.abrirIntervalo() },
      { rotulo: "Preparar evento (nomes, músicas, teste)", ativo: !emPartida(), acao: () => Preparacao.alternar() },
      { rotulo: `Placar no canto: ${CONFIGURACAO.placarNoCanto ? "ligado" : "desligado"}`, ativo: true, acao: () => { Ajustes.definirPlacarNoCanto(!CONFIGURACAO.placarNoCanto); renderizar(); } },
      {
        rotulo: CONFIGURACAO.barraAutomatica ? "Mostrar botões sempre" : "Esconder botões quando parados",
        ativo: true,
        acao: alternarBarra
      },
      { rotulo: "Parar por aqui", ativo: emPartida(), acao: pedirEncerramento },
      { rotulo: "Novo jogo", ativo: !emPartida(), acao: novoJogo },
      { rotulo: "Fechar menu", ativo: true, acao: null }
    ];
    Tela.abrirMenu(itens);
  }

  function estaOcupado() {
    return ocupado;
  }

  function estadoAtual() {
    return estado;
  }

  function aoReceberTempo(segundosRestantes, limiteSegundos) {
    if (estado !== "tocando") {
      return;
    }
    Tela.atualizarCronometro(segundosRestantes, limiteSegundos);
    const segundoInteiro = Math.ceil(segundosRestantes);
    const entrouEmTensao = segundosRestantes > 0 && segundosRestantes <= 5 && limiteSegundos > 6;
    if (entrouEmTensao !== emTensao) {
      emTensao = entrouEmTensao;
      Tela.definirTensao(emTensao);
    }
    if (emTensao && segundoInteiro <= 3 && segundoInteiro !== ultimoSegundoAvisado) {
      ultimoSegundoAvisado = segundoInteiro;
      Efeitos.tique();
    }
  }

  function aoTerminarTrecho() {
    if (estado !== "tocando") {
      return;
    }
    trechoAcabou = true;
    emTensao = false;
    ultimoSegundoAvisado = null;
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
    Tela.mostrarAviso("O navegador bloqueou o som. Toque em Tocar novamente.");
  }

  function iniciarAplicacao() {
    Ajustes.carregar();
    progressoSalvo = Armazenamento.carregar(CONFIGURACAO.chaveProgresso);
    proximaMusicaSalva = existeProgressoSalvo() ? progressoSalvo.proximaMusica : 0;

    if (existeProgressoSalvo() && progressoSalvo.quantidadeMesas) {
      Ajustes.aplicarQuantidadeMesas(progressoSalvo.quantidadeMesas);
    }
    Tela.definirBarraAutomatica(CONFIGURACAO.barraAutomatica);
    Placar.reiniciar();

    ReprodutorTrecho.definirOuvintes({
      aoTempo: aoReceberTempo,
      aoFimDoTrecho: aoTerminarTrecho,
      aoFalhaAudio: aoFalharAudio,
      aoBloqueioDoNavegador: aoBloquearNavegador
    });

    Tela.montarGradeMesas(escolherMesa);
    Tela.ligarControles({
      aoAcertar: () => (estado === "cantando" ? microfoneAprovado() : confirmarAcerto()),
      aoErrar: errarMesa,
      aoPular: pularParaJogo,
      aoContinuar: comecarJogo,
      aoComecar: comecarDoZero,
      aoCantar: iniciarMicrofone,
      aoAlternarDica: alternarDica,
      aoPedirAjuda: pedirAjuda,
      aoAbrirPlacar: alternarPlacar,
      aoAbrirGuia: alternarGuia,
      aoPedirEncerramento: pedirEncerramento,
      aoAbrirComandos: () => Tela.alternarAjuda(),
      aoAbrirListaMusicas: alternarListaMusicas,
      aoAlternarModoResposta: alternarModoResposta,
      aoImprimirLista: () => window.print(),
      aoDiminuirMesas: () => alterarQuantidadeMesas(-1),
      aoAumentarMesas: () => alterarQuantidadeMesas(1),
      aoConfirmarEncerramento: confirmarEncerramento,
      aoContinuarJogando: () => Tela.fecharSobreposicoes(),
      aoVoltar: voltar,
      aoAvancar: avancar,
      aoAbrirMenu: abrirMenu,
      aoAlternarCoringa: alternarCoringa,
      aoIniciarDesempate: iniciarDesempate
    });
    Tela.aplicarFerramentas();
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
    alternarGuia,
    alternarModoResposta,
    alternarListaMusicas,
    iniciarMicrofone,
    abrirMenu,
    errarMesa,
    moverBoasVindas,
    pularParaJogo,
    alternarBarra,
    alternarCoringa,
    iniciarDesempate,
    renderizar,
    aplicarNovoCatalogo,
    estadoDaPartida: () => estado,
    reiniciarPartida: reiniciarRegrasDoJogo,
    estaOcupado,
    estadoAtual,
    novoJogo
  };
})();
