document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagensEl = document.getElementById('lista-imagens');
    const mensagemEl = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel'); // Ou botão de conclusão
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');

    // Elementos do Menu (Adaptar se necessário)
    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem'); // Pode precisar de lógica diferente
    // Remover elementos do Modal se não forem mais usados (exibirCombinacoesBtn, etc.)

    // Botões adicionais
    const paginaInicialBtn = document.getElementById('paginaInicial');
    const sairDoJogoBtn = document.getElementById('sairDoJogo');
    // const imprimirBtn = document.getElementById('BtnImprimir'); // Manter se aplicável

    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    let tamanhoGrupo = 2; // n (ordem do grupo)
    let tabuleiro = {}; // Armazena a imagem colocada: { "row,col": imgSrc }
    let history = []; // Simplificado para { key: "row,col", imgSrc: imgSrc }
    let imagensGrupo = []; // Array ORDENADO das n imagens/elementos do grupo
    let imagensParaArrastar = []; // Imagens disponíveis para drag (pode ser embaralhado)
    let imagensCarregadas = {}; // Cache { imgSrc: ImageObject }
    let tabelaCayleyCorreta = []; // Matriz n x n com os imgSrc corretos esperados
    let celulasCorretas = 0; // Contador para verificar conclusão

    // Armazena as identidades originais
    let identidadeAditivaSrc = null;
    let identidadeMultiplicativaSrc = null;

    // Constantes visuais (ajustar conforme necessário)
    const HEADER_SIZE_RATIO = 0.15; // Proporção do canvas para cabeçalhos
    let headerPixelSize = 0; // Tamanho do cabeçalho em pixels
    let gridPixelSize = 0; // Tamanho da área da grade em pixels
    let cellPixelSize = 0; // Tamanho de cada célula da grade

    // D&D Unificado
    let isDragging = false;
    let draggedItemSrc = null;
    let ghostImage = null;

    // Áudio
    let errorSound, clapSound;
    let audioInicializado = false;

    const todasImagens = [ /* ... Sua lista completa de imagens ... */];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        tabuleiro = {};
        history = [];
        celulasCorretas = 0;

        mensagemEl.textContent = 'Arraste a imagem resultado para a célula correta da Tábua de Cayley.';
        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';

        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false; // Habilitar botão de limpar

        // Determina o tamanho do grupo (ordem n)
        const urlParams = new URLSearchParams(window.location.search);
        tamanhoGrupo = parseInt(urlParams.get('tamanhoGrupo'), 10) || 2; // Usar 'tamanhoGrupo'

        // Seleciona n imagens
        const imagensSelecionadasOriginal = selecionarImagensUnicas(tamanhoGrupo);
        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = "Erro: Não há imagens suficientes para este nível.";
            return; // Impede a continuação
        }

        // *** ARMAZENA IDENTIDADES ANTES DE QUALQUER EMBARALHAMENTO ***
        identidadeAditivaSrc = imagensSelecionadasOriginal[0];
        identidadeMultiplicativaSrc = imagensSelecionadasOriginal[1]; // Assume n >= 2

        // Define a ORDEM CANÔNICA dos elementos do grupo para a tabela
        imagensGrupo = [...imagensSelecionadasOriginal]; // Usar a ordem original selecionada

        // Define as imagens que o jogador pode arrastar (pode ser a mesma ordem ou embaralhada)
        imagensParaArrastar = [...imagensGrupo];
        // embaralharArray(imagensParaArrastar); // Descomente para embaralhar a lista de arrastar

        // *** GERA A TABELA DE CAYLEY CORRETA (Exemplo: Adição mod n) ***
        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo);

        // Carrega imagens e desenha o tabuleiro inicial
        const todasImagensNecessarias = [...imagensParaArrastar]; // Carrega apenas as de arrastar
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            // Carrega também as imagens dos cabeçalhos se forem diferentes
            imagensGrupo.forEach(src => {
                if (!imagensCarregadas[src]) {
                    let img = new Image();
                    img.src = src;
                    img.onload = () => imagensCarregadas[src] = img;
                }
            });
            ajustarERedesenharCanvas();
        });
    }

    // Função para selecionar n imagens únicas (melhor que slice se precisar garantir unicidade)
    function selecionarImagensUnicas(n) {
        const selecionadas = [];
        const copiaImagens = [...todasImagens]; // Copia para não modificar original
        embaralharArray(copiaImagens); // Embaralha a cópia
        // Pega as primeiras n imagens da cópia embaralhada
        for (let i = 0; i < n && i < copiaImagens.length; i++) {
            selecionadas.push(copiaImagens[i]);
        }
        return selecionadas; // Retorna as imagens selecionadas na ordem em que foram pegas
    }


    // *** NOVA FUNÇÃO: Gera a Tabela de Cayley ***
    function gerarTabelaCayley(elementos) {
        const n = elementos.length;
        const tabela = [];
        console.log("Gerando Tabela de Cayley para elementos:", elementos); // Log
        for (let i = 0; i < n; i++) { // Linha i
            tabela[i] = [];
            for (let j = 0; j < n; j++) { // Coluna j
                // *** IMPLEMENTA A OPERAÇÃO DO GRUPO AQUI ***
                // Exemplo: Adição Modular n baseada nos ÍNDICES
                const resultadoIndex = (i + j) % n;
                tabela[i][j] = elementos[resultadoIndex]; // Armazena o imgSrc do resultado
                // console.log(`Tabela[${i}][${j}] (${elementos[i]} + ${elementos[j]}) = ${elementos[resultadoIndex]}`); // Log detalhado
            }
        }
        console.log("Tabela de Cayley Gerada:", tabela); // Log
        return tabela;
    }

    // Ajusta Canvas e calcula tamanhos para grid + headers
    function ajustarERedesenharCanvas() {
        if (!tabuleiroContainer || !canvas || tabuleiroContainer.clientWidth === 0 || tabuleiroContainer.clientHeight === 0) {
            requestAnimationFrame(ajustarERedesenharCanvas);
            return;
        }
        // Canvas preenche o contêiner (que deve ser quadrado 1:1 pelo CSS)
        canvas.width = tabuleiroContainer.clientWidth;
        canvas.height = tabuleiroContainer.clientHeight;

        // Calcula tamanhos para headers e grid
        // Deixa uma faixa no topo e na esquerda para headers
        headerPixelSize = canvas.width * HEADER_SIZE_RATIO;
        gridPixelSize = canvas.width - headerPixelSize; // Área quadrada restante
        cellPixelSize = gridPixelSize / tamanhoGrupo; // Tamanho de cada célula na grade

        desenharTabuleiroCompleto();
    }

    // Processa o drop de UMA imagem na célula
    function processarDrop(clientX, clientY, imgSrcDropped) {
        inicializarAudio();
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Verifica se o drop foi DENTRO da área da GRADE (não nos headers)
        if (x < headerPixelSize || x > canvas.width || y < headerPixelSize || y > canvas.height) {
            return; // Drop fora da grade
        }

        // Calcula a célula na GRADE (ajustando pelas coordenadas do header)
        const gridX = x - headerPixelSize;
        const gridY = y - headerPixelSize;
        const col = Math.floor(gridX / cellPixelSize);
        const row = Math.floor(gridY / cellPixelSize);
        const key = `${row},${col}`;

        // Verifica validade da célula
        if (row >= tamanhoGrupo || col >= tamanhoGrupo) return;

        // Verifica se a célula já está preenchida CORRETAMENTE
        if (tabuleiro[key] && tabuleiro[key] === tabelaCayleyCorreta[row][col]) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            return; // Não permite substituir acerto
        }
        // Verifica se a célula está preenchida (mesmo que incorretamente) - permite sobrescrever erro
        if (tabuleiro[key]) {
            // Remove a entrada anterior do histórico se for sobrescrever
            history = history.filter(move => move.key !== key);
        }


        // *** VERIFICA SE A IMAGEM SOLTA É A CORRETA PARA ESTA CÉLULA ***
        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        if (imgSrcDropped === expectedImgSrc) {
            // *** CORRETO ***
            const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc; // Verifica se já não estava certo antes (caso sobrescreva erro)

            tabuleiro[key] = imgSrcDropped; // Marca a célula como correta
            history.push({ key: key, imgSrc: imgSrcDropped }); // Adiciona ao histórico

            if (!jaEstavaCorreto) { // Incrementa contador apenas se era um novo acerto
                celulasCorretas++;
            }

            mensagemEl.textContent = `Correto! (${imagensGrupo[row].split('/').pop().split('.')[0]} * ${imagensGrupo[col].split('/').pop().split('.')[0]})`; // Mostra operação (nomes curtos)


            // Verifica se completou o jogo
            if (celulasCorretas === tamanhoGrupo * tamanhoGrupo) {
                mensagemEl.innerHTML = "<h2>Parabéns!</h2> Tábua de Cayley completa!";
                if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                // if (imprimirBtn) imprimirBtn.style.display = 'block'; // Habilitar se quiser imprimir
                if (reiniciarBtn) reiniciarBtn.disabled = true;
                if (limparBtn) limparBtn.disabled = true;
                tocarSom(clapSound);
                if (typeof confetti === 'function') confetti({ /* ... */ });
            }
        } else {
            // *** INCORRETO ***
            mensagemEl.textContent = `Incorreto para a célula (${row}, ${col}). Tente novamente.`;
            tocarSom(errorSound);
            // Limpa a célula no tabuleiro se estava preenchida com erro
            if (tabuleiro[key]) {
                delete tabuleiro[key];
                history = history.filter(move => move.key !== key); // Remove do histórico
            }
            // Redesenha IMEDIATAMENTE para mostrar o erro (ou célula vazia)
            // Não precisa de timeout aqui, a imagem incorreta simplesmente não fica
        }
        desenharTabuleiroCompleto(); // Redesenha em ambos os casos (acerto ou erro)
    }

    // --- FUNÇÕES AUXILIARES ---

    // *** MODIFICADA: Desenha grid, headers e UMA imagem por célula ***
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#AAA'; // Linha mais clara para headers
        ctx.lineWidth = 1;
        ctx.font = `${headerPixelSize * 0.3}px Arial`; // Tamanho da fonte para headers
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 1. Desenha Cabeçalhos (Linha e Coluna)
        for (let i = 0; i < tamanhoGrupo; i++) {
            const headerImgSrc = imagensGrupo[i]; // Usa a ordem canônica
            const img = imagensCarregadas[headerImgSrc];
            const headerX = headerPixelSize / 2; // Centro X do header da linha
            const headerYCol = headerPixelSize / 2; // Centro Y do header da coluna
            const cellCenterX = headerPixelSize + (i * cellPixelSize) + (cellPixelSize / 2); // Centro X da célula da coluna i
            const cellCenterY = headerPixelSize + (i * cellPixelSize) + (cellPixelSize / 2); // Centro Y da célula da linha i

            // Desenha imagem do header da LINHA i (na esquerda)
            if (img) {
                drawImageMaintainAspect(ctx, img, 0, headerPixelSize + i * cellPixelSize, headerPixelSize, cellPixelSize);
            } else {
                ctx.fillText('?', headerX, cellCenterY); // Fallback se imagem não carregou
            }
            // Desenha borda header linha
            ctx.strokeRect(0, headerPixelSize + i * cellPixelSize, headerPixelSize, cellPixelSize);


            // Desenha imagem do header da COLUNA i (no topo)
            if (img) {
                drawImageMaintainAspect(ctx, img, headerPixelSize + i * cellPixelSize, 0, cellPixelSize, headerPixelSize);
            } else {
                ctx.fillText('?', cellCenterX, headerYCol); // Fallback
            }
            // Desenha borda header coluna
            ctx.strokeRect(headerPixelSize + i * cellPixelSize, 0, cellPixelSize, headerPixelSize);
        }
        // Desenha canto superior esquerdo (opcionalmente com símbolo da operação)
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillText('+', headerPixelSize / 2, headerPixelSize / 2); // Símbolo da operação (Ex: '+')


        // 2. Desenha a Grade Principal e Imagens Colocadas
        ctx.strokeStyle = '#333'; // Linha mais escura para grid
        ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) {
            for (let col = 0; col < tamanhoGrupo; col++) {
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;

                // Desenha a borda da célula
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize);

                // Desenha a imagem SOLTA pelo jogador (se houver)
                const key = `${row},${col}`;
                const imgSrcInCell = tabuleiro[key];
                if (imgSrcInCell) {
                    const img = imagensCarregadas[imgSrcInCell];
                    if (img) {
                        // Define o 'box' como a própria célula para desenhar a imagem dentro
                        drawImageMaintainAspect(ctx, img, cellX, cellY, cellPixelSize, cellPixelSize);
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
        listaImagensEl.innerHTML = ''; // Limpa lista

        imagens.forEach((imgSrc) => {
            // Reutiliza imagem carregada se já existir (ex: headers)
            if (imagensCarregadas[imgSrc]) {
                // Adiciona listeners à imagem já existente no cache
                let img = imagensCarregadas[imgSrc];
                if (!img.dataset.listenerAdded) { // Evita adicionar listeners múltiplos
                    img.id = imgSrc;
                    img.addEventListener('mousedown', onDragStart);
                    img.addEventListener('touchstart', onDragStart, { passive: true });
                    img.dataset.listenerAdded = "true"; // Marca que adicionou listener
                }
                if (!listaImagensEl.contains(img)) { // Adiciona à lista visual se ainda não estiver
                    listaImagensEl.appendChild(img);
                }
                restantes--; // Conta como "carregada"
            } else {
                // Cria e carrega nova imagem
                let img = new Image();
                img.src = imgSrc;
                img.id = imgSrc; // Usa SRC como ID
                img.dataset.listenerAdded = "true"; // Marca que adicionou listener

                img.addEventListener('mousedown', onDragStart);
                img.addEventListener('touchstart', onDragStart, { passive: true });

                img.onload = () => {
                    listaImagensEl.appendChild(img);
                    carregadas[imgSrc] = img; // Adiciona ao cache local desta chamada
                    imagensCarregadas[imgSrc] = img; // Adiciona ao cache GLOBAL
                    restantes--;
                    if (restantes === 0) callback(carregadas);
                };
                img.onerror = () => {
                    console.error(`Falha ao carregar: ${imgSrc}`);
                    restantes--;
                    if (restantes === 0) callback(carregadas);
                };
            }

        });
        // Chama callback imediatamente se todas já estavam no cache global
        if (restantes <= 0) callback(carregadas);
    }


    // *** MODIFICADA: Limpa a ÚLTIMA célula preenchida (correta ou incorreta) ***
    function limparUltimaJogada() {
        if (history.length > 0) {
            const lastMove = history.pop(); // Pega a última ação { key: "r,c", imgSrc: "..." }
            const key = lastMove.key;
            const imgSrcRemoved = lastMove.imgSrc; // Imagem que foi removida

            // Verifica se a imagem removida era a correta para decrementar o contador
            const [row, col] = key.split(',').map(Number);
            if (imgSrcRemoved === tabelaCayleyCorreta[row][col]) {
                celulasCorretas--; // Decrementa acertos
            }

            // Remove a imagem do tabuleiro
            delete tabuleiro[key];

            desenharTabuleiroCompleto();
            mensagemEl.textContent = "Última jogada desfeita.";

            // Reabilita botões se o jogo estava completo
            if (reiniciarBtn) reiniciarBtn.disabled = false;
            if (limparBtn) limparBtn.disabled = false;
            if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
            // if (imprimirBtn) imprimirBtn.style.display = 'none';

        } else {
            mensagemEl.textContent = "Nenhuma jogada para limpar.";
        }
    }

    function embaralharArray(array) { /* ... (Implementação Fisher-Yates) ... */ }
    function inicializarAudio() { /* ... (Implementação com try/catch) ... */ }
    function tocarSom(som) { /* ... (Implementação com verificação) ... */ }

    // --- 6. EVENT LISTENERS D&D UNIFICADO ---
    function onDragStart(event) { /* ... (Sem alterações) ... */ }
    function onDragMove(event) { /* ... (Sem alterações) ... */ }
    function onDragEnd(event) { /* ... (Sem alterações) ... */ }

    // --- 7. REGISTRO DOS EVENT LISTENERS RESTANTES ---
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    // REMOVIDO: Lógica do Modal

    // Botões de Navegação (Ajustar lógica de próximo nível se necessário)
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('../index.html', '_self'));
    if (sairDoJogoBtn) sairDoJogoBtn.addEventListener('click', () => window.open('https://www.google.com.br', '_blank'));
    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            // Lógica para determinar o próximo nível da Fase D (D2, D3...) ou ir para outra fase
            const nivelAtualMatch = document.location.pathname.match(/NivelD(\d+)/);
            const nivelAtual = nivelAtualMatch ? parseInt(nivelAtualMatch[1]) : 1;
            const proximoNivelNum = nivelAtual + 1;
            const proximoTamanhoGrupo = tamanhoGrupo + 1; // Ex: Aumenta a ordem do grupo

            // Defina o limite de níveis D (ex: D4 com tamanho 5)
            if (proximoNivelNum > 4) {
                window.open('../index.html', '_self'); // Volta para o início
            } else {
                const proximoNivelHtml = `NivelD${proximoNivelNum}.html`;
                window.open(`${proximoNivelHtml}?tamanhoGrupo=${proximoTamanhoGrupo}`, '_self');
            }
        });
    }
    // if (imprimirBtn) imprimirBtn.addEventListener('click', () => window.open('ImpTabD.html', '_blank')); // Página de impressão Nível D

    // --- 8. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});