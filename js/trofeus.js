const Trofeus = (() => {
  const tiposDePontuacao = ["acerto", "erro", "microfone", "bonus", "penalidade-cantor"];

  function classificar(pontosPorMesa) {
    const ordenadas = pontosPorMesa.map((pontos, indice) => ({ mesa: indice + 1, pontos }))
      .sort((a, b) => b.pontos - a.pontos || a.mesa - b.mesa);
    const posicoes = {};
    let posicaoAtual = 0;
    ordenadas.forEach((item, indice) => {
      if (indice === 0 || item.pontos !== ordenadas[indice - 1].pontos) {
        posicaoAtual = indice + 1;
      }
      posicoes[item.mesa] = posicaoAtual;
    });
    return posicoes;
  }

  function mesasComMaximo(valores, minimo) {
    const maximo = Math.max.apply(null, valores.concat([0]));
    if (maximo < minimo) {
      return null;
    }
    const mesas = [];
    valores.forEach((valor, indice) => {
      if (valor === maximo) {
        mesas.push(indice + 1);
      }
    });
    return { mesas, valor: maximo };
  }

  function pontosAteMusica(historico, quantidadeMesas, ultimaMusica) {
    const pontos = [];
    for (let mesa = 0; mesa < quantidadeMesas; mesa++) {
      pontos.push(0);
    }
    historico.forEach((lancamento) => {
      const entraNaConta = lancamento.tipo !== "desempate" && lancamento.indiceMusica <= ultimaMusica;
      if (entraNaConta && tiposDePontuacao.indexOf(lancamento.tipo) !== -1) {
        pontos[lancamento.mesa - 1] += lancamento.pontos;
      }
    });
    return pontos;
  }

  function calcular(historico, quantidadeMesas) {
    const regulares = historico.filter((lancamento) => lancamento.tipo !== "desempate");
    if (regulares.length === 0) {
      return [];
    }
    const ultimaMusica = Math.max.apply(null, regulares.map((lancamento) => lancamento.indiceMusica));
    const trofeus = [];

    const acertos = [];
    const desafios = [];
    for (let mesa = 0; mesa < quantidadeMesas; mesa++) {
      acertos.push(0);
      desafios.push(0);
    }
    regulares.forEach((lancamento) => {
      if (lancamento.tipo === "acerto") {
        acertos[lancamento.mesa - 1] += 1;
      }
      if (lancamento.tipo === "microfone" || lancamento.tipo === "microfone-falhou") {
        desafios[lancamento.mesa - 1] += 1;
      }
    });

    const ouvido = mesasComMaximo(acertos, 1);
    if (ouvido) {
      trofeus.push({ titulo: "Ouvido de Ouro", mesas: ouvido.mesas, detalhe: `${ouvido.valor} acertos` });
    }

    const coragem = mesasComMaximo(desafios, 1);
    if (coragem) {
      trofeus.push({ titulo: "Coragem", mesas: coragem.mesas, detalhe: `${coragem.valor} desafios de microfone` });
    }

    const finais = pontosAteMusica(regulares, quantidadeMesas, ultimaMusica);
    const posicoesFinais = classificar(finais);
    const maiorDeficit = [];
    const metade = Math.floor(ultimaMusica / 2);
    const aposMetade = classificar(pontosAteMusica(regulares, quantidadeMesas, metade));

    for (let mesa = 0; mesa < quantidadeMesas; mesa++) {
      maiorDeficit.push(0);
    }
    for (let musica = 0; musica <= ultimaMusica; musica++) {
      const parcial = pontosAteMusica(regulares, quantidadeMesas, musica);
      const lider = Math.max.apply(null, parcial);
      parcial.forEach((pontos, indice) => {
        maiorDeficit[indice] = Math.max(maiorDeficit[indice], lider - pontos);
      });
    }

    const campeasComDeficit = maiorDeficit.map((deficit, indice) => (posicoesFinais[indice + 1] === 1 ? deficit : 0));
    const virada = mesasComMaximo(campeasComDeficit, CONFIGURACAO.deficitMinimoVirada);
    if (virada) {
      trofeus.push({ titulo: "Virada do Jogo", mesas: virada.mesas, detalhe: `Chegou a ficar ${virada.valor} pontos atrás` });
    }

    const ganhos = [];
    for (let mesa = 1; mesa <= quantidadeMesas; mesa++) {
      ganhos.push(aposMetade[mesa] - posicoesFinais[mesa]);
    }
    const azarao = mesasComMaximo(ganhos, CONFIGURACAO.ganhoMinimoAzarao);
    if (azarao) {
      trofeus.push({ titulo: "Azarão", mesas: azarao.mesas, detalhe: `Subiu ${azarao.valor} posições na reta final` });
    }

    return trofeus;
  }

  return { calcular };
})();
