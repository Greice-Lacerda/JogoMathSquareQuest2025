document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('tela');
    const listaImagens = document.getElementById('lista-imagens');
    const cellSize = canvas.width / 2; // Para tabuleiro 2x2

    canvas.addEventListener('touchstart', function(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        const src = listaImagens.querySelector('.imagem-lista').src;

        handleDrop({
            preventDefault: () => {},
            dataTransfer: {
                getData: () => src
            },
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    });

    canvas.addEventListener('touchmove', function(event) {
        event.preventDefault();
    });
});
