const Relatorio = (() => {
  const largura = 2480;
  const altura = 1754;
  const margem = 140;
  const ouro = "#b8892a";
  const ouroClaro = "#f6d98a";
  const vinho = "#7a1f35";
  const marrom = "#3a2210";
  const papel = "#fffaf0";
  const faixaClara = "#f7ecd2";
  const serifa = "Georgia, 'Times New Roman', serif";
  const linhasPorPaginaInicial = 10;
  const linhasPorPaginaContinuacao = 22;
  const alturaLinha = 58;

  function zeroEsquerda(valor) {
    return String(valor).padStart(2, "0");
  }

  function textoDoMomento(momento) {
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return {
      data: `${momento.getDate()} de ${meses[momento.getMonth()]} de ${momento.getFullYear()}`,
      hora: `${zeroEsquerda(momento.getHours())}:${zeroEsquerda(momento.getMinutes())}`
    };
  }

  function calcularEstatisticas(entrada) {
    const historico = entrada.historico;
    const porMesa = {};
    const porMusica = {};
    const totais = { acertos: 0, erros: 0, microfones: 0, bonus: 0, penalidades: 0, coringas: 0 };

    function mesaDe(numero) {
      if (!porMesa[numero]) {
        porMesa[numero] = { acertos: 0, erros: 0, microfones: 0, bonus: 0 };
      }
      return porMesa[numero];
    }

    function musicaDe(indice) {
      if (!porMusica[indice]) {
        porMusica[indice] = { acertos: 0, erros: 0 };
      }
      return porMusica[indice];
    }

    historico.forEach((registro) => {
      const mesa = mesaDe(registro.mesa);
      if (registro.tipo === "acerto") {
        mesa.acertos += 1;
        totais.acertos += 1;
        musicaDe(registro.indiceMusica).acertos += 1;
      } else if (registro.tipo === "erro") {
        mesa.erros += 1;
        totais.erros += 1;
        musicaDe(registro.indiceMusica).erros += 1;
      } else if (registro.tipo === "microfone") {
        mesa.microfones += 1;
        totais.microfones += 1;
      } else if (registro.tipo === "bonus") {
        mesa.bonus += 1;
        totais.bonus += 1;
      } else if (registro.tipo === "penalidade-cantor") {
        totais.penalidades += 1;
      }
      if (registro.coringa && (registro.tipo === "acerto" || registro.tipo === "erro")) {
        totais.coringas += 1;
      }
    });

    const indices = Object.keys(porMusica).map(Number);
    let maisAcertada = null;
    let maisDificil = null;
    indices.forEach((indice) => {
      const dados = porMusica[indice];
      if (dados.acertos > 0 && (!maisAcertada || dados.acertos > porMusica[maisAcertada].acertos)) {
        maisAcertada = indice;
      }
      if (dados.erros > 0 && (!maisDificil || dados.erros > porMusica[maisDificil].erros)) {
        maisDificil = indice;
      }
    });

    const musicasTocadas = historico.length === 0 ? 0 : Math.max.apply(null, historico.map((registro) => registro.indiceMusica)) + 1;

    return {
      porMesa,
      totais,
      musicasTocadas: Math.max(musicasTocadas, entrada.musicasTocadas || 0),
      maisAcertada: maisAcertada === null ? null : { indice: maisAcertada, quantidade: porMusica[maisAcertada].acertos },
      maisDificil: maisDificil === null ? null : { indice: maisDificil, quantidade: porMusica[maisDificil].erros }
    };
  }

  function novaPagina() {
    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const c = tela.getContext("2d");
    c.fillStyle = papel;
    c.fillRect(0, 0, largura, altura);
    c.save();
    c.globalAlpha = 0.05;
    c.fillStyle = ouro;
    c.font = `bold 900px ${serifa}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("♪", largura / 2, altura / 2 + 40);
    c.restore();
    c.strokeStyle = ouro;
    c.lineWidth = 8;
    c.strokeRect(50, 50, largura - 100, altura - 100);
    c.lineWidth = 2;
    c.strokeRect(70, 70, largura - 140, altura - 140);
    c.textBaseline = "alphabetic";
    return { tela, c };
  }

  function cabecalho(c, titulo, momento) {
    const texto = textoDoMomento(momento);
    c.fillStyle = vinho;
    c.fillRect(margem, 120, largura - margem * 2, 150);
    c.fillStyle = ouroClaro;
    c.textAlign = "left";
    c.font = `bold 72px ${serifa}`;
    c.fillText(titulo, margem + 50, 215);
    c.textAlign = "right";
    c.font = `34px ${serifa}`;
    c.fillText(`${texto.data} às ${texto.hora}`, largura - margem - 50, 195);
    c.font = `italic 30px ${serifa}`;
    c.fillText("Bingo Musical – Anos Dourados", largura - margem - 50, 238);
  }

  function rodape(c, momento, numero, total) {
    const texto = textoDoMomento(momento);
    c.fillStyle = marrom;
    c.globalAlpha = 0.75;
    c.font = `26px ${serifa}`;
    c.textAlign = "left";
    c.fillText(`Relatório gerado automaticamente em ${texto.data} às ${texto.hora}`, margem, altura - 105);
    c.textAlign = "center";
    c.fillText("Jogo criado por Petrick Brayan", largura / 2, altura - 105);
    c.textAlign = "right";
    c.fillText(`Página ${numero} de ${total}`, largura - margem, altura - 105);
    c.globalAlpha = 1;
  }

  function cartoesResumo(c, itens, y) {
    const espaco = 30;
    const larguraCartao = (largura - margem * 2 - espaco * (itens.length - 1)) / itens.length;
    itens.forEach((item, indice) => {
      const x = margem + indice * (larguraCartao + espaco);
      c.fillStyle = faixaClara;
      c.fillRect(x, y, larguraCartao, 170);
      c.strokeStyle = ouro;
      c.lineWidth = 3;
      c.strokeRect(x, y, larguraCartao, 170);
      c.fillStyle = vinho;
      c.textAlign = "center";
      c.font = `bold 78px ${serifa}`;
      c.fillText(String(item.valor), x + larguraCartao / 2, y + 95);
      c.fillStyle = marrom;
      c.font = `28px ${serifa}`;
      c.fillText(item.rotulo, x + larguraCartao / 2, y + 145);
    });
  }

  function ajustarTexto(c, texto, larguraMaxima) {
    let resultado = texto;
    while (c.measureText(resultado).width > larguraMaxima && resultado.length > 4) {
      resultado = resultado.slice(0, -2);
    }
    return resultado === texto ? texto : resultado.trim() + "…";
  }

  function tabela(c, linhas, yInicial) {
    const colunas = [
      { titulo: "Pos.", x: margem + 30, alinhamento: "left" },
      { titulo: "Mesa", x: margem + 170, alinhamento: "left" },
      { titulo: "Pontos", x: 1380, alinhamento: "right" },
      { titulo: "Acertos", x: 1640, alinhamento: "right" },
      { titulo: "Erros", x: 1880, alinhamento: "right" },
      { titulo: "Microfone", x: 2130, alinhamento: "right" },
      { titulo: "Bônus", x: largura - margem - 30, alinhamento: "right" }
    ];
    c.fillStyle = marrom;
    c.fillRect(margem, yInicial, largura - margem * 2, 62);
    c.fillStyle = ouroClaro;
    c.font = `bold 30px ${serifa}`;
    colunas.forEach((coluna) => {
      c.textAlign = coluna.alinhamento;
      c.fillText(coluna.titulo, coluna.x, yInicial + 42);
    });
    linhas.forEach((linha, indice) => {
      const y = yInicial + 62 + indice * alturaLinha;
      c.fillStyle = indice % 2 === 0 ? "#fffdf6" : faixaClara;
      c.fillRect(margem, y, largura - margem * 2, alturaLinha);
      c.fillStyle = linha.posicao === 1 ? vinho : marrom;
      c.font = `${linha.posicao === 1 ? "bold " : ""}32px ${serifa}`;
      const valores = [linha.posicaoTexto, linha.nome, linha.pontos, linha.acertos, linha.erros, linha.microfones, linha.bonus];
      colunas.forEach((coluna, posicao) => {
        c.textAlign = coluna.alinhamento;
        const texto = posicao === 1 ? ajustarTexto(c, String(valores[posicao]), 950) : String(valores[posicao]);
        c.fillText(texto, coluna.x, y + 40);
      });
    });
    c.strokeStyle = ouro;
    c.lineWidth = 3;
    c.strokeRect(margem, yInicial, largura - margem * 2, 62 + linhas.length * alturaLinha);
  }

  function titulo(c, texto, y) {
    c.fillStyle = vinho;
    c.textAlign = "left";
    c.font = `bold 44px ${serifa}`;
    c.fillText(texto, margem, y);
    c.fillStyle = ouro;
    c.fillRect(margem, y + 14, 220, 5);
  }

  function linhasDoRanking(entrada, estatisticas) {
    return entrada.classificacao.map((item) => {
      const dados = estatisticas.porMesa[item.mesa] || { acertos: 0, erros: 0, microfones: 0, bonus: 0 };
      return {
        posicao: item.posicao,
        posicaoTexto: `${item.posicao}º`,
        nome: entrada.nomeDaMesa(item.mesa),
        pontos: item.pontos,
        acertos: dados.acertos,
        erros: dados.erros,
        microfones: dados.microfones,
        bonus: dados.bonus
      };
    });
  }

  function paginaDeDestaques(c, entrada, estatisticas) {
    let y = 400;
    titulo(c, "Troféus da noite", y);
    y += 80;
    c.font = `34px ${serifa}`;
    c.textAlign = "left";
    if (entrada.trofeus.length === 0) {
      c.fillStyle = marrom;
      c.fillText("Nenhum troféu foi conquistado nesta partida.", margem, y);
      y += 60;
    }
    entrada.trofeus.forEach((trofeu) => {
      c.fillStyle = vinho;
      c.font = `bold 36px ${serifa}`;
      c.fillText(`★ ${trofeu.titulo}`, margem, y);
      c.fillStyle = marrom;
      c.font = `34px ${serifa}`;
      c.fillText(ajustarTexto(c, `${trofeu.nomes}${trofeu.detalhe ? " — " + trofeu.detalhe : ""}`, 1700), margem + 420, y);
      y += 60;
    });
    y += 60;
    titulo(c, "Destaques das músicas", y);
    y += 80;
    c.fillStyle = marrom;
    c.fillStyle = marrom;
    c.font = `34px ${serifa}`;
    const musicaAcertada = estatisticas.maisAcertada ? entrada.musicas[estatisticas.maisAcertada.indice] : null;
    const musicaDificil = estatisticas.maisDificil ? entrada.musicas[estatisticas.maisDificil.indice] : null;
    c.fillText(musicaAcertada ? `Mais acertada: ${musicaAcertada.titulo} (${estatisticas.maisAcertada.quantidade} acerto${estatisticas.maisAcertada.quantidade > 1 ? "s" : ""})` : "Mais acertada: ainda não houve acertos", margem, y);
    y += 60;
    c.fillText(musicaDificil ? `Mais difícil: ${musicaDificil.titulo} (${estatisticas.maisDificil.quantidade} erro${estatisticas.maisDificil.quantidade > 1 ? "s" : ""})` : "Mais difícil: ainda não houve erros", margem, y);
    y += 120;
    titulo(c, "Resumo da partida", y);
    y += 80;
    const t = estatisticas.totais;
    const resumo = [
      `${entrada.classificacao.length} mesas participaram e ${estatisticas.musicasTocadas} música${estatisticas.musicasTocadas === 1 ? " foi tocada" : "s foram tocadas"}.`,
      `${t.acertos} acerto${t.acertos === 1 ? "" : "s"}, ${t.erros} erro${t.erros === 1 ? "" : "s"}, ${t.microfones} desafio${t.microfones === 1 ? "" : "s"} do microfone cumprido${t.microfones === 1 ? "" : "s"}.`,
      `${t.bonus} bônus do cantor ganho${t.bonus === 1 ? "" : "s"} e ${t.penalidades} perda${t.penalidades === 1 ? "" : "s"} por errar o cantor.`,
      `${t.coringas} jogada${t.coringas === 1 ? "" : "s"} com coringa.`
    ];
    c.fillStyle = marrom;
    c.font = `34px ${serifa}`;
    resumo.forEach((linha) => {
      c.fillText(`• ${linha}`, margem, y);
      y += 58;
    });
  }

  function gerarPaginas(entrada) {
    const momento = entrada.momento || new Date();
    const estatisticas = calcularEstatisticas(entrada);
    const linhas = linhasDoRanking(entrada, estatisticas);
    const primeiras = linhas.slice(0, linhasPorPaginaInicial);
    const restantes = linhas.slice(linhasPorPaginaInicial);
    const continuacoes = [];
    for (let i = 0; i < restantes.length; i += linhasPorPaginaContinuacao) {
      continuacoes.push(restantes.slice(i, i + linhasPorPaginaContinuacao));
    }
    const total = 2 + continuacoes.length;
    const paginas = [];

    const primeira = novaPagina();
    cabecalho(primeira.c, "RELATÓRIO DA PARTIDA", momento);
    cartoesResumo(primeira.c, [
      { valor: linhas.length, rotulo: "mesas" },
      { valor: estatisticas.musicasTocadas, rotulo: "músicas tocadas" },
      { valor: estatisticas.totais.acertos, rotulo: "acertos" },
      { valor: estatisticas.totais.erros, rotulo: "erros" },
      { valor: estatisticas.totais.microfones, rotulo: "microfones" },
      { valor: estatisticas.totais.coringas, rotulo: "coringas jogados" }
    ], 310);
    titulo(primeira.c, "Classificação", 585);
    tabela(primeira.c, primeiras, 625);
    rodape(primeira.c, momento, 1, total);
    paginas.push(primeira.tela);

    continuacoes.forEach((grupo, indice) => {
      const pagina = novaPagina();
      cabecalho(pagina.c, "CLASSIFICAÇÃO (continuação)", momento);
      tabela(pagina.c, grupo, 330);
      rodape(pagina.c, momento, 2 + indice, total);
      paginas.push(pagina.tela);
    });

    const ultima = novaPagina();
    cabecalho(ultima.c, "DESTAQUES DA NOITE", momento);
    paginaDeDestaques(ultima.c, entrada, estatisticas);
    rodape(ultima.c, momento, total, total);
    paginas.push(ultima.tela);

    return paginas;
  }

  return { gerarPaginas, calcularEstatisticas };
})();
