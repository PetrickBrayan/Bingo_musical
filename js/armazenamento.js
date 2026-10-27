const Armazenamento = {
  carregar(chave) {
    try {
      const texto = localStorage.getItem(chave);
      return texto ? JSON.parse(texto) : null;
    } catch (erro) {
      return null;
    }
  },

  salvar(chave, dados) {
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch (erro) {
      return;
    }
  },

  limpar(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (erro) {
      return;
    }
  }
};
