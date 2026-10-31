const Offline = (() => {
  const nomeCacheAudios = "bingo-audios-v1";
  let pedidoDeInstalacao = null;
  let ouvinte = null;

  function suportado() {
    return "serviceWorker" in navigator && location.protocol !== "file:";
  }

  function avisar() {
    if (ouvinte) {
      situacao().then(ouvinte);
    }
  }

  function registrar(aoMudar) {
    ouvinte = aoMudar || null;
    window.addEventListener("beforeinstallprompt", (evento) => {
      evento.preventDefault();
      pedidoDeInstalacao = evento;
      avisar();
    });
    window.addEventListener("online", avisar);
    window.addEventListener("offline", avisar);
    if (!suportado()) {
      avisar();
      return;
    }
    navigator.serviceWorker.register("sw.js").then(avisar).catch(avisar);
  }

  function listaDeAudios() {
    return MUSICAS.concat(MUSICAS_DESEMPATE).map((musica) => CONFIGURACAO.pastaAudios + musica.arquivo);
  }

  function contarAudiosGuardados() {
    if (!window.caches) {
      return Promise.resolve(0);
    }
    return caches.open(nomeCacheAudios).then((cache) => Promise.all(
      listaDeAudios().map((endereco) => cache.match(endereco).then((resposta) => Boolean(resposta)))
    )).then((resultados) => resultados.filter(Boolean).length);
  }

  function situacao() {
    if (!suportado()) {
      return Promise.resolve({ disponivel: false, texto: "Só funciona quando o jogo está em um endereço da internet (ex.: Vercel)." });
    }
    return navigator.serviceWorker.getRegistration().then((registro) => {
      if (!registro || !registro.active) {
        return { disponivel: true, pronto: false, texto: "Preparando… recarregue a página uma vez." };
      }
      return contarAudiosGuardados().then((guardados) => {
        const total = listaDeAudios().length;
        return {
          disponivel: true,
          pronto: true,
          guardados,
          total,
          instalavel: Boolean(pedidoDeInstalacao),
          texto: guardados >= total
            ? "Pronto: o jogo e todos os áudios funcionam sem internet."
            : `Jogo guardado. Áudios guardados: ${guardados} de ${total}. Toque para baixar o restante.`
        };
      });
    });
  }

  function baixarAudios(aoProgresso) {
    if (!window.caches) {
      return Promise.resolve();
    }
    const enderecos = listaDeAudios();
    let feitos = 0;
    return caches.open(nomeCacheAudios).then((cache) => enderecos.reduce((fila, endereco) => fila.then(() => cache.match(endereco).then((existente) => {
      if (existente) {
        return null;
      }
      return fetch(endereco).then((resposta) => (resposta.ok ? cache.put(endereco, resposta) : null)).catch(() => null);
    })).then(() => {
      feitos += 1;
      if (aoProgresso) {
        aoProgresso(feitos, enderecos.length);
      }
    }), Promise.resolve()));
  }

  function instalar() {
    if (!pedidoDeInstalacao) {
      return Promise.resolve(false);
    }
    pedidoDeInstalacao.prompt();
    return pedidoDeInstalacao.userChoice.then((escolha) => {
      pedidoDeInstalacao = null;
      return escolha.outcome === "accepted";
    });
  }

  return { registrar, situacao, baixarAudios, instalar, suportado };
})();
