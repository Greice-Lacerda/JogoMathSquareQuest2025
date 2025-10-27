// Aguarda o carregamento completo do DOM
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
    const tamanho = 2; // Nível F1: Tabuleiro 2x2
    let usedImages = [];
    let imageHistory = [];
    let cellSize = 0;

    let errorSound;
    let clapSound;
    let audioInicializado = false;

    // Variável de estado para a lógica "Célula-Primeiro" (mantida)
    let celulaAtiva = null; // Armazena {row, col} da célula clicada

    const imagens = ['../imagens/abelha.png', '../imagens/aguia.png', '../imagens/antena.png', '../imagens/aranha.jpeg', '../imagens/atomo.png', '../imagens/bala.png', '../imagens/balao.png', '../imagens/bispo.png', '../imagens/bola.jpeg', '../imagens/boliche.png', '../imagens/bolo.png', '../imagens/bone.png', '../imagens/boneca.png', '../imagens/borboleta.png', '../imagens/capelo.png', '../imagens/carro.jpeg', '../imagens/carroIcone.png', '../imagens/cartola.png', '../imagens/casa.png', '../imagens/cavalo.jpeg', '../imagens/chinelo.png', '../imagens/circulo.png', '../imagens/coracao.png', '../imagens/corcel.jpeg', '../imagens/coroa.png', '../imagens/corBranca.png', '../imagens/dado.png', '../imagens/esfera.png', '../imagens/estrela.jpeg', '../imagens/fantasma.png', '../imagens/flor.jpeg', '../imagens/florIcone.png', '../imagens/icone.jpeg', '../imagens/lisBranca.png', '../imagens/lisPreta.png', '../imagens/mais.png', '../imagens/mosca.png', '../imagens/nuvem.png', '../imagens/peao.png', '../imagens/pentIcone.png', '../imagens/pentagonos.png', '../imagens/pinguim.png', '../imagens/pentagonal.png', '../imagens/quadragular.jpg', '../imagens/presentes.png', '../imagens/prisma.png', '../imagens/quadrado.png', '../imagens/rainhaIcone.png', '../imagens/reiIcone.jpg', '../imagens/rosa.png', '../imagens/colorido.png', '../imagens/solidoIcone.png', '../imagens/terra.png', '../imagens/torre.jpeg', '../imagens/triangulo.png', '../imagens/tv.png', '../imagens/vassourinha.png', '../imagens/zangao.png'];

    // --- 3. FUNÇÕES DE RENDERIZAÇÃO E LÓGICA ---

    function inicializarAudio() {
        if (!audioInicializado) {
            errorSound = new Audio('../sons/Erro.mp3'); // Caminho corrigido
            clapSound = new Audio('../sons/Aplausos.mp3');   // Caminho corrigido
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
        // ... (Função mantida)
        if (!tabuleiroContainer || tabuleiroContainer.clientWidth === 0) {
             // Adiciona verificação para tabuleiroContainer
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
         // ... (Função mantida)
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function desenharTabuleiro() {
         // ... (Função mantida)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }

    function desenharHighlight() {
         // ... (Função mantida)
        if (!celulaAtiva) return;
        const x = celulaAtiva.col * cellSize;
        const y = celulaAtiva.row * cellSize;
        ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, cellSize, cellSize);
         // Reset stroke style for subsequent drawings if needed
        ctx.strokeStyle = '#333'; // Reset to default border color
        ctx.lineWidth = 2;       // Reset to default line width
    }

    function drawImageInCell(imgSrc, col, row) {
         // ... (Função mantida)
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
        // Error handling for image loading
        img.onerror = function() {
            console.error("Erro ao carregar a imagem:", imgSrc);
            // Optionally draw a placeholder or error indicator
            ctx.fillStyle = 'red';
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
        img.src = imgSrc;
    }

    function redesenharTodasImagens() {
         // ... (Função mantida, com chamada de highlight)
        desenharTabuleiro();
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                if (usedImages[row][col]) {
                    drawImageInCell(usedImages[row][col], col, row);
                }
            }
        }
        desenharHighlight(); // Desenha o highlight por último
    }

    function iniciarJogo() {
        // ... (Função mantida, com ajustes nos listeners)
        usedImages = Array.from({ length: tamanho }, () => Array(tamanho).fill(null));
        imageHistory = [];
        listaImagens.innerHTML = '';
        mensagem.innerHTML = "Clique em uma célula e depois na imagem, ou arraste a imagem.<br>Não pode repetir na linha/coluna."; // Mensagem atualizada
        proximoNivelBtn.style.display = 'none';
        resetarBtn.disabled = false;
        limparBtn.disabled = false;
        celulaAtiva = null;

        ajustarERedesenharCanvas();
        embaralhar(imagens);

        for (let i = 0; i < tamanho; i++) {
            const imgElement = document.createElement('img');
            imgElement.src = imagens[i];
            imgElement.alt = imagens[i].split('/').pop();

            // [NOVA LÓGICA DE INTERAÇÃO] Adiciona listeners NATIVOS de drag e o listener de CLICK
            imgElement.draggable = true; // Necessário para dragstart nativo
            imgElement.addEventListener('dragstart', onNativeDragStart);
            imgElement.addEventListener('click', onImageBankClick_CellFirst);

            // [REMOVIDO] Listeners de arraste manual (mousedown, touchstart)

            listaImagens.appendChild(imgElement);
        }
    }

    function processarJogada(row, col, src) {
        // ... (Função mantida - lógica F1)
        // Verifica se a célula é válida
        if (row === undefined || col === undefined || row < 0 || col < 0 || row >= tamanho || col >= tamanho) {
             mensagem.textContent = "Posição inválida.";
             tocarSom(errorSound);
             celulaAtiva = null;
             redesenharTodasImagens();
             return;
        }

        if (usedImages[row][col] !== null) {
            tocarSom(errorSound);
            mensagem.textContent = "Célula já ocupada. Tente outra.";
        } else if (usedImages[row].includes(src) || usedImages.map(r => r[col]).includes(src)) {
            tocarSom(errorSound);
            mensagem.textContent = "Imagem repetida na linha ou coluna.";
        } else {
            // Sucesso!
            usedImages[row][col] = src;
            imageHistory.push({ src, col, row });
            mensagem.textContent = "Correto!";

            if (usedImages.flat().every(cell => cell !== null)) {
                mensagem.innerHTML = "<h2>Parabéns! Você completou o desafio!</h2>";
                proximoNivelBtn.style.display = 'block';
                resetarBtn.disabled = true;
                limparBtn.disabled = true;
                tocarSom(clapSound);
                if (typeof confetti === 'function') {
                    confetti({ particleCount: 500, spread: 1000, origin: { y: 0.3 }, zIndex: 9999 });
                }
            }
        }
        celulaAtiva = null;
        redesenharTodasImagens();
    }

    function limparUltimaJogada() {
        // ... (Função mantida)
        if (imageHistory.length > 0) {
            const lastMove = imageHistory.pop();
            usedImages[lastMove.row][lastMove.col] = null;
            celulaAtiva = null;
            redesenharTodasImagens();
            mensagem.textContent = "Última jogada desfeita.";
            proximoNivelBtn.style.display = 'none';
            resetarBtn.disabled = false;
            limparBtn.disabled = false;
        } else {
            mensagem.textContent = "Nenhuma jogada para limpar.";
        }
    }

    // --- 4. [NOVA LÓGICA DE INTERAÇÃO] Event Listeners (Drag Nativo e Clique Célula-Primeiro) ---

    /**
     * Início do arraste NATIVO (dragstart)
     */
    function onNativeDragStart(event) {
        // Verifica se o alvo é uma imagem
        if (event.target.tagName !== 'IMG') {
            event.preventDefault(); // Impede o arraste se não for imagem
            return;
        }

        inicializarAudio(); // Garante que o áudio seja inicializado

        // Limpa a célula ativa se um arraste começar
        if (celulaAtiva) {
            celulaAtiva = null;
            redesenharTodasImagens(); // Remove o highlight
        }

        // Define os dados a serem transferidos (a URL da imagem)
        event.dataTransfer.setData('text/plain', event.target.src);
        event.dataTransfer.effectAllowed = 'copy'; // Mostra um ícone de cópia
    }

    /**
     * Permite que um item seja solto sobre o canvas (dragover)
     */
    function onCanvasDragOver(event) {
        event.preventDefault(); // ESSENCIAL para permitir o drop
        event.dataTransfer.dropEffect = 'copy'; // Indica visualmente que é uma cópia
    }

    /**
     * Lida com a soltura NATIVA no canvas (drop)
     */
    function onCanvasDrop(event) {
        event.preventDefault(); // Impede o navegador de abrir a imagem
        const imgSrcDropped = event.dataTransfer.getData('text/plain');

        if (!imgSrcDropped) {
            console.error("Nenhum dado de imagem encontrado no drop.");
            return;
        }

        // Calcula row/col baseado nas coordenadas do evento de drop
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        // Processa a jogada
        processarJogada(row, col, imgSrcDropped);
    }


    /**
     * Lida com o primeiro clique (no canvas) - Lógica Célula-Primeiro
     */
    function onCanvasClick_CellFirst(event) {
        // [REMOVIDO] Verificação 'isDragging' (não mais necessária)
        inicializarAudio(); // Garante inicialização

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Ignora clique fora do grid
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
            celulaAtiva = null;
            redesenharTodasImagens();
            return;
        }

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (row < tamanho && col < tamanho) {
            // Clicou em uma célula válida
            celulaAtiva = { row, col };
            mensagem.textContent = "Célula selecionada! Agora clique na imagem correta no banco.";
            redesenharTodasImagens(); // Mostra o destaque
        } else {
             // Clicou fora das células válidas, mas dentro do canvas? Limpa seleção.
             celulaAtiva = null;
             redesenharTodasImagens();
        }
    }

    /**
     * Lida com o segundo clique (no banco de imagens) - Lógica Célula-Primeiro
     */
    function onImageBankClick_CellFirst(event) {
        event.preventDefault(); // Impede comportamento padrão da imagem
        // [REMOVIDO] Verificação 'isDragging'

        if (!celulaAtiva) {
            tocarSom(errorSound);
            mensagem.textContent = "Por favor, clique em uma célula do tabuleiro primeiro.";
            return;
        }

        const clickedSrc = event.target.src;
        processarJogada(celulaAtiva.row, celulaAtiva.col, clickedSrc);
        // (processarJogada já limpa celulaAtiva e redesenha)
    }
    // --- FIM DA NOVA LÓGICA ---


    // --- 5. REGISTRO DE EVENTOS ---

    window.addEventListener('resize', ajustarERedesenharCanvas);

    // [NOVA LÓGICA DE INTERAÇÃO] Adiciona listeners NATIVOS de drag no canvas
    if (canvas) {
        canvas.addEventListener('dragover', onCanvasDragOver);
        canvas.addEventListener('drop', onCanvasDrop);
        // Mantém o listener de clique para "célula-primeiro"
        canvas.addEventListener('click', onCanvasClick_CellFirst);
    } else {
        console.error("Elemento canvas não encontrado!");
    }


    // Botões (mantidos)
    if(resetarBtn) resetarBtn.addEventListener('click', iniciarJogo);
    if(limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if(paginaInicialBtn) {
        paginaInicialBtn.addEventListener('click', () => {
             // Assumindo que instrucao1.html está na pasta pai
            window.open('instrucao1.html', '_blank');
        });
    }

    if(proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
             // Assumindo que Nivel2.html está na mesma pasta
            window.location.href = 'Nivel2.html?tamanhoTabuleiro=3';
        });
    }

    // --- 6. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});