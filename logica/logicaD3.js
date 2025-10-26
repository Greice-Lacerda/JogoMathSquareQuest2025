document.addEventListener('DOMContentLoaded', function () {

    // ==========================================================================
    // 1. SELEÇÃO DE ELEMENTOS E VARIÁVEIS GLOBAIS
    // ==========================================================================

    const canvas = document.getElementById('tela');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const mensagemEl = document.getElementById('mensagem');
    const listaImagensEl = document.getElementById('lista-imagens');
    const containerTabuleiro = document.getElementById('tabuleiro');
    const listaResultadosEl = document.getElementById('lista-resultados');

    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const paginaInicialBtn = document.getElementById('paginaInicial');

    // Lista completa de imagens
    let todasImagensBase = ['../imagens/abelha.png',
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
    
    let todasImagens = [];

    let tamanhoGrupo = 6;
    let cellPixelSize = 0;
    let headerPixelSize = 0;
    let tabuleiro = {};
    let tabelaCayleyCorreta = [];
    let imagensCarregadas = {};
    let imagensGrupo = [];
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];

    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    // --- NOVO: Variáveis de estado para "Caça ao Elemento" ---
    let elementoAlvoAtual = null;
    let indiceAlvoAtual = 0;
    let contagemRestanteAlvo = 0;
    let elementosCompletos = new Set();
    let celulasPreenchidas = new Set();
    // ---------------------------------------------------------

    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

    let dragging = false;
    let draggedImgSrc = null;

    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        tamanhoGrupo = 6;
        resultadosAcertados = {};

        elementoAlvoAtual = null;
        indiceAlvoAtual = 0;
        contagemRestanteAlvo = 0;
        elementosCompletos.clear();
        celulasPreenchidas.clear();

        if (proximoNivelBtn) {
            proximoNivelBtn.style.display = 'none';
            proximoNivelBtn.style.backgroundColor = ''; // Reseta a cor
        }
        if (reiniciarBtn) { reiniciarBtn.disabled = false; }
        if (limparBtn) { limparBtn.disabled = false; }

        // 1. Seleção e Preparação das Imagens
        todasImagens = [...todasImagensBase];
        embaralharArray(todasImagens);

        const imagensSelecionadasOriginal = todasImagens.slice(0, tamanhoGrupo);

        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas.`;
            return;
        }

        imagensGrupo = [...imagensSelecionadasOriginal];
        imagensParaArrastar = [...imagensGrupo];

        // 2. Geração da Solução
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // 3. Carregamento e Renderização
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensGrupo])];

        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados();
            iniciarProximoAlvo();
        });
    }

    // --- NOVO: Função para gerenciar a "Caçada" ---
    function iniciarProximoAlvo() {
        if (indiceAlvoAtual >= tamanhoGrupo) {
            return;
        }

        elementoAlvoAtual = imagensGrupo[indiceAlvoAtual];

        document.querySelectorAll('#lista-imagens img').forEach(img => {
            img.classList.remove('alvo-ativo');
            if (!elementosCompletos.has(img.getAttribute('src'))) {
                img.draggable = true;
            }
        });

        const imgAlvoEl = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
        if (imgAlvoEl) {
            imgAlvoEl.classList.add('alvo-ativo');
        }

        let contagem = 0;
        tabelaCayleyCorreta.forEach((linha, i) => {
            linha.forEach((celulaSolucao, j) => {
                const key = `${i},${j}`;
                if (celulaSolucao === elementoAlvoAtual && !celulasPreenchidas.has(key)) {
                    contagem++;
                }
            });
        });
        contagemRestanteAlvo = contagem;

        // Atualiza a mensagem
        mensagemEl.textContent = `Encontre ${contagemRestanteAlvo} células para: ${getNomeCurto(elementoAlvoAtual)}`;
    }


    /**
     * Gera a Tábua de Cayley (Adição de índices mod n).
     */
    function gerarTabelaCayley(elementos) {
        const n = elementos.length;
        const tabela = [];
        for (let i = 0; i < n; i++) {
            tabela[i] = [];
            for (let j = 0; j < n; j++) {

                // --- AJUSTE (D1): Lógica mudada para (i * j) % n (Abeliana) ---
                const resultadoIndex = (i * j) % n;
                // -----------------------------------------------------------

                tabela[i][j] = elementos[resultadoIndex];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos 36 resultados no formato A + B = C.
     */
    function gerarListaResultadosSolucao(elementos) {
        const n = elementos.length;
        const lista = [];
        let indexContador = 0;

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const linhaSrc = elementos[i];
                const colunaSrc = elementos[j];
                const resultadoSrc = tabelaCayleyCorreta[i][j];

                lista.push({
                    id: indexContador,
                    row: i,
                    col: j,
                    key: `${i},${j}`,
                    linha: getNomeCurto(linhaSrc),
                    coluna: getNomeCurto(colunaSrc),
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
     */
    function ajustarERedesenharCanvas() {
        if (!canvas || !containerTabuleiro) return;

        const size = Math.min(containerTabuleiro.clientWidth, containerTabuleiro.clientHeight);
        canvas.width = size;
        canvas.height = size;

        const totalCells = tamanhoGrupo + 1;
        headerPixelSize = size * 0.1;
        cellPixelSize = (size - headerPixelSize) / tamanhoGrupo;

        desenharTabuleiroCompleto();
    }

    /**
     * Renderiza as imagens na lista para serem arrastáveis.
     */
    function renderizarImagensParaArrastar() {
        listaImagensEl.innerHTML = '';
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.draggable = true;
            img.classList.add('arrastavel');
            img.addEventListener('dragstart', onDragStart);
            listaImagensEl.appendChild(img);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE VERIFICAÇÃO E FEEDBACK
    // ==========================================================================

    function processarDrop(clientX, clientY, imgSrcDropped) {
        inicializarAudio();
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) return;

        const gridX = x - headerPixelSize;
        const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);
        const key = `${row},${col}`;

        if (row >= tamanhoGrupo || col >= tamanhoGrupo) return;

        if (celulasPreenchidas.has(key)) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            return;
        }

        const expectedImgSrc = tabelaCayleyCorreta[row][col];

        if (imgSrcDropped === expectedImgSrc) {
            // SUCESSO!
            tabuleiro[key] = imgSrcDropped;
            celulasPreenchidas.add(key);
            celulasCorretas++;
            contagemRestanteAlvo--;

            history.push({ key: key, imgSrc: imgSrcDropped });

            const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
            if (itemLista) {
                resultadosAcertados[itemLista.id] = true;
            }

            tocarSom(clapSound);
            mensagemEl.textContent = `Correto! Faltam ${contagemRestanteAlvo} para ${getNomeCurto(elementoAlvoAtual)}`;
            renderizarListaResultados();

            if (contagemRestanteAlvo === 0) {
                elementosCompletos.add(elementoAlvoAtual);

                const imgBanco = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
                if (imgBanco) {
                    imgBanco.classList.remove('alvo-ativo');
                    imgBanco.classList.add('alvo-completo');
                    imgBanco.draggable = false;
                }

                if (elementosCompletos.size === tamanhoGrupo) {
                    // NÍVEL COMPLETO
                    mensagemEl.innerHTML = `<h2>Parabéns! Tábua completa.</h2>`;
                    if (proximoNivelBtn) {
                        proximoNivelBtn.style.display = 'block';
                        // --- AJUSTE (1): Mudar cor do botão ---
                        proximoNivelBtn.style.backgroundColor = '#4CAF50';
                        // ------------------------------------
                    }
                    if (reiniciarBtn) reiniciarBtn.disabled = true;
                    if (limparBtn) limparBtn.disabled = true;
                    if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
                } else {
                    indiceAlvoAtual++;
                    iniciarProximoAlvo();
                }
            }

        } else { // <<< INCORRETO >>>
            mensagemEl.textContent = `Incorreto! Esta célula não é ${getNomeCurto(elementoAlvoAtual)}.`;
            tocarSom(errorSound);
        }

        desenharTabuleiroCompleto();
    }


    /**
     * Lógica de Limpar Última Jogada (Undo).
     */
    function limparUltimaJogada() {
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }

        const lastMove = history.pop();
        const imgSrcDesfeito = lastMove.imgSrc;
        const key = lastMove.key;

        delete tabuleiro[key];
        celulasCorretas--;
        celulasPreenchidas.delete(key);

        const [row, col] = key.split(',').map(Number);
        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        if (itemLista) {
            delete resultadosAcertados[itemLista.id];
        }

        if (imgSrcDesfeito === elementoAlvoAtual) {
            contagemRestanteAlvo++;
            mensagemEl.textContent = `Jogada desfeita. Faltam ${contagemRestanteAlvo} para ${getNomeCurto(elementoAlvoAtual)}`;
        }
        else if (elementosCompletos.has(imgSrcDesfeito)) {
            elementosCompletos.delete(imgSrcDesfeito);

            const imgBanco = document.querySelector(`#lista-imagens img[src="${imgSrcDesfeito}"]`);
            if (imgBanco) {
                imgBanco.classList.remove('alvo-completo');
                imgBanco.draggable = true;
            }

            indiceAlvoAtual = imagensGrupo.indexOf(imgSrcDesfeito);
            iniciarProximoAlvo();
            mensagemEl.textContent = `Caçada anterior reaberta. Encontre ${contagemRestanteAlvo} para ${getNomeCurto(elementoAlvoAtual)}`;
        }

        desenharTabuleiroCompleto();
        renderizarListaResultados();

        if (proximoNivelBtn) {
            proximoNivelBtn.style.display = 'none';
            proximoNivelBtn.style.backgroundColor = ''; // Reseta a cor
        }
        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;
    }

    /**
     * Renderiza a lista dinâmica de resultados (apenas acertados).
     */
    function renderizarListaResultados() {
        if (!listaResultadosEl) return;
        let html = '';
        listaResultadosSolucao.forEach((item, index) => {
            const resolvido = resultadosAcertados[item.id];
            const linha = item.linha;
            const coluna = item.coluna;
            const resultado = item.resultadoEsperado;
            let classe = resolvido ? 'resultado-item resolvido' : 'resultado-item oculta';

            // --- AJUSTE (3): Símbolo de operação na lista ---
            const textoCombinacao = `${index + 1}: ${linha} * ${coluna} = ${resultado}`;
            // ------------------------------------------------

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
        const aspectRatio = img.width / img.height;
        const paddingFactor = 0.95;
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
        ctx.drawImage(
            img,
            Math.floor(drawX),
            Math.floor(drawY),
            Math.floor(drawW),
            Math.floor(drawH)
        );
    }

    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#eee8f1'; ctx.lineWidth = 3;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos
        for (let i = 0; i < tamanhoGrupo + 1; i++) {
            for (let j = 0; j < tamanhoGrupo + 1; j++) {
                const cellX = (j === 0) ? 0 : headerPixelSize + (j - 1) * cellPixelSize;
                const cellY = (i === 0) ? 0 : headerPixelSize + (i - 1) * cellPixelSize;
                const size = (i === 0 || j === 0) ? headerPixelSize : cellPixelSize;

                ctx.fillStyle = (i === 0 || j === 0) ? '#e1e5e60a' : '#dfe6e50e';
                ctx.fillRect(cellX, cellY, size, size);
                ctx.strokeRect(cellX, cellY, size, size);

                if (i === 0 && j > 0) {
                    const img = imagensCarregadas[imagensGrupo[j - 1]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, size, size);
                } else if (j === 0 && i > 0) {
                    const img = imagensCarregadas[imagensGrupo[i - 1]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, size, size);
                }
            }
        }

        // Célula 0,0 (Operação)
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';

        // --- AJUSTE (3): Mudar símbolo da operação ---
        ctx.fillText('*', headerPixelSize / 2, headerPixelSize / 2);
        // --------------------------------------------

        // 2. Desenha o Grid Principal e os Acertos
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) {
            for (let col = 0; col < tamanhoGrupo; col++) {
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);
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
        let loadedCount = 0;
        const total = imagens.length;
        const loadedImgs = {};
        if (total === 0) {
            callback(loadedImgs);
            return;
        }
        imagens.forEach(src => {
            if (loadedImgs[src]) {
                loadedCount++;
                if (loadedCount === total) callback(loadedImgs);
                return;
            }
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
    // 5. EVENT LISTENERS E CONTROLES
    // ==========================================================================

    /**
     * Função auxiliar para obter o nome curto do arquivo
     */
    function getNomeCurto(src) {
        if (!src) return "N/A";

        // --- AJUSTE (2): Remover (E{i}) ---
        const nomeArquivo = src.split('/').pop().split('.')[0];
        return nomeArquivo;
        // -----------------------------------
    }

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

    // --- D&D LISTENERS (AJUSTADOS) ---
    function onDragStart(event) {
        draggedImgSrc = event.target.getAttribute('src');

        if (draggedImgSrc !== elementoAlvoAtual) {
            event.preventDefault();
            tocarSom(errorSound);
            mensagemEl.textContent = `Alvo errado! Você deve encontrar: ${getNomeCurto(elementoAlvoAtual)}`;

            const imgAlvoEl = document.querySelector(`#lista-imagens img.alvo-ativo`);
            if (imgAlvoEl) {
                imgAlvoEl.classList.add('shake-animation');
                setTimeout(() => imgAlvoEl.classList.remove('shake-animation'), 500);
            }
            dragging = false;
            return;
        }

        event.dataTransfer.setData('text/plain', draggedImgSrc);
        event.dataTransfer.effectAllowed = 'copy';
        dragging = true;
    }

    // Canvas Listeners
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (dragging) {
                const imgSrcDropped = e.dataTransfer.getData('text/plain');
                if (imgSrcDropped) {
                    processarDrop(e.clientX, e.clientY, imgSrcDropped);
                }
            }
            dragging = false;
            draggedImgSrc = null;
        });
    }

    // --- REGISTRO DOS EVENT LISTENERS ---
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 1;
            const proximoNivelNum = nivelAtual + 1;

            // LINHA REMOVIDA - O tamanho é sempre 6
            // const proximoTamanho = tamanhoTabuleiro + 1;

            if (proximoNivelNum > 4) { // Supondo D4 como último nível
                window.open('../Finalizou.html', '_self');
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;

                // AJUSTE: O parâmetro de tamanho foi removido da URL
                window.open(proximoNivelHtml, '_self');
            }
        });
    }
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('instrucaoD3.html', '_blanck'));

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});