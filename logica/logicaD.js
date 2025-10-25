document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagensEl = document.getElementById('lista-imagens');
    const mensagemEl = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel'); // Botão após concluir
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');

    // Elementos do Menu
    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem'); // Desfazer Jogada

    // Botões adicionais
    const paginaInicialBtn = document.getElementById('paginaInicial');
    const sairDoJogoBtn = document.getElementById('sairDoJogo');
    const imprimirBtn = document.getElementById('BtnImprimir');

    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    let tamanhoGrupo = 6; // *** FIXO EM 6 ***
    let tabuleiro = {}; // { "row,col": imgSrc }
    let history = []; // { key: "row,col", imgSrc: imgSrc }
    let imagensGrupo = []; // Array ORDENADO dos 6 elementos
    let imagensParaArrastar = []; // Imagens disponíveis para drag
    let imagensCarregadas = {}; // Cache { imgSrc: ImageObject }
    let tabelaCayleyCorreta = []; // Matriz 6x6 com imgSrc corretos
    let celulasCorretas = 0; // Contador de acertos
    let identidadeAditivaSrc = null;
    let identidadeMultiplicativaSrc = null;

    // Constantes visuais (ajustar via CSS idealmente, mas JS pode calcular)
    const HEADER_SIZE_RATIO = 0.15; // Proporção para cabeçalhos
    let headerPixelSize = 0;
    let gridPixelSize = 0;
    let cellPixelSize = 0;

    // D&D Unificado
    let isDragging = false;
    let draggedItemSrc = null;
    let ghostImage = null;

    // Áudio
    let errorSound, clapSound;
    let audioInicializado = false;

    // Lista completa de imagens disponíveis
    const todasImagens = [
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
        // Adicione mais imagens se necessário para garantir pelo menos 6 únicas
    ];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        tamanhoGrupo = 6; // Garante que é 6

        mensagemEl.textContent = 'Arraste a imagem resultado para a célula correta da Tábua de Cayley 6x6.';
        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (imprimirBtn) imprimirBtn.style.display = 'none'; // Esconde imprimir inicialmente
        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;

        const imagensSelecionadasOriginal = selecionarImagensUnicas(tamanhoGrupo);
        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas. Encontradas: ${imagensSelecionadasOriginal.length}. Verifique a pasta de imagens.`;
            if (reiniciarBtn) reiniciarBtn.disabled = true;
            if (limparBtn) limparBtn.disabled = true;
            return;
        }

        identidadeAditivaSrc = imagensSelecionadasOriginal[0];
        identidadeMultiplicativaSrc = imagensSelecionadasOriginal[1];
        imagensGrupo = [...imagensSelecionadasOriginal]; // Ordem canônica
        imagensParaArrastar = [...imagensGrupo]; // Ordem para arrastar (pode embaralhar)
        // embaralharArray(imagensParaArrastar); // Descomente para embaralhar

        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo); // Sempre 6x6

        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensGrupo])];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
        });
    }

    function selecionarImagensUnicas(n) {
        const selecionadas = [];
        const copiaImagens = [...todasImagens];
        embaralharArray(copiaImagens);
        for (let i = 0; i < n && i < copiaImagens.length; i++) {
            selecionadas.push(copiaImagens[i]);
        }
        return selecionadas;
    }

    function gerarTabelaCayley(elementos) {
        const n = elementos.length; // Será 6
        const tabela = [];
        console.log("Gerando Tabela de Cayley 6x6 para elementos:", elementos);
        for (let i = 0; i < n; i++) {
            tabela[i] = [];
            for (let j = 0; j < n; j++) {
                // Operação: Adição Modular n (índices)
                const resultadoIndex = (i + j) % n;
                tabela[i][j] = elementos[resultadoIndex];
            }
        }
        console.log("Tabela de Cayley Gerada (6x6):", tabela);
        return tabela;
    }

    function ajustarERedesenharCanvas() {
        if (!tabuleiroContainer || !canvas || tabuleiroContainer.clientWidth === 0 || tabuleiroContainer.clientHeight === 0) {
            requestAnimationFrame(ajustarERedesenharCanvas);
            return;
        }
        canvas.width = tabuleiroContainer.clientWidth;
        canvas.height = tabuleiroContainer.clientHeight; // Assume container quadrado 1:1

        headerPixelSize = canvas.width * HEADER_SIZE_RATIO;
        gridPixelSize = canvas.width - headerPixelSize;
        cellPixelSize = gridPixelSize / tamanhoGrupo; // Divide por 6

        desenharTabuleiroCompleto();
    }

    function processarDrop(clientX, clientY, imgSrcDropped) {
        inicializarAudio();
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) return;

        const gridX = x - headerPixelSize;
        const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);
        const key = `${row},${col}`;

        if (row >= tamanhoGrupo || col >= tamanhoGrupo) return; // Fora dos limites 6x6

        // Permite sobrescrever, mas verifica se já estava correto
        const jaEstavaCorreto = tabuleiro[key] === tabelaCayleyCorreta[row][col];
        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            return; // Não faz nada se já estava certo
        }

        // Limpa histórico se for sobrescrever um erro anterior na mesma célula
        if (tabuleiro[key] && !jaEstavaCorreto) {
            history = history.filter(move => move.key !== key);
        }

        const expectedImgSrc = tabelaCayleyCorreta[row][col];

        if (imgSrcDropped === expectedImgSrc) { // CORRETO
            tabuleiro[key] = imgSrcDropped;
            history.push({ key: key, imgSrc: imgSrcDropped });
            celulasCorretas++; // Incrementa sempre que acerta (mesmo se sobrescreveu erro)

            try { // Tenta mostrar nomes curtos
                const nomeLinha = imagensGrupo[row].split('/').pop().split('.')[0] || `Elem ${row + 1}`;
                const nomeColuna = imagensGrupo[col].split('/').pop().split('.')[0] || `Elem ${col + 1}`;
                mensagemEl.textContent = `Correto! (${nomeLinha} * ${nomeColuna})`;
            } catch {
                mensagemEl.textContent = 'Correto!';
            }


            if (celulasCorretas === tamanhoGrupo * tamanhoGrupo) { // Completou 36 células
                mensagemEl.innerHTML = "<h2>Parabéns!</h2> Tábua de Cayley 6x6 completa!";
                if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                if (imprimirBtn) imprimirBtn.style.display = 'block'; // Mostra imprimir no final
                if (reiniciarBtn) reiniciarBtn.disabled = true;
                if (limparBtn) limparBtn.disabled = true;
                tocarSom(clapSound);
                if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
            }
        } else { // INCORRETO
            mensagemEl.textContent = `Incorreto para a célula (${row + 1}, ${col + 1}). Tente novamente.`; // Mostra 1-based index
            tocarSom(errorSound);
            // Limpa a célula apenas se ela continha um erro anterior
            if (tabuleiro[key] && !jaEstavaCorreto) {
                delete tabuleiro[key];
                // Não precisa mexer no history aqui, pois já foi filtrado acima
            }
            // A imagem incorreta não é colocada visualmente
        }
        desenharTabuleiroCompleto();
    }

    // --- 5. FUNÇÕES AUXILIARES ---

    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
        if (!img || !img.naturalWidth || !img.naturalHeight) return;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const boxRatio = w / h;
        let dw, dh, dx, dy;
        if (imgRatio > boxRatio) { dw = w; dh = w / imgRatio; dx = x; dy = y + (h - dh) / 2; }
        else { dh = h; dw = h * imgRatio; dx = x + (w - dw) / 2; dy = y; }
        ctx.drawImage(img, dx, dy, dw, dh);
    }

    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#AAA'; ctx.lineWidth = 1;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`; // Fonte mínima 10px
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // Desenha Cabeçalhos (6 Headers)
        for (let i = 0; i < tamanhoGrupo; i++) {
            const headerImgSrc = imagensGrupo[i];
            const img = imagensCarregadas[headerImgSrc];
            const headerMidX = headerPixelSize / 2;
            const headerMidY = headerPixelSize / 2;
            const cellMidX = headerPixelSize + (i * cellPixelSize) + (cellPixelSize / 2);
            const cellMidY = headerPixelSize + (i * cellPixelSize) + (cellPixelSize / 2);

            // Header Linha i
            if (img) drawImageMaintainAspect(ctx, img, 0, headerPixelSize + i * cellPixelSize, headerPixelSize, cellPixelSize);
            else ctx.fillText('?', headerMidX, cellMidY);
            ctx.strokeRect(0, headerPixelSize + i * cellPixelSize, headerPixelSize, cellPixelSize);

            // Header Coluna i
            if (img) drawImageMaintainAspect(ctx, img, headerPixelSize + i * cellPixelSize, 0, cellPixelSize, headerPixelSize);
            else ctx.fillText('?', cellMidX, headerMidY);
            ctx.strokeRect(headerPixelSize + i * cellPixelSize, 0, cellPixelSize, headerPixelSize);
        }
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillText('+', headerMidX, headerMidY); // Operação

        // Desenha Grid (6x6) e Imagens
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) {
            for (let col = 0; col < tamanhoGrupo; col++) {
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize); // Borda

                const key = `${row},${col}`;
                const imgSrcInCell = tabuleiro[key];
                if (imgSrcInCell) {
                    const img = imagensCarregadas[imgSrcInCell];
                    if (img) {
                        drawImageMaintainAspect(ctx, img, cellX, cellY, cellPixelSize, cellPixelSize);
                    }
                }
            }
        }
    }

    function carregarImagens(imagens, callback) {
        let carregadasLocal = {}; // Cache local para esta chamada específica
        let restantes = imagens.length;
        if (!listaImagensEl) return callback({}); // Retorna objeto vazio se lista não existe
        listaImagensEl.innerHTML = ''; // Limpa lista visual

        imagens.forEach((imgSrc) => {
            // Verifica se já está no cache GLOBAL
            let img = imagensCarregadas[imgSrc];
            let needsLoad = !img; // Precisa carregar se não está no cache global

            if (!needsLoad) { // Já está no cache global
                // Garante que tenha ID e listeners para D&D (se ainda não tiver)
                if (!img.id) img.id = imgSrc;
                if (!img.dataset.listenerAddedD) { // Usa um dataset específico para nível D
                    img.addEventListener('mousedown', onDragStart);
                    img.addEventListener('touchstart', onDragStart, { passive: true });
                    img.dataset.listenerAddedD = "true";
                }
                // Adiciona à lista visual APENAS se pertencer a imagensParaArrastar e não estiver lá
                if (imagensParaArrastar.includes(imgSrc) && !listaImagensEl.querySelector(`[id="${imgSrc}"]`)) {
                    listaImagensEl.appendChild(img);
                }
                restantes--; // Considera "carregada" para o callback
            } else { // Precisa carregar
                img = new Image();
                img.src = imgSrc;
                img.id = imgSrc;
                img.dataset.listenerAddedD = "true";

                img.addEventListener('mousedown', onDragStart);
                img.addEventListener('touchstart', onDragStart, { passive: true });

                img.onload = () => {
                    // Adiciona ao cache GLOBAL
                    imagensCarregadas[imgSrc] = img;
                    // Adiciona ao cache LOCAL desta chamada
                    carregadasLocal[imgSrc] = img;
                    // Adiciona à lista visual APENAS se pertencer a imagensParaArrastar
                    if (imagensParaArrastar.includes(imgSrc)) {
                        listaImagensEl.appendChild(img);
                    }
                    restantes--;
                    if (restantes === 0) callback(carregadasLocal); // Chama callback quando todas as NOVAS carregarem
                };
                img.onerror = () => {
                    console.error(`Falha ao carregar: ${imgSrc}`);
                    restantes--;
                    if (restantes === 0) callback(carregadasLocal);
                };
            }
        });

        // Chama callback imediatamente se todas JÁ ESTAVAM no cache global
        if (restantes <= 0 && imagens.length > 0) {
            // Preenche carregadasLocal com as imagens do cache global que foram solicitadas
            imagens.forEach(src => {
                if (imagensCarregadas[src]) {
                    carregadasLocal[src] = imagensCarregadas[src];
                }
            });
            callback(carregadasLocal);
        } else if (imagens.length === 0) {
            callback({}); // Callback se não havia imagens para carregar
        }
    }


    function limparUltimaJogada() {
        if (history.length > 0) {
            const lastMove = history.pop();
            const key = lastMove.key;
            const imgSrcRemoved = lastMove.imgSrc;
            const [row, col] = key.split(',').map(Number);

            // Decrementa contador APENAS se a jogada desfeita era um acerto
            if (imgSrcRemoved === tabelaCayleyCorreta[row][col]) {
                celulasCorretas--;
            }

            delete tabuleiro[key]; // Remove do tabuleiro lógico

            desenharTabuleiroCompleto(); // Redesenha
            mensagemEl.textContent = "Última jogada desfeita.";

            if (reiniciarBtn) reiniciarBtn.disabled = false;
            if (limparBtn) limparBtn.disabled = false;
            if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
            if (imprimirBtn) imprimirBtn.style.display = 'none'; // Esconde imprimir de novo

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
                errorSound = new Audio('../sons/Erro.mp3'); clapSound = new Audio('../sons/Aplausos.mp3');
                errorSound.load(); clapSound.load();
                audioInicializado = true; console.log("Áudio D inicializado.");
            } catch (e) { console.error("Erro áudio D:", e); audioInicializado = false; }
        }
    }

    function tocarSom(som) {
        if (som && audioInicializado) {
            som.currentTime = 0;
            som.play().catch(e => console.error("Erro áudio D:", e));
        }
    }

    // --- 6. EVENT LISTENERS D&D UNIFICADO ---
    function onDragStart(event) {
        if (event.type === 'mousedown') event.preventDefault();
        if (!event.target.id || !imagensCarregadas[event.target.id]) return;
        inicializarAudio(); isDragging = true; draggedItemSrc = event.target.id;
        ghostImage = event.target.cloneNode();
        ghostImage.style.cssText = `position:fixed; pointer-events:none; opacity:0.7; z-index:1000; width:${event.target.clientWidth}px; height:${event.target.clientHeight}px; border-radius: 5px;`; // Add border-radius
        document.body.appendChild(ghostImage); onDragMove(event);
        window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false }); window.addEventListener('touchend', onDragEnd);
    }
    function onDragMove(event) {
        if (!isDragging || !ghostImage) return; if (event.type === 'touchmove') event.preventDefault();
        let clientX = event.touches ? event.touches[0].clientX : event.clientX;
        let clientY = event.touches ? event.touches[0].clientY : event.clientY;
        ghostImage.style.left = `${clientX - ghostImage.width / 2}px`;
        ghostImage.style.top = `${clientY - ghostImage.height / 2}px`;
    }
    function onDragEnd(event) {
        if (!isDragging) return; isDragging = false;
        window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd);
        window.removeEventListener('touchmove', onDragMove); window.removeEventListener('touchend', onDragEnd);
        if (ghostImage && document.body.contains(ghostImage)) document.body.removeChild(ghostImage);
        let clientX = event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
        let clientY = event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
        processarDrop(clientX, clientY, draggedItemSrc);
        ghostImage = null; draggedItemSrc = null;
    }

    // --- 7. REGISTRO DOS EVENT LISTENERS RESTANTES ---
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    // Botões de Navegação
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('../index.html', '_self'));
    if (sairDoJogoBtn) sairDoJogoBtn.addEventListener('click', () => window.open('https://www.google.com.br', '_blank'));
    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 1;
            const proximoNivelNum = nivelAtual + 1;
            const proximoTamanho = tamanhoTabuleiro + 1;

            if (proximoNivelNum > 4) { // Supondo M5 como último
                window.open('../NivelZerouJogo.html', '_self');
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;
                window.open(`${proximoNivelHtml}?tamanhoTabuleiro=${proximoTamanho}`, '_self');
            }
        });
    }
    if (imprimirBtn) imprimirBtn.addEventListener('click', () => window.open('ImpTabD.html', '_blank')); // Página de impressão Nível D

    // --- 8. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});