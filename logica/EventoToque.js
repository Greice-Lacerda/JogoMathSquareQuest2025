document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('tela');
    const listaImagens = document.getElementById('lista-imagens');
    const cellSize = canvas.width / 2; // Para tabuleiro 2x2
    let imagemSelecionada = null; // Variável para armazenar a imagem selecionada

    // Evento para selecionar a imagem na lista
    listaImagens.addEventListener('touchstart', function(event) {
        const target = event.target;
        if (target.classList.contains('imagem-lista')) {
            imagemSelecionada = target.src; // Guarda a imagem selecionada
        }
    });

    // Evento para inserir a imagem no canvas
    canvas.addEventListener('touchstart', function(event) {
        if (!imagemSelecionada) return; // Se nenhuma imagem estiver selecionada, sai

        event.preventDefault();
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        const context = canvas.getContext('2d');

        // Calcula onde desenhar a imagem no canvas
        const drawX = col * cellSize;
        const drawY = row * cellSize;
        const img = new Image();
        img.src = imagemSelecionada;

        img.onload = function() {
            context.drawImage(img, drawX, drawY, cellSize, cellSize);
        };

        // Remove a imagem selecionada da lista
        const imagens = listaImagens.querySelectorAll('.imagem-lista');
        imagens.forEach(function(imagem) {
            if (imagem.src === imagemSelecionada) {
                imagem.remove();
            }
        });

        // Reseta a imagem selecionada
        imagemSelecionada = null;
    });
});
