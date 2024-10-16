const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

let tabuleiro = [];
let n = 0; // Tamanho do tabuleiro
let imagens = [];
let mensagem = "";

// Função para iniciar o jogo
function iniciarJogo() {
    n = parseInt(prompt("Digite o tamanho do tabuleiro (2, 3, 4, 5 ou 6):"));
    if (![2, 3, 4, 5, 6].includes(n)) {
        alert("Tamanho inválido. Por favor, escolha entre 2, 3, 4, 5 ou 6.");
        return;
    }

    tabuleiro = Array.from({ length: n }, () => Array(n).fill(null));
    carregarImagens();
    document.getElementById('instrucoes').style.display = 'none';
    document.getElementById('jogo').style.display = 'block';
    desenharTabuleiro();
}

// Função para carregar imagens dinamicamente do servidor
function carregarImagens() {
    fetch('/imagens')
        .then(response => response.json())
        .then(data => {
            imagens = data.map(img => `imagens/${img}`);
            atualizarListaImagens();
        })
        .catch(error => console.error('Erro ao carregar imagens:', error));
}

// Função para atualizar a lista de imagens
function atualizarListaImagens() {
    const listaImagens = document.getElementById('lista-imagens');
    listaImagens.innerHTML = ''; // Limpa a lista existente

    imagens.forEach(imgSrc => {
        const imgItem = document.createElement('div');
        imgItem.className = 'imagem-item';
        imgItem.draggable = true;
        imgItem.innerHTML = `<img src="${imgSrc}" style="width:50px;height:50px;" />`;
        imgItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', imgSrc);
        });
        listaImagens.appendChild(imgItem);
    });
}

// Função para desenhar o tabuleiro
function desenharTabuleiro() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tamanhoCelula = canvas.width / n;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            ctx.strokeRect(j * tamanhoCelula, i * tamanhoCelula, tamanhoCelula, tamanhoCelula);
            if (tabuleiro[i][j]) {
                const img = new Image();
                img.src = tabuleiro[i][j];
                img.onload = () => {
                    ctx.drawImage(img, j * tamanhoCelula, i * tamanhoCelula, tamanhoCelula, tamanhoCelula);
                };
            }
        }
    }
    
    document.getElementById('mensagem').innerText = mensagem;

    // Verifica se o tabuleiro está completo
    if (verificarVitoria()) {
        mensagem = "Você venceu!";
        document.getElementById('mensagem').innerText = mensagem;
    }
}

// Função para verificar se o tabuleiro está completo
function verificarVitoria() {
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!tabuleiro[i][j]) {
                return false; // Há uma célula vazia
            }
        }
    }
    return true; // Todas as células estão preenchidas
}

// Função para limpar o tabuleiro
function limparTabuleiro() {
    tabuleiro = Array.from({ length: n }, () => Array(n).fill(null));
    mensagem = "";
    desenharTabuleiro();
}

// Função para lidar com o evento de soltar a imagem no tabuleiro
canvas.addEventListener('dragover', (e) => {
    e.preventDefault(); // Permite o drop
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const x = e.offsetX;
    const y = e.offsetY;
    const coluna = Math.floor(x / (canvas.width / n));
    const linha = Math.floor(y / (canvas.height / n));
    
    const imgSrc = e.dataTransfer.getData('text/plain');
    if (podeColocar(imgSrc, linha, coluna)) {
        tabuleiro[linha][coluna] = imgSrc;
        mensagem = "";
        desenharTabuleiro();
    } else {
        mensagem = "Imagem já utilizada em uma linha ou coluna.";
    }
});

// Função para verificar se a imagem pode ser colocada
function podeColocar(imgSrc, linha, coluna) {
    // Verifica se a imagem já está em uso na linha ou coluna
    for (let i = 0; i < n; i++) {
        if (tabuleiro[linha][i] === imgSrc || tabuleiro[i][coluna] === imgSrc) {
            return false; // A imagem já está em uso
        }
    }
    return true; // A imagem pode ser colocada
}

// Função para reiniciar o jogo
function reiniciarJogo() {
    iniciarJogo();
}

// Função para fechar o jogo na tela inicial
function fecharJogo() {
    window.close(); // Fecha a aba do navegador
}

// Função para fechar o jogo na tela do jogo
function fechar_jogo() {
    window.close(); // Fecha a aba do navegador
}

// Função para redirecionar para a página index.html
function voltarParaIndex() {
    window.location.href = "index.html"; // Certifique-se de que este arquivo existe e está no mesmo diretório
}

function embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
// Função para imprimir tabuleiros
document.getElementById('imprimir-tabuleiros').addEventListener('click', function() {
    window.print(); // Imprime a página atual
});

// Função para imprimir imagens
document.getElementById('imprimir-imagens').addEventListener('click', function() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write('<html><head><title>Imagens</title></head><body>');
    const imagens = ['abelha.jpeg', 'bispo.jpeg', 'bola.jpeg', 'carro.jpeg', 'cavalo.jpeg', 'circulo.jpeg', 'coração.png', 'estrela.jpeg', 'flor.jpeg', 'peao.jpeg', 'quadrado.jpeg', 'Rainha.jpeg', 'Rei.jpeg', 'torre.jpeg', 'triangulo.jpeg'];
    imagens.forEach(img => {
        newWindow.document.write(`<img src="imagens/${img}" alt="${img}" style="margin: 10px;">`);
    });
    newWindow.document.write('</body></html>');
    newWindow.document.close();
    newWindow.print();
});

// Eventos de clique dos botões
document.getElementById('jogar').addEventListener('click', iniciarJogo);
document.getElementById('fechar').addEventListener('click', fecharJogo);
document.getElementById('limpar').addEventListener('click', limparTabuleiro);
document.getElementById('reiniciar').addEventListener('click', reiniciarJogo);
document.getElementById('voltar').addEventListener('click', voltarParaIndex);
document.getElementById('fechar_jogo').addEventListener('click', fechar_jogo);
document.getElementById('imprimir-tabuleiros').addEventListener('click', imprimir-tabuleiros, '_blank');
document.getElementById('imprimir-imagens').addEventListener('click', imprimir-imagens, '_blank');

