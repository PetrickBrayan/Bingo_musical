const Ajustes = (() => {
  function limitarQuantidadeMesas(valor) {
    const inteiro = Math.round(Number(valor));
    if (!Number.isFinite(inteiro)) {
      return CONFIGURACAO.quantidadeMesas;
    }
    return Math.min(Math.max(inteiro, CONFIGURACAO.quantidadeMinimaMesas), CONFIGURACAO.quantidadeMaximaMesas);
  }

  function aplicarQuantidadeMesas(valor) {
    CONFIGURACAO.quantidadeMesas = limitarQuantidadeMesas(valor);
  }

  function definirQuantidadeMesas(valor) {
    aplicarQuantidadeMesas(valor);
    Armazenamento.salvar(CONFIGURACAO.chaveAjustes, { quantidadeMesas: CONFIGURACAO.quantidadeMesas });
  }

  function carregar() {
    const ajustesSalvos = Armazenamento.carregar(CONFIGURACAO.chaveAjustes);
    if (ajustesSalvos) {
      aplicarQuantidadeMesas(ajustesSalvos.quantidadeMesas);
    }
  }

  return { carregar, aplicarQuantidadeMesas, definirQuantidadeMesas };
})();
