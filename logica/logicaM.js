document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagensEl = document.getElementById('lista-imagens');
    const mensagemEl = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');

    // Elementos do Menu e Modal
    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem');
    const modalCombinacoes = document.getElementById('painelCombinacoes');
    const listaCombinacoesEl = document.getElementById('lista-combinacoes');
    const exibirCombinacoesBtn = document.getElementById('exibirCombinacoesBtn');
    const fecharCombinacoesBtn = document.getElementById('fecharCombinacoesBtn'); // Botão do modal

    // Botões adicionais
    const paginaInicialBtn = document.getElementById('paginaInicial');

    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    let tamanhoTabuleiro = 2;
    let tabuleiro = {}; // { "row,col": [imgSrc1, imgSrc2] }
    let imageHistory = []; // { key: "row,col", index: 0|1 }
    let imagensSelecionadas = [];
    let imagensCarregadas = {}; // { imgSrc: ImageObject }
    let combinacoesGeradas = []; // [[imgSrc1, imgSrc2], ...]

    // Variáveis de estado para D&D Unificado
    let isDragging = false;
    let draggedItemSrc = null;
    let ghostImage = null;

    // Lógica de áudio
    let errorSound, clapSound;
    let audioInicializado = false;

    const todasImagens = ['../imagens/abelha.png',
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
        '../imagens/corBranca.png',
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
        '../imagens/pentIcone.png',
        '../imagens/pentagonos.png',
        '../imagens/pinguim.png',
        '../imagens/pentagonal.png',
        '../imagens/quadragular.jpg',
        '../imagens/presentes.png',
        '../imagens/prisma.png',
        '../imagens/quadrado.png',
        '../imagens/rainhaIcone.png',
        '../imagens/reiIcone.jpg',
        '../imagens/rosa.png',
        '../imagens/colorido.png',
        '../imagens/solidoIcone.png',
        '../imagens/terra.png',
        '../imagens/torre.jpeg',
        '../imagens/triangulo.png',
        '../imagens/tv.png',
        '../imagens/vassourinha.png',
        '../imagens/zangao.png'
    ];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        tabuleiro = {};
        imageHistory = [];

        mensagemEl.textContent = 'Arraste duas imagens para cada célula para formar uma combinação.';
        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';

        if (modalCombinacoes) modalCombinacoes.classList.remove('modal-ativo');
        if (listaCombinacoesEl) listaCombinacoesEl.style.display = 'none';
        if (exibirCombinacoesBtn) exibirCombinacoesBtn.textContent = 'Exibir Combinações';

        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;

        const urlParams = new URLSearchParams(window.location.search);
        tamanhoTabuleiro = parseInt(urlParams.get('tamanhoTabuleiro'), 10) || 2;

        const imagensParaEmbaralhar = [...todasImagens];
        embaralharArray(imagensParaEmbaralhar);
        while (imagensParaEmbaralhar.length < tamanhoTabuleiro) {
            imagensParaEmbaralhar.push(...todasImagens);
            embaralharArray(imagensParaEmbaralhar);
        }
        imagensSelecionadas = imagensParaEmbaralhar.slice(0, tamanhoTabuleiro);

        combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);

        carregarImagens(imagensSelecionadas, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
        });
    }

    function ajustarERedesenharCanvas() {
        if (!tabuleiroContainer || !canvas || tabuleiroContainer.clientWidth === 0 || tabuleiroContainer.clientHeight === 0) {
            requestAnimationFrame(ajustarERedesenharCanvas);
            return;
        }
        canvas.width = tabuleiroContainer.clientWidth;
        // Altura igual à largura para canvas quadrado (pois o container é quadrado 1:1)
        canvas.height = tabuleiroContainer.clientHeight;

        desenharTabuleiroCompleto();
    }

    function processarDrop(clientX, clientY, imgSrc) {
        inicializarAudio();
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

        const cellWidth = canvas.width / tamanhoTabuleiro;
        const cellHeight = canvas.height / tamanhoTabuleiro; // Igual a cellWidth
        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);
        const key = `${row},${col}`;

        if (row >= tamanhoTabuleiro || col >= tamanhoTabuleiro) return;
        if (!tabuleiro[key]) tabuleiro[key] = [];

        if (tabuleiro[key].length >= 2) {
            mensagemEl.textContent = 'Célula cheia. Tente outra.';
            tocarSom(errorSound);
            return;
        }

        const imageIndex = tabuleiro[key].length;
        tabuleiro[key].push(imgSrc);
        imageHistory.push({ key: key, index: imageIndex });

        desenharTabuleiroCompleto();

        if (tabuleiro[key].length === 2) {
            const combinacaoAtual = tabuleiro[key];
            if (verificarEremoverCombinacao(combinacaoAtual)) {
                mensagemEl.textContent = 'Combinação correta!';
                setTimeout(() => { if (mensagemEl.textContent === 'Combinação correta!') mensagemEl.textContent = ''; }, 1500);

                if (combinacoesGeradas.length === 0) {
                    mensagemEl.innerHTML = "<h2>Parabéns!<br>Você completou o desafio!</h2>";
                    if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                    if (reiniciarBtn) reiniciarBtn.disabled = true;
                    if (limparBtn) limparBtn.disabled = true;
                    tocarSom(clapSound);
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
                    }
                }
            } else {
                mensagemEl.textContent = "Combinação inválida ou já usada!";
                tocarSom(errorSound);
                imageHistory.pop();
                imageHistory.pop();
                tabuleiro[key] = [];
                setTimeout(desenharTabuleiroCompleto, 800);
            }
        }
    }

    // --- 4. FUNÇÕES DE COMBINAÇÃO ---
    function gerarCombinacoes(imagens) {
        const combinacoes = [];
        for (let i = 0; i < imagens.length; i++) {
            for (let j = 0; j < imagens.length; j++) {
                combinacoes.push([imagens[i], imagens[j]]);
            }
        }
        exibirCombinacoes(combinacoes);
        return combinacoes;
    }

    function exibirCombinacoes(combinacoes) {
        if (!listaCombinacoesEl) return;
        listaCombinacoesEl.innerHTML = '';
        if (combinacoes.length === 0) {
            listaCombinacoesEl.innerHTML = '<p>Nenhuma combinação restante.</p>'; return;
        }
        combinacoes.forEach((comb, index) => {
            const divComb = document.createElement('div');
            try {
                const img1Name = comb[0].split('/').pop().split('.')[0] || 'img1';
                const img2Name = comb[1].split('/').pop().split('.')[0] || 'img2';
                divComb.textContent = `${index + 1}: ${img1Name} + ${img2Name}`;
            } catch (e) { divComb.textContent = `${index + 1}: Erro`; }
            listaCombinacoesEl.appendChild(divComb);
        });
    }

    function verificarEremoverCombinacao(combinacaoJogador) {
        for (let i = 0; i < combinacoesGeradas.length; i++) {
            let combValida = combinacoesGeradas[i];
            if (combValida[0] === combinacaoJogador[0] && combValida[1] === combinacaoJogador[1]) {
                combinacoesGeradas.splice(i, 1);
                exibirCombinacoes(combinacoesGeradas);
                return true;
            }
        }
        return false;
    }

    // --- 5. FUNÇÕES AUXILIARES ---

    /**
     * Desenha uma imagem no canvas mantendo sua proporção original,
     * centralizada dentro do retângulo (box) especificado.
     */
    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
        if (!img || !img.naturalWidth || !img.naturalHeight) {
            console.warn("Tentando desenhar imagem inválida ou não carregada.");
            return;
        }
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const boxRatio = w / h;
        let drawWidth, drawHeight, drawX, drawY;

        if (imgRatio > boxRatio) {
            drawWidth = w;
            drawHeight = w / imgRatio;
            drawX = x;
            drawY = y + (h - drawHeight) / 2;
        } else {
            drawHeight = h;
            drawWidth = h * imgRatio;
            drawX = x + (w - drawWidth) / 2;
            drawY = y;
        }
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    // Desenha tabuleiro e imagens (duas por célula quadrada, sem distorção)
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        const cellWidth = canvas.width / tamanhoTabuleiro;
        const cellHeight = canvas.height / tamanhoTabuleiro; // Igual a cellWidth

        for (let row = 0; row < tamanhoTabuleiro; row++) {
            for (let col = 0; col < tamanhoTabuleiro; col++) {
                ctx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight); // Borda

                const key = `${row},${col}`;
                const imagensNaCelula = tabuleiro[key];

                if (imagensNaCelula && imagensNaCelula.length > 0) {
                    // Calcula os DOIS RETÂNGULOS (slots) dentro da célula quadrada
                    const padding = cellWidth * 0.05;
                    const gap = cellWidth * 0.05;
                    const availableWidth = cellWidth - (padding * 2);
                    const availableHeight = cellHeight - (padding * 2);
                    const slotWidth = (availableWidth - gap) / 2;
                    const slotHeight = availableHeight;

                    // Coords Slot 1 (Esquerda)
                    const x1 = col * cellWidth + padding;
                    const y1 = row * cellHeight + padding;
                    // Coords Slot 2 (Direita)
                    const x2 = x1 + slotWidth + gap;
                    const y2 = y1;

                    // Desenha img1 SEM DISTORCER
                    if (imagensNaCelula[0]) {
                        const img1 = imagensCarregadas[imagensNaCelula[0]];
                        if (img1) {
                            drawImageMaintainAspect(ctx, img1, x1, y1, slotWidth, slotHeight);
                        }
                    }
                    // Desenha img2 SEM DISTORCER
                    if (imagensNaCelula[1]) {
                        const img2 = imagensCarregadas[imagensNaCelula[1]];
                        if (img2) {
                            drawImageMaintainAspect(ctx, img2, x2, y2, slotWidth, slotHeight);
                        }
                    }
                }
            }
        }
    }

    // Carrega imagens e adiciona listeners D&D unificados
    function carregarImagens(imagens, callback) {
        let carregadas = {};
        let restantes = imagens.length;
        if (!listaImagensEl) return;
        listaImagensEl.innerHTML = '';

        imagens.forEach((imgSrc) => {
            let img = new Image();
            img.src = imgSrc;
            img.id = imgSrc;

            img.addEventListener('mousedown', onDragStart);
            img.addEventListener('touchstart', onDragStart, { passive: true });

            img.onload = () => {
                listaImagensEl.appendChild(img);
                carregadas[imgSrc] = img;
                restantes--;
                if (restantes === 0) callback(carregadas);
            };
            img.onerror = () => {
                console.error(`Falha ao carregar: ${imgSrc}`);
                restantes--;
                if (restantes === 0) callback(carregadas);
            };
        });
    }

    // Desfaz a última imagem adicionada
    function limparUltimaJogada() {
        if (imageHistory.length > 0) {
            const lastMove = imageHistory.pop();
            const cellImages = tabuleiro[lastMove.key];
            if (cellImages && cellImages.length > lastMove.index) {
                cellImages.splice(lastMove.index, 1);
            }
            desenharTabuleiroCompleto();
            mensagemEl.textContent = "Última imagem removida.";
            if (reiniciarBtn) reiniciarBtn.disabled = false;
            if (limparBtn) limparBtn.disabled = false;
            if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        } else {
            mensagemEl.textContent = "Nenhuma jogada para limpar.";
        }
    }

    function embaralharArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function inicializarAudio() {
        if (!audioInicializado) {
            try {
                errorSound = new Audio('../sons/Erro.mp3');
                clapSound = new Audio('../sons/Aplausos.mp3');
                errorSound.load(); clapSound.load();
                audioInicializado = true; console.log("Áudio inicializado.");
            } catch (e) { console.error("Erro áudio:", e); audioInicializado = false; }
        }
    }

    function tocarSom(som) {
        if (som && audioInicializado) {
            som.currentTime = 0;
            som.play().catch(e => console.error("Erro áudio:", e));
        }
    }

    // --- 6. EVENT LISTENERS D&D UNIFICADO ---
    function onDragStart(event) {
        if (event.type === 'mousedown') event.preventDefault();
        if (!event.target.id || !imagensCarregadas[event.target.id]) return;
        inicializarAudio();
        isDragging = true;
        draggedItemSrc = event.target.id;
        ghostImage = event.target.cloneNode();
        ghostImage.style.cssText = `position:fixed; pointer-events:none; opacity:0.7; z-index:1000; width:${event.target.clientWidth}px; height:${event.target.clientHeight}px;`;
        document.body.appendChild(ghostImage);
        onDragMove(event);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
    }
    function onDragMove(event) {
        if (!isDragging || !ghostImage) return;
        if (event.type === 'touchmove') event.preventDefault();
        let clientX = event.touches ? event.touches[0].clientX : event.clientX;
        let clientY = event.touches ? event.touches[0].clientY : event.clientY;
        ghostImage.style.left = `${clientX - ghostImage.width / 2}px`;
        ghostImage.style.top = `${clientY - ghostImage.height / 2}px`;
    }
    function onDragEnd(event) {
        if (!isDragging) return;
        isDragging = false;
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove);
        window.removeEventListener('touchend', onDragEnd);
        if (ghostImage && document.body.contains(ghostImage)) {
            document.body.removeChild(ghostImage);
        }
        let clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
        let clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
        processarDrop(clientX, clientY, draggedItemSrc);
        ghostImage = null; draggedItemSrc = null;
    }

    // --- 7. REGISTRO DOS EVENT LISTENERS RESTANTES ---
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    // Lógica do Modal
    if (exibirCombinacoesBtn && modalCombinacoes && listaCombinacoesEl) {
        exibirCombinacoesBtn.addEventListener('click', () => {
            const modalAtivo = modalCombinacoes.classList.contains('modal-ativo');
            if (modalAtivo) {
                modalCombinacoes.classList.remove('modal-ativo');
                exibirCombinacoesBtn.textContent = 'Exibir Combinações';
                listaCombinacoesEl.style.display = 'none';
            } else {
                exibirCombinacoes(combinacoesGeradas);
                listaCombinacoesEl.style.display = 'grid'; // Define display ANTES de mostrar
                modalCombinacoes.classList.add('modal-ativo');
                exibirCombinacoesBtn.textContent = 'Ocultar Combinações';
            }
        });
    }
    if (fecharCombinacoesBtn && modalCombinacoes && exibirCombinacoesBtn && listaCombinacoesEl) {
        fecharCombinacoesBtn.addEventListener('click', () => {
            modalCombinacoes.classList.remove('modal-ativo');
            exibirCombinacoesBtn.textContent = 'Exibir Combinações';
            listaCombinacoesEl.style.display = 'none';
        });
    }
    if (modalCombinacoes && exibirCombinacoesBtn && listaCombinacoesEl) {
        modalCombinacoes.addEventListener('click', (event) => {
            if (event.target === modalCombinacoes) { // Clique no fundo
                modalCombinacoes.classList.remove('modal-ativo');
                exibirCombinacoesBtn.textContent = 'Exibir Combinações';
                listaCombinacoesEl.style.display = 'none';
            }
        });
    }

    // Botões de Navegação
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('../instrucao2.html', '_self'));
    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelM(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 1;
            const proximoNivelNum = nivelAtual + 1;
            const proximoTamanho = tamanhoTabuleiro + 1;

            if (proximoNivelNum > 5) { // Supondo M5 como último
                window.open('../NivelD.html', '_self');
            } else {
                const proximoNivelHtml = `NivelM${proximoNivelNum}.html`;
                window.open(`${proximoNivelHtml}?tamanhoTabuleiro=${proximoTamanho}`, '_self');
            }
        });
    }
    
    // --- 8. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});