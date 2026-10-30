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

  function aplicarModoResposta(modo) {
    if (Object.keys(CONFIGURACAO.rotulosModoResposta).includes(modo)) {
      CONFIGURACAO.modoResposta = modo;
    }
  }

  function salvar() {
    Armazenamento.salvar(CONFIGURACAO.chaveAjustes, {
      quantidadeMesas: CONFIGURACAO.quantidadeMesas,
      modoResposta: CONFIGURACAO.modoResposta,
      barraAutomatica: CONFIGURACAO.barraAutomatica
    });
  }

  function definirQuantidadeMesas(valor) {
    aplicarQuantidadeMesas(valor);
    salvar();
  }

  function definirModoResposta(modo) {
    aplicarModoResposta(modo);
    salvar();
  }

  function definirBarraAutomatica(valor) {
    CONFIGURACAO.barraAutomatica = Boolean(valor);
    salvar();
  }

  function carregar() {
    const ajustesSalvos = Armazenamento.carregar(CONFIGURACAO.chaveAjustes);
    if (ajustesSalvos) {
      aplicarQuantidadeMesas(ajustesSalvos.quantidadeMesas);
      aplicarModoResposta(ajustesSalvos.modoResposta);
      CONFIGURACAO.barraAutomatica = Boolean(ajustesSalvos.barraAutomatica);
    }
  }

  return { carregar, aplicarQuantidadeMesas, definirQuantidadeMesas, definirModoResposta, definirBarraAutomatica };
})();
