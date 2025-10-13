// Aguarda o carregamento completo do DOM para garantir que todos os elementos HTML existam
document.addEventListener('DOMContentLoaded', function() {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const imprimirBtn = document.getElementById('BtnImprimir');
    const limparBtn = document.getElementById('limparImagem');
    const resetarBtn = document.getElementById('resetarTabuleiro');
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');
    const paginaInicialBtn = document.getElementById('paginaInicial');
    const sairDoJogoBtn = document.getElementById('sairDoJogo');
    
    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    const tamanho = 4; // Nível 3: Tabuleiro 4x4
    let usedImages = [];
    let imageHistory = [];
    let cellSize = 0; // Será calculado dinamicamente

    // ALTERAÇÃO: Apenas declaramos os sons aqui, sem criar o objeto Audio ainda.
    let errorSound;
    let clapSound;
    let audioInicializado = false; // Flag para garantir que o áudio seja inicializado apenas uma vez

    // Lista de todas as imagens disponíveis
    const imagens = [
        "../imagens/abelha.png", "../imagens/abelha0.png", "../imagens/abelha1.png", "../imagens/aguia.png",
        "../imagens/antena.png", "../imagens/aranha.jpeg", "../imagens/atomo.png", "../imagens/BALA.png",
        "../imagens/balao.png", "../imagens/bispo1.png", "../imagens/bola.jpeg", "../imagens/boliche.png",
        "../imagens/bolo.png", "../imagens/boneca.png", "../imagens/borboleta.png", "../imagens/carro.jpeg",
        "../imagens/carro.png", "../imagens/carro0.png", "../imagens/casa.png", "../imagens/cavalo.jpeg",
        "../imagens/cavalo1.jpeg", "../imagens/chapeu1.png", "../imagens/chapeu2.png", "../imagens/chapeu3.png",
        "../imagens/chinelo.png", "../imagens/circulo.png", "../imagens/coração.png", "../imagens/coroa.png",
        "../imagens/dado.png", "../imagens/esfera.png", "../imagens/estrela.jpeg", "../imagens/estrela1.jpeg",
        "../imagens/fantasma.png", "../imagens/flor.jpeg", "../imagens/flor1.PNG", "../imagens/florLis.png",
        "../imagens/florLis3.png", "../imagens/mais.png", "../imagens/nuvem.png", "../imagens/PEAO.png",
        "../imagens/pentagono.png", "../imagens/pentagono1.png", "../imagens/pinguim.png", "../imagens/piramide.jpg",
        "../imagens/piramide2.png", "../imagens/prisma.png", "../imagens/quadrado.png", "../imagens/Rainha5.png",
        "../imagens/rainha6.png", "../imagens/Rei.jpg", "../imagens/rosa.png", "../imagens/saco.png",
        "../imagens/solido.png", "../imagens/solido1.png", "../imagens/terra.png", "../imagens/torre.jpeg",
        "../imagens/triangulo.png", "../imagens/tv.png", "../imagens/varrer.png"
    ];

    // --- 3. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---

    // ALTERAÇÃO: Nova função para inicializar o áudio na primeira interação do usuário
    function inicializarAudio() {
        if (!audioInicializado) {
            errorSound = new Audio('../sons/Erro.mp3');
            clapSound = new Audio('../sons/Aplausos.mp3');
            errorSound.load(); // Pré-carrega o áudio
            clapSound.load();
            audioInicializado = true;
            console.log("Áudio inicializado pelo usuário.");
        }
    }

    // ALTERAÇÃO: Função helper para tocar sons, garantindo que reiniciem
    function tocarSom(som) {
        if (som) {
            som.currentTime = 0;
            som.play().catch(error => console.error("Erro ao tocar o som:", error));
        }
    }

    function ajustarERedesenharCanvas() {
        const containerSize = tabuleiroContainer.clientWidth;
        canvas.width = containerSize;
        canvas.height = containerSize;
        cellSize = canvas.width / tamanho;
        redesenharTodasImagens();
    }

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function desenharTabuleiro() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }

    function drawImageInCell(imgSrc, col, row) {
        const img = new Image();
        img.onload = function() {
            const padding = cellSize * 0.15;
            const imgSize = cellSize - (2 * padding);
            const x = col * cellSize + padding;
            const y = row * cellSize + padding;
            ctx.filter = 'drop-shadow(4px 4px 2px rgba(0, 0, 0, 0.7))';
            ctx.drawImage(img, x, y, imgSize, imgSize);
            ctx.filter = 'none';
        };
        img.src = imgSrc;
    }
    
    function redesenharTodasImagens() {
        desenharTabuleiro();
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                if (usedImages[row][col]) {
                    drawImageInCell(usedImages[row][col], col, row);
                }
            }
        }
    }

    function iniciarJogo() {
        usedImages = Array.from({ length: tamanho }, () => Array(tamanho).fill(null));
        imageHistory = [];
        listaImagens.innerHTML = '';
        mensagem.innerHTML = "Arraste as imagens para o tabuleiro!<br>Não pode repetir na mesma linha ou coluna.";
        proximoNivelBtn.style.display = 'none';
        imprimirBtn.style.display = 'none';
        
        ajustarERedesenharCanvas();
        embaralhar(imagens);

        for (let i = 0; i < tamanho; i++) {
            const imgElement = document.createElement('img');
            imgElement.src = imagens[i];
            imgElement.alt = imagens[i].split('/').pop();
            imgElement.draggable = true;
            imgElement.addEventListener('dragstart', (event) => {
                inicializarAudio(); // ALTERAÇÃO: O áudio é desbloqueado aqui!
            event.dataTransfer.setData('text/plain', event.target.src);
            });
            listaImagens.appendChild(imgElement);
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const src = event.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (usedImages[row][col] !== null) {
            tocarSom(errorSound); // ALTERAÇÃO: Usa a nova função para tocar
            mensagem.textContent = "Célula já ocupada. Tente outra.";
        } else if (usedImages[row].includes(src) || usedImages.map(r => r[col]).includes(src)) {
            tocarSom(errorSound); // ALTERAÇÃO: Usa a nova função para tocar
            mensagem.textContent = "Imagem repetida na linha ou coluna.";
        } else {
            usedImages[row][col] = src;
            imageHistory.push({ src, col, row });
            drawImageInCell(src, col, row);
            mensagem.textContent = "";

            if (usedImages.flat().every(cell => cell !== null)) {
                mensagem.innerHTML = "<h2>Parabéns! Você completou o desafio!</h2>";
                proximoNivelBtn.style.display = 'block';
                imprimirBtn.style.display = 'block';
                resetarBtn.disabled = true;
                limparBtn.disabled = true;

                tocarSom(clapSound); // ALTERAÇÃO: Usa a nova função para tocar

                // ✅ A MÁGICA ACONTECE AQUI
                confetti({
                    particleCount: 500,
                    spread: 1000,
                    origin: { y: 0.3 },
                    zIndex: 9999 
                // Força os confetes a aparecerem na camada mais alta
                });
            }
        }
    }

    function limparUltimaJogada() {
        if (imageHistory.length > 0) {
            const lastMove = imageHistory.pop();
            usedImages[lastMove.row][lastMove.col] = null;
            redesenharTodasImagens();
            mensagem.textContent = "Última jogada desfeita.";
            proximoNivelBtn.style.display = 'none';
            imprimirBtn.style.display = 'none';
        } else {
            mensagem.textContent = "Nenhuma jogada para limpar.";
        }
    }

    // --- 4. REGISTRO DOS EVENT LISTENERS ---
    
    canvas.addEventListener('dragover', (event) => event.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    
    window.addEventListener('resize', ajustarERedesenharCanvas);

    resetarBtn.addEventListener('click', iniciarJogo);
    limparBtn.addEventListener('click', limparUltimaJogada);
    
    paginaInicialBtn.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
    
    sairDoJogoBtn.addEventListener('click', () => {
        window.location.href = 'https://www.google.com.br';
    });

    proximoNivelBtn.addEventListener('click', () => {
        window.location.href = 'Nivel4.html?tamanhoTabuleiro=5';
    });

    imprimirBtn.addEventListener('click', () => {
    // Abre 'Imprimir.html' em uma nova guia
    window.open('ImpTab.html', '_blank');
    });

    // --- 5. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});