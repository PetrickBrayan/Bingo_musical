const Preparacao = (() => {
  const pegar = (identificador) => document.getElementById(identificador);
  const botaoPreparar = pegar("botaoPreparar");
  const seloPreparacao = pegar("seloPreparacao");
  const situacaoOffline = pegar("situacaoOffline");
  const listaEditorMesas = pegar("listaEditorMesas");
  const corpoEditorMusicas = pegar("corpoEditorMusicas");
  const resumoChecklist = pegar("resumoChecklist");
  const itensChecklist = pegar("itensChecklist");
  const relogioIntervalo = pegar("relogioIntervalo");
  const listaIntervalo = pegar("listaIntervalo");
  const certificados = pegar("certificados");

  let rascunho = [];
  let resultadosAudio = [];
  let temporizadorIntervalo = null;
  let segundosIntervalo = 0;
  let somTestado = false;
  let telaCheiaTestada = false;

  function criar(etiqueta, classe, texto) {
    const elemento = document.createElement(etiqueta);
    if (classe) {
      elemento.className = classe;
    }
    if (texto !== undefined) {
      elemento.textContent = texto;
    }
    return elemento;
  }

  function limpar(elemento) {
    while (elemento.firstChild) {
      elemento.removeChild(elemento.firstChild);
    }
  }

  function aoClicar(identificador, acao) {
    const botao = pegar(identificador);
    botao.addEventListener("mousedown", (evento) => evento.preventDefault());
    botao.addEventListener("click", acao);
  }

  function abrirHub() {
    Tela.abrirSobreposicao("preparacao");
    atualizarOffline();
  }

  function alternar() {
    if (Tela.sobreposicaoAbertaPorId("preparacao")) {
      Tela.fecharSobreposicoes();
    } else {
      abrirHub();
    }
  }

  function atualizarOffline() {
    Offline.situacao().then((estado) => {
      situacaoOffline.textContent = estado.texto;
    });
  }

  function acionarOffline() {
    Offline.situacao().then((estado) => {
      if (!estado.disponivel || !estado.pronto) {
        Tela.mostrarAviso(estado.texto);
        return null;
      }
      Tela.mostrarAviso("Guardando os áudios…");
      return Offline.baixarAudios((feitos, total) => {
        situacaoOffline.textContent = `Guardando áudios: ${feitos} de ${total}`;
      }).then(() => {
        atualizarOffline();
        return Offline.instalar();
      });
    });
  }

  function renderizarEditorMesas() {
    limpar(listaEditorMesas);
    for (let mesa = 1; mesa <= CONFIGURACAO.quantidadeMesas; mesa++) {
      const linha = criar("div", "linha-editor-mesa");
      linha.appendChild(criar("span", "linha-editor-mesa__numero", String(mesa)));
      const cor = criar("button", "cor-mesa");
      cor.type = "button";
      cor.setAttribute("aria-label", `Trocar a cor da mesa ${mesa}`);
      cor.style.background = Mesas.cor(mesa);
      cor.addEventListener("click", () => {
        cor.style.background = Mesas.trocarCor(mesa);
        Jogo.renderizar();
      });
      const campo = criar("input");
      campo.type = "text";
      campo.maxLength = 28;
      campo.placeholder = "Nome da mesa (opcional)";
      campo.value = Mesas.nome(mesa);
      campo.addEventListener("input", () => {
        Mesas.definirNome(mesa, campo.value);
        Jogo.renderizar();
      });
      linha.appendChild(cor);
      linha.appendChild(campo);
      listaEditorMesas.appendChild(linha);
    }
  }

  function abrirEditorMesas() {
    renderizarEditorMesas();
    Tela.abrirSobreposicao("editorMesas");
  }

  function criarCampo(posicao, campo, tipo, extra) {
    const entrada = criar("input");
    entrada.type = tipo || "text";
    entrada.value = rascunho[posicao][campo] === undefined ? "" : rascunho[posicao][campo];
    if (tipo === "number") {
      entrada.min = "1";
    }
    if (extra) {
      entrada.setAttribute("list", extra);
    }
    entrada.addEventListener("input", () => {
      rascunho[posicao][campo] = tipo === "number" ? Number(entrada.value) : entrada.value;
    });
    return entrada;
  }

  function criarSeletor(posicao, campo, opcoes) {
    const seletor = criar("select");
    opcoes.forEach((opcao) => {
      const item = criar("option", "", opcao.texto);
      item.value = opcao.valor;
      seletor.appendChild(item);
    });
    seletor.value = rascunho[posicao][campo] || "";
    seletor.addEventListener("change", () => {
      rascunho[posicao][campo] = seletor.value;
    });
    return seletor;
  }

  function mover(posicao, passo) {
    const destino = posicao + passo;
    if (destino < 0 || destino >= rascunho.length) {
      return;
    }
    const guardado = rascunho[posicao];
    rascunho[posicao] = rascunho[destino];
    rascunho[destino] = guardado;
    renderizarEditorMusicas();
  }

  function criarBotaoPequeno(texto, acao, rotulo) {
    const botao = criar("button", "botao-controle", texto);
    botao.type = "button";
    botao.setAttribute("aria-label", rotulo);
    botao.addEventListener("click", acao);
    return botao;
  }

  function renderizarEditorMusicas() {
    limpar(corpoEditorMusicas);
    rascunho.forEach((musica, posicao) => {
      const linha = document.createElement("tr");
      linha.appendChild(criar("td", "", String(posicao + 1)));
      [
        criarCampo(posicao, "titulo"),
        criarCampo(posicao, "interprete"),
        criarSeletor(posicao, "decada", Catalogo.decadas.map((decada) => ({ valor: decada, texto: decada }))),
        criarCampo(posicao, "categoria", "text", "listaCategorias"),
        criarCampo(posicao, "duracaoSegundos", "number"),
        criarCampo(posicao, "pontos", "number"),
        criarSeletor(posicao, "especial", Object.keys(Catalogo.especiais).map((chave) => ({ valor: chave, texto: Catalogo.especiais[chave] }))),
        criarCampo(posicao, "dica"),
        criarCampo(posicao, "parteParaCantar"),
        criarCampo(posicao, "arquivo")
      ].forEach((controle) => {
        const celula = criar("td");
        celula.appendChild(controle);
        linha.appendChild(celula);
      });
      const ordem = criar("td", "celula-ordem");
      ordem.appendChild(criarBotaoPequeno("↑", () => mover(posicao, -1), "Subir"));
      ordem.appendChild(criarBotaoPequeno("↓", () => mover(posicao, 1), "Descer"));
      ordem.appendChild(criarBotaoPequeno("✕", () => {
        rascunho.splice(posicao, 1);
        renderizarEditorMusicas();
      }, "Remover"));
      linha.appendChild(ordem);
      corpoEditorMusicas.appendChild(linha);
    });
  }

  function garantirListaDeCategorias() {
    if (pegar("listaCategorias")) {
      return;
    }
    const lista = criar("datalist");
    lista.id = "listaCategorias";
    Catalogo.categorias.forEach((categoria) => {
      const item = document.createElement("option");
      item.value = categoria;
      lista.appendChild(item);
    });
    document.body.appendChild(lista);
  }

  function abrirEditorMusicas() {
    garantirListaDeCategorias();
    rascunho = Catalogo.copiaAtual();
    renderizarEditorMusicas();
    Tela.abrirSobreposicao("editorMusicas");
  }

  function salvarMusicas() {
    if (!Catalogo.salvar(rascunho)) {
      Tela.mostrarAviso("Preencha ao menos uma música com título e cantor");
      return;
    }
    Jogo.aplicarNovoCatalogo();
    rascunho = Catalogo.copiaAtual();
    renderizarEditorMusicas();
    Tela.mostrarAviso("Músicas salvas. Jogo salvo anterior foi apagado.");
    testarAudios(true);
  }

  function restaurarMusicas() {
    Catalogo.restaurarPadrao();
    Jogo.aplicarNovoCatalogo();
    rascunho = Catalogo.copiaAtual();
    renderizarEditorMusicas();
    Tela.mostrarAviso("Lista original restaurada");
    testarAudios(true);
  }

  function testarArquivo(musica, minimo) {
    return new Promise((resolver) => {
      const audio = new Audio();
      let concluido = false;
      const terminar = (situacao, texto) => {
        if (concluido) {
          return;
        }
        concluido = true;
        clearTimeout(limite);
        audio.removeAttribute("src");
        resolver({ situacao, texto });
      };
      const limite = setTimeout(() => terminar("erro", "Não respondeu a tempo"), 9000);
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () => {
        const duracao = audio.duration;
        if (Number.isFinite(duracao) && duracao + 0.5 < minimo) {
          terminar("alerta", `Só tem ${Math.round(duracao)}s e o trecho pede ${minimo}s`);
        } else {
          terminar("ok", Number.isFinite(duracao) ? `${Math.round(duracao)}s de áudio` : "Encontrado");
        }
      });
      audio.addEventListener("error", () => terminar("erro", "Arquivo faltando ou ilegível"));
      audio.src = CONFIGURACAO.pastaAudios + musica.arquivo;
    });
  }

  function testarAudios(silencioso) {
    const alvos = MUSICAS.map((musica, indice) => ({
      rotulo: `${indice + 1}. ${musica.titulo}`,
      musica,
      minimo: (musica.duracaoSegundos || CONFIGURACAO.duracaoPadraoTrechoSegundos) + CONFIGURACAO.segundosDeAjuda,
      obrigatorio: true
    })).concat(MUSICAS_DESEMPATE.map((musica, indice) => ({
      rotulo: `Desempate ${indice + 1}: ${musica.titulo}`,
      musica,
      minimo: musica.duracaoSegundos,
      obrigatorio: false
    })));
    return Promise.all(alvos.map((alvo) => testarArquivo(alvo.musica, alvo.minimo).then((resultado) => {
      if (resultado.situacao === "erro" && !alvo.obrigatorio) {
        resultado.situacao = "alerta";
        resultado.texto += " (só é usado no desempate)";
      }
      return Object.assign({ rotulo: alvo.rotulo, arquivo: alvo.musica.arquivo }, resultado);
    }))).then((resultados) => {
      resultadosAudio = resultados;
      const faltando = resultados.filter((item) => item.situacao === "erro").length;
      seloPreparacao.textContent = `${faltando} MP3 faltando`;
      seloPreparacao.hidden = faltando === 0;
      if (!silencioso || Tela.sobreposicaoAbertaPorId("checklist")) {
        renderizarChecklist();
      }
      return resultados;
    });
  }

  function renderizarChecklist() {
    limpar(itensChecklist);
    const itens = [
      { situacao: somTestado ? "ok" : "alerta", texto: somTestado ? "Som testado" : "Som ainda não testado: toque em “Tocar som de teste”" },
      { situacao: telaCheiaTestada ? "ok" : "alerta", texto: telaCheiaTestada ? "Tela cheia testada" : "Tela cheia ainda não testada" }
    ].concat(resultadosAudio.map((item) => ({
      situacao: item.situacao,
      texto: `${item.rotulo} (${item.arquivo}): ${item.texto}`
    })));
    itens.forEach((item) => {
      const linha = criar("li", "", item.texto);
      linha.dataset.situacao = item.situacao;
      itensChecklist.appendChild(linha);
    });
    const faltando = resultadosAudio.filter((item) => item.situacao === "erro").length;
    const avisos = itens.filter((item) => item.situacao === "alerta").length;
    resumoChecklist.classList.toggle("problema", faltando > 0);
    if (resultadosAudio.length === 0) {
      resumoChecklist.textContent = "Rodando o teste…";
    } else if (faltando > 0) {
      resumoChecklist.textContent = `ATENÇÃO: ${faltando} arquivo(s) de áudio faltando. Coloque-os na pasta audios.`;
    } else if (avisos > 0) {
      resumoChecklist.textContent = `Quase lá: ${avisos} item(ns) para conferir.`;
    } else {
      resumoChecklist.textContent = "Tudo certo! Pode começar a festa.";
    }
  }

  function abrirChecklist() {
    Tela.abrirSobreposicao("checklist");
    resultadosAudio = [];
    renderizarChecklist();
    testarAudios(false);
  }

  function testarSom() {
    Efeitos.preparar();
    Efeitos.acerto();
    somTestado = true;
    renderizarChecklist();
  }

  function testarTelaCheia() {
    Tela.alternarTelaCheia();
    telaCheiaTestada = true;
    renderizarChecklist();
  }

  function formatarRelogio(segundos) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
  }

  function atualizarRelogio() {
    relogioIntervalo.textContent = segundosIntervalo > 0 ? formatarRelogio(segundosIntervalo) : "Já vamos!";
  }

  function pararIntervalo() {
    clearInterval(temporizadorIntervalo);
    temporizadorIntervalo = null;
  }

  function ajustarMinuto(minutos) {
    segundosIntervalo = Math.max(segundosIntervalo + minutos * 60, 0);
    atualizarRelogio();
  }

  function renderizarClassificacaoDoIntervalo() {
    limpar(listaIntervalo);
    const classificacao = Placar.classificacao();
    classificacao.slice(0, 10).forEach((item) => {
      const linha = criar("li", item.posicao === 1 && item.pontos > 0 ? "lider" : "");
      linha.appendChild(criar("span", "lista-placar__posicao", item.pontos > 0 ? `${item.posicao}º` : "–"));
      linha.appendChild(criar("span", "lista-placar__mesa", Mesas.rotulo(item.mesa)));
      linha.appendChild(criar("span", "lista-placar__pontos", String(item.pontos)));
      listaIntervalo.appendChild(linha);
    });
  }

  function abrirIntervalo() {
    const estado = Jogo.estadoDaPartida();
    if (estado === "tocando" || estado === "respondendo" || estado === "cantando" || estado === "cantor") {
      Tela.mostrarAviso("Pause a música antes de abrir o intervalo");
      return;
    }
    pararIntervalo();
    segundosIntervalo = CONFIGURACAO.duracaoIntervaloMinutos * 60;
    renderizarClassificacaoDoIntervalo();
    atualizarRelogio();
    Tela.abrirSobreposicao("intervalo");
    temporizadorIntervalo = setInterval(() => {
      if (!Tela.sobreposicaoAbertaPorId("intervalo")) {
        pararIntervalo();
        return;
      }
      segundosIntervalo = Math.max(segundosIntervalo - 1, 0);
      atualizarRelogio();
      if (segundosIntervalo === 0) {
        pararIntervalo();
        Efeitos.vitoria();
      }
    }, 1000);
  }

  function dataPorExtenso() {
    return new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  }

  function abrirCertificado() {
    const classificacao = Placar.classificacao();
    const lideres = classificacao.filter((item) => item.posicao === 1 && item.pontos > 0);
    if (lideres.length === 0) {
      Tela.mostrarAviso("Ainda não há mesa campeã");
      return;
    }
    limpar(certificados);
    lideres.forEach((item) => {
      const cartao = criar("article", "certificado");
      cartao.appendChild(criar("p", "certificado__faixa", "Bingo Musical • Anos Dourados"));
      cartao.appendChild(criar("h3", "certificado__titulo", "Certificado de Mesa Campeã"));
      cartao.appendChild(criar("p", "certificado__texto", "Com muito talento, ouvido afinado e boa memória, a"));
      cartao.appendChild(criar("p", "certificado__mesa", Mesas.rotulo(item.mesa)));
      cartao.appendChild(criar("p", "certificado__texto", `conquistou o 1º lugar com ${item.pontos} pontos.`));
      cartao.appendChild(criar("p", "certificado__rodape", `${dataPorExtenso()} • Jogo criado por Petrick Brayan`));
      certificados.appendChild(cartao);
    });
    Tela.abrirSobreposicao("certificado");
  }

  function iniciar() {
    botaoPreparar.addEventListener("mousedown", (evento) => evento.preventDefault());
    botaoPreparar.addEventListener("click", abrirHub);
    aoClicar("botaoCartaoMesas", abrirEditorMesas);
    aoClicar("botaoCartaoMusicas", abrirEditorMusicas);
    aoClicar("botaoCartaoChecklist", abrirChecklist);
    aoClicar("botaoCartaoOffline", acionarOffline);
    aoClicar("botaoSugerirNomes", () => {
      Mesas.sugerirNomes(CONFIGURACAO.quantidadeMesas);
      renderizarEditorMesas();
      Jogo.renderizar();
    });
    aoClicar("botaoLimparNomes", () => {
      Mesas.limparNomes();
      renderizarEditorMesas();
      Jogo.renderizar();
    });
    aoClicar("botaoSalvarMusicas", salvarMusicas);
    aoClicar("botaoAdicionarMusica", () => {
      rascunho.push(Catalogo.novaMusica(rascunho.length));
      renderizarEditorMusicas();
    });
    aoClicar("botaoRestaurarMusicas", restaurarMusicas);
    aoClicar("botaoTestarSom", testarSom);
    aoClicar("botaoTestarTelaCheia", testarTelaCheia);
    aoClicar("botaoRetestar", abrirChecklist);
    aoClicar("botaoMenosMinuto", () => ajustarMinuto(-1));
    aoClicar("botaoMaisMinuto", () => ajustarMinuto(1));
    aoClicar("botaoImprimirCertificado", () => window.print());
    aoClicar("botaoCertificado", abrirCertificado);
    aoClicar("botaoIntervaloFinal", abrirIntervalo);
    Offline.registrar(atualizarOffline);
    testarAudios(true);
  }

  iniciar();

  return { alternar, abrirIntervalo, abrirCertificado, testarAudios };
})();
