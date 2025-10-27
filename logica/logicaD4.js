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
    let todasImagensBase = [
        '../imagens/abelha.png', '../imagens/aguia.png', '../imagens/antena.png',
        '../imagens/aranha.jpeg', '../imagens/atomo.png', '../imagens/bala.png',
        '../imagens/balao.png', '../imagens/bispo.png', '../imagens/bola.jpeg',
        '../imagens/boliche.png', '../imagens/bolo.png', '../imagens/bone.png',
        '../imagens/boneca.png', '../imagens/borboleta.png', '../imagens/capelo.png',
        '../imagens/carro.jpeg', '../imagens/carroIcone.png', '../imagens/cartola.png',
        '../imagens/casa.png', '../imagens/cavalo.jpeg', '../imagens/chinelo.png',
        '../imagens/circulo.png', '../imagens/coracao.png', '../imagens/corcel.jpeg',
        '../imagens/coroa.png', '../imagens/corBranca.png', '../imagens/dado.png',
        '../imagens/esfera.png', '../imagens/estrela.jpeg', '../imagens/fantasma.png',
        '../imagens/flor.jpeg', '../imagens/florIcone.png', '../imagens/icone.jpeg',
        '../imagens/lisBranca.png', '../imagens/lisPreta.png', '../imagens/mais.png',
        '../imagens/mosca.png', '../imagens/nuvem.png', '../imagens/peao.png',
        '../imagens/pentIcone.png', '../imagens/pentagonos.png', '../imagens/pinguim.png',
        '../imagens/pentagonal.png', '../imagens/quadragular.jpg', '../imagens/presentes.png',
        '../imagens/prisma.png', '../imagens/quadrado.png', '../imagens/rainhaIcone.png',
        '../imagens/reiIcone.jpg', '../imagens/rosa.png', '../imagens/colorido.png',
        '../imagens/solidoIcone.png', '../imagens/terra.png', '../imagens/torre.jpeg',
        '../imagens/triangulo.png', '../imagens/tv.png', '../imagens/vassourinha.png',
        '../imagens/zangao.png'
    ];

    let todasImagens = [];

    // --- LÓGICA D4: Módulo 5 Híbrido em Tabuleiro 6x6 ---
    let tamanhoGrupo = 6;
    let MODULO_N = 5;
    // --------------------------------------------------

    let cellPixelSize = 0;
    let headerPixelSize = 0;
    let tabuleiro = {};
    let tabelaCayleyCorreta = [];
    let imagensCarregadas = {};
    let imagensGrupo = []; // [null, img1...img6]
    let imagensParaArrastar = [];
    let celulasCorretas = 0;
    let history = [];

    let listaResultadosSolucao = [];
    let resultadosAcertados = {};

    // --- LÓGICA D4: Mapeamento de Posição <-> Valor ---
    let valorPosicao = []; // Mapa: valorPosicao[Pos] = Valor (Ex: valorPosicao[1] = 5)
    let posicaoValor = {}; // Mapa: posicaoValor[Valor] = Pos (Ex: posicaoValor[5] = 1)
    let pos_I = -1; // Posição do Elemento Neutro (Valor 1)
    let pos_Z = -1; // Posição do Distrator (Valor 0)
    let pos_5 = -1; // Posição do Valor 5
    // -------------------------------------------------

    // --- Variáveis de estado "Caça ao Elemento" ---
    let elementoAlvoAtual = null;
    let indiceAlvoAtual = 0; // (0 a 5)
    let contagemRestanteAlvo = 0;
    let elementosCompletos = new Set();
    let celulasPreenchidas = new Set();
    // ---------------------------------------------

    let celulaAtiva = null;
    let dragging = false;
    let draggedImgSrc = null;

    const clapSound = new Audio('audio/clap.mp3');
    const errorSound = new Audio('audio/error.mp3');

    // ==========================================================================
    // 2. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO
    // ==========================================================================

    function getNomeCurto(src) {
        if (!src) return "N/A";
        const nomeArquivo = src.split('/').pop().split('.')[0];
        return nomeArquivo || `Elem[${imagensGrupo.indexOf(src)}]`;
    }

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;
        // --- LÓGICA D4 ---
        tamanhoGrupo = 6;
        MODULO_N = 5;
        // -----------------
        resultadosAcertados = {};
        celulaAtiva = null;
        elementoAlvoAtual = null;
        indiceAlvoAtual = 0;
        contagemRestanteAlvo = 0;
        elementosCompletos.clear();
        celulasPreenchidas.clear();

        if (proximoNivelBtn) {
            proximoNivelBtn.style.display = 'none';
            proximoNivelBtn.style.backgroundColor = '';
        }
        if (reiniciarBtn) { reiniciarBtn.disabled = false; }
        if (limparBtn) { limparBtn.disabled = false; }

        mensagemEl.textContent = 'Arraste a imagem ou clique na célula e depois na imagem.';

        // 1. Seleção e Preparação das Imagens
        todasImagens = [...todasImagensBase];
        embaralharArray(todasImagens);
        const imagensSelecionadasOriginal = todasImagens.slice(0, tamanhoGrupo);
        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas.`;
            return;
        }

        imagensGrupo = [null, ...imagensSelecionadasOriginal];
        imagensParaArrastar = [...imagensSelecionadasOriginal]; // (Não embaralhar)

        // --- LÓGICA D4: Configuração do Mapeamento (6 Posições -> Valores {1,2,3,4,5,0}) ---
        let valores = [0, 1, 2, 3, 4, 5]; // 6 valores matemáticos
        embaralharArray(valores);

        valorPosicao = [null]; // [0] é nulo
        posicaoValor = {};

        for (let i = 1; i <= tamanhoGrupo; i++) { // i de 1 a 6
            const valor = valores[i - 1];
            valorPosicao[i] = valor;      // Ex: valorPosicao[Pos 1] = 5
            posicaoValor[valor] = i;  // Ex: posicaoValor[5] = Pos 1
        }

        pos_I = posicaoValor[1]; // Encontra a Posição do valor 1 (Neutro)
        pos_Z = posicaoValor[0]; // Encontra a Posição do valor 0 (Distrator/Zero)
        pos_5 = posicaoValor[5]; // Encontra a Posição do valor 5
        // -----------------------------------------------------

        // 2. Geração da Solução
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

    // --- Função "Caçada" (6 elementos) ---
    function iniciarProximoAlvo() {
        if (indiceAlvoAtual >= tamanhoGrupo) { // (indiceAlvoAtual vai de 0 a 5)
            return;
        }

        elementoAlvoAtual = imagensGrupo[indiceAlvoAtual + 1];

        document.querySelectorAll('#lista-imagens img').forEach(img => {
            img.classList.remove('alvo-ativo');
            const isAlvo = img.getAttribute('src') === elementoAlvoAtual;
            const isCompleto = elementosCompletos.has(img.getAttribute('src'));
            img.draggable = isAlvo;
            img.style.cursor = isAlvo ? 'grab' : (isCompleto ? 'not-allowed' : 'pointer');
            if (isCompleto) { img.classList.add('alvo-completo'); }
        });

        const imgAlvoEl = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
        if (imgAlvoEl) { imgAlvoEl.classList.add('alvo-ativo'); }

        let contagem = 0;
        tabelaCayleyCorreta.forEach((linha, i) => { // i = 0 a 5
            linha.forEach((celulaSolucao, j) => { // j = 0 a 5
                const key = `${i},${j}`;
                if (celulaSolucao === elementoAlvoAtual && !celulasPreenchidas.has(key)) {
                    contagem++;
                }
            });
        });
        contagemRestanteAlvo = contagem;

        // Atualiza a mensagem com tags (Zero/Neutro/5)
        let nome = getNomeCurto(elementoAlvoAtual);
        const posAtual = imagensGrupo.indexOf(elementoAlvoAtual);
        if (posAtual === pos_I) nome += " (Neutro)";
        if (posAtual === pos_Z) nome += " (Zero/Distrator)";
        if (posAtual === pos_5) nome += " (Valor 5)";
        mensagemEl.textContent = `Encontre ${contagemRestanteAlvo} células para: ${nome}`;
    }


    /**
     * Gera a Tábua de Cayley (MULTIPLICAÇÃO MÓDULO 5 Híbrida).
     * --- LÓGICA D4 ---
     */
    function gerarTabelaCayley(elementos) {
        const n = tamanhoGrupo; // n = 6
        const mod = MODULO_N;   // mod = 5
        const tabela = [];

        for (let i = 0; i < n; i++) { // i de 0 a 5
            tabela[i] = [];
            for (let j = 0; j < n; j++) { // j de 0 a 5

                const posI = i + 1;
                const posJ = j + 1;

                const valI = valorPosicao[posI];
                const valJ = valorPosicao[posJ];

                // 1. Calcula a multiplicação direta
                const resultadoMult = (valI * valJ);

                let resultadoValor;

                // 2. Aplica as Regras Especiais
                if (resultadoMult === 5) {
                    // Regra 1: Resultado 5 -> Valor 5
                    resultadoValor = 5;
                } else {
                    // Regra 2: Demais casos -> Módulo 5
                    resultadoValor = resultadoMult % mod;
                }

                // 3. Mapeia o valor de volta para a Posição
                const resultadoPos = posicaoValor[resultadoValor];
                tabela[i][j] = elementos[resultadoPos];
            }
        }
        return tabela;
    }

    /**
     * Gera a lista completa dos resultados no formato A * B = C.
     */
    function gerarListaResultadosSolucao(elementos) {
        const n = tamanhoGrupo; // n = 6
        const lista = [];
        let indexContador = 0;

        for (let i = 0; i < n; i++) { // i de 0 a 5
            for (let j = 0; j < n; j++) { // j de 0 a 5
                const linhaSrc = elementos[i + 1];
                const colunaSrc = elementos[j + 1];
                const resultadoSrc = tabelaCayleyCorreta[i][j];

                lista.push({
                    id: indexContador, row: i, col: j, key: `${i},${j}`,
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
     * Ajusta o tamanho do Canvas e redesenha o tabuleiro (6x6).
     */
    function ajustarERedesenharCanvas() {
        if (!canvas || !containerTabuleiro) return;
        const containerRect = containerTabuleiro.getBoundingClientRect();
        const size = Math.min(containerRect.width, containerRect.height);
        if (size <= 0) return;
        canvas.width = size; canvas.height = size;
        const totalCells = tamanhoGrupo + 1; // 6 + 1 = 7
        headerPixelSize = size * 0.1;
        cellPixelSize = (size - headerPixelSize) / tamanhoGrupo;
        desenharTabuleiroCompleto();
    }

    /**
     * Renderiza as imagens na lista (arrastáveis E clicáveis).
     */
    function renderizarImagensParaArrastar() {
        listaImagensEl.innerHTML = '';
        imagensParaArrastar.forEach(src => {
            const img = document.createElement('img');
            img.src = src; img.draggable = true; img.classList.add('arrastavel');
            img.addEventListener('dragstart', onDragStart);
            img.addEventListener('click', onImageBankClick);
            listaImagensEl.appendChild(img);
        });
    }

    // ==========================================================================
    // 3. LÓGICA DE VERIFICAÇÃO E FEEDBACK (REFATORADO)
    // ==========================================================================

    function processarJogada(row, col, imgSrcDropped) {
        inicializarAudio();
        if (!canvas) return;
        const key = `${row},${col}`;

        if (celulasPreenchidas.has(key)) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            tocarSom(errorSound);
            celulaAtiva = null;
            desenharTabuleiroCompleto();
            return;
        }

        const expectedImgSrc = tabelaCayleyCorreta[row][col];

        // Prepara nome do alvo (com tags)
        let nomeAlvo = getNomeCurto(elementoAlvoAtual);
        const posAlvo = imagensGrupo.indexOf(elementoAlvoAtual);
        if (posAlvo === pos_I) nomeAlvo += " (Neutro)";
        if (posAlvo === pos_Z) nomeAlvo += " (Zero/Distrator)";
        if (posAlvo === pos_5) nomeAlvo += " (Valor 5)";


        if (imgSrcDropped === expectedImgSrc) {
            // SUCESSO!
            tabuleiro[key] = imgSrcDropped;
            celulasPreenchidas.add(key);
            celulasCorretas++;
            contagemRestanteAlvo--;
            history.push({ key: key, imgSrc: imgSrcDropped });

            const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
            if (itemLista) { resultadosAcertados[itemLista.id] = true; }

            tocarSom(clapSound);
            mensagemEl.textContent = `Correto! Faltam ${contagemRestanteAlvo} para ${nomeAlvo}`;
            renderizarListaResultados();

            if (contagemRestanteAlvo === 0) {
                elementosCompletos.add(elementoAlvoAtual);

                const imgBanco = document.querySelector(`#lista-imagens img[src="${elementoAlvoAtual}"]`);
                if (imgBanco) {
                    imgBanco.classList.remove('alvo-ativo');
                    imgBanco.classList.add('alvo-completo');
                    imgBanco.draggable = false;
                    imgBanco.style.cursor = 'not-allowed';
                }

                if (elementosCompletos.size === tamanhoGrupo) { // (size === 6)
                    mensagemEl.innerHTML = `<h2>Parabéns! Tábua completa.</h2>`;
                    if (proximoNivelBtn) {
                        proximoNivelBtn.style.display = 'block';
                        proximoNivelBtn.style.backgroundColor = '#4CAF50';
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
            mensagemEl.textContent = `Incorreto! Esta célula não é ${nomeAlvo}.`;
            tocarSom(errorSound);
        }

        celulaAtiva = null;
        desenharTabuleiroCompleto();
    }


    function limparUltimaJogada() {
        if (history.length === 0) {
            mensagemEl.textContent = "Nenhuma jogada correta para desfazer.";
            return;
        }
        celulaAtiva = null;
        const lastMove = history.pop();
        const imgSrcDesfeito = lastMove.imgSrc;
        const key = lastMove.key;
        delete tabuleiro[key];
        celulasCorretas--;
        celulasPreenchidas.delete(key);
        const [row, col] = key.split(',').map(Number);
        const itemLista = listaResultadosSolucao.find(item => item.row === row && item.col === col);
        if (itemLista) { delete resultadosAcertados[itemLista.id]; }

        let nomeAlvo = getNomeCurto(elementoAlvoAtual);
        const posAlvo = imagensGrupo.indexOf(elementoAlvoAtual);
        if (posAlvo === pos_I) nomeAlvo += " (Neutro)";
        if (posAlvo === pos_Z) nomeAlvo += " (Zero/Distrator)";
        if (posAlvo === pos_5) nomeAlvo += " (Valor 5)";

        if (imgSrcDesfeito === elementoAlvoAtual) {
            contagemRestanteAlvo++;
            mensagemEl.textContent = `Jogada desfeita. Faltam ${contagemRestanteAlvo} para ${nomeAlvo}`;
        }
        else if (elementosCompletos.has(imgSrcDesfeito)) {
            elementosCompletos.delete(imgSrcDesfeito);
            indiceAlvoAtual = imagensGrupo.indexOf(imgSrcDesfeito) - 1;
            iniciarProximoAlvo(); // Recalcula e atualiza a mensagem
        }

        desenharTabuleiroCompleto();
        renderizarListaResultados();

        if (proximoNivelBtn) {
            proximoNivelBtn.style.display = 'none';
            proximoNivelBtn.style.backgroundColor = '';
        }
        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;
    }

    /**
     * Renderiza a lista de resultados (Símbolo '*').
     */
    function renderizarListaResultados() {
        if (!listaResultadosEl) return;
        let html = '';
        listaResultadosSolucao.forEach((item, index) => {
            const resolvido = resultadosAcertados[item.id];
            let classe = resolvido ? 'resultado-item resolvido' : 'resultado-item oculta';
            // --- LÓGICA D4: MULTIPLICAÇÃO (Símbolo '*') ---
            const textoCombinacao = `${index + 1}: ${item.linha} * ${item.coluna} = ${item.resultadoEsperado}`;
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
        const paddingFactor = 0.9;
        const maxW = w * paddingFactor; const maxH = h * paddingFactor;
        let drawW = maxW; let drawH = maxH;
        if (maxW / maxH > aspectRatio) { drawW = maxH * aspectRatio; } else { drawH = maxW / aspectRatio; }
        const drawX = x + (w - drawW) / 2; const drawY = y + (h - drawH) / 2;
        ctx.drawImage(img, Math.floor(drawX), Math.floor(drawY), Math.floor(drawW), Math.floor(drawH));
    }

    /**
     * Desenha o tabuleiro completo (6x6, Base 1, Símbolo '*').
     */
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#eee8f1'; ctx.lineWidth = 3;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos (6x6)
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

                if (i === 0 && j > 0) { // j vai de 1 a 6
                    const img = imagensCarregadas[imagensGrupo[j]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                } else if (j === 0 && i > 0) { // i vai de 1 a 6
                    const img = imagensCarregadas[imagensGrupo[i]];
                    if (img) drawImageMaintainAspect(ctx, img, cellX, cellY, sizeW, sizeH);
                }
            }
        }

        // Célula 0,0 (Operação)
        ctx.fillStyle = '#5b0a914d'; ctx.fillRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillStyle = 'white';
        // --- LÓGICA D4: MULTIPLICAÇÃO (Símbolo '*') ---
        ctx.fillText('*', headerPixelSize / 2, headerPixelSize / 2);

        // 2. Desenha o Grid Principal (6x6)
        ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) { // row de 0 a 5
            for (let col = 0; col < tamanhoGrupo; col++) { // col de 0 a 5
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                // --- LÓGICA DE DESTAQUE ---
                if (celulaAtiva && celulaAtiva.row === row && celulaAtiva.col === col) {
                    ctx.fillStyle = 'rgba(255, 255, 100, 0.4)';
                    ctx.fillRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3;
                    ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);
                    ctx.strokeStyle = '#07b5fad0'; ctx.lineWidth = 2;
                }
                // --- FIM DESTAQUE ---

                const key = `${row},${col}`;
                const imgSrcInCell = tabuleiro[key];
                if (imgSrcInCell) {
                    const img = imagensCarregadas[imgSrcInCell];
                    if (img) { drawImageMaintainAspect(ctx, img, cellX, cellY, cellPixelSize, cellPixelSize); }
                }
            }
        }
    }

    function carregarImagens(imagens, callback) {
        let loadedCount = 0;
        const imagensUnicas = [...new Set(imagens)].filter(Boolean); // Filtra null
        const total = imagensUnicas.length;
        const loadedImgs = {};
        if (total === 0) { callback(loadedImgs); return; }
        imagensUnicas.forEach(src => {
            const img = new Image(); img.crossOrigin = "anonymous";
            img.onload = () => {
                loadedImgs[src] = img; loadedCount++;
                if (loadedCount === total) callback(loadedImgs);
            };
            img.onerror = () => {
                console.error(`Falha ao carregar imagem: ${src}.`); loadedCount++;
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

    function onDragStart(event) {
        draggedImgSrc = event.target.getAttribute('src');
        let nomeAlvo = getNomeCurto(elementoAlvoAtual);
        const posAlvo = imagensGrupo.indexOf(elementoAlvoAtual);
        if (posAlvo === pos_I) nomeAlvo += " (Neutro)";
        if (posAlvo === pos_Z) nomeAlvo += " (Zero/Distrator)";
        if (posAlvo === pos_5) nomeAlvo += " (Valor 5)";

        // Lógica da Caçada
        if (draggedImgSrc !== elementoAlvoAtual) {
            event.preventDefault();
            tocarSom(errorSound);
            mensagemEl.textContent = `Alvo errado! Você deve encontrar: ${nomeAlvo}`;

            const imgAlvoEl = document.querySelector(`#lista-imagens img.alvo-ativo`);
            if (imgAlvoEl) {
                imgAlvoEl.classList.add('shake-animation');
                setTimeout(() => imgAlvoEl.classList.remove('shake-animation'), 500);
            }
            dragging = false; return;
        }
        event.dataTransfer.setData('text/plain', draggedImgSrc);
        event.dataTransfer.effectAllowed = 'copy';
        dragging = true;
    }

    function onImageBankClick(event) {
        const imgSrcClicked = event.target.getAttribute('src');

        let nomeAlvo = getNomeCurto(elementoAlvoAtual);
        const posAlvo = imagensGrupo.indexOf(elementoAlvoAtual);
        if (posAlvo === pos_I) nomeAlvo += " (Neutro)";
        if (posAlvo === pos_Z) nomeAlvo += " (Zero/Distrator)";
        if (posAlvo === pos_5) nomeAlvo += " (Valor 5)";

        // Lógica da Caçada
        if (imgSrcClicked !== elementoAlvoAtual) {
            if (elementosCompletos.has(imgSrcClicked)) {
                mensagemEl.textContent = "Você já completou esse elemento.";
            } else {
                mensagemEl.textContent = `Alvo errado! Você deve encontrar: ${nomeAlvo}`;
                const imgAlvoEl = document.querySelector(`#lista-imagens img.alvo-ativo`);
                if (imgAlvoEl) {
                    imgAlvoEl.classList.add('shake-animation');
                    setTimeout(() => imgAlvoEl.classList.remove('shake-animation'), 500);
                }
            }
            tocarSom(errorSound); return;
        }

        if (!celulaAtiva) {
            mensagemEl.textContent = "Por favor, clique em uma célula do tabuleiro primeiro.";
            return;
        }
        processarJogada(celulaAtiva.row, celulaAtiva.col, imgSrcClicked);
    }

    function onCanvasClick(event) {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left; const y = event.clientY - rect.top;

        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
            celulaAtiva = null; desenharTabuleiroCompleto(); return;
        }

        const gridX = x - headerPixelSize; const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);

        if (row < tamanhoGrupo && col < tamanhoGrupo) {
            if (celulasPreenchidas.has(`${row},${col}`)) {
                mensagemEl.textContent = "Célula já preenchida corretamente.";
                celulaAtiva = null; desenharTabuleiroCompleto(); return;
            }
            celulaAtiva = { row, col, key: `${row},${col}` };
            mensagemEl.textContent = `Célula [${row + 1}, ${col + 1}] selecionada. Agora clique na imagem alvo.`;
            desenharTabuleiroCompleto();
        }
    }

    // --- REGISTRO DOS EVENT LISTENERS ---
    if (canvas) {
        canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (dragging) {
                const imgSrcDropped = e.dataTransfer.getData('text/plain');
                if (imgSrcDropped) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
                    if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
                        dragging = false; return;
                    }
                    const gridX = x - headerPixelSize; const gridY = y - headerPixelSize;
                    const col = Math.floor(gridX / cellPixelSize);

                    const row = Math.floor(gridY / cellPixelSize);
                    if (row < tamanhoGrupo && col < tamanhoGrupo) {
                        processarJogada(row, col, imgSrcDropped);
                    }
                }
            }
            dragging = false; draggedImgSrc = null;
        });
        canvas.addEventListener('click', onCanvasClick);
    }

    // Botões
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 4; // Default para 4
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
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('configNivelD5.html', '_blank'));

    // --- INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});