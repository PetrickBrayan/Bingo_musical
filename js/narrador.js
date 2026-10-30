const Narrador = (() => {
  const titulosAcerto = [
    "Acertou, mesa {mesa}!",
    "É isso aí, mesa {mesa}!",
    "Mesa {mesa} mandou bem!",
    "Que ouvido, mesa {mesa}!"
  ];
  const comentariosAcerto = [
    "Parabéns! As outras mesas estão fingindo que também sabiam.",
    "Isso é que é ter bagagem musical!",
    "Essa mesa claramente viveu os anos dourados.",
    "Até o vinil ficou orgulhoso.",
    "Cantou de cor, sem nem piscar."
  ];
  const titulosErro = [
    "Ih… errou, mesa {mesa}!",
    "Não era essa, mesa {mesa}!",
    "Quase, mesa {mesa}! Quer dizer, nem tanto."
  ];
  const comentariosErro = [
    "Calma, foi só um escorregão.",
    "As outras mesas agradecem a oportunidade.",
    "Respira, toma uma água e volta mais forte.",
    "Disfarça, ninguém viu. Só o salão inteiro.",
    "Essa doeu, mas dá para se recuperar."
  ];
  const comentariosDesistencia = [
    "Levantou a plaquinha e amarelou?",
    "Coragem é para poucos. Fica para a próxima.",
    "Quem não arrisca não petisca, mas também não perde ponto. Ah, perdeu."
  ];
  const comentariosNinguem = [
    "Essa era das boas, hein? Vergonha só um pouquinho.",
    "O disco chorou. Fica a lição para a próxima.",
    "Ninguém? Sério? O cantor está de braços cruzados."
  ];
  const comentariosMicrofoneBom = [
    "Afinado ou não, a coragem vale metade dos pontos!",
    "A plateia aprova! Uma salva de palmas para os artistas.",
    "Subiu no palco e não fez feio!"
  ];
  const comentariosMicrofoneRuim = [
    "Sem desconto de pontos, só do orgulho.",
    "Foi bonito tentar! A música segue.",
    "O importante é participar, né? Mas ganhar é melhor."
  ];
  const frasesAjuda = [
    "+{segundos} segundos! Isso custa {custo} pontos. Sem choro depois, hein?",
    "Ajudinha liberada: +{segundos}s. A música agora vale {custo} pontos a menos.",
    "Precisou de uma força? Tudo bem, mas são {custo} pontos a menos."
  ];

  const frasesRepeticao = [
    "Vamos ouvir mais uma vez!",
    "Tá difícil, né?",
    "Vish, deu branco… esqueceu mesmo!",
    "Já decorei o trecho de tanto tocar! Que tal revelar?"
  ];

  function sortear(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
  }

  function preencher(texto, dados) {
    return texto.replace(/\{(\w+)\}/g, (trecho, chave) => String(dados[chave]));
  }

  function listarMesas(numeros) {
    if (numeros.length <= 1) {
      return numeros.join("");
    }
    return numeros.slice(0, -1).join(", ") + " e " + numeros[numeros.length - 1];
  }

  function comentarioDoAcerto(ocorrencia) {
    if (ocorrencia.sequencia >= 3) {
      return `${ocorrencia.sequencia} acertos seguidos! Alguém chama os bombeiros: está pegando fogo!`;
    }
    if (ocorrencia.sequencia === 2) {
      return `Dois seguidos! A mesa ${ocorrencia.mesa} está embalada.`;
    }
    if (ocorrencia.virouLider) {
      return `Mesa ${ocorrencia.mesa} assumiu a liderança! Quem vai tomar o posto?`;
    }
    if (ocorrencia.empatouNaPonta) {
      return "Empate na ponta! A disputa está pegando fogo.";
    }
    if (ocorrencia.ajudou) {
      return "Com uma ajudinha, mas vale do mesmo jeito.";
    }
    return sortear(comentariosAcerto);
  }

  function acerto(ocorrencia) {
    return {
      tipo: "acerto",
      icone: "✓",
      titulo: preencher(sortear(titulosAcerto), ocorrencia),
      detalhe: `+${ocorrencia.pontos} pontos para a mesa ${ocorrencia.mesa}`,
      comentario: comentarioDoAcerto(ocorrencia)
    };
  }

  function microfoneBom(ocorrencia) {
    return {
      tipo: "microfone",
      icone: "♪",
      titulo: `Mandou bem, mesa ${ocorrencia.mesa}!`,
      detalhe: `+${ocorrencia.pontos} pontos pela cantoria`,
      comentario: sortear(comentariosMicrofoneBom)
    };
  }

  function microfoneRuim(ocorrencia) {
    return {
      tipo: "microfone",
      icone: "♪",
      titulo: `Não rolou, mesa ${ocorrencia.mesa}`,
      detalhe: "Sem perder pontos, mas fora desta música",
      comentario: sortear(comentariosMicrofoneRuim)
    };
  }

  function erro(ocorrencia) {
    return {
      tipo: "erro",
      icone: "✕",
      titulo: preencher(sortear(titulosErro), ocorrencia),
      detalhe: ocorrencia.pontos > 0 ? `−${ocorrencia.pontos} pontos para a mesa ${ocorrencia.mesa}` : "Fica fora desta música",
      comentario: sortear(comentariosErro)
    };
  }

  function desistencia(ocorrencia) {
    return {
      tipo: "desistiu",
      icone: "…",
      titulo: `Mesa ${ocorrencia.mesa} desistiu!`,
      detalhe: ocorrencia.pontos > 0 ? `−${ocorrencia.pontos} pontos pela amarelada` : "Fica fora desta música",
      comentario: sortear(comentariosDesistencia)
    };
  }

  function ninguem() {
    return {
      tipo: "ninguem",
      icone: "?",
      titulo: "Ninguém acertou!",
      detalhe: "Esta música não pontuou",
      comentario: sortear(comentariosNinguem)
    };
  }

  function revelacao(ocorrencia) {
    if (ocorrencia.tipo === "acerto") {
      return acerto(ocorrencia);
    }
    if (ocorrencia.tipo === "microfone") {
      return microfoneBom(ocorrencia);
    }
    return ninguem();
  }

  function repeticao(vezes) {
    return frasesRepeticao[Math.min(vezes, frasesRepeticao.length) - 1];
  }

  function ajuda(segundos, custo) {
    return preencher(sortear(frasesAjuda), { segundos, custo });
  }

  function preparo(situacao) {
    if (situacao.indice === 0) {
      return "Todo mundo zerado. Quem vai abrir o placar?";
    }
    if (situacao.ultima) {
      return "Última música! Tudo pode mudar agora.";
    }
    if (situacao.pontos <= 0) {
      return "Ninguém pontuou ainda. Quem vai quebrar o gelo?";
    }
    if (situacao.lideres.length === 1) {
      return `Mesa ${situacao.lideres[0]} lidera com ${situacao.pontos}. Quem vai tirar ela de lá?`;
    }
    return `Empate na ponta entre as mesas ${listarMesas(situacao.lideres)}. Desempatem!`;
  }

  function final(lideres, pontos) {
    if (pontos <= 0) {
      return { titulo: "Fim de jogo", subtitulo: "Ninguém pontuou. Vamos de revanche?" };
    }
    if (lideres.length === 1) {
      return {
        titulo: `Mesa ${lideres[0]} é a campeã!`,
        subtitulo: `${pontos} pontos. Parabéns, vocês mandaram muito bem!`
      };
    }
    return {
      titulo: "Temos um empate!",
      subtitulo: `Mesas ${listarMesas(lideres)} com ${pontos} pontos cada. Parabéns a todas!`
    };
  }

  return { acerto, erro, desistencia, microfoneRuim, revelacao, ninguem, repeticao, ajuda, preparo, final, listarMesas };
})();
