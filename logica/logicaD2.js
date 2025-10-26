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
    let imagensGrupo = []; // --- AJUSTE 1-BASED ---: Este array será [null, img1, img2, ..., img6]
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];
    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    // --- VARIÁVEIS DE ESTADO ---
    let celulaAtiva = null; // Armazena a célula clicada: {row, col, key}
    let dragging = false;
    let draggedImgSrc = null;

    // Áudio
    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');


    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        tamanhoGrupo = 6;
        resultadosAcertados = {};
        celulaAtiva = null; // Limpa a célula ativa

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

        // --- AJUSTE 1-BASED ---
        // 'imagensGrupo' agora é 1-indexado, com 'null' na posição 0.
        imagensGrupo = [null, ...imagensSelecionadasOriginal];

        // 'imagensParaArrastar' contém apenas as 6 imagens válidas (0-indexed).
        imagensParaArrastar = [...imagensSelecionadasOriginal];

        // --- ALTERAÇÃO REQUERIDA ---
        // A linha abaixo foi removida para manter a ordem da lista igual à do cabeçalho.
        // embaralharArray(imagensParaArrastar); 
        // -------------------------

        // Gera a solução (passando o array 1-indexado)
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        // Gera a lista de resultados (passando o array 1-indexado)
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // --- AJUSTE 1-BASED ---
        // Carrega apenas as imagens originais, evitando o 'null'
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensSelecionadasOriginal])];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados();
        });
    }

    /**
     * Gera a Tábua de Cayley (Multiplicação Modular de valores 1-based).
     * LÓGICA CORRIGIDA: Usa ( (i+1) * (j+1) - 1 ) % n
     * --- AJUSTE 1-BASED ---: 'elementos' é [null, img1, ..., img6]
     */
    function gerarTabelaCayley(elementos) {
        const n = tamanhoGrupo; // n = 6
        const tabela = [];
        for (let i = 0; i < n; i++) { // i de 0 a 5 (índice da *tabela*)
            tabela[i] = [];
            for (let j = 0; j < n; j++) { // j de 0 a 5 (índice da *tabela*)

                // Mapeia i e j (0-5) para posições 1-6
                const posI = i + 1;
                const posJ = j + 1;

                // Calcula a posição do resultado (1-6)
                // Ex: (Pos 2 * Pos 3) -> 6. (6-1)%6 + 1 = 6.
                // Ex: (Pos 4 * Pos 5) -> 20. (20-1)%6 + 1 = 2.
                const resultadoPos = ((posI * posJ) - 1) % n + 1;

                // Acessa o array 1-indexado 'elementos'
                tabela[i][j] = elementos[resultadoPos];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos 36 resultados no formato A x B = C.
     * --- AJUSTE 1-BASED ---: 'elementos' é [null, img1, ..., img6]
     */
    function gerarListaResultadosSolucao(elementos) {
        const n = tamanhoGrupo; // n = 6
        const lista = [];
        let indexContador = 0;

        // --- AJUSTE 1-BASED ---
        // 'elementos.indexOf(src)' agora retorna 1-6, o que é o desejado.
        const getNomeCurto = (src) => src.split('/').pop().split('.')[0] || `Elem[${elementos.indexOf(src)}]`;

        for (let i = 0; i < n; i++) { // i de 0 a 5
            for (let j = 0; j < n; j++) { // j de 0 a 5

                // --- AJUSTE 1-BASED ---
                // Acessa o array 1-indexado
                const linhaSrc = elementos[i + 1];
                const colunaSrc = elementos[j + 1];

                // 'tabelaCayleyCorreta' já foi gerada com a lógica correta (é 0-indexed [0-5][0-5])
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

        const containerRect = containerTabuleiro.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height);

        if (size <= 0) return; // Evita erro se o container estiver oculto

        canvas.width = size;
        canvas.height = size;

        const totalCells = tamanhoGrupo + 1;
        headerPixelSize = size * 0.1;
        cellPixelSize = (size - headerPixelSize) / tamanhoGrupo;

        desenharTabuleiroCompleto();
    }

    /**
     * Renderiza as imagens na lista para serem arrastáveis E clicáveis.
     */
    function renderizarImagensParaArrastar() {
        if (!listaImagensEl) return;
        listaImagensEl.innerHTML = '';
        // 'imagensParaArrastar' agora está na ordem correta (não embaralhado)
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.draggable = true;
            img.classList.add('arrastavel');

            // Eventos de D&D
            img.addEventListener('dragstart', onDragStart);

            // Evento de Clique
            img.addEventListener('click', onImageBankClick);

            listaImagensEl.appendChild(img);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE VERIFICAÇÃO E FEEDBACK (REFATORADO)
    // ==========================================================================

    /**
     * REFATORADO: Função central que processa a jogada.
     * Recebe 'row' e 'col' diretamente.
     */
    function processarJogada(row, col, imgSrcDropped) {
        inicializarAudio();
        if (!canvas) return;

        const key = `${row},${col}`;

        // 'tabelaCayleyCorreta' está [0-5][0-5]
        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc;

        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        const itemListaIndex = listaResultadosSolucao.indexOf(itemLista);

        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            celulaAtiva = null; // Limpa a seleção
            desenharTabuleiroCompleto(); // Redesenha para remover o destaque
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

            if (itemLista) {
                resultadosAcertados[itemListaIndex] = true;
            }

            tocarSom(clapSound);

            // --- LÓGICA DE FEEDBACK CORRIGIDA (1-based) ---
            const nomeLinha = itemLista ? itemLista.linha : `Elem[${row + 1}]`;
            const nomeColuna = itemLista ? itemLista.coluna : `Elem[${col + 1}]`;

            const n = tamanhoGrupo;
            const fallbackIndex = (((row + 1) * (col + 1)) - 1) % n;
            const nomeResultado = itemLista ? itemLista.resultadoEsperado : `Elem[${fallbackIndex + 1}]`;
            // ------------------------------------

            // Mensagem de feedback (Corrigido para 'x')
            mensagemEl.textContent = `Correto! ${nomeLinha} x ${nomeColuna} = ${nomeResultado}`;

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

        celulaAtiva = null; // Limpa a seleção após a tentativa
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
        celulaAtiva = null; // Limpa seleção

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

    /**
     * Renderiza a lista dinâmica de resultados.
     */
    function renderizarListaResultados() {
        if (!listaResultadosEl) return;
        let html = '';

        // Usa a lista de solução (que já tem os nomes corretos 1-based)
        listaResultadosSolucao.forEach((item, index) => {
            const resolvido = resultadosAcertados[index];
            const linha = item.linha;
            const coluna = item.coluna;
            const resultado = item.resultadoEsperado;
            let classe = resolvido ? 'resultado-item resolvido' : 'resultado-item oculta';

            // Texto da combinação (já usa 'x' por causa da 'gerarListaResultadosSolucao')
            const textoCombinacao = `${index + 1}: ${linha} x ${coluna} = ${resultado}`;
            html += `<div class="${classe}">${textoCombinacao}</div>`;
        });

        listaResultadosEl.innerHTML = html;
        const itensOcultos = listaResultadosEl.querySelectorAll('.oculta');
        itensOcultos.forEach(el => el.style.display = 'none');
    }


    // ==========================================================================
    // 4. FUNÇÕES AUXILIARES DE DESENHO E CARREGAMENTO
    // ==========================================================================

    /**
     * Desenha uma imagem mantendo a proporção de aspecto.
     */
    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
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
        ctx.drawImage(
            img,
            Math.floor(drawX),
            Math.floor(drawY),
            Math.floor(drawW),
            Math.floor(drawH)
        );
    }

    /**
     * ATUALIZADO: Desenha o tabuleiro E o destaque da célula ativa.
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#bcf5edff'; ctx.lineWidth = 2;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos
        for (let i = 0; i < tamanhoGrupo + 1; i++) { // i de 0 a 6
            for (let j = 0; j < tamanhoGrupo + 1; j++) { // j de 0 a 6
                const cellX = (j === 0) ? 0 : headerPixelSize + (j - 1) * cellPixelSize;
                const cellY = (i === 0) ? 0 : headerPixelSize + (i - 1) * cellPixelSize;

                let sizeW = (j === 0) ? headerPixelSize : cellPixelSize;
                let sizeH = (i === 0) ? headerPixelSize : cellPixelSize;
                if (i === 0 && j === 0) { sizeW = headerPixelSize; sizeH = headerPixelSize; }

                ctx.fillStyle = (i === 0 || j === 0) ? '#e1e5e60a' : '#dfe6e50e';
                ctx.fillRect(cellX, cellY, sizeW, sizeH);
                ctx.strokeRect(cellX, cellY, sizeW, sizeH);

                // --- AJUSTE 1-BASED ---
                if (i === 0 && j > 0) { // j vai de 1 a 6
                    // Acessa o array 1-indexado 'imagensGrupo'
                    const img = imagensCarregadas[imagensGrupo[j]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                } else if (j === 0 && i > 0) { // i vai de 1 a 6
                    // Acessa o array 1-indexado 'imagensGrupo'
                    const img = imagensCarregadas[imagensGrupo[i]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                }
            }
        }

        // Célula 0,0 (Operação 'x')
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';
        // CORRIGIDO: Símbolo 'x'
        ctx.fillText('x', headerPixelSize / 2, headerPixelSize / 2);

        // 2. Desenha o Grid Principal, Acertos e DESTAQUE
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) { // row de 0 a 5
            for (let col = 0; col < tamanhoGrupo; col++) { // col de 0 a 5
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;

                // Desenha a borda da célula
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                // --- LÓGICA DE DESTAQUE ---
                if (celulaAtiva && celulaAtiva.row === row && celulaAtiva.col === col) {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.4)'; // Destaque amarelo
                    ctx.fillRect(cellX, cellY, cellPixelSize, cellPixelSize);

                    ctx.strokeStyle = '#FFD700'; // Dourado
                    ctx.lineWidth = 3;
                    ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#07b5fad0'; // Reseta a cor da borda
                    ctx.lineWidth = 2;
                }
                // --- FIM DA LÓGICA DE DESTAQUE ---

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
     */
    function carregarImagens(imagens, callback) {
        let loadedCount = 0;
        // --- AJUSTE 1-BASED ---
        // Filtra 'null' ou 'undefined' caso 'imagens' venha de 'imagensGrupo'
        const imagensUnicas = [...new Set(imagens)].filter(Boolean);
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
    // 5. EVENT LISTENERS E CONTROLES (ATUALIZADOS)
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

    // --- LISTENERS DE CLIQUE ---

    /**
     * Lida com cliques no banco de imagens.
     */
    function onImageBankClick(event) {
        if (!celulaAtiva) {
            mensagemEl.textContent = "Por favor, clique em uma célula do tabuleiro primeiro.";
            return;
        }

        const imgSrcClicked = event.target.getAttribute('src');

        // Processa a jogada usando a célula ativa e a imagem clicada
        processarJogada(celulaAtiva.row, celulaAtiva.col, imgSrcClicked);
    }

    /**
     * Lida com cliques no canvas (para selecionar a célula).
     */
    function onCanvasClick(event) {
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Ignora clique fora do grid principal
        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
            celulaAtiva = null; // Clicou fora, limpa seleção
            desenharTabuleiroCompleto(); // Redesenha para remover destaque
            return;
        }

        const gridX = x - headerPixelSize;
        const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);

        if (row < tamanhoGrupo && col < tamanhoGrupo) {
            // Clicou em uma célula válida
            celulaAtiva = { row, col, key: `${row},${col}` };
            mensagemEl.textContent = "Célula selecionada! Agora clique na imagem correta no banco.";
            desenharTabuleiroCompleto(); // Redesenha para mostrar o destaque
        }
    }

    // --- REGISTRO DOS EVENT LISTENERS ---

    // D&D (Canvas)
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const imgSrcDropped = e.dataTransfer.getData('text/plain');
            if (!imgSrcDropped || !dragging) {
                dragging = false;
                return;
            }

            // Calcula row e col do drop
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
                dragging = false;
                return;
            }

            const gridX = x - headerPixelSize;
            const gridY = y - headerPixelSize;
            const col = Math.floor(gridX / cellPixelSize);
            const row = Math.floor(gridY / cellPixelSize);

            if (row < tamanhoGrupo && col < tamanhoGrupo) {
                // Chama a função de lógica central
                processarJogada(row, col, imgSrcDropped);
            }

            dragging = false;
        });

        // Adiciona o listener de clique no canvas
        canvas.addEventListener('click', onCanvasClick);
    }

    // Botões
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 2; // Default para 2 (NivelD2)
            const proximoNivelNum = nivelAtual + 1;

            if (proximoNivelNum > 4) { // Supondo D4 como último nível
                window.open('../Finalizou.html', '_self');
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;
                window.open(proximoNivelHtml, '_self');
            }
        });
    }

    if (paginaInicialBtn) {
        paginaInicialBtn.addEventListener('click', () => {
            window.open('instrucaoD2.html', '_blank');
        });
    }

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});