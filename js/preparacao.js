const Preparacao = (() => {
  const pegar = (identificador) => document.getElementById(identificador) || document.createElement("div");
  const botaoPreparar = pegar("botaoPreparar");
  const seloPreparacao = pegar("seloPreparacao");
  const situacaoOffline = pegar("situacaoOffline");
  const listaEditorMesas = pegar("listaEditorMesas");
  const corpoEditorMusicas = pegar("corpoEditorMusicas");
  const resumoChecklist = pegar("resumoChecklist");
  const itensChecklist = pegar("itensChecklist");
  const relogioIntervalo = pegar("relogioIntervalo");
  const listaIntervalo = pegar("listaIntervalo");
  const statusMesas = pegar("statusMesas");
  const statusMusicas = pegar("statusMusicas");
  const statusChecklist = pegar("statusChecklist");
  const resumoMesas = pegar("resumoMesas");
  const resumoMusicas = pegar("resumoMusicas");
  const problemasMusicas = pegar("problemasMusicas");
  const filtroMusicas = pegar("filtroMusicas");
  const areaColarNomes = pegar("areaColarNomes");
  const campoColarNomes = pegar("campoColarNomes");
  const certificados = pegar("certificados");
  const relatorios = pegar("relatorios");

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

  function textoDeEspeciais(contagem) {
    const partes = [];
    if (contagem.dobro + contagem.relampago + contagem.surpresa > 0) {
      partes.push(`${contagem.dobro + contagem.relampago + contagem.surpresa} especiais`);
    }
    if (contagem.karaoke > 0) {
      partes.push(`${contagem.karaoke} de karaokê`);
    }
    return partes.length ? ` · ${partes.join(" · ")}` : "";
  }

  function atualizarResumos() {
    try {
      calcularResumos();
    } catch (erro) {
      statusMesas.textContent = "";
      statusMusicas.textContent = "";
      statusChecklist.textContent = "";
    }
  }

  function calcularResumos() {
    const analise = Catalogo.analisar(Catalogo.copiaAtual());
    statusMesas.textContent = `${Mesas.contarNomes(CONFIGURACAO.quantidadeMesas)} de ${CONFIGURACAO.quantidadeMesas} mesas com nome`;
    statusMusicas.textContent = `${analise.contagem.total} músicas${textoDeEspeciais(analise.contagem)}`;
    const faltando = resultadosAudio.filter((resultado) => resultado.situacao === "erro").length;
    statusChecklist.textContent = resultadosAudio.length === 0
      ? "Ainda não testado"
      : (faltando === 0 ? "Todos os áudios encontrados" : (Catalogo.quantasIgnoradas() > 0 ? `${faltando} sem áudio, o jogo pula sozinho` : `${faltando} áudio(s) com problema`));
    statusChecklist.className = "status-preparacao" + (resultadosAudio.length > 0 && faltando > 0 ? " status-preparacao--alerta" : "");
    statusMusicas.className = "status-preparacao" + (analise.problemas.length > 0 ? " status-preparacao--alerta" : "");
    if (analise.problemas.length > 0) {
      statusMusicas.textContent += ` · ${analise.problemas.length} aviso(s)`;
    }
  }

  function abrirHub() {
    Tela.abrirSobreposicao("preparacao");
    atualizarResumos();
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
      campo.setAttribute("aria-label", `Nome da mesa ${mesa}`);
      campo.addEventListener("input", () => {
        Mesas.definirNome(mesa, campo.value);
        atualizarResumoDeMesas();
        Jogo.renderizar();
      });
      campo.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
          evento.preventDefault();
          const proximo = listaEditorMesas.querySelectorAll("input")[mesa];
          if (proximo) {
            proximo.focus();
          }
        }
      });
      linha.appendChild(cor);
      linha.appendChild(campo);
      listaEditorMesas.appendChild(linha);
    }
  }

  function atualizarResumoDeMesas() {
    if (typeof Mesas.contarNomes !== "function") {
      return;
    }
    resumoMesas.textContent = `${Mesas.contarNomes(CONFIGURACAO.quantidadeMesas)} de ${CONFIGURACAO.quantidadeMesas} mesas já têm nome.`;
  }

  function abrirEditorMesas() {
    areaColarNomes.hidden = true;
    renderizarEditorMesas();
    atualizarResumoDeMesas();
    Tela.abrirSobreposicao("editorMesas");
  }

  function aplicarNomesColados() {
    const linhas = campoColarNomes.value.split(/\r?\n/).map((linha) => linha.trim());
    while (linhas.length > 0 && linhas[linhas.length - 1] === "") {
      linhas.pop();
    }
    if (linhas.length === 0) {
      Tela.mostrarAviso("Cole ao menos um nome, um por linha");
      return;
    }
    Mesas.definirNomes(linhas, CONFIGURACAO.quantidadeMesas);
    campoColarNomes.value = "";
    areaColarNomes.hidden = true;
    renderizarEditorMesas();
    atualizarResumoDeMesas();
    Jogo.renderizar();
    const excedente = linhas.length - CONFIGURACAO.quantidadeMesas;
    Tela.mostrarAviso(excedente > 0 ? `Nomes aplicados. ${excedente} linha(s) passaram do número de mesas.` : "Nomes aplicados");
  }

  const rotulosDosCampos = {
    titulo: "Título", interprete: "Cantor", categoria: "Categoria", duracaoSegundos: "Trecho em segundos",
    pontos: "Pontos", dica: "Dica", parteParaCantar: "Parte para cantar", arquivo: "Arquivo de áudio",
    decada: "Década", especial: "Especial"
  };

  function criarCampo(posicao, campo, tipo, extra) {
    const entrada = criar("input");
    entrada.setAttribute("aria-label", `${rotulosDosCampos[campo]} da música ${posicao + 1}`);
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
      atualizarAvisosDeMusicas();
    });
    return entrada;
  }

  function criarSeletor(posicao, campo, opcoes) {
    const seletor = criar("select");
    seletor.setAttribute("aria-label", `${rotulosDosCampos[campo]} da música ${posicao + 1}`);
    opcoes.forEach((opcao) => {
      const item = criar("option", "", opcao.texto);
      item.value = opcao.valor;
      seletor.appendChild(item);
    });
    seletor.value = rascunho[posicao][campo] || "";
    seletor.addEventListener("change", () => {
      rascunho[posicao][campo] = seletor.value;
      atualizarAvisosDeMusicas();
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

  function textoPesquisavel(musica) {
    return `${musica.titulo || ""} ${musica.interprete || ""} ${musica.decada || ""} ${musica.categoria || ""}`.toLowerCase();
  }

  function atualizarAvisosDeMusicas() {
    if (typeof Catalogo.analisar !== "function") {
      return;
    }
    const analise = Catalogo.analisar(rascunho);
    const contagem = analise.contagem;
    resumoMusicas.textContent = `${contagem.total} músicas${textoDeEspeciais(contagem)}.`;
    limpar(problemasMusicas);
    analise.problemas.forEach((problema) => {
      problemasMusicas.appendChild(criar("li", "", problema.texto));
    });
    problemasMusicas.hidden = analise.problemas.length === 0;
    const comProblema = {};
    analise.problemas.forEach((problema) => { comProblema[problema.posicao] = true; });
    Array.prototype.forEach.call(corpoEditorMusicas.querySelectorAll("tr"), (linha) => {
      linha.classList.toggle("linha-com-problema", Boolean(comProblema[Number(linha.getAttribute("data-posicao"))]));
    });
  }

  function aplicarFiltroDeMusicas() {
    const termo = filtroMusicas.value.trim().toLowerCase();
    Array.prototype.forEach.call(corpoEditorMusicas.querySelectorAll("tr"), (linha) => {
      const musica = rascunho[Number(linha.getAttribute("data-posicao"))];
      linha.hidden = termo !== "" && textoPesquisavel(musica).indexOf(termo) === -1;
    });
  }

  function embaralharMusicas() {
    for (let i = rascunho.length - 1; i > 0; i--) {
      const sorteado = Math.floor(Math.random() * (i + 1));
      const guardado = rascunho[i];
      rascunho[i] = rascunho[sorteado];
      rascunho[sorteado] = guardado;
    }
    renderizarEditorMusicas();
    Tela.mostrarAviso("Ordem embaralhada. Toque em Salvar para valer.");
  }

  function ordenarMusicasPorDecada() {
    const indexadas = rascunho.map((musica, posicao) => ({ musica, posicao }));
    indexadas.sort((a, b) => {
      const diferenca = Catalogo.decadas.indexOf(a.musica.decada) - Catalogo.decadas.indexOf(b.musica.decada);
      return diferenca !== 0 ? diferenca : a.posicao - b.posicao;
    });
    rascunho = indexadas.map((item) => item.musica);
    renderizarEditorMusicas();
    Tela.mostrarAviso("Ordenadas dos anos 50 aos 90. Toque em Salvar para valer.");
  }

  function duplicarMusica(posicao) {
    const copia = JSON.parse(JSON.stringify(rascunho[posicao]));
    copia.titulo = `${copia.titulo} (cópia)`;
    copia.arquivo = "";
    rascunho.splice(posicao + 1, 0, copia);
    renderizarEditorMusicas();
  }

  function baixarMusicas() {
    const codigo = Catalogo.gerarCodigo(rascunho, MUSICAS_DESEMPATE);
    entregarArquivo(new Blob([codigo], { type: "text/javascript;charset=utf-8" }), "musicas.js");
    Tela.mostrarAviso("musicas.js gerado. Troque o arquivo js/musicas.js do projeto por ele.");
  }

  function renderizarEditorMusicas() {
    limpar(corpoEditorMusicas);
    rascunho.forEach((musica, posicao) => {
      const linha = document.createElement("tr");
      linha.setAttribute("data-posicao", String(posicao));
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
      ordem.appendChild(criarBotaoPequeno("⧉", () => duplicarMusica(posicao), "Duplicar"));
      ordem.appendChild(criarBotaoPequeno("✕", () => {
        rascunho.splice(posicao, 1);
        renderizarEditorMusicas();
      }, "Remover"));
      linha.appendChild(ordem);
      corpoEditorMusicas.appendChild(linha);
    });
    atualizarAvisosDeMusicas();
    aplicarFiltroDeMusicas();
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
    filtroMusicas.value = "";
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

  function consultarServidor(endereco) {
    if (!window.fetch || location.protocol === "file:") {
      return Promise.resolve("desconhecido");
    }
    return fetch(endereco, { method: "HEAD", cache: "no-store" })
      .then((resposta) => {
        const tipo = resposta.headers.get("Content-Type") || "";
        if (resposta.status === 404 || resposta.status === 410 || (resposta.ok && tipo.indexOf("text/html") === 0)) {
          return "faltando";
        }
        return resposta.ok ? "existe" : "desconhecido";
      })
      .catch(() => "desconhecido");
  }

  function estaNoCacheDeAudios(endereco) {
    if (!window.caches) {
      return Promise.resolve(false);
    }
    return caches.open("bingo-audios-v1")
      .then((cache) => cache.match(new URL(endereco, location.href).href.split("?")[0]))
      .then((guardado) => Boolean(guardado))
      .catch(() => false);
  }

  function lerDuracao(endereco, minimo, existeComCerteza) {
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
      const limite = setTimeout(() => {
        terminar(existeComCerteza ? "ok" : "alerta", existeComCerteza ? "Encontrado" : "Não deu para conferir agora");
      }, existeComCerteza ? 6000 : 12000);
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () => {
        const duracao = audio.duration;
        if (Number.isFinite(duracao) && duracao + 0.5 < minimo) {
          terminar("alerta", `Só tem ${Math.round(duracao)}s e o trecho pede ${minimo}s`);
        } else {
          terminar("ok", Number.isFinite(duracao) ? `${Math.round(duracao)}s de áudio` : "Encontrado");
        }
      });
      audio.addEventListener("error", () => {
        terminar(existeComCerteza ? "alerta" : "erro", existeComCerteza ? "Existe, mas o navegador não conseguiu ler" : "Arquivo faltando ou ilegível");
      });
      audio.src = endereco;
    });
  }

  function testarArquivo(musica, minimo) {
    const endereco = CONFIGURACAO.pastaAudios + musica.arquivo;
    return consultarServidor(endereco).then((situacaoNoServidor) => {
      if (situacaoNoServidor === "faltando") {
        return { situacao: "erro", texto: "Arquivo faltando na pasta audios" };
      }
      if (situacaoNoServidor === "existe") {
        return lerDuracao(endereco, minimo, true);
      }
      return estaNoCacheDeAudios(endereco).then((guardado) => lerDuracao(endereco, minimo, guardado));
    });
  }

  function executarEmLotes(tarefas, limite) {
    const resultados = new Array(tarefas.length);
    let proxima = 0;
    const trabalhador = () => {
      if (proxima >= tarefas.length) {
        return Promise.resolve();
      }
      const posicao = proxima;
      proxima += 1;
      return tarefas[posicao]().then((resultado) => {
        resultados[posicao] = resultado;
        return trabalhador();
      });
    };
    const trabalhadores = [];
    for (let numero = 0; numero < Math.min(limite, tarefas.length); numero++) {
      trabalhadores.push(trabalhador());
    }
    return Promise.all(trabalhadores).then(() => resultados);
  }

  function testarAudios(silencioso) {
    const alvos = Catalogo.copiaAtual().map((musica, indice) => ({
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
    return executarEmLotes(alvos.map((alvo) => () => testarArquivo(alvo.musica, alvo.minimo).then((resultado) => {
      if (resultado.situacao === "erro" && !alvo.obrigatorio) {
        resultado.situacao = "alerta";
        resultado.texto += " (só é usado no desempate)";
      }
      return Object.assign({ rotulo: alvo.rotulo, arquivo: alvo.musica.arquivo }, resultado);
    })), 4).then((resultados) => {
      resultadosAudio = resultados;
      const faltando = resultados.filter((item) => item.situacao === "erro").length;
      Jogo.aplicarDisponibilidadeDeAudios(resultados.filter((item) => item.situacao === "erro").map((item) => item.arquivo));
      seloPreparacao.textContent = `${faltando} MP3 faltando`;
      seloPreparacao.hidden = faltando === 0;
      atualizarResumos();
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
    const ignoradas = Catalogo.quantasIgnoradas();
    resumoChecklist.classList.toggle("problema", faltando > 0 && ignoradas === 0);
    if (resultadosAudio.length === 0) {
      resumoChecklist.textContent = "Rodando o teste…";
    } else if (faltando > 0 && ignoradas > 0) {
      resumoChecklist.textContent = `O jogo já pula sozinho as ${ignoradas} música(s) sem áudio e joga com as ${MUSICAS.length} que estão prontas. Para incluir as outras, coloque os MP3 na pasta audios.`;
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

  let certificadosGerados = [];

  function abrirCertificado() {
    const classificacao = Placar.classificacao();
    const campeas = classificacao.filter((item) => item.posicao === 1 && item.pontos > 0);
    if (campeas.length === 0) {
      Tela.mostrarAviso("Ainda não há mesa campeã");
      return;
    }
    const trofeus = Trofeus.calcular(Placar.exportar().historico, CONFIGURACAO.quantidadeMesas);
    const momento = new Date();
    certificadosGerados = campeas.map((item) => {
      const dados = {
        mesa: Mesas.rotulo(item.mesa),
        numeroMesa: item.mesa,
        pontos: item.pontos,
        posicao: 1,
        totalMesas: CONFIGURACAO.quantidadeMesas,
        trofeus: trofeus.filter((trofeu) => trofeu.mesas.indexOf(item.mesa) !== -1).map((trofeu) => trofeu.titulo),
        momento
      };
      return { dados, jpeg: Certificado.jpegEmBytes(Certificado.gerarCanvas(dados)) };
    });
    limpar(certificados);
    certificadosGerados.forEach((certificado) => {
      const imagem = criar("img", "certificado-imagem");
      imagem.alt = `Certificado de mesa campeã: ${certificado.dados.mesa}`;
      imagem.src = certificado.jpeg.dataUrl;
      certificados.appendChild(imagem);
    });
    Tela.abrirSobreposicao("certificado");
  }

  let paginasDoRelatorio = [];
  let momentoDoRelatorio = new Date();

  function abrirRelatorio() {
    const historico = Placar.exportar().historico;
    if (historico.length === 0) {
      Tela.mostrarAviso("Ainda não há dados para o relatório");
      return;
    }
    momentoDoRelatorio = new Date();
    const trofeus = Trofeus.calcular(historico, CONFIGURACAO.quantidadeMesas).map((trofeu) => ({
      titulo: trofeu.titulo,
      detalhe: trofeu.detalhe,
      nomes: trofeu.mesas.map((mesa) => Mesas.rotulo(mesa)).join(", ")
    }));
    const telas = Relatorio.gerarPaginas({
      historico,
      classificacao: Placar.classificacao(),
      trofeus,
      musicas: MUSICAS,
      nomeDaMesa: (mesa) => Mesas.rotulo(mesa),
      momento: momentoDoRelatorio
    });
    paginasDoRelatorio = telas.map((tela) => Certificado.jpegEmBytes(tela));
    limpar(relatorios);
    paginasDoRelatorio.forEach((pagina, indice) => {
      const imagem = criar("img", "certificado-imagem");
      imagem.alt = `Relatório da partida, página ${indice + 1} de ${paginasDoRelatorio.length}`;
      imagem.src = pagina.dataUrl;
      relatorios.appendChild(imagem);
    });
    Tela.abrirSobreposicao("relatorio");
  }

  function nomeDoRelatorio(extensao, indice) {
    const dois = (valor) => String(valor).padStart(2, "0");
    const m = momentoDoRelatorio;
    const sufixo = indice === undefined ? "" : `-pagina-${indice + 1}`;
    return `relatorio-bingo-musical-${m.getFullYear()}${dois(m.getMonth() + 1)}${dois(m.getDate())}-${dois(m.getHours())}${dois(m.getMinutes())}${sufixo}.${extensao}`;
  }

  function baixarRelatorioPdf() {
    if (paginasDoRelatorio.length === 0) {
      return;
    }
    entregarArquivo(Certificado.montarPdf(paginasDoRelatorio), nomeDoRelatorio("pdf"));
    Tela.mostrarAviso("PDF do relatório gerado");
  }

  function baixarRelatorioImagens() {
    paginasDoRelatorio.forEach((pagina, indice) => {
      entregarArquivo(Certificado.dataUrlEmBlob(pagina.dataUrl), nomeDoRelatorio("jpg", indice));
    });
  }

  function imprimirRelatorio() {
    try {
      window.print();
    } catch (erro) {
      baixarRelatorioPdf();
    }
  }

  function suportaDownload() {
    return "download" in document.createElement("a");
  }

  function entregarArquivo(blob, nome) {
    if (suportaDownload()) {
      Certificado.baixarArquivo(blob, nome);
    } else {
      window.open(URL.createObjectURL(blob), "_blank", "noopener");
    }
  }

  function baixarPdf() {
    if (certificadosGerados.length === 0) {
      return;
    }
    const blob = Certificado.montarPdf(certificadosGerados.map((certificado) => certificado.jpeg));
    entregarArquivo(blob, Certificado.nomeDoArquivo(certificadosGerados[0].dados, "pdf"));
    Tela.mostrarAviso("PDF do certificado gerado");
  }

  function baixarImagem() {
    certificadosGerados.forEach((certificado) => {
      entregarArquivo(Certificado.dataUrlEmBlob(certificado.jpeg.dataUrl), Certificado.nomeDoArquivo(certificado.dados, "jpg"));
    });
  }

  function imprimirCertificado() {
    try {
      window.print();
    } catch (erro) {
      baixarPdf();
    }
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
      atualizarResumoDeMesas();
      Jogo.renderizar();
    });
    aoClicar("botaoLimparNomes", () => {
      Mesas.limparNomes();
      renderizarEditorMesas();
      atualizarResumoDeMesas();
      Jogo.renderizar();
    });
    aoClicar("botaoSalvarMusicas", salvarMusicas);
    aoClicar("botaoAdicionarMusica", () => {
      rascunho.push(Catalogo.novaMusica(rascunho.length));
      renderizarEditorMusicas();
    });
    aoClicar("botaoRestaurarMusicas", restaurarMusicas);
    aoClicar("botaoBaixarMusicas", baixarMusicas);
    aoClicar("botaoEmbaralharMusicas", embaralharMusicas);
    aoClicar("botaoOrdenarPorDecada", ordenarMusicasPorDecada);
    filtroMusicas.addEventListener("input", aplicarFiltroDeMusicas);
    aoClicar("botaoColarNomes", () => {
      areaColarNomes.hidden = !areaColarNomes.hidden;
      if (!areaColarNomes.hidden) {
        campoColarNomes.focus();
      }
    });
    aoClicar("botaoAplicarNomes", aplicarNomesColados);
    aoClicar("botaoCancelarColar", () => {
      campoColarNomes.value = "";
      areaColarNomes.hidden = true;
    });
    aoClicar("botaoTestarSom", testarSom);
    aoClicar("botaoTestarTelaCheia", testarTelaCheia);
    aoClicar("botaoRetestar", abrirChecklist);
    aoClicar("botaoMenosMinuto", () => ajustarMinuto(-1));
    aoClicar("botaoMaisMinuto", () => ajustarMinuto(1));
    aoClicar("botaoImprimirCertificado", imprimirCertificado);
    aoClicar("botaoBaixarPdf", baixarPdf);
    aoClicar("botaoBaixarImagem", baixarImagem);
    aoClicar("botaoCertificado", abrirCertificado);
    aoClicar("botaoRelatorio", abrirRelatorio);
    aoClicar("botaoImprimirRelatorio", imprimirRelatorio);
    aoClicar("botaoBaixarRelatorioPdf", baixarRelatorioPdf);
    aoClicar("botaoBaixarRelatorioImagem", baixarRelatorioImagens);
    aoClicar("botaoIntervaloFinal", abrirIntervalo);
    Offline.registrar(atualizarOffline);
    testarAudios(true);
  }

  iniciar();

  return { alternar, abrirIntervalo, abrirCertificado, abrirRelatorio, testarAudios };
})();
