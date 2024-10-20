const diretorioImagens = 'imagens';
const tamanhoTabuleiro = 4;
const cellSize = 100;
let tabuleiro = {};
let combinacoesRestantes = new Map();
let mensagemErro = "";

// Função para buscar imagens
function buscarImagens(diretorio) {
    // Simula a busca das imagens na pasta
    const formatosSuportados = ['.png', '.jpg', '.jpeg'];
    const todasImagens = [
        'abelha.jpeg', 'bispo.jpeg', 'bola.jpeg', 'carro.jpeg', 'cavalo.jpeg',
        'circulo.jpeg', 'coração.png', 'estrela.jpeg', 'flor.jpeg', 'peao.jpeg',
        'quadrado.jpeg', 'Rainha.jpeg', 'Rei.jpeg', 'torre.jpeg', 'triangulo.jpeg'
    ]; // Exemplo de imagens retornadas
    return todasImagens.slice(0, tamanhoTabuleiro); // Ajusta a quantidade de imagens ao tamanho do tabuleiro
}

// Função para carregar imagens
function carregarImagens(imagens) {
    const imagensCarregadas = {};
    imagens.forEach(img => {
        const image = new Image();
        image.src = `${diretorioImagens}/${img}`;
        image.classList.add('imagem-lista');  // Adiciona a classe CSS para ajustar o tamanho
        imagensCarregadas[img] = image;
    });
    return imagensCarregadas;
}

// Função para criar combinações
function criarCombinacoes(imagens) {
    const combinacoes = [];
    imagens.forEach((img1, i1) => {
        imagens.forEach((img2, i2) => {
            combinacoes.push([[img1, img2], i1 * imagens.length + i2 + 1]);
        });
    });
    combinacoesRestantes = new Map(combinacoes);
}

// Função para desenhar o tabuleiro
function desenharTabuleiro(ctx, imagensCarregadas, tabuleiro) {
    for (let row = 0; row < tamanhoTabuleiro; row++) {
        for (let col = 0; col < tamanhoTabuleiro; col++) {
            const rectX = col * cellSize;
            const rectY = row * cellSize;
            ctx.clearRect(rectX, rectY, cellSize, cellSize);
            ctx.strokeRect(rectX, rectY, cellSize, cellSize);
            if (tabuleiro[`${row},${col}`]) {
                tabuleiro[`${row},${col}`].forEach((imgName, idx) => {
                    const img = imagensCarregadas[imgName];
                    const x = rectX + (idx % 2) * (cellSize / 2);
                    const y = rectY + (idx % 2) * (cellSize / 2);
                    ctx.drawImage(img, x, y, cellSize / 2, cellSize / 2);
                });
            }
        }
    }
}

// Função para desenhar a lista de imagens
function desenharListaImagens(imagensCarregadas) {
    const listaImagens = document.getElementById('lista-imagens');
    listaImagens.innerHTML = '';
    Object.entries(imagensCarregadas).forEach(([imgName, img]) => {
        img.draggable = true;
        img.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text/plain', imgName);
        });
        listaImagens.appendChild(img);
    });
}

// Função para desenhar a lista de combinações
function desenharListaCombinacoes() {
    const listaCombinacoes = document.getElementById('lista-combinacoes');
    listaCombinacoes.innerHTML = '';
    Array.from(combinacoesRestantes).forEach(([comb, num], index) => {
        const div = document.createElement('div');
        div.textContent = `${num}: ${comb}`;
        listaCombinacoes.appendChild(div);
    });
}

// Inicializar o jogo
function inicializarJogo() {
    const imagens = buscarImagens(diretorioImagens);
    const imagensCarregadas = carregarImagens(imagens);
    criarCombinacoes(imagens);
    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    desenharTabuleiro(ctx, imagensCarregadas, tabuleiro);
    desenharListaImagens(imagensCarregadas);
    desenharListaCombinacoes();

    // Eventos de arrastar e soltar
    canvas.addEventListener('dragover', (event) => event.preventDefault());
    canvas.addEventListener('drop', (event) => {
        event.preventDefault();
        const imgName = event.dataTransfer.getData('text/plain');
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        if (!tabuleiro[`${row},${col}`]) tabuleiro[`${row},${col}`] = [];
        if (tabuleiro[`${row},${col}`].length < 2) {
            tabuleiro[`${row},${col}`].push(imgName);
            if (tabuleiro[`${row},${col}`].length === 2) {
                const novaCombinacao = tabuleiro[`${row},${col}`];
                const combinacaoString = JSON.stringify(novaCombinacao);
                if (combinacoesRestantes.has(combinacaoString)) {
                    combinacoesRestantes.delete(combinacaoString);
                    if (combinacoesRestantes.size === 0) {
                        mensagemErro = "Parabéns! Você conseguiu completar o tabuleiro.";
                        confetti();
                    } else {
                        mensagemErro = "";
                    }
                } else {
                    mensagemErro = "Erro: combinação já utilizada.";
                    tabuleiro[`${row},${col}`] = [];
                }
            }
            desenharTabuleiro(ctx, imagensCarregadas, tabuleiro);
            desenharListaCombinacoes();
            document.getElementById('mensagem').textContent = mensagemErro;
        }
    });
}

document.getElementById('limpar').addEventListener('click', () => {
    tabuleiro = {};
    mensagemErro = "";
    inicializarJogo();
});

inicializarJogo();
