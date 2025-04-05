document.addEventListener('DOMContentLoaded', function() {
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivel = document.getElementById('proximo-nivel');
    const errorSound = new Audio('../sons/Erro.mp3');  // Caminho para o som de erro
    const clapSound = new Audio('../sons/Aplausos.mp3');  // Caminho para o som 
    
    const todasImagens = [
        '../imagens/abelha.jpeg', '../imagens/bispo.jpeg', '../imagens/bola.jpeg', '../imagens/carro.jpeg', '../imagens/cavalo.jpeg',
        '../imagens/circulo.jpeg', '../imagens/coração.png', '../imagens/estrela.jpeg', '../imagens/flor.jpeg', '../imagens/peao.jpeg',
        '../imagens/quadrado.jpeg', '../imagens/Rainha.jpeg', '../imagens/Rei.jpeg', '../imagens/torre.jpeg', '../imagens/triangulo.jpeg',
        '../imagens/abelha.png', '../imagens/abelha0.png', '../imagens/abelha1.png', '../imagens/aguia.png', '../imagens/antena.jpg',
        '../imagens/aranha.jpeg', '../imagens/atomo.png', '../imagens/BALA.png', '../imagens/balao.jpeg', '../imagens/bispo1.jpeg',
        '../imagens/boliche.png', '../imagens/bolo.png', '../imagens/boneca.png', '../imagens/borboleta.png', '../imagens/CAP.png',
        '../imagens/carro0.png', '../imagens/casa.png', '../imagens/cavalo1.jpeg', '../imagens/chapeu1.png', '../imagens/chapeu2.png',
        '../imagens/chapeu3.png', '../imagens/chinelo.png', '../imagens/cone.jpg', '../imagens/dado.png', '../imagens/esfera.png',
        '../imagens/estrela1.jpeg', '../imagens/fantasma.png', '../imagens/flor1.jpeg', '../imagens/florLis.png', '../imagens/florLis2.png',
        '../imagens/florLis3.png', '../imagens/laço.png', '../imagens/nuvem.png', '../imagens/PEAO.png', '../imagens/peao1.jpeg',
        '../imagens/pentagono.png', '../imagens/pinguim.png', '../imagens/piramide.jpg', '../imagens/piramide2.jpg', '../imagens/prisma.png',
        '../imagens/Rainha1.jpeg', '../imagens/Rainha3.jpeg', '../imagens/Rainha5.jpeg', '../imagens/Rei.png', '../imagens/Rei1.jpeg',
        '../imagens/rosa.png', '../imagens/saco.png', '../imagens/solido.jpg', '../imagens/terra.png', '../imagens/triangulo.png',
        '../imagens/tv.png', '../imagens/varrer.png'
    ];

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    embaralhar(imagens);

    const tamanho = 5; // Define o tamanho do tabuleiro como 5x5.
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
            const imgWidth = cellSize*0.8;
            const imgHeight = cellSize*0.8;
            const x = col * cellSize + (cellSize - imgWidth) / 2;
            const y = row * cellSize + (cellSize - imgHeight) / 2;
            ctx.drawImage(img, x, y, imgWidth, imgHeight);
        };
        img.src = imgSrc;
    }

    const usedImages = Array.from({ length: tamanho }, () => Array(tamanho).fill(null));
    canvas.addEventListener('drop', function(event) {
        event.preventDefault();
        const src = event.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        if (usedImages[row].includes(src) || usedImages.map(row => row[col]).includes(src)) {
            errorSound.play();
            mensagem.textContent = "Imagem já utilizada nesta linha ou coluna.";                   
        } else {
            usedImages[row][col] = src;
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
    });

    canvas.addEventListener('dragover', function(event) {
        event.preventDefault();
    });

    document.getElementById('limpar').addEventListener('click', function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        desenharTabuleiro();
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                usedImages[row][col] = null;
            }
        }
        mensagem.textContent = ""; // Limpa a mensagem
    });

    document.getElementById('reiniciar').addEventListener('click', function() {
        embaralhar(imagens); // Embaralha as imagens ao reiniciar
        window.location.href = "../paginas/index.html"; // Redireciona para a página inicial
    });
    
});
