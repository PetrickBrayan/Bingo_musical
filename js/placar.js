const Placar = (() => {
  let pontosPorMesa = [];
  let historico = [];

  function reiniciar() {
    pontosPorMesa = Array.from({ length: CONFIGURACAO.quantidadeMesas }, () => 0);
    historico = [];
  }

  function adicionar(mesa, pontos, indiceMusica, tipo) {
    pontosPorMesa[mesa - 1] += pontos;
    historico.push({ mesa, pontos, indiceMusica, tipo });
  }

  function pontosDaMesa(mesa) {
    return pontosPorMesa[mesa - 1];
  }

  function desfazerUltimo() {
    const ultimo = historico.pop();
    if (!ultimo) {
      return null;
    }
    pontosPorMesa[ultimo.mesa - 1] -= ultimo.pontos;
    return ultimo;
  }

  function ultimo() {
    return historico.length > 0 ? historico[historico.length - 1] : null;
  }

  function classificacao() {
    const lista = pontosPorMesa.map((pontos, indice) => ({ mesa: indice + 1, pontos }));
    lista.sort((a, b) => b.pontos - a.pontos || a.mesa - b.mesa);

    let posicaoAtual = 0;
    return lista.map((item, indice) => {
      if (indice === 0 || item.pontos !== lista[indice - 1].pontos) {
        posicaoAtual = indice + 1;
      }
      return Object.assign({}, item, { posicao: posicaoAtual });
    });
  }

  function exportar() {
    return { pontosPorMesa: [...pontosPorMesa], historico: [...historico] };
  }

  function importar(dados) {
    const dadosValidos = dados
      && Array.isArray(dados.pontosPorMesa)
      && dados.pontosPorMesa.length === CONFIGURACAO.quantidadeMesas
      && Array.isArray(dados.historico);

    if (!dadosValidos) {
      reiniciar();
      return;
    }

    pontosPorMesa = [...dados.pontosPorMesa];
    historico = [...dados.historico];
  }

  reiniciar();

  return { reiniciar, adicionar, pontosDaMesa, ultimo, desfazerUltimo, classificacao, exportar, importar };
})();
