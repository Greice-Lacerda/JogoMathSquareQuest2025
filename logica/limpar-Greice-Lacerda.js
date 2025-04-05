document.addEventListener('DOMContentLoaded', function () {
    const mensagem = document.getElementById('mensagem');
    const botaoLimparTabuleiro = document.getElementById('limpar-tabuleiro');
  
    // Limpa todo o tabuleiro quando o botão for clicado
    botaoLimparTabuleiro.addEventListener('click', function () {
      if (typeof usedImages !== 'undefined' && Array.isArray(usedImages)) {
        for (let row = 0; row < usedImages.length; row++) {
          for (let col = 0; col < usedImages[row].length; col++) {
            usedImages[row][col] = null;
          }
        }
      }
      if (typeof desenharTabuleiro === 'function') {
        desenharTabuleiro();
      }
      if (typeof imageHistory !== 'undefined' && Array.isArray(imageHistory)) {
        imageHistory.length = 0;
      }
      mensagem.textContent = 'Imagens do tabuleiro limpas!';
    });
  });
  
  // Função para limpar a última imagem inserida no tabuleiro  
  function handleDrop(event) {
      event.preventDefault();
      const src = event.dataTransfer.getData('text/plain');
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      // Verifica se a célula já contém uma imagem
      if (usedImages[row][col] !== null) {
  function limpar() {
    const mensagem = document.getElementById('mensagem');
    if (typeof imageHistory !== 'undefined' && imageHistory.length > 0) {
      const lastImage = imageHistory.pop();
      const imgElement = document.querySelector(`img[src="${lastImage.src}"]`);
      if (imgElement) {
        imgElement.classList.add('imagem-fade-out');
        imgElement.addEventListener('animationend', function() {
          if (typeof usedImages !== 'undefined' && Array.isArray(usedImages)) {
            usedImages[lastImage.row][lastImage.col] = null;
          }
          if (typeof desenharTabuleiro === 'function') {
            desenharTabuleiro();
          }
          if (typeof usedImages !== 'undefined' && Array.isArray(usedImages)) {
            usedImages.flat().forEach((src, index) => {
              if (src !== null) {
                const col = index % tamanho;
                const row = Math.floor(index / tamanho);
                if (typeof drawImageInCell === 'function') {
                  drawImageInCell(src, col, row);
                }
              }
            });
          }
          mensagem.textContent = "";
          imgElement.remove();
          if (imageHistory.length === 0) {
            const btnLimpar = document.querySelector('button[onclick="limpar()"]');
            if (btnLimpar) {
              btnLimpar.disabled = true;
            }
            mensagem.textContent = "Tabuleiro vazio";
          }
        });
      }
    } else {
      mensagem.textContent = "Tabuleiro vazio";
    }
  }
]