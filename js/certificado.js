const Certificado = (() => {
  const largura = 2480;
  const altura = 1754;
  const ouroEscuro = "#8a5f0e";
  const ouroClaro = "#f6d98a";
  const vinho = "#7a1f35";
  const marrom = "#3a2210";
  const serifa = "Georgia, 'Times New Roman', serif";

  function textoEspacado(contexto, texto, x, y, espaco) {
    const letras = Array.from(texto);
    const larguras = letras.map((letra) => contexto.measureText(letra).width);
    const total = larguras.reduce((soma, valor) => soma + valor, 0) + espaco * (letras.length - 1);
    let cursor = x - total / 2;
    const alinhamentoAnterior = contexto.textAlign;
    contexto.textAlign = "left";
    letras.forEach((letra, indice) => {
      contexto.fillText(letra, cursor, y);
      cursor += larguras[indice] + espaco;
    });
    contexto.textAlign = alinhamentoAnterior;
    return total;
  }

  function degradeOuro(contexto, x0, y0, x1, y1) {
    const degrade = contexto.createLinearGradient(x0, y0, x1, y1);
    degrade.addColorStop(0, ouroEscuro);
    degrade.addColorStop(0.35, ouroClaro);
    degrade.addColorStop(0.55, "#d9a93a");
    degrade.addColorStop(1, ouroEscuro);
    return degrade;
  }

  function desenharFundo(c) {
    const papel = c.createRadialGradient(largura / 2, altura / 2, 120, largura / 2, altura / 2, largura * 0.72);
    papel.addColorStop(0, "#fffbf0");
    papel.addColorStop(1, "#f1ddb2");
    c.fillStyle = papel;
    c.fillRect(0, 0, largura, altura);

    c.lineWidth = 2;
    for (let i = 0; i < 70; i++) {
      c.beginPath();
      for (let x = 0; x <= largura; x += 20) {
        const y = altura / 2 + Math.sin(x / 140 + i * 0.35) * (70 + i * 6) * Math.cos(i * 0.1) + (i - 35) * 22;
        if (x === 0) {
          c.moveTo(x, y);
        } else {
          c.lineTo(x, y);
        }
      }
      c.strokeStyle = "rgba(184, 137, 42, 0.07)";
      c.stroke();
    }
  }

  function desenharMarcaDagua(c) {
    c.save();
    c.beginPath();
    c.rect(120, 120, largura - 240, altura - 240);
    c.clip();

    c.translate(largura / 2, altura / 2 + 20);
    for (let raio = 560; raio > 190; raio -= 14) {
      c.beginPath();
      c.arc(0, 0, raio, 0, Math.PI * 2);
      c.strokeStyle = "rgba(122, 31, 53, 0.055)";
      c.lineWidth = 4;
      c.stroke();
    }
    c.beginPath();
    c.arc(0, 0, 175, 0, Math.PI * 2);
    c.fillStyle = "rgba(184, 137, 42, 0.12)";
    c.fill();
    c.beginPath();
    c.arc(0, 0, 22, 0, Math.PI * 2);
    c.fillStyle = "rgba(122, 31, 53, 0.18)";
    c.fill();

    c.rotate(-0.32);
    c.font = `bold 60px ${serifa}`;
    c.textAlign = "center";
    c.fillStyle = "rgba(122, 31, 53, 0.04)";
    for (let linha = -9; linha <= 9; linha++) {
      textoEspacado(c, "BINGO MUSICAL  ♪  ANOS DOURADOS  ♫  BINGO MUSICAL  ♪  ANOS DOURADOS", 0, linha * 150, 6);
    }
    c.restore();
  }

  function microtexto(c, x, y, comprimento, angulo) {
    c.save();
    c.translate(x, y);
    c.rotate(angulo);
    c.font = `bold 12px ${serifa}`;
    c.fillStyle = "rgba(122, 31, 53, 0.55)";
    c.textAlign = "left";
    const frase = "BINGO MUSICAL ANOS DOURADOS ★ ";
    let cursor = 0;
    while (cursor < comprimento) {
      c.fillText(frase, cursor, 0);
      cursor += c.measureText(frase).width;
    }
    c.restore();
  }

  function estrelaDeOitoPontas(c, x, y, raio, cor) {
    c.save();
    c.translate(x, y);
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? raio : raio * 0.42;
      const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
      if (i === 0) {
        c.moveTo(r * Math.cos(a), r * Math.sin(a));
      } else {
        c.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
    }
    c.closePath();
    c.fillStyle = cor;
    c.fill();
    c.restore();
  }

  function desenharLeque(c, x, y, rotacao) {
    c.save();
    c.translate(x, y);
    c.rotate(rotacao);
    for (let k = 0; k < 6; k++) {
      c.beginPath();
      c.arc(0, 0, 40 + k * 26, 0, Math.PI / 2);
      c.strokeStyle = k % 2 === 0 ? degradeOuro(c, 0, 0, 200, 200) : vinho;
      c.lineWidth = k % 2 === 0 ? 6 : 3;
      c.stroke();
    }
    for (let k = 0; k <= 8; k++) {
      const a = (Math.PI / 2) * (k / 8);
      c.beginPath();
      c.moveTo(40 * Math.cos(a), 40 * Math.sin(a));
      c.lineTo(170 * Math.cos(a), 170 * Math.sin(a));
      c.strokeStyle = "rgba(184, 137, 42, 0.7)";
      c.lineWidth = 2;
      c.stroke();
    }
    c.restore();
  }

  function desenharMoldura(c) {
    c.lineJoin = "round";
    c.strokeStyle = degradeOuro(c, 0, 0, largura, altura);
    c.lineWidth = 24;
    c.strokeRect(46, 46, largura - 92, altura - 92);
    c.strokeStyle = vinho;
    c.lineWidth = 6;
    c.strokeRect(88, 88, largura - 176, altura - 176);
    c.strokeStyle = degradeOuro(c, 0, 0, largura, altura);
    c.lineWidth = 3;
    c.strokeRect(104, 104, largura - 208, altura - 208);

    microtexto(c, 320, 140, largura - 640, 0);
    microtexto(c, 320, altura - 128, largura - 640, 0);
    microtexto(c, 128, 320, altura - 640, Math.PI / 2);
    microtexto(c, largura - 116, 320, altura - 640, Math.PI / 2);

    desenharLeque(c, 104, 104, 0);
    desenharLeque(c, largura - 104, 104, Math.PI / 2);
    desenharLeque(c, largura - 104, altura - 104, Math.PI);
    desenharLeque(c, 104, altura - 104, -Math.PI / 2);
    [[104, 104], [largura - 104, 104], [largura - 104, altura - 104], [104, altura - 104]].forEach((ponto) => {
      estrelaDeOitoPontas(c, ponto[0], ponto[1], 34, vinho);
    });
  }

  function desenharCabecalho(c) {
    const cx = largura / 2;
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI + (Math.PI * i) / 28;
      c.beginPath();
      c.moveTo(cx + 150 * Math.cos(a), 330 + 150 * Math.sin(a));
      c.lineTo(cx + (i % 2 === 0 ? 230 : 195) * Math.cos(a), 330 + (i % 2 === 0 ? 230 : 195) * Math.sin(a));
      c.strokeStyle = degradeOuro(c, cx - 230, 100, cx + 230, 330);
      c.lineWidth = 6;
      c.stroke();
    }
    c.beginPath();
    c.arc(cx, 330, 135, Math.PI, 0);
    c.fillStyle = vinho;
    c.fill();
    c.beginPath();
    c.arc(cx, 330, 100, Math.PI, 0);
    c.fillStyle = "#2a0b14";
    c.fill();
    c.beginPath();
    c.arc(cx, 330, 34, Math.PI, 0);
    c.fillStyle = ouroClaro;
    c.fill();
    c.fillStyle = vinho;
    c.font = `bold 84px ${serifa}`;
    c.textAlign = "center";
    c.fillText("♪", cx - 420, 300);
    c.fillText("♫", cx + 420, 300);

    c.font = `bold 128px ${serifa}`;
    c.fillStyle = degradeOuro(c, cx - 600, 390, cx + 600, 470);
    c.shadowColor = "rgba(58, 34, 16, 0.35)";
    c.shadowBlur = 6;
    c.shadowOffsetY = 4;
    textoEspacado(c, "BINGO MUSICAL", cx, 470, 18);
    c.shadowColor = "transparent";
    c.font = `bold 46px ${serifa}`;
    c.fillStyle = vinho;
    textoEspacado(c, "ANOS DOURADOS", cx, 530, 30);

    [-1, 1].forEach((lado) => {
      c.beginPath();
      c.moveTo(cx + lado * 520, 515);
      c.lineTo(cx + lado * 900, 515);
      c.strokeStyle = degradeOuro(c, cx - 900, 0, cx + 900, 0);
      c.lineWidth = 4;
      c.stroke();
      estrelaDeOitoPontas(c, cx + lado * 500, 515, 16, vinho);
    });
  }

  function desenharFaixa(c, texto) {
    const cx = largura / 2;
    const y = 590;
    const meia = 860;
    c.beginPath();
    c.moveTo(cx - meia - 90, y + 50);
    c.lineTo(cx - meia + 30, y + 50);
    c.lineTo(cx - meia + 30, y + 150);
    c.lineTo(cx - meia - 90, y + 150);
    c.lineTo(cx - meia - 30, y + 100);
    c.closePath();
    c.fillStyle = "#4e0f22";
    c.fill();
    c.beginPath();
    c.moveTo(cx + meia + 90, y + 50);
    c.lineTo(cx + meia - 30, y + 50);
    c.lineTo(cx + meia - 30, y + 150);
    c.lineTo(cx + meia + 90, y + 150);
    c.lineTo(cx + meia + 30, y + 100);
    c.closePath();
    c.fill();
    const degrade = c.createLinearGradient(0, y, 0, y + 130);
    degrade.addColorStop(0, "#a22a47");
    degrade.addColorStop(1, "#5e1226");
    c.fillStyle = degrade;
    c.fillRect(cx - meia, y, meia * 2, 130);
    c.strokeStyle = ouroClaro;
    c.lineWidth = 4;
    c.strokeRect(cx - meia + 12, y + 12, meia * 2 - 24, 106);
    c.font = `bold 68px ${serifa}`;
    c.fillStyle = "#fff3d6";
    c.shadowColor = "rgba(0, 0, 0, 0.45)";
    c.shadowBlur = 4;
    c.shadowOffsetY = 3;
    textoEspacado(c, texto, cx, y + 88, 9);
    c.shadowColor = "transparent";
  }

  function desenharLouros(c, x, y, lado) {
    c.save();
    c.translate(x, y);
    c.scale(lado, 1);
    for (let i = 0; i < 11; i++) {
      const a = -0.9 + i * 0.2;
      const px = 40 + Math.sin(a) * 40 * (1 + i * 0.05) + i * 8;
      const py = -Math.cos(a) * 20 - i * 14 + 70;
      c.save();
      c.translate(px, py);
      c.rotate(-0.9 + i * 0.1);
      c.beginPath();
      c.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2);
      c.fillStyle = i % 2 === 0 ? "rgba(98, 130, 54, 0.85)" : "rgba(184, 137, 42, 0.85)";
      c.fill();
      c.restore();
    }
    c.restore();
  }

  function ajustarFonte(c, texto, tamanhoInicial, larguraMaxima) {
    let tamanho = tamanhoInicial;
    do {
      c.font = `bold ${tamanho}px ${serifa}`;
      tamanho -= 4;
    } while (c.measureText(texto).width > larguraMaxima && tamanho > 40);
    return c.measureText(texto).width;
  }

  function desenharCorpo(c, dados) {
    const cx = largura / 2;
    c.textAlign = "center";
    c.fillStyle = marrom;
    c.font = `italic 54px ${serifa}`;
    c.fillText("Conferimos, com muito orgulho, à", cx, 830);

    c.fillStyle = vinho;
    const larguraNome = ajustarFonte(c, dados.mesa, 168, 1500);
    c.shadowColor = "rgba(184, 137, 42, 0.45)";
    c.shadowBlur = 8;
    c.shadowOffsetY = 4;
    c.fillText(dados.mesa, cx, 990);
    c.shadowColor = "transparent";

    const limite = Math.min(larguraNome / 2 + 80, 1000);
    estrelaDeOitoPontas(c, cx - limite, 950, 26, ouroEscuro);
    estrelaDeOitoPontas(c, cx + limite, 950, 26, ouroEscuro);

    c.beginPath();
    c.moveTo(cx - 640, 1030);
    c.lineTo(cx - 40, 1030);
    c.moveTo(cx + 40, 1030);
    c.lineTo(cx + 640, 1030);
    c.strokeStyle = degradeOuro(c, cx - 640, 0, cx + 640, 0);
    c.lineWidth = 5;
    c.stroke();
    estrelaDeOitoPontas(c, cx, 1030, 20, vinho);

    c.fillStyle = marrom;
    c.font = `46px ${serifa}`;
    c.fillText("pelo brilhante desempenho na competição musical dos Anos Dourados,", cx, 1110);
    c.fillText(`conquistando o ${dados.posicao}º lugar com ${dados.pontos} pontos entre ${dados.totalMesas} mesas participantes.`, cx, 1175);

    if (dados.trofeus.length > 0) {
      c.font = `italic bold 44px ${serifa}`;
      c.fillStyle = ouroEscuro;
      c.fillText(`🏆 ${dados.trofeus.join("  •  ")}`, cx, 1232);
    }
  }

  function desenharSelo(c, x, y) {
    c.save();
    c.translate(x, y);
    c.scale(0.88, 0.88);
    [-1, 1].forEach((lado) => {
      c.beginPath();
      c.moveTo(lado * 30, 60);
      c.lineTo(lado * 100, 190);
      c.lineTo(lado * 62, 172);
      c.lineTo(lado * 40, 205);
      c.lineTo(lado * 4, 80);
      c.closePath();
      c.fillStyle = lado < 0 ? "#a22a47" : "#7a1f35";
      c.fill();
    });
    c.beginPath();
    for (let i = 0; i < 64; i++) {
      const r = i % 2 === 0 ? 138 : 122;
      const a = (Math.PI * 2 * i) / 64;
      if (i === 0) {
        c.moveTo(r * Math.cos(a), r * Math.sin(a));
      } else {
        c.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
    }
    c.closePath();
    c.fillStyle = degradeOuro(c, -140, -140, 140, 140);
    c.shadowColor = "rgba(58, 34, 16, 0.5)";
    c.shadowBlur = 14;
    c.shadowOffsetY = 6;
    c.fill();
    c.shadowColor = "transparent";
    c.beginPath();
    c.arc(0, 0, 100, 0, Math.PI * 2);
    c.strokeStyle = vinho;
    c.lineWidth = 6;
    c.stroke();
    c.beginPath();
    c.arc(0, 0, 90, 0, Math.PI * 2);
    c.strokeStyle = "rgba(122, 31, 53, 0.55)";
    c.lineWidth = 2;
    c.stroke();
    c.textAlign = "center";
    c.fillStyle = vinho;
    c.font = `bold 108px ${serifa}`;
    c.fillText("1º", 0, 22);
    c.font = `bold 28px ${serifa}`;
    textoEspacado(c, "LUGAR", 0, 62, 6);
    c.font = `bold 20px ${serifa}`;
    textoEspacado(c, "★ AUTÊNTICO ★", 0, -58, 3);
    c.restore();
  }

  function desenharAssinaturas(c, dados) {
    const y = 1500;
    const esquerda = 640;
    const direita = largura - 640;
    c.strokeStyle = marrom;
    c.lineWidth = 3;
    [esquerda, direita].forEach((centro) => {
      c.beginPath();
      c.moveTo(centro - 270, y);
      c.lineTo(centro + 270, y);
      c.stroke();
    });
    c.textAlign = "center";
    c.fillStyle = marrom;
    c.font = `34px ${serifa}`;
    c.fillText("Apresentador(a) do evento", esquerda, y + 50);
    c.fillText("Equipe Bingo Musical", direita, y + 50);
    c.font = `italic 92px "Brush Script MT", "Segoe Script", "Lucida Handwriting", cursive`;
    c.fillStyle = "#1f3a6b";
    c.save();
    c.translate(direita, y - 24);
    c.rotate(-0.04);
    c.fillText("Bingo Musical", 0, 0);
    c.restore();
    desenharSelo(c, largura / 2, 1395);
  }

  function desenharRodape(c, dados) {
    c.textAlign = "center";
    c.fillStyle = "#6b4a2a";
    c.font = `32px ${serifa}`;
    c.fillText(`Emitido em ${dados.dataTexto}, às ${dados.horaTexto}   •   Certificado nº ${dados.numero}   •   Jogo criado por Petrick Brayan`, largura / 2, 1598);
  }

  function zeroEsquerda(valor) {
    return String(valor).padStart(2, "0");
  }

  function prepararDados(dados) {
    const agora = dados.momento || new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return Object.assign({}, dados, {
      dataTexto: `${agora.getDate()} de ${meses[agora.getMonth()]} de ${agora.getFullYear()}`,
      horaTexto: `${zeroEsquerda(agora.getHours())}:${zeroEsquerda(agora.getMinutes())}`,
      numero: `BM-${agora.getFullYear()}${zeroEsquerda(agora.getMonth() + 1)}${zeroEsquerda(agora.getDate())}-${zeroEsquerda(agora.getHours())}${zeroEsquerda(agora.getMinutes())}-M${zeroEsquerda(dados.numeroMesa)}`
    });
  }

  function gerarCanvas(dadosBrutos) {
    const dados = prepararDados(dadosBrutos);
    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    const c = tela.getContext("2d");
    desenharFundo(c);
    desenharMarcaDagua(c);
    desenharMoldura(c);
    desenharCabecalho(c);
    desenharFaixa(c, "CERTIFICADO DE MESA CAMPEÃ");
    desenharCorpo(c, dados);
    desenharAssinaturas(c, dados);
    desenharRodape(c, dados);
    return tela;
  }

  function jpegEmBytes(tela) {
    const dataUrl = tela.toDataURL("image/jpeg", 0.92);
    const binario = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    return { bytes, dataUrl };
  }

  function textoEmBytes(texto) {
    const bytes = new Uint8Array(texto.length);
    for (let i = 0; i < texto.length; i++) {
      bytes[i] = texto.charCodeAt(i) & 255;
    }
    return bytes;
  }

  function montarPdf(imagens) {
    const partes = [];
    const posicoes = [];
    let tamanho = 0;
    function adicionar(conteudo) {
      const bytes = typeof conteudo === "string" ? textoEmBytes(conteudo) : conteudo;
      partes.push(bytes);
      tamanho += bytes.length;
    }
    function objeto(numero, cabecalho, fluxo) {
      posicoes[numero] = tamanho;
      adicionar(`${numero} 0 obj\n${cabecalho}\n`);
      if (fluxo) {
        adicionar("stream\n");
        adicionar(fluxo);
        adicionar("\nendstream\n");
      }
      adicionar("endobj\n");
    }
    const quantidade = imagens.length;
    const referenciasDasPaginas = imagens.map((item, i) => `${3 + i * 3} 0 R`).join(" ");
    adicionar("%PDF-1.4\n");
    objeto(1, "<< /Type /Catalog /Pages 2 0 R >>");
    objeto(2, `<< /Type /Pages /Kids [${referenciasDasPaginas}] /Count ${quantidade} >>`);
    imagens.forEach((imagem, i) => {
      const base = 3 + i * 3;
      const conteudo = "q 842 0 0 595 0 0 cm /Im0 Do Q";
      objeto(base, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /XObject << /Im0 ${base + 2} 0 R >> >> /Contents ${base + 1} 0 R >>`);
      objeto(base + 1, `<< /Length ${conteudo.length} >>`, conteudo);
      objeto(base + 2, `<< /Type /XObject /Subtype /Image /Width ${largura} /Height ${altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imagem.bytes.length} >>`, imagem.bytes);
    });
    const totalObjetos = 3 + quantidade * 3;
    const inicioTabela = tamanho;
    let tabela = `xref\n0 ${totalObjetos}\n0000000000 65535 f \n`;
    for (let n = 1; n < totalObjetos; n++) {
      tabela += `${String(posicoes[n]).padStart(10, "0")} 00000 n \n`;
    }
    tabela += `trailer\n<< /Size ${totalObjetos} /Root 1 0 R >>\nstartxref\n${inicioTabela}\n%%EOF`;
    adicionar(tabela);
    return new Blob(partes, { type: "application/pdf" });
  }

  function baixarArquivo(blob, nome) {
    const endereco = URL.createObjectURL(blob);
    const ancora = document.createElement("a");
    ancora.href = endereco;
    ancora.download = nome;
    document.body.appendChild(ancora);
    ancora.click();
    document.body.removeChild(ancora);
    setTimeout(() => URL.revokeObjectURL(endereco), 30000);
  }

  function dataUrlEmBlob(dataUrl) {
    const binario = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/jpeg" });
  }

  function nomeDoArquivo(dados, extensao) {
    const limpo = dados.mesa.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
    return `certificado-${limpo || "mesa"}.${extensao}`;
  }

  return { gerarCanvas, jpegEmBytes, montarPdf, baixarArquivo, dataUrlEmBlob, nomeDoArquivo };
})();
