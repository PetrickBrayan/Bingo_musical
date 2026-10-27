const Armazenamento = {
  carregar() {
    try {
      const texto = localStorage.getItem(CONFIGURACAO.chaveArmazenamento);
      return texto ? JSON.parse(texto) : null;
    } catch (erro) {
      return null;
    }
  },

  salvar(dados) {
    try {
      localStorage.setItem(CONFIGURACAO.chaveArmazenamento, JSON.stringify(dados));
    } catch (erro) {
      return;
    }
  },

  limpar() {
    try {
      localStorage.removeItem(CONFIGURACAO.chaveArmazenamento);
    } catch (erro) {
      return;
    }
  }
};
