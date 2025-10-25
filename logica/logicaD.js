document.addEventListener('DOMContentLoaded', function () {

    // ... (Seleção de elementos, Variáveis de Estado - tamanhoGrupo = 6, etc.) ...
    const todasImagens = [ /* ... Sua lista completa ... */];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        // ... (Reset de tabuleiro, history, celulasCorretas, etc.) ...
        tamanhoGrupo = 6; // Garante que é 6

        mensagemEl.textContent = 'Arraste a imagem resultado para a célula correta da Tábua de Cayley 6x6 (operação: índice_linha + índice_coluna mod 6).';

        // ... (Seleção de imagens, definição de imagensGrupo, imagensParaArrastar) ...
        const imagensSelecionadasOriginal = selecionarImagensUnicas(tamanhoGrupo);
        if (imagensSelecionadasOriginal.length < tamanhoGrupo) {
            mensagemEl.textContent = `Erro: São necessárias ${tamanhoGrupo} imagens únicas. Encontradas: ${imagensSelecionadasOriginal.length}.`;
            // ... (Desabilitar botões) ...
            return;
        }
        identidadeAditivaSrc = imagensSelecionadasOriginal[0];
        identidadeMultiplicativaSrc = imagensSelecionadasOriginal[1];
        imagensGrupo = [...imagensSelecionadasOriginal];
        imagensParaArrastar = [...imagensGrupo];
        // embaralharArray(imagensParaArrastar); // Opcional

        tabelaCayleyCorreta = gerarTabelaCayley(imagensGrupo); // Confirma que usa (i+j)%n

        // ... (Carregamento de imagens e chamada inicial de desenho) ...
        const todasImagensNecessarias = [...new Set([...imagensParaArrastar, ...imagensGrupo])];
        carregarImagens(todasImagensNecessarias, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
        });
    }

    function selecionarImagensUnicas(n) { /* ... (Implementação mantida) ... */ }

    // Confirma que a operação é adição de índices mod n
    function gerarTabelaCayley(elementos) {
        const n = elementos.length; // Será 6
        const tabela = [];
        console.log("Gerando Tabela de Cayley 6x6 (Adição Mod 6) para:", elementos);
        for (let i = 0; i < n; i++) {
            tabela[i] = [];
            for (let j = 0; j < n; j++) {
                const resultadoIndex = (i + j) % n; // Operação de adição de índice mod n
                tabela[i][j] = elementos[resultadoIndex]; // Armazena o imgSrc do resultado
            }
        }
        console.log("Tabela Gerada:", tabela);
        return tabela;
    }

    function ajustarERedesenharCanvas() { /* ... (Implementação mantida) ... */ }

    // *** LÓGICA DE VERIFICAÇÃO E FEEDBACK AJUSTADA ***
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

        if (row >= tamanhoGrupo || col >= tamanhoGrupo) return;

        const expectedImgSrc = tabelaCayleyCorreta[row][col];
        const jaEstavaCorreto = tabuleiro[key] === expectedImgSrc;

        if (jaEstavaCorreto) {
            mensagemEl.textContent = "Célula já preenchida corretamente.";
            return; // Não faz nada se já estava certo
        }

        // Limpa histórico se for sobrescrever um erro anterior na mesma célula
        if (tabuleiro[key] && !jaEstavaCorreto) {
            history = history.filter(move => move.key !== key);
        }

        // Verifica se a imagem solta é a correta
        if (imgSrcDropped === expectedImgSrc) { // <<< CORRETO >>>
            tabuleiro[key] = imgSrcDropped; // Armazena a imagem correta no tabuleiro lógico
            history.push({ key: key, imgSrc: imgSrcDropped });
            celulasCorretas++;

            // --- GERA MENSAGEM DE FEEDBACK DETALHADA ---
            const indiceResultado = (row + col) % tamanhoGrupo;
            let nomeLinha = `Elem ${row}`; // Fallback
            let nomeColuna = `Elem ${col}`; // Fallback
            let nomeResultado = `Elem ${indiceResultado}`; // Fallback
            try { // Tenta pegar nomes curtos dos arquivos
                nomeLinha = imagensGrupo[row].split('/').pop().split('.')[0] || nomeLinha;
                nomeColuna = imagensGrupo[col].split('/').pop().split('.')[0] || nomeColuna;
                nomeResultado = imagensGrupo[indiceResultado].split('/').pop().split('.')[0] || nomeResultado;
            } catch { }
            // Exibe: "Figura_Linha + Figura_Coluna = Figura_Resultado" (nomes curtos)
            mensagemEl.textContent = `Correto! ${nomeLinha} + ${nomeColuna} = ${nomeResultado}`;
            // Ou, se preferir focar nos índices:
            // mensagemEl.textContent = `Correto! Elem[${row}] + Elem[${col}] = Elem[${indiceResultado}]`;
            // --- FIM DA GERAÇÃO DA MENSAGEM ---

            if (celulasCorretas === tamanhoGrupo * tamanhoGrupo) { // Completou 36 células
                // ... (Lógica de fim de jogo: mensagem, confetti, botões) ...
                mensagemEl.innerHTML = `<h2>Parabéns!</h2> Tábua de Cayley 6x6 completa!<br>(${nomeLinha} + ${nomeColuna} = ${nomeResultado})`;
                if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                if (reiniciarBtn) reiniciarBtn.disabled = true;
                if (limparBtn) limparBtn.disabled = true;
                tocarSom(clapSound);
                if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
            }
        } else { // <<< INCORRETO >>>
            mensagemEl.textContent = `Incorreto para a célula (${row + 1}, ${col + 1}). O resultado de ${row} + ${col} (mod 6) não é essa imagem.`;
            tocarSom(errorSound);
            // Limpa a célula lógica APENAS se ela continha um erro anterior
            if (tabuleiro[key] && !jaEstavaCorreto) {
                delete tabuleiro[key];
                // History já foi filtrado acima
            }
            // A imagem incorreta não será desenhada
        }
        desenharTabuleiroCompleto(); // Redesenha para mostrar o acerto ou limpar o erro
    }

    // --- 5. FUNÇÕES AUXILIARES ---

    function drawImageMaintainAspect(ctx, img, x, y, w, h) { /* ... (Implementação mantida) ... */ }

    // Desenha tabuleiro lendo APENAS do objeto 'tabuleiro' (que só tem acertos)
    function desenharTabuleiroCompleto() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#AAA'; ctx.lineWidth = 1;
        ctx.font = `${Math.max(10, headerPixelSize * 0.3)}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        // Desenha Cabeçalhos (6 Headers)
        for (let i = 0; i < tamanhoGrupo; i++) { /* ... (Lógica mantida) ... */ }
        ctx.strokeRect(0, 0, headerPixelSize, headerPixelSize);
        ctx.fillText('+', headerPixelSize / 2, headerPixelSize / 2); // Operação

        // Desenha Grid (6x6) e Imagens CORRETAS já colocadas
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoGrupo; row++) {
            for (let col = 0; col < tamanhoGrupo; col++) {
                const cellX = headerPixelSize + col * cellPixelSize;
                const cellY = headerPixelSize + row * cellPixelSize;
                ctx.strokeRect(cellX, cellY, cellPixelSize, cellPixelSize); // Borda

                // --- Pega a imagem do objeto 'tabuleiro' (SÓ TEM ACERTOS) ---
                const key = `${row},${col}`;
                const imgSrcInCell = tabuleiro[key]; // Pega a imagem CORRETA se existir
                // ---
                if (imgSrcInCell) {
                    const img = imagensCarregadas[imgSrcInCell];
                    if (img) {
                        drawImageMaintainAspect(ctx, img, cellX, cellY, cellPixelSize, cellPixelSize);
                    }
                }
            }
        }
    }

    function carregarImagens(imagens, callback) { /* ... (Implementação mantida) ... */ }
    function limparUltimaJogada() { /* ... (Implementação mantida - já decrementa corretas) ... */ }
    function embaralharArray(array) { /* ... (Implementação mantida) ... */ }
    function inicializarAudio() { /* ... (Implementação mantida) ... */ }
    function tocarSom(som) { /* ... (Implementação mantida) ... */ }

    // --- 6. EVENT LISTENERS D&D UNIFICADO ---
    function onDragStart(event) { /* ... (Implementação mantida) ... */ }
    function onDragMove(event) { /* ... (Implementação mantida) ... */ }
    function onDragEnd(event) { /* ... (Implementação mantida) ... */ }

    // --- 7. REGISTRO DOS EVENT LISTENERS RESTANTES ---
    window.addEventListener('resize', ajustarERedesenharCanvas);
    if (reiniciarBtn) reiniciarBtn.addEventListener('click', iniciarJogo);
    if (limparBtn) limparBtn.addEventListener('click', limparUltimaJogada);

    // Botões de Navegação (Próximo Nível volta ao início)
    if (paginaInicialBtn) paginaInicialBtn.addEventListener('click', () => window.open('../instrucao3.html', '_self'));
    
    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            window.open('../NivelD1.html', '_self');
        });
    }
    
    // --- 8. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});