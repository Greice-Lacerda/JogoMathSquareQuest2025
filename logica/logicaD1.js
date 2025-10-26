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

    let tamanhoGrupo = 6; // Número de elementos no grupo (6 para nível D)
    let cellPixelSize = 0;
    let headerPixelSize = 0;
    let tabuleiro = {};
    let tabelaCayleyCorreta = [];
    let imagensCarregadas = {};
    let imagensGrupo = []; // --- AJUSTE 1-BASED ---: [null, img1, ..., img6]
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];

    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    // --- VARIÁVEIS DE ESTADO (NOVO) ---
    let celulaAtiva = null; // Armazena a célula clicada: {row, col, key}
    let dragging = false;
    let draggedImgSrc = null;

    // Variáveis de Áudio
    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

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
        celulaAtiva = null; // --- NOVO --- Limpa a célula ativa

        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (reiniciarBtn) { reiniciarBtn.disabled = false; }
        if (limparBtn) { limparBtn.disabled = false; }

        // --- MENSAGEM ATUALIZADA ---
        mensagemEl.textContent = 'Arraste a imagem ou clique na célula e depois na imagem.';

        // 2.1 Seleção e Preparação das Imagens (Embaralhamento Dinâmico)
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

        // --- AJUSTE DE ORDEM --- (Removido o embaralhamento para coincidir com o cabeçalho)
        // embaralharArray(imagensParaArrastar);

        // 2.2 Geração da Solução e da Lista de Resultados (Passando array 1-based)
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // 2.3 Carregamento e Renderização
        // --- AJUSTE 1-BASED --- (Carrega apenas as imagens originais)
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensSelecionadasOriginal])];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados(); // Renderiza a lista inicial (oculta)
        });
    }

    /**
     * Gera a Tábua de Cayley (SOMA MODULAR de Posições 1-based).
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

                // --- LÓGICA DE SOMA (Base 1) ---
                // ( (A + B) - 1 ) % N + 1
                // Ex: (1+1=2) -> ((2)-1)%6 + 1 = 2
                // Ex: (4+5=9) -> ((9)-1)%6 + 1 = 3
                // Ex: (6+6=12) -> ((12)-1)%6 + 1 = 6
                const resultadoPos = ((posI + posJ) - 1) % n + 1;

                // Acessa o array 1-indexado 'elementos'
                tabela[i][j] = elementos[resultadoPos];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos 36 resultados no formato A + B = C.
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

                // --- AJUSTE 1-BASED --- (Acessa o array 1-indexado)
                const linhaSrc = elementos[i + 1];
                const colunaSrc = elementos[j + 1];

                // 'tabelaCayleyCorreta' é [0-5][0-5]
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
     * --- ATUALIZADO (Layout mais robusto) ---
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
     * --- ATUALIZADO (Adiciona listener de clique) ---
     */
    function renderizarImagensParaArrastar() {
        if (!listaImagensEl) return;
        listaImagensEl.innerHTML = '';
        // 'imagensParaArrastar' está na ordem correta
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.draggable = true;
            img.classList.add('arrastavel');

            // Eventos de D&D
            img.addEventListener('dragstart', onDragStart);

            // --- NOVO (Evento de Clique) ---
            img.addEventListener('click', onImageBankClick);

            listaImagensEl.appendChild(img);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE VERIFICAÇÃO E FEEDBACK (REFATORADO)
    // ==========================================================================

    /**
     * --- REFATORADO ---
     * Função central que processa a jogada (seja por clique ou D&D).
     * Recebe 'row' e 'col' (0-5) e a imagem.
     */
    function processarJogada(row, col, imgSrcDropped) {
        inicializarAudio();
        if (!canvas) return;

        const key = `${row},${col}`;

        // 'tabelaCayleyCorreta' é [0-5][0-5] e já tem a lógica 1-based
        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc;

        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        const itemListaIndex = listaResultadosSolucao.indexOf(itemLista);


        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            celulaAtiva = null; // --- NOVO ---
            desenharTabuleiroCompleto(); // --- NOVO ---
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

            // Marca o resultado na lista como acertado
            if (itemLista) {
                resultadosAcertados[itemListaIndex] = true;
            }

            tocarSom(clapSound);

            // --- LÓGICA DE FEEDBACK (Base 1) ---
            // 'itemLista.linha' já é Elem[1], etc.
            const nomeLinha = itemLista ? itemLista.linha : `Elem[${row + 1}]`;
            const nomeColuna = itemLista ? itemLista.coluna : `Elem[${col + 1}]`;

            // Fallback usa a mesma lógica de soma (Base 1)
            const n = tamanhoGrupo;
            const fallbackIndex = (((row + 1) + (col + 1)) - 1) % n + 1;
            const nomeResultado = itemLista ? itemLista.resultadoEsperado : `Elem[${fallbackIndex}]`;

            // Mensagem usa o símbolo '+'
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
            // (Não é preciso deletar 'tabuleiro[key]' pois não foi setado)
        }

        celulaAtiva = null; // --- NOVO --- Limpa a seleção após a tentativa
        desenharTabuleiroCompleto();
    }

    /**
     * Lógica de Limpar Última Jogada.
     * --- ATUALIZADO (Limpa 'celulaAtiva') ---
     */
    function limparUltimaJogada() {
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }
        celulaAtiva = null; // --- NOVO ---

        const lastMove = history.pop();
        delete tabuleiro[lastMove.key];
        celulasCorretas--;

        // Remove o acerto da lista de resultados
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
     * --- ATUALIZADO (Símbolo '+') ---
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

            // --- LÓGICA DE SOMA (Símbolo '+') ---
            const textoCombinacao = `${index + 1}: ${linha} + ${coluna} = ${resultado}`;

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
     * Desenha o tabuleiro completo (Cabeçalhos, Acertos e Destaque).
     * --- ATUALIZADO (Índices 1-based, Destaque, Correção W/H) ---
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#bcf5edff'; ctx.lineWidth = 2;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos (Linha e Coluna 0)
        for (let i = 0; i < tamanhoGrupo + 1; i++) { // i de 0 a 6
            for (let j = 0; j < tamanhoGrupo + 1; j++) { // j de 0 a 6
                const cellX = (j === 0) ? 0 : headerPixelSize + (j - 1) * cellPixelSize;
                const cellY = (i === 0) ? 0 : headerPixelSize + (i - 1) * cellPixelSize;

                // --- CORREÇÃO W/H ---
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

        // Célula 0,0 (Operação '+')
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';
        // --- LÓGICA DE SOMA (Símbolo '+') ---
        ctx.fillText('+', headerPixelSize / 2, headerPixelSize / 2);

        // 2. Desenha o Grid Principal, Acertos e DESTAQUE
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) { // row de 0 a 5
            for (let col = 0; col < tamanhoGrupo; col++) { // col de 0 a 5
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;

                // Desenha a borda da célula
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                // --- LÓGICA DE DESTAQUE (NOVO) ---
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
     * --- ATUALIZADO (Mais robusto) ---
     */
    function carregarImagens(imagens, callback) {
        let loadedCount = 0;
        // Filtra 'null' ou 'undefined'
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

    // --- LISTENERS DE CLIQUE (NOVOS) ---

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

    // --- REGISTRO DOS EVENT LISTENERS (ATUALIZADO) ---
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });

        // Listener de Drop (REFATORADO)
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

        // --- NOVO (Adiciona o listener de clique no canvas) ---
        canvas.addEventListener('click', onCanvasClick);
    }

    // Botões
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 1; // Default para 1
            const proximoNivelNum = nivelAtual + 1;

            if (proximoNivelNum > 4) { // Supondo D4 como último nível
                window.open('../Finalizou.html', '_self');
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;
                window.open(proximoNivelHtml, '_self');
            }
        });
    }

    // (Corrigido de _black para _blank, mas mantendo a intenção original se foi _black)
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('instrucaoD1.html', '_blank'));

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});