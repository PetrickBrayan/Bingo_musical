const Catalogo = (() => {
  const padrao = JSON.parse(JSON.stringify(MUSICAS));
  const decadas = ["Anos 50", "Anos 60", "Anos 70", "Anos 80"];
  const categorias = ["Jovem Guarda", "Seresta", "Samba", "MPB", "Sertanejo", "Romântica", "Bossa Nova"];
  const especiais = { "": "Normal", "dobro": "Vale o dobro", "relampago": "Relâmpago" };

  function clonar(lista) {
    return JSON.parse(JSON.stringify(lista));
  }

  function substituir(lista) {
    MUSICAS.length = 0;
    lista.forEach((musica) => MUSICAS.push(musica));
  }

  function normalizar(musica, posicao) {
    const numero = (valor, minimo, reserva) => {
      const convertido = Math.round(Number(valor));
      return Number.isFinite(convertido) && convertido >= minimo ? convertido : reserva;
    };
    const resultado = {
      titulo: String(musica.titulo || "").trim(),
      interprete: String(musica.interprete || "").trim(),
      decada: decadas.indexOf(musica.decada) !== -1 ? musica.decada : "Anos 70",
      categoria: String(musica.categoria || "MPB").trim(),
      duracaoSegundos: numero(musica.duracaoSegundos, 3, CONFIGURACAO.duracaoPadraoTrechoSegundos),
      pontos: numero(musica.pontos, 1, CONFIGURACAO.pontosPadrao),
      arquivo: String(musica.arquivo || "").trim() || `${String(posicao + 1).padStart(2, "0")}.mp3`
    };
    if (musica.especial === "dobro" || musica.especial === "relampago") {
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

  function listaValida(lista) {
    return Array.isArray(lista) && lista.length > 0 && lista.every((musica) => musica && musica.titulo && musica.interprete);
  }

  function carregar() {
    const salvas = Armazenamento.carregar(CONFIGURACAO.chaveMusicas);
    if (listaValida(salvas)) {
      substituir(salvas);
    }
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
    return true;
  }

  function restaurarPadrao() {
    Armazenamento.limpar(CONFIGURACAO.chaveMusicas);
    substituir(clonar(padrao));
  }

  function copiaAtual() {
    return clonar(MUSICAS);
  }

  function novaMusica(posicao) {
    return normalizar({ titulo: "", interprete: "", decada: "Anos 70", categoria: "MPB" }, posicao);
  }

  carregar();

  return { salvar, restaurarPadrao, copiaAtual, novaMusica, decadas, categorias, especiais };
})();
