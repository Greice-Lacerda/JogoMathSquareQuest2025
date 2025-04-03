document.addEventListener('DOMContentLoaded', function() {
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivel = document.getElementById('proximo-nivel');
    const errorSound = new Audio('../sons/Erro.mp3');  // Caminho para o som de erro
    const clapSound = new Audio('../sons/Aplausos.mp3');  // Caminho para o som 
    const imagens = [
    "../imagens/abelha.png", "../imagens/abelha0.png", "../imagens/abelha1.png",
    "../imagens/aguia.png", "../imagens/antena.png", "../imagens/aranha.jpeg",
    "../imagens/atomo.png", "../imagens/BALA.png", "../imagens/balao.jpeg",
    "../imagens/bispo1.jpeg", "../imagens/bola.jpeg", "../imagens/boliche.png",
    "../imagens/bolo.png", "../imagens/boneca.png", "../imagens/borboleta.png",
    "../imagens/carro.jpeg", "../imagens/carro.png", "../imagens/carro0.png",
    "../imagens/casa.png", "../imagens/cavalo.jpeg", "../imagens/cavalo1.jpeg",
    "../imagens/chapeu1.png", "../imagens/chapeu2.png", "../imagens/chapeu3.png",
    "../imagens/chinelo.png", "../imagens/circulo.jpeg", "../imagens/coração.png",
    "../imagens/coroa.png", "../imagens/dado.png", "../imagens/esfera.png",
    "../imagens/estrela.jpeg", "../imagens/estrela1.jpeg", "../imagens/fantasma.png",
    "../imagens/flor.jpeg", "../imagens/flor1.PNG", "../imagens/florLis.png",
    "../imagens/florLis3.png", "../imagens/nuvem.png", "../imagens/PEAO.png",
    "../imagens/pentagono.png", "../imagens/pinguim.png", "../imagens/piramide.jpg",
    "../imagens/piramide2.jpg", "../imagens/prisma.png", "../imagens/quadrado.jpeg",
    "../imagens/Rainha5.jpeg", "../imagens/rainha6.png", "../imagens/Rei.png",
    "../imagens/rosa.png", "../imagens/saco.png", "../imagens/solido.jpg",
    "../imagens/terra.png", "../imagens/torre.jpeg", "../imagens/triangulo.jpeg",
    "../imagens/tv.png", "../imagens/varrer.png"
    ];

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    embaralhar(imagens);

    const tamanho = 2; // Define o tamanho do tabuleiro como 2x2.
    listaImagens.innerHTML = ''; // Limpa as imagens anteriores
    for (let i = 0; i < tamanho; i++) {
        const imgElement = document.createElement('img');
        imgElement.src = `../imagens/${imagens[i]}`;
        imgElement.alt = imagens[i];
        imgElement.className = 'imagem-lista';
        imgElement.draggable = true;
        listaImagens.appendChild(imgElement);
        imgElement.addEventListener('dragstart', function(event) {
            event.dataTransfer.setData('text/plain', event.target.src);
        });
    }

    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / tamanho;
    function desenharTabuleiro() {
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize); // Adiciona bordas às células
            }
        }
    }
    desenharTabuleiro();

    function drawImageInCell(imgSrc, col, row) {
        const img = new Image();
        img.onload = function() {
            const imgWidth = 0.9*cellSize;
            const imgHeight = 0.9*cellSize;
            const x = col * cellSize + (cellSize - imgWidth)/2;
            const y = row * cellSize + (cellSize - imgHeight)/2;

            // Adiciona sombra usando filter drop-shadow
            ctx.filter = 'drop-shadow(5px 5px 5px rgba(0, 0, 0, 1))';

            ctx.drawImage(img, x, y, imgWidth, imgHeight);

            // Reseta o filtro para evitar que afete outros desenhos
            ctx.filter = 'none';
        };
        img.src = imgSrc;
    }

    const usedImages = Array.from({ length: tamanho }, () => Array(tamanho).fill(null));
    const imageHistory = [];

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
            errorSound.play();
            mensagem.textContent = "Esta célula já contém uma imagem.";
        } else if (usedImages[row].includes(src) || usedImages.map(row => row[col]).includes(src)) {
            errorSound.play();
            mensagem.textContent = "Imagem já utilizada nesta linha ou coluna.";                   
        } else {
            usedImages[row][col] = src;
            imageHistory.push({ src, col, row });
            drawImageInCell(src, col, row);
            mensagem.textContent = ""; // Limpa a mensagem de erro
            if (usedImages.flat().every(cell => cell !== null)) {
                mensagem.textContent = "Parabéns! Você conseguiu completar o tabuleiro.";
                proximoNivel.style.display = 'block'; // Exibe o botão Próximo Nível
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                clapSound.play();  
            }
        }
    }

    canvas.addEventListener('drop', handleDrop);
    canvas.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

    // Adiciona suporte a eventos de toque
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
