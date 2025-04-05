document.addEventListener('DOMContentLoaded', function () {
    const mensagem = document.getElementById('mensagem');
    const botaoLimparTabuleiro = document.getElementById('limpar-tabuleiro');
    const usedImages = Array.from({ length: tamanho }, () => Array(tamanho).fill(null));
    const imageHistory = [];

    // Função para limpar a última imagem inserida no tabuleiro
    function limpar() {
        if (imageHistory.length > 0) {
            const lastImage = imageHistory.pop();
            const { row, col, src } = lastImage;
            const imgElement = document.querySelector(`img[src="${src}"]`);
            if (imgElement) {
                imgElement.remove();
                usedImages[row][col] = null;
                mensagem.textContent = "";
            }
            if (imageHistory.length === 0) {
                mensagem.textContent = "Tabuleiro vazio, insira novas imagens.";
            }
        }
    }

    // Adiciona o evento de clique ao botão para limpar o tabuleiro
    botaoLimparTabuleiro.addEventListener('click', limpar);

    // Função para lidar com o evento de soltar
    function handleDrop(event) {
        event.preventDefault();
        const src = event.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (row >= 0 && row < tamanho && col >= 0 && col < tamanho) {
            usedImages[row][col] = src;
            imageHistory.push({ row, col, src });
            // Aqui você pode adicionar o código para desenhar a imagem no canvas
        }
    }

    // Adiciona o evento de arrastar e soltar ao canvas
    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragover', function (event) {
        event.preventDefault();
    });
});
