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
    const painelCombinacoes = document.getElementById('painel-combinacoes');
    const listaCombinacoes = document.getElementById('lista-combinacoes');
    const exibirCombinacoesBtn = document.getElementById('exibirCombinacoesBtn');
    
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
        "../imagens/abelha.png", "../imagens/abelha0.png", "../imagens/abelha1.png", "../imagens/aguia.png",
        "../imagens/antena.png", "../imagens/aranha.jpeg", "../imagens/atomo.png", "../imagens/BALA.png",
        "../imagens/balao.png", "../imagens/bispo1.png", "../imagens/bola.jpeg", "../imagens/boliche.png",
        "../imagens/bolo.png", "../imagens/boneca.png", "../imagens/borboleta.png", "../imagens/carro.jpeg",
        "../imagens/carro.png", "../imagens/carro0.png", "../imagens/casa.png", "../imagens/cavalo.jpeg",
        "../imagens/cavalo1.jpeg", "../imagens/chapeu1.png", "../imagens/chapeu2.png", "../imagens/chapeu3.png",
        "../imagens/chinelo.png", "../imagens/circulo.png", "../imagens/coração.png", "../imagens/coroa.png",
        "../imagens/dado.png", "../imagens/esfera.png", "../imagens/estrela.jpeg", "../imagens/estrela1.jpeg",
        "../imagens/fantasma.png", "../imagens/flor.jpeg", "../imagens/flor1.PNG", "../imagens/florLis.png",
        "../imagens/florLis3.png", "../imagens/mais.png", "../imagens/nuvem.png", "../imagens/PEAO.png",
        "../imagens/pentagono.png", "../imagens/pentagono1.png", "../imagens/pinguim.png", "../imagens/piramide.jpg",
        "../imagens/piramide2.png", "../imagens/prisma.png", "../imagens/quadrado.png", "../imagens/Rainha5.png",
        "../imagens/rainha6.png", "../imagens/Rei.jpg", "../imagens/rosa.png", "../imagens/saco.png",
        "../imagens/solido.png", "../imagens/solido1.png", "../imagens/terra.png", "../imagens/torre.jpeg",
        "../imagens/triangulo.png", "../imagens/tv.png", "../imagens/varrer.png"
    ];

    // --- 3. FUNÇÕES PRINCIPAIS E LÓGICA DO JOGO ---

    function iniciarJogo() {
        tabuleiro = {};
        imageHistory = [];
        
        mensagem.textContent = 'Arraste duas imagens para cada célula para formar uma combinação.';
        if (proximoNivelBtn) proximoNivelBtn.style.display = 'none';
        if (painelCombinacoes) painelCombinacoes.style.display = 'none';
        if (exibirCombinacoesBtn) exibirCombinacoesBtn.textContent = 'Exibir Combinações';
        if (reiniciarBtn) reiniciarBtn.disabled = false;
        if (limparBtn) limparBtn.disabled = false;

        const urlParams = new URLSearchParams(window.location.search);
        tamanhoTabuleiro = parseInt(urlParams.get('tamanhoTabuleiro'), 10) || 2;
        
        const imagensParaEmbaralhar = [...todasImagens];
        embaralharArray(imagensParaEmbaralhar);
        imagensSelecionadas = imagensParaEmbaralhar.slice(0, tamanhoTabuleiro);
        
        combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);

        carregarImagens(imagensSelecionadas, (loadedImgs) => {
            imagensCarregadas = loadedImgs;
            ajustarERedesenharCanvas();
        });
    }

    function ajustarERedesenharCanvas() {
        if (!tabuleiroContainer || tabuleiroContainer.clientWidth === 0) {
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
        inicializarAudio();
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
                    if (proximoNivelBtn) proximoNivelBtn.style.display = 'block';
                    if (reiniciarBtn) reiniciarBtn.disabled = true;
                    if (limparBtn) limparBtn.disabled = true;
                    tocarSom(clapSound);
                    if (typeof confetti === 'function') {
                        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, zIndex: 9999 });
                    }
                }
            } else {
                mensagem.textContent = "Combinação inválida ou já usada!";
                tabuleiro[key] = [];
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
        if (!listaCombinacoes) return;
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
            
            // --- ALTERAÇÃO: Lógica de verificação de combinação ajustada ---
            // Removemos a verificação da ordem inversa. Agora, a combinação do jogador
            // deve corresponder EXATAMENTE à ordem da combinação gerada.
            // Isso faz com que [A, B] seja diferente de [B, A].
            if (comb[0] === combinacao[0] && comb[1] === combinacao[1]) {
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
        if (!listaImagens) return;
        listaImagens.innerHTML = '';
        imagens.forEach((imgSrc) => {
            let img = new Image();
            img.src = imgSrc;
            img.id = imgSrc;
            img.draggable = true;
            img.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.id);
            });
            img.onload = () => {
                listaImagens.appendChild(img);
                carregadas[imgSrc] = img;
                restantes--;
                if (restantes === 0) callback(carregadas);
            };
            img.onerror = () => {
                console.error(`Falha ao carregar a imagem: ${imgSrc}`);
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
            try {
                errorSound = new Audio('../sons/Erro.mp3');
                clapSound = new Audio('../sons/Aplausos.mp3');
                audioInicializado = true;
            } catch (e) {
                console.error("Erro ao inicializar o áudio:", e);
            }
        }
    }

    function tocarSom(som) {
        if (som && audioInicializado) {
            som.currentTime = 0;
            som.play().catch(e => console.error("Erro ao tocar áudio:", e));
        }
    }

    if (canvas) {
        canvas.addEventListener('dragover', (e) => e.preventDefault());
        canvas.addEventListener('drop', handleDrop);
    }
    window.addEventListener('resize', ajustarERedesenharCanvas);

    if (reiniciarBtn) {
        reiniciarBtn.addEventListener('click', iniciarJogo);
    }
    if (limparBtn) {
        limparBtn.addEventListener('click', limparUltimaJogada);
    }

    // --- LÓGICA AJUSTADA E CORRETA PARA O SEU HTML ---
    if (exibirCombinacoesBtn) {
        exibirCombinacoesBtn.addEventListener('click', () => {
            // A lógica mira diretamente na lista, como solicitado.
            if (listaCombinacoes) {
                const isHidden = listaCombinacoes.style.display === 'none' || listaCombinacoes.style.display === '';
                
                // Altera apenas a visibilidade da lista
                listaCombinacoes.style.display = isHidden ? 'block' : 'none';
                
                // Altera o texto do botão
                exibirCombinacoesBtn.textContent = isHidden ? 'Ocultar Combinações' : 'Exibir Combinações';
            }
        });
    }

    if (paginaInicialBtn) {
        paginaInicialBtn.addEventListener('click', () => {
            window.open('../index.html', '_self');
        });
    }
    if (sairDoJogoBtn) {
        sairDoJogoBtn.addEventListener('click', () => {
            window.open('https://www.google.com.br', '_blank');
        });
    }
    if (proximoNivelBtn) {
        proximoNivelBtn.addEventListener('click', () => {
            const proximoTamanho = tamanhoTabuleiro + 1;
            window.open(`NivelM2.html?tamanhoTabuleiro=${proximoTamanho}`, '_self');
        });
    }
    if (imprimirBtn) {
        imprimirBtn.addEventListener('click', () => {
            window.open('imprimir.html', '_blank');
        });
    }

    // --- 7. INICIALIZAÇÃO DO JOGO ---
    iniciarJogo();
});