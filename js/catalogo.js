const Catalogo = (() => {
  const decadas = ["Anos 50", "Anos 60", "Anos 70", "Anos 80", "Anos 90"];
  const categorias = ["Jovem Guarda", "Seresta", "Samba", "MPB", "Sertanejo", "Romântica", "Bossa Nova"];
  const especiais = { "": "Normal", "dobro": "Vale o dobro", "relampago": "Relâmpago", "surpresa": "Desafio surpresa", "karaoke": "Karaokê" };

  function clonar(lista) {
    return JSON.parse(JSON.stringify(lista));
  }

  function substituir(lista) {
    MUSICAS.length = 0;
    lista.forEach((musica) => MUSICAS.push(musica));
  }

  function reconhecerDecada(texto) {
    if (decadas.indexOf(texto) !== -1) {
      return texto;
    }
    const encontrada = /([5-9])0/.exec(String(texto || ""));
    return encontrada ? `Anos ${encontrada[1]}0` : "Anos 70";
  }

  function normalizar(musica, posicao) {
    const numero = (valor, minimo, reserva) => {
      const convertido = Math.round(Number(valor));
      return Number.isFinite(convertido) && convertido >= minimo ? convertido : reserva;
    };
    const resultado = {
      titulo: String(musica.titulo || "").trim(),
      interprete: String(musica.interprete || "").trim(),
      decada: reconhecerDecada(musica.decada),
      categoria: String(musica.categoria || "MPB").trim(),
      duracaoSegundos: numero(musica.duracaoSegundos, 3, CONFIGURACAO.duracaoPadraoTrechoSegundos),
      pontos: numero(musica.pontos, 1, CONFIGURACAO.pontosPadrao),
      arquivo: String(musica.arquivo || "").trim() || `${String(posicao + 1).padStart(2, "0")}.mp3`
    };
    if (musica.especial === "dobro" || musica.especial === "relampago" || musica.especial === "surpresa" || musica.especial === "karaoke") {
      resultado.especial = musica.especial;
    }
    if (String(musica.dica || "").trim()) {
      resultado.dica = String(musica.dica).trim();
    }
    if (String(musica.parteParaCantar || "").trim()) {
      resultado.parteParaCantar = String(musica.parteParaCantar).trim();
    }
    return resultado;
  }

  const padrao = clonar(MUSICAS).map((musica, posicao) => normalizar(musica, posicao));
  substituir(clonar(padrao));

  function listaValida(lista) {
    return Array.isArray(lista) && lista.length > 0 && lista.every((musica) => musica && musica.titulo && musica.interprete);
  }

  let atualizadaPeloArquivo = false;

  function assinaturaDaLista(lista) {
    const texto = JSON.stringify(lista.map((musica) => [musica.titulo, musica.interprete, musica.decada, musica.duracaoSegundos, musica.pontos, musica.arquivo, musica.especial || ""]));
    let valor = 5381;
    for (let posicao = 0; posicao < texto.length; posicao++) {
      valor = ((valor * 33) ^ texto.charCodeAt(posicao)) >>> 0;
    }
    return String(valor);
  }

  const assinaturaDoArquivo = assinaturaDaLista(padrao);

  function carregar() {
    const salvas = Armazenamento.carregar(CONFIGURACAO.chaveMusicas);
    if (!listaValida(salvas)) {
      return;
    }
    if (Armazenamento.carregar(CONFIGURACAO.chaveAssinaturaMusicas) !== assinaturaDoArquivo) {
      Armazenamento.salvar(CONFIGURACAO.chaveBackupMusicas, salvas);
      Armazenamento.limpar(CONFIGURACAO.chaveMusicas);
      Armazenamento.limpar(CONFIGURACAO.chaveAssinaturaMusicas);
      atualizadaPeloArquivo = true;
      return;
    }
    substituir(salvas);
  }

  function foiAtualizadaPeloArquivo() {
    return atualizadaPeloArquivo;
  }

  function salvar(lista) {
    const limpas = lista
      .map((musica, posicao) => normalizar(musica, posicao))
      .filter((musica) => musica.titulo && musica.interprete);
    if (limpas.length === 0) {
      return false;
    }
    substituir(limpas);
    Armazenamento.salvar(CONFIGURACAO.chaveMusicas, limpas);
    Armazenamento.salvar(CONFIGURACAO.chaveAssinaturaMusicas, assinaturaDoArquivo);
    return true;
  }

  function restaurarPadrao() {
    Armazenamento.limpar(CONFIGURACAO.chaveMusicas);
    Armazenamento.limpar(CONFIGURACAO.chaveAssinaturaMusicas);
    substituir(clonar(padrao));
  }

  function copiaAtual() {
    return clonar(MUSICAS);
  }

  function novaMusica(posicao) {
    return normalizar({ titulo: "", interprete: "", decada: "Anos 70", categoria: "MPB" }, posicao);
  }

  function chaveDaMusica(musica) {
    return `${String(musica.titulo || "").trim().toLowerCase()}|${String(musica.interprete || "").trim().toLowerCase()}`;
  }

  function analisar(lista) {
    const problemas = [];
    const porArquivo = {};
    const porMusica = {};
    const contagem = { total: lista.length, dobro: 0, relampago: 0, surpresa: 0, karaoke: 0 };
    lista.forEach((musica, posicao) => {
      const numero = posicao + 1;
      const arquivo = String(musica.arquivo || "").trim().toLowerCase();
      const chave = chaveDaMusica(musica);
      if (contagem[musica.especial] !== undefined) {
        contagem[musica.especial] += 1;
      }
      if (!String(musica.titulo || "").trim() || !String(musica.interprete || "").trim()) {
        problemas.push({ posicao, texto: `Música ${numero}: falta o título ou o cantor. Ela não será salva.` });
      }
      if (!arquivo) {
        problemas.push({ posicao, texto: `Música ${numero}: falta o nome do arquivo de áudio.` });
      } else if (!/\.mp3$/.test(arquivo)) {
        problemas.push({ posicao, texto: `Música ${numero}: o arquivo "${musica.arquivo}" deveria terminar em .mp3.` });
      }
      if (arquivo && porArquivo[arquivo] !== undefined) {
        problemas.push({ posicao, texto: `Música ${numero}: usa o mesmo arquivo da música ${porArquivo[arquivo] + 1} (${musica.arquivo}). As duas vão tocar o mesmo som.` });
      }
      if (chave !== "|" && porMusica[chave] !== undefined) {
        problemas.push({ posicao, texto: `Música ${numero}: "${musica.titulo}" já aparece na posição ${porMusica[chave] + 1}.` });
      }
      if (!(Number(musica.pontos) >= 1)) {
        problemas.push({ posicao, texto: `Música ${numero}: os pontos precisam ser 1 ou mais.` });
      }
      if (!(Number(musica.duracaoSegundos) >= 3)) {
        problemas.push({ posicao, texto: `Música ${numero}: o trecho precisa ter 3 segundos ou mais.` });
      }
      if (arquivo && porArquivo[arquivo] === undefined) {
        porArquivo[arquivo] = posicao;
      }
      if (chave !== "|" && porMusica[chave] === undefined) {
        porMusica[chave] = posicao;
      }
    });
    return { contagem, problemas };
  }

  function gerarCodigo(lista, desempate) {
    const campos = ["titulo", "interprete", "decada", "categoria", "duracaoSegundos", "pontos", "arquivo", "especial", "dica", "parteParaCantar"];
    const linhaDe = (musica) => {
      const partes = campos
        .filter((campo) => musica[campo] !== undefined && musica[campo] !== "")
        .map((campo) => `${campo}: ${JSON.stringify(musica[campo])}`);
      return `  { ${partes.join(", ")} }`;
    };
    const principais = lista.map((musica, posicao) => linhaDe(normalizar(musica, posicao)));
    const extras = (desempate || []).map(linhaDe);
    return `const MUSICAS = [\n${principais.join(",\n")}\n];\n\nconst MUSICAS_DESEMPATE = [\n${extras.join(",\n")}\n];\n`;
  }

  carregar();

  return { assinaturaDoArquivo, foiAtualizadaPeloArquivo, analisar, gerarCodigo, reconhecerDecada, salvar, restaurarPadrao, copiaAtual, novaMusica, decadas, categorias, especiais };
})();
