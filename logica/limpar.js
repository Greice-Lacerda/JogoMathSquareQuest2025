document.addEventListener('DOMContentLoaded', function () {
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivel = document.getElementById('proximo-nivel');
    const botaoLimparTabuleiro = document.getElementById('limpar-tabuleiro');

    let tabuleiro = {}; // Inicializa o tabuleiro
    let canvas, ctx, tamanhoTabuleiro, cellWidth, cellHeight;

    // Função que limpa as imagens do tabuleiro e reinicia a lista de combinações
    botaoLimparTabuleiro.addEventListener('click', function () {
        for (let key in tabuleiro) {
            if (tabuleiro[key].length > 0) {
                tabuleiro[key].forEach(img => {
                    const imgElement = document.querySelector(`img[src="${img.src}"]`);
                    if (imgElement) {
                        imgElement.classList.add('imagem-fade-out');
                    imgElement.addEventListener('animationend', function () {
                        imgElement.remove();
                    });
                }
                }
                // Limpa a lista de imagens do tabuleiro
                tabuleiro[key] = []; // Limpa as imagens do tabuleiro
            }
        }
        imageHistory = []; // Reinicia o historico
        mensagem.textContent = 'Imagens do tabuleiro limpas!';
    });
}

// Função para limpar o tabuleiro
function limpar() {
    if (imageHistory.length > 0) {
        const lastImage = imageHistory.pop();
        const imgElement = document.querySelector(`img[src="${lastImage.src}"]`);
        if (imgElement) {
            imgElement.classList.add('imagem-fade-out');
            imgElement.addEventListener('animationend', function() {
                usedImages[lastImage.row][lastImage.col] = null;
                desenharTabuleiro();
                usedImages.flat().forEach((src, index) => {
                    if (src !== null) {
                        const col = index % tamanho;
                        const row = Math.floor(index / tamanho);
                        drawImageInCell(src, col, row);
                    }
                });
                mensagem.textContent = "";
                imgElement.remove();
                if (imageHistory.length === 0) {
                    document.querySelector('button[onclick="limpar()"]').disabled = true;
                    mensagem.textContent = "Tabuleiro vazio";
                }
            });
        }
    } else {
        mensagem.textContent = "Tabuleiro vazio";
    }
});


