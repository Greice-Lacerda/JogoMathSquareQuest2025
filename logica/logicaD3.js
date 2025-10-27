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

    // --- LÓGICA D3: Módulo 5 ---
    let tamanhoGrupo = 5; 
    let cellPixelSize = 0;
    let headerPixelSize = 0;
    let tabuleiro = {};
    let tabelaCayleyCorreta = [];
    let imagensCarregadas = {};
    let imagensGrupo = []; // --- AJUSTE 1-BASED ---: [null, img1...img5]
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];

    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    // --- Variáveis de estado "Caça ao Elemento" ---
    let elementoAlvoAtual = null;
    let indiceAlvoAtual = 0; // (0 a 4)
    let contagemRestanteAlvo = 0;
    let elementosCompletos = new Set();
    let celulasPreenchidas = new Set();
    // ---------------------------------------------

    // --- VARIÁVEIS DE ESTADO (NOVO) ---
    let celulaAtiva = null; // Armazena a célula clicada: {row, col, key}
    let dragging = false;
    let draggedImgSrc = null;

    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    /**
     * Função auxiliar para obter o nome curto do arquivo (Base 1)
     */
    function getNomeCurto(src) {
        if (!src) return "N/A";
        const nomeArquivo = src.split('/').pop().split('.')[0];
        // 'imagensGrupo' é 1-based, indexOf retornará 1-5
        return nomeArquivo || `Elem[${imagensGrupo.indexOf(src)}]`;
    }

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        // --- LÓGICA D3: Módulo 5 ---
        tamanhoGrupo = 5; 
        resultadosAcertados = {};
        celulaAtiva = null; // --- NOVO ---

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

        // --- MENSAGEM ATUALIZADA ---
        mensagemEl.textContent = 'Arraste a imagem ou clique na célula e depois na imagem.';

        // 1. Seleção e Preparação das Imagens
        todasImagens = [...todasImagensBase];
        embaralharArray(todasImagens);

        const imagensSelecionadasOriginal = todasImagens.slice(0, tamanhoGrupo);

        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas.`;
            return;
        }

        // --- AJUSTE 1-BASED ---
        imagensGrupo = [null, ...imagensSelecionadasOriginal];
        imagensParaArrastar = [...imagensSelecionadasOriginal]; // (Não embaralhar)

        // 2. Geração da Solução (Base 1)
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);
        listaResultadosSolucao = gerarListaResultadosSolucao(imagensGrupo);

        // 3. Carregamento e Renderização
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensSelecionadasOriginal])];

        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
            renderizarImagensParaArrastar();
            renderizarListaResultados();
            iniciarProximoAlvo(); // Inicia a "Caçada"
        });
    }

    // --- Função "Caçada" (AJUSTADA para 1-based) ---
    function iniciarProximoAlvo() {
        if (indiceAlvoAtual >= tamanhoGrupo) { // (indiceAlvoAtual vai de 0 a 4)
            return;
        }

        // --- AJUSTE 1-BASED --- (Acessa [1] a [5])
        elementoAlvoAtual = imagensGrupo[indiceAlvoAtual + 1]; 

        document.querySelectorAll('#lista-imagens img').forEach(img => {
            img.classList.remove('alvo-ativo');
            // --- ATUALIZADO (Adiciona lógica de clique) ---
            const isAlvo = img.getAttribute('src') === elementoAlvoAtual;
            const isCompleto = elementosCompletos.has(img.getAttribute('src'));

            img.draggable = isAlvo; // Só pode arrastar o alvo
            img.style.cursor = isAlvo ? 'grab' : (isCompleto ? 'not-allowed' : 'pointer');
            
            if (isCompleto) {
                img.classList.add('alvo-completo');
            }
        });

        const imgAlvoEl = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
        if (imgAlvoEl) {
            imgAlvoEl.classList.add('alvo-ativo');
        }

        // Calcula contagem restante (lógica interna 0-based está OK)
        let contagem = 0;
        tabelaCayleyCorreta.forEach((linha, i) => { // i = 0 a 4
            linha.forEach((celulaSolucao, j) => { // j = 0 a 4
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
     * Gera a Tábua de Cayley (SOMA MODULAR Módulo 5 - Base 1).
     * --- AJUSTE 1-BASED ---: 'elementos' é [null, img1, ..., img5]
     */
    function gerarTabelaCayley(elementos) {
        const n = tamanhoGrupo; // n = 5
        const tabela = [];
        for (let i = 0; i < n; i++) { // i de 0 a 4
            tabela[i] = [];
            for (let j = 0; j < n; j++) { // j de 0 a 4
                
                // Mapeia i e j (0-4) para posições 1-5
                const posI = i + 1;
                const posJ = j + 1;

                // --- LÓGICA D3: SOMA MODULAR (Base 1) ---
                const resultadoPos = ( (posI + posJ) - 1 ) % n + 1;
                
                tabela[i][j] = elementos[resultadoPos];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos resultados no formato A + B = C.
     * --- AJUSTE 1-BASED ---: 'elementos' é [null, img1, ..., img5]
     */
    function gerarListaResultadosSolucao(elementos) {
        const n = tamanhoGrupo; // n = 5
        const lista = [];
        let indexContador = 0;

        for (let i = 0; i < n; i++) { // i de 0 a 4
            for (let j = 0; j < n; j++) { // j de 0 a 4
                
                // --- AJUSTE 1-BASED --- (Acessa o array 1-indexado)
                const linhaSrc = elementos[i + 1];
                const colunaSrc = elementos[j + 1];
                
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
        
        if (size <= 0) return;

        canvas.width = size;
        canvas.height = size;

        const totalCells = tamanhoGrupo + 1; // 5 + 1 = 6
        headerPixelSize = size * 0.1;
        cellPixelSize = (size - headerPixelSize) / tamanhoGrupo;

        desenharTabuleiroCompleto();
    }

    /**
     * Renderiza as imagens na lista (arrastáveis E clicáveis).
     * --- ATUALIZADO (Adiciona clique) ---
     */
    function renderizarImagensParaArrastar() {
        listaImagensEl.innerHTML = '';
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.draggable = true; // (Será controlado pelo 'iniciarProximoAlvo')
            img.classList.add('arrastavel');
            
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
     */
    function processarJogada(row, col, imgSrcDropped) {
        inicializarAudio();
        if (!canvas) return;

        const key = `${row},${col}`;

        // Verifica se já foi preenchida
        if (celulasPreenchidas.has(key)) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            celulaAtiva = null; // Limpa seleção
            desenharTabuleiroCompleto(); // Remove destaque
            return;
        }

        const expectedImgSrc = tabelaCayleyCorreta[row][col];

        // Verifica se a imagem (que é o 'alvo') é a esperada para esta célula
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

            // Verifica se completou o alvo atual
            if (contagemRestanteAlvo === 0) {
                elementosCompletos.add(elementoAlvoAtual);

                const imgBanco = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
                if (imgBanco) {
                    imgBanco.classList.remove('alvo-ativo');
                    imgBanco.classList.add('alvo-completo');
                    imgBanco.draggable = false;
                    imgBanco.style.cursor = 'not-allowed';
                }

                // Verifica se completou o nível
                if (elementosCompletos.size === tamanhoGrupo) {
                    mensagemEl.innerHTML = `<h2>Parabéns! Tábua completa.</h2>`;
                    if (proximoNivelBtn) {
                        proximoNivelBtn.style.display = 'block';
                        proximoNivelBtn.style.backgroundColor = '#4CAF50'; // Cor verde
                    }
                    if (reiniciarBtn) reiniciarBtn.disabled = true;
                    if (limparBtn) limparBtn.disabled = true;
                    if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
                
                } else {
                    // Próximo alvo
                    indiceAlvoAtual++;
                    iniciarProximoAlvo();
                }
            }

        } else { // <<< INCORRETO >>>
            // O usuário clicou/arrastou o 'elementoAlvoAtual' para a célula errada
            mensagemEl.textContent = `Incorreto! Esta célula não é ${getNomeCurto(elementoAlvoAtual)}.`;
            tocarSom(errorSound);
        }

        celulaAtiva = null; // Limpa seleção
        desenharTabuleiroCompleto();
    }


    /**
     * Lógica de Limpar Última Jogada (Undo).
     * --- AJUSTADO (Base 1 e 'celulaAtiva') ---
     */
    function limparUltimaJogada() {
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }
        celulaAtiva = null; // --- NOVO ---

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

        // Se a imagem desfeita é a que estávamos caçando
        if (imgSrcDesfeito === elementoAlvoAtual) {
            contagemRestanteAlvo++;
            mensagemEl.textContent = `Jogada desfeita. Faltam ${contagemRestanteAlvo} para ${getNomeCurto(elementoAlvoAtual)}`;
        }
        // Se a imagem desfeita era de uma caçada já completa
        else if (elementosCompletos.has(imgSrcDesfeito)) {
            elementosCompletos.delete(imgSrcDesfeito);

            // --- AJUSTE 1-BASED --- (indexOf retorna 1-5, subtrai 1 para 0-4)
            indiceAlvoAtual = imagensGrupo.indexOf(imgSrcDesfeito) - 1;
            
            // Reinicia a caçada para esse item (recalcula contagem)
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
     * Renderiza a lista dinâmica de resultados.
     * --- AJUSTADO (Símbolo '+') ---
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

            // --- LÓGICA D3: SOMA (Símbolo '+') ---
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

    function drawImageMaintainAspect(ctx, img, x, y, w, h) {
        const aspectRatio = img.width / img.height;
        const paddingFactor = 0.9; // (Era 0.95, 0.9 é mais seguro)
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
     * Desenha o tabuleiro completo.
     * --- ATUALIZADO (Base 1, Destaque, Correção W/H, Símbolo '+') ---
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#eee8f1'; ctx.lineWidth = 3;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos
        for (let i = 0; i < tamanhoGrupo + 1; i++) { // i de 0 a 5
            for (let j = 0; j < tamanhoGrupo + 1; j++) { // j de 0 a 5
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
                if (i === 0 && j > 0) { // j vai de 1 a 5
                    const img = imagensCarregadas[imagensGrupo[j]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                } else if (j === 0 && i > 0) { // i vai de 1 a 5
                    const img = imagensCarregadas[imagensGrupo[i]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                }
            }
        }

        // Célula 0,0 (Operação)
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';
        // --- LÓGICA D3: SOMA (Símbolo '+') ---
        ctx.fillText('+', headerPixelSize / 2, headerPixelSize / 2);

        // 2. Desenha o Grid Principal e os Acertos
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) { // row de 0 a 4
            for (let col = 0; col < tamanhoGrupo; col++) { // col de 0 a 4
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                // --- LÓGICA DE DESTAQUE (NOVO) ---
                if (celulaAtiva && celulaAtiva.row === row && celulaAtiva.col === col) {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
                    ctx.fillRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#07b5fad0';
                    ctx.lineWidth = 2;
                }
                // --- FIM DESTAQUE ---

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
     * Carrega imagens (Robusto, 1-based safe)
     */
    function carregarImagens(imagens, callback) {
        let loadedCount = 0;
        const imagensUnicas = [...new Set(imagens)].filter(Boolean); // Filtra null
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
                console.error(`Falha ao carregar imagem: ${src}.`);
                loadedCount++;
                if (loadedCount === total) callback(loadedImgs);
            };
            img.src = src;
        });
    }

    // ==========================================================================
    // 5. EVENT LISTENERS E CONTROLES (ATUALIZADOS)
    // ==========================================================================

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

    /**
     * D&D Listener (Caçada)
     */
    function onDragStart(event) {
        draggedImgSrc = event.target.getAttribute('src');

        // Lógica da Caçada: Só permite arrastar o alvo ativo
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

    // --- LISTENERS DE CLIQUE (NOVOS) ---

    /**
     * Lida com cliques no banco de imagens (Caçada)
     */
    function onImageBankClick(event) {
        const imgSrcClicked = event.target.getAttribute('src');

        // Lógica da Caçada: Só permite interagir com o alvo
        if (imgSrcClicked !== elementoAlvoAtual) {
            if (elementosCompletos.has(imgSrcClicked)) {
                mensagemEl.textContent = "Você já completou esse elemento.";
            } else {
                mensagemEl.textContent = `Alvo errado! Você deve encontrar: ${getNomeCurto(elementoAlvoAtual)}`;
                const imgAlvoEl = document.querySelector(`#lista-imagens img.alvo-ativo`);
                if (imgAlvoEl) {
                    imgAlvoEl.classList.add('shake-animation');
                    setTimeout(() => imgAlvoEl.classList.remove('shake-animation'), 500);
                }
            }
            tocarSom(errorSound);
            return;
        }

        // Se clicou no alvo correto, mas não selecionou célula
        if (!celulaAtiva) {
            mensagemEl.textContent = "Por favor, clique em uma célula do tabuleiro primeiro.";
            return;
        }
        
        // Clicou no alvo correto E tem uma célula ativa
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
            // Se a célula já estiver preenchida, não faz nada
            if (celulasPreenchidas.has(`${row},${col}`)) {
                mensagemEl.textContent = "Célula já preenchida corretamente.";
                celulaAtiva = null;
                desenharTabuleiroCompleto();
                return;
            }
            
            // Célula válida e vazia
            celulaAtiva = { row, col, key: `${row},${col}` };
            mensagemEl.textContent = `Célula [${row+1}, ${col+1}] selecionada. Agora clique na imagem alvo.`;
            desenharTabuleiroCompleto(); // Redesenha com destaque
        }
    }

    // --- REGISTRO DOS EVENT LISTENERS (ATUALIZADO) ---
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
        
        // Listener de Drop (REFATORADO)
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (dragging) {
                const imgSrcDropped = e.dataTransfer.getData('text/plain');
                if (imgSrcDropped) {
                    
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
                        processarJogada(row, col, imgSrcDropped);
                    }
                }
            }
            dragging = false;
            draggedImgSrc = null;
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
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 3; // Default para 3
            const proximoNivelNum = nivelAtual + 1;

            if (proximoNivelNum > 5) { // Supondo D5 como último nível
                window.open('../Finalizou.html', '_self');
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;
                window.open(proximoNivelHtml, '_self');
            }
        });
    }
    // (Corrigido de _blanck para _blank)
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('instrucaoD3.html', '_blank'));

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});