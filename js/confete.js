const Confete = (() => {
  const tela = document.getElementById("confete");
  const pincel = tela.getContext("2d");
  const cores = ["#f4c95d", "#ff7eb6", "#7ddc9b", "#7fd0f0", "#c9a0ff", "#fff3d6"];
  const gravidade = 0.18;
  const maximoDeParticulas = 320;

  let particulas = [];
  let animando = false;

  function ajustarTamanho() {
    tela.width = window.innerWidth;
    tela.height = window.innerHeight;
  }

  function criarParticula(origemX, origemY) {
    const angulo = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const velocidade = 6 + Math.random() * 10;
    return {
      x: origemX,
      y: origemY,
      vx: Math.cos(angulo) * velocidade,
      vy: Math.sin(angulo) * velocidade,
      largura: 6 + Math.random() * 8,
      altura: 4 + Math.random() * 6,
      giro: Math.random() * Math.PI,
      velocidadeGiro: (Math.random() - 0.5) * 0.4,
      cor: cores[Math.floor(Math.random() * cores.length)]
    };
  }

  function atualizar(particula) {
    particula.vy += gravidade;
    particula.vx *= 0.99;
    particula.x += particula.vx;
    particula.y += particula.vy;
    particula.giro += particula.velocidadeGiro;
  }

  function desenhar(particula) {
    pincel.save();
    pincel.translate(particula.x, particula.y);
    pincel.rotate(particula.giro);
    pincel.fillStyle = particula.cor;
    pincel.fillRect(-particula.largura / 2, -particula.altura / 2, particula.largura, particula.altura);
    pincel.restore();
  }

  function quadro() {
    pincel.clearRect(0, 0, tela.width, tela.height);
    particulas.forEach((particula) => {
      atualizar(particula);
      desenhar(particula);
    });
    particulas = particulas.filter((particula) => particula.y < tela.height + 40);

    if (particulas.length > 0) {
      requestAnimationFrame(quadro);
    } else {
      animando = false;
    }
  }

  function disparar(quantidade) {
    ajustarTamanho();
    const espaco = maximoDeParticulas - particulas.length;
    const total = Math.min(quantidade, Math.max(espaco, 0));
    const larguraTela = tela.width;
    const alturaTela = tela.height;

    for (let i = 0; i < total; i++) {
      const lado = i % 2 === 0 ? 0.2 : 0.8;
      particulas.push(criarParticula(larguraTela * lado, alturaTela * 0.75));
    }

    if (!animando && particulas.length > 0) {
      animando = true;
      requestAnimationFrame(quadro);
    }
  }

  window.addEventListener("resize", ajustarTamanho);
  ajustarTamanho();

  return { disparar };
})();
