document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO JOGO ---
    const listaImagens = document.getElementById('lista-imagens');
    const mensagem = document.getElementById('mensagem');
    const proximoNivelBtn = document.getElementById('proximo-nivel');
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const tabuleiroContainer = document.getElementById('tabuleiro');
    
    // Elementos do Menu e do Nível Médio
    const reiniciarBtn = document.getElementById('resetarTabuleiro');
    const limparBtn = document.getElementById('limparImagem');
    const painelCombinacoes = document.getElementById('painel-combinacoes'); // ID do HTML corrigido
    const listaCombinacoes = document.getElementById('lista-combinacoes');
    const exibirCombinacoesBtn = document.getElementById('exibirCombinacoesBtn'); // ID do HTML corrigido
    
    // Botões adicionais do menu
    const paginaInicialBtn = document.getElementById('paginaInicial');
    const sairDoJogoBtn = document.getElementById('sairDoJogo');
    const imprimirBtn = document.getElementById('BtnImprimir');

    // --- 2. CONFIGURAÇÕES E VARIÁVEIS DE ESTADO ---
    let tamanhoTabuleiro = 2;
    let tabuleiro = {};
    let imageHistory = [];
    let imagensSelecionadas = [];
    let imagensCarregadas = {};
    let combinacoesGeradas = [];
    let cellSize = 0;

    // Lógica de áudio
    let errorSound, clapSound;
    let audioInicializado = false;

    const todasImagens = [
        '../imagens/abelha.png', '../imagens/bispo1.png', '../imagens/bola.jpeg', '../imagens/carro.png', '../imagens/cavalo1.jpeg',
        '../imagens/circulo.png', '../imagens/coração.png', '../imagens/estrela1.jpeg', '../imagens/flor.jpeg', '../imagens/PEAO.png',
        '../imagens/quadrado.png', '../imagens/Rainha5.png', '../imagens/Rei.jpg', '../imagens/torre.jpeg', '../imagens/triangulo.png',
    ];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        tabuleiro = {};
        imageHistory = [];
        
        mensagem.textContent = 'Arraste duas imagens para cada célula para formar uma combinação.';
        proximoNivelBtn.style.display = 'none';
        painelCombinacoes.style.display = 'none';
        exibirCombinacoesBtn.textContent = 'Exibir Combinações';
        reiniciarBtn.disabled = false;
        limparBtn.disabled = false;

        const urlParams = new URLSearchParams(window.location.search);
        tamanhoTabuleiro = parseInt(urlParams.get('tamanhoTabuleiro'), 10) || 2;
        
        embaralharArray(todasImagens);
        imagensSelecionadas = todasImagens.slice(0, tamanhoTabuleiro);
        combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);

        carregarImagens(imagensSelecionadas, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
        });
    }

    function ajustarERedesenharCanvas() {
        if (tabuleiroContainer.clientWidth === 0) {
            setTimeout(ajustarERedesenharCanvas, 100);
            return;
        }
        const containerSize = tabuleiroContainer.clientWidth;
        canvas.width = containerSize;
        canvas.height = containerSize;
        cellSize = canvas.width / tamanhoTabuleiro;
        desenharTabuleiroCompleto();
    }

    function handleDrop(event) {
        event.preventDefault();
        const imgSrc = event.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const col = Math.floor((event.clientX - rect.left) / cellSize);
        const row = Math.floor((event.clientY - rect.top) / cellSize);
        const key = `${row},${col}`;

        if (!tabuleiro[key]) tabuleiro[key] = [];

        if (tabuleiro[key].length >= 2) {
            mensagem.textContent = 'Célula cheia. Tente outra.';
            tocarSom(errorSound);
            return;
        }

        tabuleiro[key].push(imgSrc);
        imageHistory.push({ key });
        desenharTabuleiroCompleto();

        if (tabuleiro[key].length === 2) {
            const combinacaoAtual = tabuleiro[key];
            if (verificarEremoverCombinacao(combinacaoAtual)) {
                if (combinacoesGeradas.length === 0) {
                    mensagem.innerHTML = "<h2>Parabéns!</h2>Você completou o desafio!";
                    proximoNivelBtn.style.display = 'block';
                    reiniciarBtn.disabled = true;
                    limparBtn.disabled = true;
                    tocarSom(clapSound);
                    confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
                }
            } else {
                mensagem.textContent = "Combinação inválida ou já usada!";
                tabuleiro[key] = [];
                imageHistory.pop();
                imageHistory.pop();
                setTimeout(desenharTabuleiroCompleto, 800);
                tocarSom(errorSound);
            }
        }
    }

    // --- 4. FUNÇÕES DE COMBINAÇÃO ---

    function gerarCombinacoes(imagens) {
        const combinacoes = [];
        for (let i = 0; i < imagens.length; i++) {
            for (let j = 0; j < imagens.length; j++) {
                combinacoes.push([imagens[i], imagens[j]]);
            }
        }
        exibirCombinacoes(combinacoes);
        return combinacoes;
    }

    function exibirCombinacoes(combinacoes) {
        listaCombinacoes.innerHTML = '';
        combinacoes.forEach((comb, index) => {
            const divComb = document.createElement('div');
            const img1 = comb[0].split('/').pop().split('.')[0];
            const img2 = comb[1].split('/').pop().split('.')[0];
            divComb.textContent = `${index + 1}: ${img1} + ${img2}`;
            listaCombinacoes.appendChild(divComb);
        });
    }

    function verificarEremoverCombinacao(combinacao) {
        for (let i = 0; i < combinacoesGeradas.length; i++) {
            let comb = combinacoesGeradas[i];
            if ((comb[0] === combinacao[0] && comb[1] === combinacao[1]) ||
                (comb[0] === combinacao[1] && comb[1] === combinacao[0])) {
                combinacoesGeradas.splice(i, 1);
                exibirCombinacoes(combinacoesGeradas);
                return true;
            }
        }
        return false;
    }

    // --- 5. FUNÇÕES AUXILIARES ---

    function desenharTabuleiroCompleto() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        for (let row = 0; row < tamanhoTabuleiro; row++) {
            for (let col = 0; col < tamanhoTabuleiro; col++) {
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
                const key = `${row},${col}`;
                if (tabuleiro[key] && tabuleiro[key].length > 0) {
                    tabuleiro[key].forEach((imgSrc, index) => {
                        const img = imagensCarregadas[imgSrc];
                        if (img) {
                            const padding = cellSize * 0.1;
                            const imgWidth = (cellSize - padding * 3) / 2;
                            const imgHeight = cellSize - padding * 2;
                            const x = col * cellSize + padding + (index * (imgWidth + padding));
                            const y = row * cellSize + padding;
                            ctx.drawImage(img, x, y, imgWidth, imgHeight);
                        }
                    });
                }
            }
        }
    }

    function carregarImagens(imagens, callback) {
        let carregadas = {};
        let restantes = imagens.length;
        listaImagens.innerHTML = '';
        imagens.forEach((imgSrc) => {
            let img = new Image();
            img.src = imgSrc;
            img.id = imgSrc;
            img.draggable = true;
            img.addEventListener('dragstart', (e) => {
                inicializarAudio();
                e.dataTransfer.setData('text/plain', e.target.id);
            });
            img.onload = () => {
                listaImagens.appendChild(img);
                carregadas[imgSrc] = img;
                restantes--;
                if (restantes === 0) callback(carregadas);
            };
        });
    }

    function limparUltimaJogada() {
        if (imageHistory.length > 0) {
            const lastMove = imageHistory.pop();
            if (tabuleiro[lastMove.key] && tabuleiro[lastMove.key].length > 0) {
                tabuleiro[lastMove.key].pop();
            }
            desenharTabuleiroCompleto();
            mensagem.textContent = "Última jogada desfeita.";
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
            errorSound = new Audio('../sons/Erro.mp3');
            clapSound = new Audio('../sons/Aplausos.mp3');
            audioInicializado = true;
        }
    }

    function tocarSom(som) {
        if (som) {
            som.currentTime = 0;
            som.play().catch(e => console.error("Erro ao tocar áudio:", e));
        }
    }

    // --- 6. REGISTRO DE EVENTOS ---
    canvas.addEventListener('dragover', (e) => e.preventDefault());
    canvas.addEventListener('drop', handleDrop);
    window.addEventListener('resize', ajustarERedesenharCanvas);
    reiniciarBtn.addEventListener('click', iniciarJogo);
    limparBtn.addEventListener('click', limparUltimaJogada);

    exibirCombinacoesBtn.addEventListener('click', () => {
        if (painelCombinacoes) {
            const isHidden = painelCombinacoes.style.display === 'none';
            painelCombinacoes.style.display = isHidden ? 'flex' : 'none'; // Usa flex para consistência
            exibirCombinacoesBtn.textContent = isHidden ? 'Ocultar Combinações' : 'Exibir Combinações';
        }
    });
    
    paginaInicialBtn.addEventListener('click', () => {
        window.open('../index.html', '_self');
    });
    
    sairDoJogoBtn.addEventListener('click', () => {
        window.open('https://www.google.com.br', '_blank');
    });

    proximoNivelBtn.addEventListener('click', () => {
        const proximoTamanho = tamanhoTabuleiro + 1;
        window.open(`NivelM2.html?tamanhoTabuleiro=${proximoTamanho}`, '_self');
    });

    imprimirBtn.addEventListener('click', () => {
        window.open('imprimir.html', '_blank');
    });

    // --- 7. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});