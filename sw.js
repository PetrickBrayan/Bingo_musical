const VERSAO = "v1";
const CACHE_APP = "bingo-app-" + VERSAO;
const CACHE_AUDIOS = "bingo-audios-v1";
const ARQUIVOS_DO_APP = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/estilo.css",
  "icones/icone-192.png",
  "icones/icone-512.png",
  "js/configuracao.js",
  "js/musicas.js",
  "js/armazenamento.js",
  "js/catalogo.js",
  "js/ajustes.js",
  "js/mesas.js",
  "js/placar.js",
  "js/reprodutor.js",
  "js/narrador.js",
  "js/trofeus.js",
  "js/efeitos.js",
  "js/confete.js",
  "js/offline.js",
  "js/tela.js",
  "js/preparacao.js",
  "js/jogo.js",
  "js/principal.js"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE_APP)
      .then((cache) => Promise.all(ARQUIVOS_DO_APP.map((arquivo) => cache.add(arquivo).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((nome) => nome.indexOf("bingo-app-") === 0 && nome !== CACHE_APP).map((nome) => caches.delete(nome))))
      .then(() => self.clients.claim())
  );
});

function responderComFaixa(requisicao, resposta) {
  const faixa = requisicao.headers.get("range");
  if (!faixa) {
    return Promise.resolve(resposta);
  }
  return resposta.arrayBuffer().then((conteudo) => {
    const partes = /bytes=(\d*)-(\d*)/.exec(faixa);
    const inicio = partes && partes[1] ? Number(partes[1]) : 0;
    const fim = partes && partes[2] ? Math.min(Number(partes[2]), conteudo.byteLength - 1) : conteudo.byteLength - 1;
    return new Response(conteudo.slice(inicio, fim + 1), {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "Content-Type": resposta.headers.get("Content-Type") || "audio/mpeg",
        "Content-Length": String(fim - inicio + 1),
        "Content-Range": "bytes " + inicio + "-" + fim + "/" + conteudo.byteLength
      }
    });
  });
}

function tratarAudio(requisicao) {
  const endereco = new URL(requisicao.url);
  const chave = endereco.origin + endereco.pathname;
  return caches.open(CACHE_AUDIOS).then((cache) => cache.match(chave).then((guardado) => {
    if (guardado) {
      return responderComFaixa(requisicao, guardado);
    }
    return fetch(chave).then((resposta) => {
      if (resposta.ok) {
        cache.put(chave, resposta.clone());
        return responderComFaixa(requisicao, resposta);
      }
      return resposta;
    });
  }));
}

function tratarArquivoDoApp(requisicao) {
  return fetch(requisicao)
    .then((resposta) => {
      if (resposta.ok) {
        const copia = resposta.clone();
        caches.open(CACHE_APP).then((cache) => cache.put(requisicao, copia));
      }
      return resposta;
    })
    .catch(() => caches.match(requisicao, { ignoreSearch: true }).then((guardado) => guardado || caches.match("index.html")));
}

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET" || new URL(requisicao.url).origin !== self.location.origin) {
    return;
  }
  if (new URL(requisicao.url).pathname.indexOf("/audios/") !== -1) {
    evento.respondWith(tratarAudio(requisicao));
    return;
  }
  evento.respondWith(tratarArquivoDoApp(requisicao));
});
