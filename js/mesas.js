const Mesas = (() => {
  const paleta = ["#f4c95d", "#ff7eb6", "#7ddc9b", "#7fd0f0", "#c9a0ff", "#ffb347", "#ff7b7b", "#a3e635", "#38bdf8", "#f472b6", "#fb923c", "#2dd4bf"];
  const nomesSugeridos = [
    "Os Seresteiros", "Cantores do Rádio", "Vinil de Ouro", "Os Boêmios", "Estrelas da Radiola",
    "Rosa dos Ventos", "Os Inesquecíveis", "Baile da Saudade", "Pandeiro de Ouro", "Violão de Prata",
    "Os Românticos", "Fita Cassete", "Flores do Samba", "Coração Sertanejo", "Lenços ao Vento",
    "Chá das Cinco", "Toca-Discos", "Os Serenateiros", "Gafieira Real", "Voz do Coração",
    "Anos Dourados", "Sambistas do Balanço", "Noite de Gala", "Os Crooners", "Lamparina Acesa",
    "Bossa Nova", "Memórias Cantadas", "Hora da Serenata", "Os Eternos Jovens", "Melodia de Ouro"
  ];

  let nomes = [];
  let cores = [];

  function embaralhar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
      const sorteado = Math.floor(Math.random() * (i + 1));
      const guardado = copia[i];
      copia[i] = copia[sorteado];
      copia[sorteado] = guardado;
    }
    return copia;
  }

  function salvar() {
    Armazenamento.salvar(CONFIGURACAO.chaveMesas, { nomes, cores });
  }

  function carregar() {
    const salvo = Armazenamento.carregar(CONFIGURACAO.chaveMesas);
    if (salvo) {
      nomes = Array.isArray(salvo.nomes) ? salvo.nomes : [];
      cores = Array.isArray(salvo.cores) ? salvo.cores : [];
    }
  }

  function nome(mesa) {
    return String(nomes[mesa - 1] || "").trim();
  }

  function cor(mesa) {
    return cores[mesa - 1] || paleta[(mesa - 1) % paleta.length];
  }

  function rotulo(mesa) {
    const nomeDaMesa = nome(mesa);
    return nomeDaMesa ? `Mesa ${mesa} – ${nomeDaMesa}` : `Mesa ${mesa}`;
  }

  function apelido(mesa) {
    return nome(mesa) || `mesa ${mesa}`;
  }

  function paraMesa(mesa) {
    const nomeDaMesa = nome(mesa);
    return nomeDaMesa ? `para ${nomeDaMesa}` : `para a mesa ${mesa}`;
  }

  function listar(numeros) {
    return Narrador.listarMesas(numeros.map(apelido));
  }

  function definirNome(mesa, texto) {
    nomes[mesa - 1] = String(texto).slice(0, 28);
    salvar();
  }

  function trocarCor(mesa) {
    const posicao = paleta.indexOf(cor(mesa));
    cores[mesa - 1] = paleta[(posicao + 1) % paleta.length];
    salvar();
    return cores[mesa - 1];
  }

  function sugerirNomes(quantidade) {
    const sorteados = embaralhar(nomesSugeridos);
    for (let mesa = 1; mesa <= quantidade; mesa++) {
      nomes[mesa - 1] = sorteados[mesa - 1] || "";
    }
    salvar();
  }

  function limparNomes() {
    nomes = [];
    salvar();
  }

  carregar();

  return { nome, cor, rotulo, apelido, paraMesa, listar, definirNome, trocarCor, sugerirNomes, limparNomes };
})();
