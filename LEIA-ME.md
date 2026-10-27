# Bingo Musical - Anos Dourados

Site estático (HTML, CSS e JavaScript puros). Não precisa de instalação nem de build.

## Como usar
1. Coloque os 20 trechos em `audios/` como `01.mp3` ... `20.mp3` (a ordem está em `js/musicas.js`).
2. Publique a pasta no Vercel ou abra `index.html` direto no notebook.
3. No evento: tela cheia com `F`, lista de comandos com `H`.

## Onde mudar o que for preciso
- `js/configuracao.js`: número de mesas, duração do trecho, pontos, rodadas duplas.
- `js/musicas.js`: títulos, intérpretes, décadas e categorias.
- `css/estilo.css`: cores e tamanhos.

## Ordem de leitura do código
`index.html` (estrutura) → `css/estilo.css` (visual) → `js/configuracao.js` → `js/musicas.js` → `js/armazenamento.js` → `js/placar.js` → `js/reprodutor.js` → `js/tela.js` → `js/jogo.js` (regras e estados) → `js/principal.js` (teclado).
