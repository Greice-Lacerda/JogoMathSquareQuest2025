document.addEventListener('DOMContentLoaded', function () {

    // ==========================================================================
    // 1. SELEÇÃO DE ELEMENTOS E VARIÁVEIS GLOBAIS
    // ==========================================================================

    const canvas = document.getElementById('tela');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const mensagemEl = document.getElementById('mensagem');
    const listaImagensEl = document.getElementById('lista-imagens');
    const containerTabuleiro = document.getElementById('tabuleiro');
    const listaResultadosEl = document.getElementById('lista-resultados'); // Elemento para a lista dinâmica

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

    let todasImagens = [];

    let tamanhoGrupo = 6; // Número de elementos no grupo (6 para nível D)
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

    // Variáveis de Áudio (Ajuste os caminhos)
    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

    // Variáveis Globais de D&D
    let dragging = false;
    let draggedImgSrc = null;

    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    function iniciarJogo() {
        // Zera o estado do jogo
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        tamanhoGrupo = 6;
        resultadosAcertados = {};

        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (reiniciarBtn) { reiniciarBtn.disabled = false; }
        if (limparBtn) limparBtn.disabled = false;

        mensagemEl.textContent = 'Arraste a imagem resultado para a célula correta da Tábua de Cayley.';

        // 2.1 Seleção e Preparação das Imagens (Embaralhamento Dinâmico)
        todasImagens = [...todasImagensBase];
        embaralharArray(todasImagens);

        const imagensSelecionadasOriginal = todasImagens.slice(0, tamanhoGrupo);

        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas.`;
            return;
        }

        imagensGrupo = [...imagensSelecionadasOriginal];
        imagensParaArrastar = [...imagensGrupo];
        embaralharArray(imagensParaArrastar);

        // 2.2 Geração da Solução e da Lista de Resultados
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // 2.3 Carregamento e Renderização
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensGrupo])];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados(); // Renderiza a lista inicial (oculta)
        });
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
                const resultadoIndex = (i + j) % n;
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

        // Função auxiliar para obter o nome curto do arquivo
        const getNomeCurto = (src) => src.split('/').pop().split('.')[0] || `Elem[${elementos.indexOf(src)}]`;

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
        // ... (Lógica de coordenadas e verificação)
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

        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc;

        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        const itemListaIndex = listaResultadosSolucao.indexOf(itemLista);


        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            return;
        }

        // --- VERIFICAÇÃO ---
        if (imgSrcDropped === expectedImgSrc) {
            tabuleiro[key] = imgSrcDropped;

            if (!history.some(move => move.key === key)) {
                celulasCorretas++;
            }
            history = history.filter(move => move.key !== key);
            history.push({ key: key, imgSrc: imgSrcDropped });

            // NOVO: Marca o resultado na lista como acertado
            if (itemLista) {
                resultadosAcertados[itemListaIndex] = true;
            }

            tocarSom(clapSound);

            // GERA MENSAGEM DE FEEDBACK DETALHADA
            const nomeLinha = itemLista ? itemLista.linha : `Elem[${row}]`;
            const nomeColuna = itemLista ? itemLista.coluna : `Elem[${col}]`;
            const nomeResultado = itemLista ? itemLista.resultadoEsperado : `Elem[${(row + col) % tamanhoGrupo}]`;

            mensagemEl.textContent = `Correto! ${nomeLinha} + ${nomeColuna} = ${nomeResultado}`;

            renderizarListaResultados(); // Atualiza a lista após o acerto

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
            delete tabuleiro[key];
        }
        desenharTabuleiroCompleto();
    }

    /**
     * Lógica de Limpar Última Jogada.
     */
    function limparUltimaJogada() {
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }

        const lastMove = history.pop();
        delete tabuleiro[lastMove.key];
        celulasCorretas--;

        // NOVO: Remove o acerto da lista de resultados
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

    /**
     * NOVO: Renderiza a lista dinâmica de resultados (apenas acertados) em 2 colunas.
     */
    function renderizarListaResultados() {
        if (!listaResultadosEl) return;

        let html = '';

        listaResultadosSolucao.forEach((item, index) => {
            const resolvido = resultadosAcertados[index];

            const linha = item.linha;
            const coluna = item.coluna;
            const resultado = item.resultadoEsperado;

            let classe = resolvido ? 'resultado-item resolvido' : 'resultado-item oculta';

            const textoCombinacao = `${index + 1}: ${linha} + ${coluna} = ${resultado}`;

            // Adiciona o item ao HTML. O CSS cuidará da exibição em colunas e da ocultação.
            html += `<div class="${classe}">${textoCombinacao}</div>`;
        });

        listaResultadosEl.innerHTML = html;

        // Garante que os itens ocultos não ocupem espaço no layout grid.
        const itensOcultos = listaResultadosEl.querySelectorAll('.oculta');
        itensOcultos.forEach(el => el.style.display = 'none');
    }


    // ==========================================================================
    // 4. FUNÇÕES AUXILIARES DE DESENHO E CARREGAMENTO
    // ==========================================================================

    /**
     * Desenha uma imagem mantendo a proporção de aspecto, centralizada na célula.
     * @param {CanvasRenderingContext2D} ctx Contexto de desenho do Canvas.
     * @param {HTMLImageElement} img Objeto imagem a ser desenhado.
     * @param {number} x Coordenada X inicial da célula.
     * @param {number} y Coordenada Y inicial da célula.
     * @param {number} w Largura da célula.
     * @param {number} h Altura da célula.
     */

    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
        const aspectRatio = img.width / img.height;
        const paddingFactor = 0.9; // Fator de preenchimento para evitar bordas

        const maxW = w * paddingFactor;
        const maxH = h * paddingFactor;

        let drawW = maxW;
        let drawH = maxH;

        if (maxW / maxH > aspectRatio) {
            drawW = maxH * aspectRatio;
        } else {
            drawH = maxW / aspectRatio;
        }

        // Cálculo da posição para centralizar
        const drawX = x + (w - drawW)/2;
        const drawY = y + (h - drawH)/2;

        // Desenha a imagem usando Math.floor para evitar problemas de sub-pixel, 
        // garantindo o alinhamento e a nitidez.
        ctx.drawImage(
            img, 
            Math.floor(drawX), 
            Math.floor(drawY), 
            Math.floor(drawW), 
            Math.floor(drawH)
        );
    }
    /**
     * Desenha o tabuleiro completo (Cabeçalhos e Acertos).
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#bcf5edff'; ctx.lineWidth = 2;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos (Linha e Coluna 0)
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
        ctx.fillStyle = 'white'; ctx.fillText('+', headerPixelSize / 2, headerPixelSize / 2);

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

    /**
     * Carrega todas as imagens e chama o callback ao finalizar.
     */
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

    // Funções Auxiliares
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

    // --- D&D LISTENERS ---
    function onDragStart(event) {
        draggedImgSrc = event.target.getAttribute('src');
        event.dataTransfer.setData('text/plain', draggedImgSrc);
        event.dataTransfer.effectAllowed = 'copy';
        dragging = true;
    }

    // Canvas Listeners
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const imgSrcDropped = e.dataTransfer.getData('text/plain');
            if (imgSrcDropped && dragging) {
                processarDrop(e.clientX, e.clientY, imgSrcDropped);
            }
            dragging = false;
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

    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('instrucaoD1.html', '_black'));

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});