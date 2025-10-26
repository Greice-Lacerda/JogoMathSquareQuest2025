// Aguarda o carregamento completo do DOM para garantir que todos os elementos HTML existam
document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const limparBtn = document.getElementById('limparImagem');
    const resetarBtn = document.getElementById('resetarTabuleiro');
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');
    const paginaInicialBtn = document.getElementById('paginaInicial');

    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    const tamanho = 4; // Nível 3: Tabuleiro 4x4
    let usedImages = [];
    let imageHistory = [];
    let cellSize = 0; // Será calculado dinamicamente

    let errorSound;
    let clapSound;
    let audioInicializado = false;

    // --- REATORAÇÃO: Variáveis de estado para o arraste manual ---
    let isDragging = false; // Flag para saber se estamos arrastando
    let draggedItemSrc = null; // A 'src' da imagem que estamos arrastando
    let ghostImage = null; // A imagem "fantasma" que segue o mouse/dedo
    // --- FIM REATORAÇÃO ---

    const imagens = ['../imagens/abelha.png',
        '../imagens/aguia.png',
        '../imagens/antena.png',
        '../imagens/aranha.jpeg',
        '../imagens/atomo.png',
        '../imagens/bala.png',
        '../imagens/balao.png',
        '../imagens/bispo.png',
        '../imagens/bola.jpeg',
        '../imagens/boliche.png',
        '../imagens/bolo.png',
        '../imagens/bone.png',
        '../imagens/boneca.png',
        '../imagens/borboleta.png',
        '../imagens/capelo.png',
        '../imagens/carro.jpeg',
        '../imagens/carroIcone.png',
        '../imagens/cartola.png',
        '../imagens/casa.png',
        '../imagens/cavalo.jpeg',
        '../imagens/chinelo.png',
        '../imagens/circulo.png',
        '../imagens/coracao.png',
        '../imagens/corcel.jpeg',
        '../imagens/coroa.png',
        '../imagens/coroaBranca.png',
        '../imagens/dado.png',
        '../imagens/esfera.png',
        '../imagens/estrela.jpeg',
        '../imagens/fantasma.png',
        '../imagens/flor.jpeg',
        '../imagens/florIcone.png',
        '../imagens/icone.jpeg',
        '../imagens/lisBranca.png',
        '../imagens/lisPreta.png',
        '../imagens/mais.png',
        '../imagens/mosca.png',
        '../imagens/nuvem.png',
        '../imagens/peao.png',
        '../imagens/pentagonoIcone.png',
        '../imagens/pentagonos.png',
        '../imagens/pinguim.png',
        '../imagens/piramidePentonal.png',
        '../imagens/piramideQuadragular.jpg',
        '../imagens/presentes.png',
        '../imagens/prisma.png',
        '../imagens/quadrado.png',
        '../imagens/rainhaIcone.png',
        '../imagens/reiIcone.jpg',
        '../imagens/rosa.png',
        '../imagens/solidoColorido.png',
        '../imagens/solidoIcone.png',
        '../imagens/terra.png',
        '../imagens/torre.jpeg',
        '../imagens/triangulo.png',
        '../imagens/tv.png',
        '../imagens/vassourinha.png',
        '../imagens/zangao.png'
    ];

    // --- 3. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---

    function inicializarAudio() {
        if (!audioInicializado) {
            errorSound = new Audio('../sons/Erro.mp3');
            clapSound = new Audio('../sons/Aplausos.mp3');
            errorSound.load();
            clapSound.load();
            audioInicializado = true;
            console.log("Áudio inicializado pelo usuário.");
        }
    }

    function tocarSom(som) {
        if (som) {
            som.currentTime = 0;
            som.play().catch(error => console.error("Erro ao tocar o som:", error));
        }
    }

    function ajustarERedesenharCanvas() {
        // Garantir que o container tenha um tamanho antes de ler
        if (tabuleiroContainer.clientWidth === 0) {
            // Se o container não tiver largura, espera um ciclo de renderização
            requestAnimationFrame(ajustarERedesenharCanvas);
            return;
        }

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
        img.onload = function () {
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

        // --- REATORAÇÃO: Garante que botões sejam reativados ---
        resetarBtn.disabled = false;
        limparBtn.disabled = false;
        // --- FIM REATORAÇÃO ---

        ajustarERedesenharCanvas();
        embaralhar(imagens);

        for (let i = 0; i < tamanho; i++) {
            const imgElement = document.createElement('img');
            imgElement.src = imagens[i];
            imgElement.alt = imagens[i].split('/').pop();

            // --- REATORAÇÃO: Substituído 'draggable' e 'dragstart' por 'mousedown' e 'touchstart' ---
            // imgElement.draggable = true; // REMOVIDO
            // imgElement.addEventListener('dragstart', ...); // REMOVIDO
            imgElement.addEventListener('mousedown', onDragStart);
            imgElement.addEventListener('touchstart', onDragStart);
            // --- FIM REATORAÇÃO ---

            listaImagens.appendChild(imgElement);
        }
    }

    // --- REATORAÇÃO: Lógica de "soltar" extraída da função de evento original ---
    // Esta função agora processa a lógica do jogo, recebendo as coordenadas e a 'src'.
    function processarDrop(clientX, clientY, src) {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Verifica se o drop foi dentro dos limites do canvas
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
            return; // Sai se o drop foi fora do canvas
        }

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Verifica se a célula é válida (caso de cálculo impreciso)
        if (row >= tamanho || col >= tamanho) return;

        if (usedImages[row][col] !== null) {
            tocarSom(errorSound);
            mensagem.textContent = "Célula já ocupada. Tente outra.";
        } else if (usedImages[row].includes(src) || usedImages.map(r => r[col]).includes(src)) {
            tocarSom(errorSound);
            mensagem.textContent = "Imagem repetida na linha ou coluna.";
        } else {
            usedImages[row][col] = src;
            imageHistory.push({ src, col, row });
            drawImageInCell(src, col, row);
            mensagem.textContent = "";

            if (usedImages.flat().every(cell => cell !== null)) {
                mensagem.innerHTML = "<h2>Parabéns! Você completou o desafio!</h2>";
                proximoNivelBtn.style.display = 'block';
                resetarBtn.disabled = true;
                limparBtn.disabled = true;
                tocarSom(clapSound);
                confetti({
                    particleCount: 500,
                    spread: 1000,
                    origin: { y: 0.3 },
                    zIndex: 9999
                });
            }
        }
    }
    // --- FIM REATORAÇÃO ---


    function limparUltimaJogada() {
        if (imageHistory.length > 0) {
            const lastMove = imageHistory.pop();
            usedImages[lastMove.row][lastMove.col] = null;
            redesenharTodasImagens();
            mensagem.textContent = "Última jogada desfeita.";
            proximoNivelBtn.style.display = 'none';

            // --- REATORAÇÃO: Garante que botões sejam reativados ---
            resetarBtn.disabled = false;
            limparBtn.disabled = false;
            // --- FIM REATORAÇÃO ---
        } else {
            mensagem.textContent = "Nenhuma jogada para limpar.";
        }
    }

    // --- 4. NOVOS EVENT LISTENERS (Mouse e Toque unificados) ---

    // --- REATORAÇÃO: Função 'onDragStart' (Início do arraste) ---
    function onDragStart(event) {
        // Previne o comportamento padrão (como 'drag' nativo do browser em imagens)
        event.preventDefault();

        // Verifica se o alvo é uma imagem
        if (event.target.tagName !== 'IMG') return;

        inicializarAudio(); // Garante que o áudio seja inicializado

        isDragging = true;
        draggedItemSrc = event.target.src;

        // Cria a imagem "fantasma" (ghost)
        ghostImage = event.target.cloneNode();
        ghostImage.style.position = 'fixed';
        ghostImage.style.pointerEvents = 'none'; // Impede a imagem de bloquear outros eventos
        ghostImage.style.opacity = '0.7';
        ghostImage.style.zIndex = '1000';
        ghostImage.style.width = `${event.target.clientWidth}px`; // Mantém o tamanho
        ghostImage.style.height = `${event.target.clientHeight}px`;
        document.body.appendChild(ghostImage);

        // Posiciona a imagem fantasma
        onDragMove(event);

        // Adiciona os listeners GLOBAIS para movimento e soltura
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);

        // { passive: false } é CRÍTICO para o touchmove permitir o preventDefault()
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    }

    // --- REATORAÇÃO: Função 'onDragMove' (Movimento do arraste) ---
    function onDragMove(event) {
        if (!isDragging) return;

        // CRÍTICO para mobile: Impede a página de rolar enquanto arrasta
        if (event.type === 'touchmove') {
            event.preventDefault();
        }

        // Normaliza o evento para obter coordenadas (funciona para mouse e toque)
        let clientX, clientY;
        if (event.touches) {
            // Se for 'touchmove' ou 'touchstart'
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            // Se for 'mousemove' ou 'mousedown'
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Move a imagem fantasma, centralizando-a no ponteiro/dedo
        if (ghostImage) {
            ghostImage.style.left = `${clientX - ghostImage.width / 2}px`;
            ghostImage.style.top = `${clientY - ghostImage.height / 2}px`;
        }
    }

    // --- REATORAÇÃO: Função 'onDragEnd' (Fim do arraste / "Drop") ---
    function onDragEnd(event) {
        if (!isDragging) return;

        isDragging = false;

        // Limpa os listeners GLOBAIS
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);

        // Remove a imagem fantasma
        if (ghostImage && document.body.contains(ghostImage)) {
            document.body.removeChild(ghostImage);
        }

        // Normaliza o evento para obter as coordenadas de *soltura*
        let clientX, clientY;
        if (event.changedTouches) {
            // Se for 'touchend', usa 'changedTouches'
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            // Se for 'mouseup', usa 'clientX/Y'
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Processa a lógica de soltar
        processarDrop(clientX, clientY, draggedItemSrc);

        // Limpa as variáveis de estado
        ghostImage = null;
        draggedItemSrc = null;
    }


    // --- 5. REGISTRO DE EVENTOS (Restante) ---


    window.addEventListener('resize', ajustarERedesenharCanvas);

    resetarBtn.addEventListener('click', iniciarJogo);
    limparBtn.addEventListener('click', limparUltimaJogada);

    paginaInicialBtn.addEventListener('click', () => {
        window.location.href = '../instrucao1.html';
    });

    proximoNivelBtn.addEventListener('click', () => {
        // Link para a F4 (Nível 4)
        window.location.href = 'Nivel4.html?tamanhoTabuleiro=5';
    });

    // --- 6. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});