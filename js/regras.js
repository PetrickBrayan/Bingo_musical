const Regras = (() => {
  const fasesQueAceitamMesa = ["tocando", "tempoEsgotado"];
  const fasesQueAceitamPlacar = ["abertura", "preparada", "revelada", "fim"];
  const fasesQueAceitamNovaMusica = ["abertura", "preparada", "revelada"];

  function copiar(estado) {
    return JSON.parse(JSON.stringify(estado));
  }

  function registrarMudanca(estado) {
    estado.versao += 1;
    return estado;
  }

  function limparResposta(estado) {
    estado.mesaRespondendo = null;
    estado.faseAntesDeResponder = null;
    estado.restanteEmMilissegundos = null;
  }

  function limparRodada(estado) {
    limparResposta(estado);
    estado.mesasEliminadas = [];
    estado.terminaEm = null;
    estado.resultado = null;
  }

  function registrarMusicaJogada(estado) {
    if (!estado.musicasJogadas.includes(estado.indiceDaMusica)) {
      estado.musicasJogadas.push(estado.indiceDaMusica);
    }
  }

  function finalizarRodada(estado, resultado) {
    limparResposta(estado);
    estado.terminaEm = null;
    estado.fase = "revelada";
    estado.resultado = resultado;
    registrarMusicaJogada(estado);
    return estado;
  }

  function encerrar(estado) {
    const novo = copiar(estado);
    limparRodada(novo);
    novo.fase = "fim";
    return registrarMudanca(novo);
  }

  function criarEstadoInicial(quantidadeDeMesas) {
    return {
      versao: 0,
      fase: "abertura",
      faseAnterior: null,
      indiceDaMusica: -1,
      pontuacao: Array.from({ length: quantidadeDeMesas }, () => 0),
      mesasEliminadas: [],
      mesaRespondendo: null,
      faseAntesDeResponder: null,
      restanteEmMilissegundos: null,
      terminaEm: null,
      resultado: null,
      musicasJogadas: []
    };
  }

  function proximoIndiceDisponivel(estado, totalDeMusicas) {
    let indice = estado.indiceDaMusica + 1;
    while (indice < totalDeMusicas && estado.musicasJogadas.includes(indice)) {
      indice += 1;
    }
    return indice;
  }

  function podeEscolherMusica(estado, indice) {
    return fasesQueAceitamNovaMusica.includes(estado.fase) && !estado.musicasJogadas.includes(indice);
  }

  function prepararMusica(estado, indice, totalDeMusicas) {
    if (indice < 0 || indice >= totalDeMusicas) return estado;
    if (!podeEscolherMusica(estado, indice)) return estado;
    const novo = copiar(estado);
    limparRodada(novo);
    novo.fase = "preparada";
    novo.indiceDaMusica = indice;
    return registrarMudanca(novo);
  }

  function proximaMusica(estado, totalDeMusicas) {
    if (!["abertura", "revelada"].includes(estado.fase)) return estado;
    const indice = proximoIndiceDisponivel(estado, totalDeMusicas);
    if (indice >= totalDeMusicas) return encerrar(estado);
    return prepararMusica(estado, indice, totalDeMusicas);
  }

  function comecarTrecho(estado, agora, duracaoEmMilissegundos) {
    const novo = copiar(estado);
    novo.fase = "tocando";
    novo.terminaEm = agora + duracaoEmMilissegundos;
    return registrarMudanca(novo);
  }

  function iniciarTrecho(estado, agora, duracaoEmMilissegundos) {
    if (estado.fase !== "preparada") return estado;
    return comecarTrecho(estado, agora, duracaoEmMilissegundos);
  }

  function repetirTrecho(estado, agora, duracaoEmMilissegundos) {
    if (estado.fase !== "tempoEsgotado") return estado;
    return comecarTrecho(estado, agora, duracaoEmMilissegundos);
  }

  function tempoAcabou(estado) {
    if (estado.fase !== "tocando") return estado;
    const novo = copiar(estado);
    novo.fase = "tempoEsgotado";
    novo.terminaEm = null;
    return registrarMudanca(novo);
  }

  function mesaPodeLevantar(estado, numeroDaMesa) {
    if (!fasesQueAceitamMesa.includes(estado.fase)) return false;
    if (!Number.isInteger(numeroDaMesa)) return false;
    if (numeroDaMesa < 1 || numeroDaMesa > estado.pontuacao.length) return false;
    return !estado.mesasEliminadas.includes(numeroDaMesa);
  }

  function mesaLevantou(estado, numeroDaMesa, agora) {
    if (!mesaPodeLevantar(estado, numeroDaMesa)) return estado;
    const novo = copiar(estado);
    novo.faseAntesDeResponder = estado.fase;
    novo.restanteEmMilissegundos = estado.fase === "tocando" ? Math.max(0, estado.terminaEm - agora) : 0;
    novo.terminaEm = null;
    novo.mesaRespondendo = numeroDaMesa;
    novo.fase = "respondendo";
    return registrarMudanca(novo);
  }

  function voltarAoTrecho(estado, agora) {
    const restante = estado.restanteEmMilissegundos;
    const voltaTocando = estado.faseAntesDeResponder === "tocando" && restante > 0;
    limparResposta(estado);
    if (voltaTocando) {
      estado.fase = "tocando";
      estado.terminaEm = agora + restante;
    } else {
      estado.fase = "tempoEsgotado";
      estado.terminaEm = null;
    }
    return estado;
  }

  function confirmarAcerto(estado, pontos) {
    if (estado.fase !== "respondendo") return estado;
    const novo = copiar(estado);
    const mesa = novo.mesaRespondendo;
    novo.pontuacao[mesa - 1] += pontos;
    return registrarMudanca(finalizarRodada(novo, { tipo: "acerto", mesa, pontos }));
  }

  function confirmarErro(estado, agora) {
    if (estado.fase !== "respondendo") return estado;
    const novo = copiar(estado);
    novo.mesasEliminadas.push(novo.mesaRespondendo);
    if (novo.mesasEliminadas.length >= novo.pontuacao.length) {
      return registrarMudanca(finalizarRodada(novo, { tipo: "ninguem" }));
    }
    return registrarMudanca(voltarAoTrecho(novo, agora));
  }

  function cancelarResposta(estado, agora) {
    if (estado.fase !== "respondendo") return estado;
    return registrarMudanca(voltarAoTrecho(copiar(estado), agora));
  }

  function revelar(estado) {
    if (!fasesQueAceitamMesa.includes(estado.fase)) return estado;
    return registrarMudanca(finalizarRodada(copiar(estado), { tipo: "ninguem" }));
  }

  function alternarPlacar(estado) {
    if (estado.fase === "placar") {
      const novo = copiar(estado);
      novo.fase = novo.faseAnterior;
      novo.faseAnterior = null;
      return registrarMudanca(novo);
    }
    if (!fasesQueAceitamPlacar.includes(estado.fase)) return estado;
    const novo = copiar(estado);
    novo.faseAnterior = estado.fase;
    novo.fase = "placar";
    return registrarMudanca(novo);
  }

  function corrigirPontuacao(estado, numeroDaMesa, variacao) {
    if (!Number.isInteger(numeroDaMesa)) return estado;
    if (numeroDaMesa < 1 || numeroDaMesa > estado.pontuacao.length) return estado;
    const novo = copiar(estado);
    novo.pontuacao[numeroDaMesa - 1] = Math.max(0, novo.pontuacao[numeroDaMesa - 1] + variacao);
    return registrarMudanca(novo);
  }

  function segundosRestantes(estado, agora) {
    if (estado.fase === "tocando") return Math.max(0, Math.ceil((estado.terminaEm - agora) / 1000));
    if (estado.fase === "respondendo") return Math.ceil(estado.restanteEmMilissegundos / 1000);
    return null;
  }

  function classificacao(estado) {
    const lista = estado.pontuacao.map((pontos, indice) => ({ mesa: indice + 1, pontos }));
    lista.sort((a, b) => b.pontos - a.pontos || a.mesa - b.mesa);
    let posicaoAtual = 0;
    let pontosAnteriores = null;
    lista.forEach((item, indice) => {
      if (item.pontos !== pontosAnteriores) {
        posicaoAtual = indice + 1;
        pontosAnteriores = item.pontos;
      }
      item.posicao = posicaoAtual;
    });
    return lista;
  }

  return {
    criarEstadoInicial,
    proximoIndiceDisponivel,
    podeEscolherMusica,
    prepararMusica,
    proximaMusica,
    iniciarTrecho,
    repetirTrecho,
    tempoAcabou,
    mesaPodeLevantar,
    mesaLevantou,
    confirmarAcerto,
    confirmarErro,
    cancelarResposta,
    revelar,
    alternarPlacar,
    corrigirPontuacao,
    segundosRestantes,
    classificacao
  };
})();
