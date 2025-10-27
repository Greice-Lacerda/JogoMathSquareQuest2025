document.addEventListener('DOMContentLoaded', function () {

    // ==========================================================================
    // 0. [D5] LEITURA DE PARÂMETROS E VALIDAÇÃO
    // ==========================================================================

    const urlParams = new URLSearchParams(window.location.search);
    const logicString = decodeURIComponent(urlParams.get('logic'));
    const moduloString = decodeURIComponent(urlParams.get('modulo'));
    const mensagemEl = document.getElementById('mensagem');
    const containerPrincipal = document.querySelector('.page-container');

    let MODULO_N;
    let userFunction;

    if (!logicString || logicString === "null" || !moduloString || moduloString === "null") {
        if (mensagemEl) mensagemEl.innerHTML = `<h2>Erro Crítico</h2><p>Parâmetros 'logic' ou 'modulo' não encontrados na URL. <br> Por favor, volte e configure o nível.</p>`;
        if (containerPrincipal) containerPrincipal.style.display = 'none';
        return;
    }

    try {
        MODULO_N = parseInt(moduloString, 10);
        if (isNaN(MODULO_N) || MODULO_N < 2 || MODULO_N > 6) {
            throw new Error(`Módulo inválido: ${moduloString}. Deve ser entre 2 e 6.`);
        }
    } catch (e) {
        if (mensagemEl) mensagemEl.innerHTML = `<h2>Erro Crítico</h2><p>Valor de módulo inválido. ${e.message}</p>`;
        if (containerPrincipal) containerPrincipal.style.display = 'none';
        return;
    }

    try {
        userFunction = new Function('a', 'b', `return ${logicString}`);
        // [REFATORAÇÃO 1-BASED] Teste rápido com 1,1
        userFunction(1, 1);
    } catch (e) {
        if (mensagemEl) mensagemEl.innerHTML = `<h2>Erro Crítico</h2><p>Erro ao processar a lógica: ${e.message}</p>`;
        if (containerPrincipal) containerPrincipal.style.display = 'none';
        return;
    }

    // ==========================================================================
    // 1. SELEÇÃO DE ELEMENTOS E VARIÁVEIS GLOBAIS
    // ==========================================================================

    const canvas = document.getElementById('tela');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const listaImagensEl = document.getElementById('lista-imagens');
    const containerTabuleiro = document.getElementById('tabuleiro');
    const listaResultadosEl = document.getElementById('lista-resultados');
    const rotateOverlay = document.getElementById('rotate-overlay');

    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const paginaInicialBtn = document.getElementById('paginaInicial');

    // Lista completa de imagens (não alterada)
    let todasImagensBase = ['../imagens/abelha.png', '../imagens/aguia.png', '../imagens/antena.png', '../imagens/aranha.jpeg', '../imagens/atomo.png', '../imagens/bala.png', '../imagens/balao.png', '../imagens/bispo.png', '../imagens/bola.jpeg', '../imagens/boliche.png', '../imagens/bolo.png', '../imagens/bone.png', '../imagens/boneca.png', '../imagens/borboleta.png', '../imagens/capelo.png', '../imagens/carro.jpeg', '../imagens/carroIcone.png', '../imagens/cartola.png', '../imagens/casa.png', '../imagens/cavalo.jpeg', '../imagens/chinelo.png', '../imagens/circulo.png', '../imagens/coracao.png', '../imagens/corcel.jpeg', '../imagens/coroa.png', '../imagens/corBranca.png', '../imagens/dado.png', '../imagens/esfera.png', '../imagens/estrela.jpeg', '../imagens/fantasma.png', '../imagens/flor.jpeg', '../imagens/florIcone.png', '../imagens/icone.jpeg', '../imagens/lisBranca.png', '../imagens/lisPreta.png', '../imagens/mais.png', '../imagens/mosca.png', '../imagens/nuvem.png', '../imagens/peao.png', '../imagens/pentIcone.png', '../imagens/pentagonos.png', '../imagens/pinguim.png', '../imagens/pentagonal.png', '../imagens/quadragular.jpg', '../imagens/presentes.png', '../imagens/prisma.png', '../imagens/quadrado.png', '../imagens/rainhaIcone.png', '../imagens/reiIcone.jpg', '../imagens/rosa.png', '../imagens/colorido.png', '../imagens/solidoIcone.png', '../imagens/terra.png', '../imagens/torre.jpeg', '../imagens/triangulo.png', '../imagens/tv.png', '../imagens/vassourinha.png', '../imagens/zangao.png'];
    
    let todasImagens = [];

    let tamanhoGrupo = MODULO_N;
    let cellPixelSize = 0;
    let headerPixelSize = 0;
    let tabuleiro = {};
    let tabelaCayleyCorreta = [];
    let imagensCarregadas = {};

    // [REFATORAÇÃO 1-BASED] 'imagensGrupo' é [null, img1, ..., imgN]
    let imagensGrupo = [];
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];

    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    let celulaAtiva = null;
    let dragging = false;
    let draggedImgSrc = null;

    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        tamanhoGrupo = MODULO_N;
        resultadosAcertados = {};
        celulaAtiva = null;

        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (reiniciarBtn) { reiniciarBtn.disabled = false; }
        if (limparBtn) { limparBtn.disabled = false; }

        mensagemEl.textContent = 'Arraste a imagem ou clique na célula e depois na imagem.';

        todasImagens = [...todasImagensBase];
        embaralharArray(todasImagens);
        const imagensSelecionadasOriginal = todasImagens.slice(0, tamanhoGrupo);

        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas.`;
            return;
        }

        // [REFATORAÇÃO 1-BASED] 'imagensGrupo' agora é 1-indexado
        imagensGrupo = [null, ...imagensSelecionadasOriginal];

        // 'imagensParaArrastar' pode continuar 0-based, é só o banco de imagens
        imagensParaArrastar = [...imagensSelecionadasOriginal];

        // 2.2 Geração da Solução (passando array 1-based)
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // 2.3 Carregamento e Renderização
        // (Carrega 'null' mas a função 'carregarImagens' filtra)
        const todasImagensNecessarias = [...new Set(imagensGrupo)];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados();
        });
    }

    /**
     * [REFATORAÇÃO 1-BASED] Gera a Tábua usando a FUNÇÃO DO USUÁRIO (1-based).
     * 'elementos' é [null, img1, ..., imgN]
     */
    function gerarTabelaCayley(elementos) {
        const n = tamanhoGrupo; // n = MODULO_N
        const tabela = [];
        for (let i = 0; i < n; i++) { // i (linha da grade) de 0 a n-1
            tabela[i] = [];
            for (let j = 0; j < n; j++) { // j (coluna da grade) de 0 a n-1

                // [REFATORAÇÃO 1-BASED] Mapeia índice da grade (0..N-1) para entrada (1..N)
                const posI = i + 1;
                const posJ = j + 1;
                let rawResult = 0;

                try {
                    // [REFATORAÇÃO 1-BASED] Chama a função com 1-based (a=1..N, b=1..N)
                    rawResult = userFunction(posI, posJ);
                    if (typeof rawResult !== 'number' || !isFinite(rawResult)) {
                        console.warn(`Função do usuário não retornou um número para (${posI},${posJ}). Default para 1.`);
                        rawResult = 1; // Default 1-based
                    }
                } catch (e) {
                    console.error(`Erro ao executar userFunction(${posI},${posJ}): ${e.message}. Default para 1.`);
                    rawResult = 1; // Default 1-based
                }

                const roundedResult = Math.round(rawResult);

                // [REFATORAÇÃO 1-BASED] Fórmula de Módulo 1-based (mapeia Z -> {1, ..., N})
                // "módulo 0 vira N"
                const finalResultIndex = ((((roundedResult - 1) % n) + n) % n) + 1;

                // Acessa o array 1-indexado 'elementos'
                tabela[i][j] = elementos[finalResultIndex];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos N*N resultados.
     * [REFATORAÇÃO 1-BASED] 'elementos' é [null, img1, ..., imgN]
     */
    function gerarListaResultadosSolucao(elementos) {
        const n = tamanhoGrupo;
        const lista = [];
        let indexContador = 0;

        // [REFATORAÇÃO 1-BASED] 'elementos.indexOf(src)' agora retorna 1 a N
        const getNomeCurto = (src) => src.split('/').pop().split('.')[0] || `Elem[${elementos.indexOf(src)}]`;

        for (let i = 0; i < n; i++) { // i (grid) de 0 a n-1
            for (let j = 0; j < n; j++) { // j (grid) de 0 a n-1

                // [REFATORAÇÃO 1-BASED] Acessa o array 1-indexado
                const linhaSrc = elementos[i + 1];
                const colunaSrc = elementos[j + 1];
                const resultadoSrc = tabelaCayleyCorreta[i][j]; // Pega o resultado já calculado

                lista.push({
                    id: indexContador,
                    row: i, // row/col (0-based) da grade
                    col: j,
                    key: `${i},${j}`,
                    linha: getNomeCurto(linhaSrc), // Elem[1]..Elem[N]
                    coluna: getNomeCurto(colunaSrc), // Elem[1]..Elem[N]
                    resultadoEsperado: getNomeCurto(resultadoSrc),
                    imgSrc: resultadoSrc
                });
                indexContador++;
            }
        }
        return lista;
    }

    /**
     * Ajusta o tamanho do Canvas e redesenha o tabuleiro.
     * (Lógica mantida, está correta e atende ao pedido)
     */
    function ajustarERedesenharCanvas() {
        if (!canvas || !containerTabuleiro) return;
        const containerRect = containerTabuleiro.getBoundingClientRect();
        const size = Math.max(10, Math.min(containerRect.width, containerRect.height));
        if (size <= 10) return;
        canvas.width = size;
        canvas.height = size;
        const totalCells = tamanhoGrupo + 1;
        headerPixelSize = size * 0.1;
        // [OK] "redividir as celulas para o tamanho n" -> É o que esta linha faz:
        cellPixelSize = (size - headerPixelSize) / tamanhoGrupo;
        desenharTabuleiroCompleto();
    }

    /**
     * Renderiza as imagens na lista (banco de imagens).
     * (Não precisa de mudança, 'imagensParaArrastar' é 0-based)
     */
    function renderizarImagensParaArrastar() {
        if (!listaImagensEl) return;
        listaImagensEl.innerHTML = '';
        // 'imagensParaArrastar' (0-based) é usado aqui
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.draggable = true;
            img.classList.add('arrastavel');
            img.addEventListener('dragstart', onDragStart);
            img.addEventListener('click', onImageBankClick);
            listaImagensEl.appendChild(img);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE VERIFICAÇÃO E FEEDBACK
    // ==========================================================================

    /**
     * Função central que processa a jogada (clique ou D&D).
     * [REFATORAÇÃO 1-BASED] Feedback usa 1-based e 'f()'
     */
    function processarJogada(row, col, imgSrcDropped) {
        // row e col aqui são 0-based (índices da grade)
        inicializarAudio();
        if (!canvas) return;

        const key = `${row},${col}`;
        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc;

        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        const itemListaIndex = listaResultadosSolucao.indexOf(itemLista);

        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            celulaAtiva = null;
            desenharTabuleiroCompleto();
            return;
        }

        if (imgSrcDropped === expectedImgSrc) { // <<< CORRETO >>>
            tabuleiro[key] = imgSrcDropped;
            if (!history.some(move => move.key === key)) celulasCorretas++;
            history = history.filter(move => move.key !== key);
            history.push({ key: key, imgSrc: imgSrcDropped });
            if (itemLista) resultadosAcertados[itemListaIndex] = true;
            tocarSom(clapSound);

            // [REFATORAÇÃO 1-BASED] Lógica de feedback 1-based
            const nomeLinha = itemLista ? itemLista.linha : `Elem[${row + 1}]`;
            const nomeColuna = itemLista ? itemLista.coluna : `Elem[${col + 1}]`;

            // Recalcula o índice de fallback (1-based)
            const n = tamanhoGrupo;
            const posI = row + 1;
            const posJ = col + 1;
            const fallbackResult = userFunction(posI, posJ); // Chamada 1-based
            const fallbackIndex = ((((Math.round(fallbackResult) - 1) % n) + n) % n) + 1;
            const nomeResultado = itemLista ? itemLista.resultadoEsperado : `Elem[${fallbackIndex}]`;

            mensagemEl.textContent = `Correto! f(${nomeLinha}, ${nomeColuna}) = ${nomeResultado}`;
            renderizarListaResultados();

            if (celulasCorretas === tamanhoGrupo * tamanhoGrupo) {
                mensagemEl.innerHTML = `<h2>Parabéns! Tábua completa.</h2>`;
                if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                if (reiniciarBtn) reiniciarBtn.disabled = true;
                if (limparBtn) limparBtn.disabled = true;
                if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
            }
        } else { // <<< INCORRETO >>>
            mensagemEl.textContent = `Incorreto! O resultado não é essa imagem.`;
            tocarSom(errorSound);
        }
        celulaAtiva = null;
        desenharTabuleiroCompleto();
    }

    function limparUltimaJogada() {
        // ... (Sem alterações lógicas necessárias aqui)
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }
        celulaAtiva = null;
        const lastMove = history.pop();
        delete tabuleiro[lastMove.key];
        celulasCorretas--;
        const [row, col] = lastMove.key.split(',').map(Number);
        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        const itemListaIndex = listaResultadosSolucao.indexOf(itemLista);
        if (itemListaIndex !== -1) {
            delete resultadosAcertados[itemListaIndex];
        }
        mensagemEl.textContent = `Última jogada desfeita: ${lastMove.key}`;
        desenharTabuleiroCompleto();
        renderizarListaResultados();
        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;
    }

    function renderizarListaResultados() {
        // ... (Sem alterações lógicas necessárias aqui, usa 'itemLista' que já está 1-based)
        if (!listaResultadosEl) return;
        let html = '';
        listaResultadosSolucao.forEach((item, index) => {
            const resolvido = resultadosAcertados[index];
            const linha = item.linha;
            const coluna = item.coluna;
            const resultado = item.resultadoEsperado;
            let classe = resolvido ? 'resultado-item resolvido' : 'resultado-item oculta';
            const textoCombinacao = `${index + 1}: f(${linha}, ${coluna}) = ${resultado}`;
            html += `<div class="${classe}">${textoCombinacao}</div>`;
        });
        listaResultadosEl.innerHTML = html;
        const itensOcultos = listaResultadosEl.querySelectorAll('.oculta');
        itensOcultos.forEach(el => el.style.display = 'none');
    }

    // ==========================================================================
    // 4. FUNÇÕES AUXILIARES DE DESENHO E CARREGAMENTO
    // ==========================================================================

    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
        // ... (Função não alterada, mantida como estava)
        const aspectRatio = img.width / img.height;
        const paddingFactor = 0.9;
        const maxW = w * paddingFactor;
        const maxH = h * paddingFactor;
        let drawW = maxW;
        let drawH = maxH;
        if (maxW / maxH > aspectRatio) {
            drawW = maxH * aspectRatio;
        } else {
            drawH = maxW / aspectRatio;
        }
        const drawX = x + (w - drawW) / 2;
        const drawY = y + (h - drawH) / 2;
        ctx.drawImage(img, Math.floor(drawX), Math.floor(drawY), Math.floor(drawW), Math.floor(drawH));
    }

    /**
     * Desenha o tabuleiro completo (Cabeçalhos, Acertos e Destaque).
     * [REFATORAÇÃO 1-BASED]
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#bcf5edff'; ctx.lineWidth = 2;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos
        for (let i = 0; i < tamanhoGrupo + 1; i++) { // i de 0 a N
            for (let j = 0; j < tamanhoGrupo + 1; j++) { // j de 0 a N
                const cellX = (j === 0) ? 0 : headerPixelSize + (j - 1) * cellPixelSize;
                const cellY = (i === 0) ? 0 : headerPixelSize + (i - 1) * cellPixelSize;
                let sizeW = (j === 0) ? headerPixelSize : cellPixelSize;
                let sizeH = (i === 0) ? headerPixelSize : cellPixelSize;
                if (i === 0 && j === 0) { sizeW = headerPixelSize; sizeH = headerPixelSize; }

                ctx.fillStyle = (i === 0 || j === 0) ? '#e1e5e60a' : '#dfe6e5e0e';
                ctx.fillRect(cellX, cellY, sizeW, sizeH);
                ctx.strokeRect(cellX, cellY, sizeW, sizeH);

                // [REFATORAÇÃO 1-BASED] Acesso 1-based a 'imagensGrupo'
                if (i === 0 && j > 0) { // j vai de 1 a N
                    // Acessa o array 1-indexado 'imagensGrupo'
                    const img = imagensCarregadas[imagensGrupo[j]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                } else if (j === 0 && i > 0) { // i vai de 1 a N
                    // Acessa o array 1-indexado 'imagensGrupo'
                    const img = imagensCarregadas[imagensGrupo[i]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                }
            }
        }

        // Célula 0,0 (Operação)
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';
        ctx.fillText('f()', headerPixelSize / 2, headerPixelSize / 2);

        // 2. Desenha o Grid Principal, Acertos e DESTAQUE
        // (Sem alteração, 'row' e 'col' são 0-based para a grade)
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) { // row de 0 a n-1
            for (let col = 0; col < tamanhoGrupo; col++) { // col de 0 a n-1
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                if (celulaAtiva && celulaAtiva.row === row && celulaAtiva.col === col) {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
                    ctx.fillRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#07b5fad0';
                    ctx.lineWidth = 2;
                }

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

    /**
     * Carrega todas as imagens e chama o callback.
     * (Filtra 'null' automaticamente)
     */
    function carregarImagens(imagens, callback) {
        let loadedCount = 0;
        const imagensUnicas = [...new Set(imagens)].filter(Boolean); // Filtra 'null'
        const total = imagensUnicas.length;
        const loadedImgs = {};
        if (total === 0) {
            callback(loadedImgs);
            return;
        }
        imagensUnicas.forEach(src => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                loadedImgs[src] = img;
                loadedCount++;
                if (loadedCount === total) callback(loadedImgs);
            };
            img.onerror = () => {
                console.error(`Falha ao carregar imagem: ${src}. Verifique o caminho!`);
                loadedCount++;
                if (loadedCount === total) callback(loadedImgs);
            };
            img.src = src;
        });
    }

    // ==========================================================================
    // 5. [D5] RESPONSIVIDADE (ROTAÇÃO)
    // ==========================================================================

    function checkOrientation() {
        // ... (Função não alterada, mantida como estava)
        if (!rotateOverlay) return;
        const isSmallScreen = window.innerWidth < 1024;
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        if (isSmallScreen && isPortrait) {
            rotateOverlay.style.display = 'flex';
        } else {
            rotateOverlay.style.display = 'none';
        }
    }

    // ==========================================================================
    // 6. EVENT LISTENERS E CONTROLES
    // ==========================================================================

    // Funções Auxiliares (sem alteração)
    function inicializarAudio() { }
    function tocarSom(som) {
        som.currentTime = 0;
        som.play().catch(e => console.error("Erro ao tocar áudio:", e));
    }
    function embaralharArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // D&D e Listeners de Clique (sem alteração, pois 'row'/'col' 0-based são corretos para a grade)
    function onDragStart(event) {
        draggedImgSrc = event.target.getAttribute('src');
        event.dataTransfer.setData('text/plain', draggedImgSrc);
        event.dataTransfer.effectAllowed = 'copy';
        dragging = true;
    }
    function onImageBankClick(event) {
        if (!celulaAtiva) {
            mensagemEl.textContent = "Por favor, clique em uma célula do tabuleiro primeiro.";
            return;
        }
        const imgSrcClicked = event.target.getAttribute('src');
        processarJogada(celulaAtiva.row, celulaAtiva.col, imgSrcClicked);
    }
    function onCanvasClick(event) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
            celulaAtiva = null;
            desenharTabuleiroCompleto();
            return;
        }
        const gridX = x - headerPixelSize;
        const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);
        if (row < tamanhoGrupo && col < tamanhoGrupo) {
            celulaAtiva = { row, col, key: `${row},${col}` };
            mensagemEl.textContent = "Célula selecionada! Agora clique na imagem correta no banco.";
            desenharTabuleiroCompleto();
        }
    }

    // --- REGISTRO DOS EVENT LISTENERS ---
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const imgSrcDropped = e.dataTransfer.getData('text/plain');
            if (!imgSrcDropped || !dragging) { dragging = false; return; }
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
                dragging = false; return;
            }
            const gridX = x - headerPixelSize;
            const gridY = y - headerPixelSize;
            const col = Math.floor(gridX / cellPixelSize);
            const row = Math.floor(gridY / cellPixelSize);
            if (row < tamanhoGrupo && col < tamanhoGrupo) {
                processarJogada(row, col, imgSrcDropped);
            }
            dragging = false;
        });
        canvas.addEventListener('click', onCanvasClick);
    }

    // Botões e Resize
    window.addEventListener('resize', ajustarERedesenharCanvas);
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            window.location.href = 'Finalizou.html';
        });
    }

    if (paginaInicialBtn) {
        paginaInicialBtn.addEventListener('click', () => {
            window.location.href = 'configNivelD5.html';
        });
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    checkOrientation();
    iniciarJogo();
});