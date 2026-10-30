const Efeitos = (() => {
  const passoEntreNotasSegundos = 0.1;
  let contextoDeAudio = null;

  function obterContexto() {
    if (!contextoDeAudio) {
      const Classe = window.AudioContext || window.webkitAudioContext;
      if (!Classe) {
        return null;
      }
      try {
        contextoDeAudio = new Classe();
      } catch (erro) {
        return null;
      }
    }
    if (contextoDeAudio.state === "suspended" && contextoDeAudio.resume) {
      contextoDeAudio.resume();
    }
    return contextoDeAudio;
  }

  function tocarNota(contexto, frequencia, atraso, duracao, tipo, volume) {
    const inicio = contexto.currentTime + atraso;
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;
    ganho.gain.setValueAtTime(0.0001, inicio);
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracao + 0.05);
  }

  function tocarSequencia(frequencias, tipo, volume, duracao) {
    const contexto = obterContexto();
    if (!contexto) {
      return;
    }
    try {
      frequencias.forEach((frequencia, posicao) => {
        tocarNota(contexto, frequencia, posicao * passoEntreNotasSegundos, duracao, tipo, volume);
      });
    } catch (erro) {
      return;
    }
  }

  function vibrar(padrao) {
    if (navigator.vibrate) {
      navigator.vibrate(padrao);
    }
  }

  function acerto() {
    tocarSequencia([523, 659, 784, 1047], "triangle", 0.25, 0.28);
    vibrar(60);
  }

  function erro() {
    tocarSequencia([262, 208, 165], "sawtooth", 0.16, 0.3);
    vibrar([80, 60, 80]);
  }

  function microfone() {
    tocarSequencia([659, 784], "triangle", 0.2, 0.25);
  }

  function tique() {
    tocarSequencia([880], "square", 0.08, 0.08);
  }

  function vitoria() {
    tocarSequencia([523, 523, 523, 698, 659, 698, 784, 1047], "triangle", 0.28, 0.32);
    vibrar([100, 50, 100, 50, 200]);
  }

  function preparar() {
    obterContexto();
  }

  return { preparar, acerto, erro, microfone, tique, vitoria };
})();
