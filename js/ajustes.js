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
      barraAutomatica: CONFIGURACAO.barraAutomatica,
      escalaTexto: CONFIGURACAO.escalaTexto,
      altoContraste: CONFIGURACAO.altoContraste,
      placarNoCanto: CONFIGURACAO.placarNoCanto
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

  function definirEscalaTexto(valor) {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      return;
    }
    CONFIGURACAO.escalaTexto = Math.round(Math.min(Math.max(numero, CONFIGURACAO.escalaMinima), CONFIGURACAO.escalaMaxima) * 100) / 100;
    salvar();
  }

  function definirAltoContraste(valor) {
    CONFIGURACAO.altoContraste = Boolean(valor);
    salvar();
  }

  function definirPlacarNoCanto(valor) {
    CONFIGURACAO.placarNoCanto = Boolean(valor);
    salvar();
  }

  function carregar() {
    const ajustesSalvos = Armazenamento.carregar(CONFIGURACAO.chaveAjustes);
    if (ajustesSalvos) {
      aplicarQuantidadeMesas(ajustesSalvos.quantidadeMesas);
      aplicarModoResposta(ajustesSalvos.modoResposta);
      CONFIGURACAO.barraAutomatica = Boolean(ajustesSalvos.barraAutomatica);
      if (typeof ajustesSalvos.escalaTexto === "number") {
        CONFIGURACAO.escalaTexto = Math.min(Math.max(ajustesSalvos.escalaTexto, CONFIGURACAO.escalaMinima), CONFIGURACAO.escalaMaxima);
      }
      CONFIGURACAO.altoContraste = Boolean(ajustesSalvos.altoContraste);
      if (typeof ajustesSalvos.placarNoCanto === "boolean") {
        CONFIGURACAO.placarNoCanto = ajustesSalvos.placarNoCanto;
      }
    }
  }

  return { carregar, aplicarQuantidadeMesas, definirQuantidadeMesas, definirModoResposta, definirBarraAutomatica, definirEscalaTexto, definirAltoContraste, definirPlacarNoCanto };
})();
