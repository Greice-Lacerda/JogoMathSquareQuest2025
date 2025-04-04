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
}
