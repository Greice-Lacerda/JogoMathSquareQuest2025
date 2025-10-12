const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

let tabuleiro = [];
let n = 0; // Tamanho do tabuleiro
let imagens = [];
let mensagem = "";

// Função para iniciar o jogo
function EscolhaTabuleiro() {
    n = parseInt(prompt("Digite o tamanho do tabuleiro (2 a 6):"));
    if (![2, 3, 4, 5, 6].includes(n)) {
        alert("Tamanho inválido. Por favor, escolha entre 2 e 6.");
        return;
    }

    const listaImagens = document.getElementById('lista-imagens');
    imagens = [
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

    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Embaralha as imagens antes de exibi-las
    embaralhar(imagens);

    const tamanho = n; // Define o tamanho do tabuleiro.
    listaImagens.innerHTML = ''; // Limpa as imagens anteriores
    for (let i = 0; i < tamanho; i++) {
        const imgElement = document.createElement('img');
        imgElement.src = `imagens/${imagens[i]}`;
        imgElement.alt = imagens[i];
        imgElement.className = 'imagem-lista';
    }    

    const canvas = document.getElementById('tela');
    const ctx = canvas.getContext('2d');
    const cellSize = canvas.width / tamanho;
    function desenharTabuleiro() {
        for (let row = 0; row < tamanho; row++) {
            for (let col = 0; col < tamanho; col++) {
                ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
                ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize); // Adiciona bordas às células
            }
        }
    }
    desenharTabuleiro();
}

// Função para imprimir o tabuleiro
function imprimirTabuleiros() {
    const printWindow = window.open('../paginas/ImpTab.html', '_blank');
    const canvas = document.getElementById('tela');
    const canvasImage = canvas.toDataURL('image/png');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Tabuleiro</title></head><body>');
    printWindow.document.write(`<img src="${canvasImage}" alt="Tabuleiro">`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Função para imprimir as imagens
function imprimirImagens() {
    const newWindow = window.open('', '_blank');
    newWindow.document.write('<!DOCTYPE html><html><head><title>Imagens</title></head><body>');
    
    // Usa as imagens já carregadas na variável global 'imagens'
    // e seleciona as 'n' primeiras para impressão, correspondentes ao tabuleiro
    const imagensParaImprimir = imagens.slice(0, n);

    imagensParaImprimir.forEach(imgPath => {
        // O caminho já é relativo, então usamos como está
        newWindow.document.write(`<img src="${imgPath}" alt="${imgPath.split('/').pop()}" style="margin: 10px; width: 100px; height: 100px;">`);
    });

    newWindow.document.write('</body></html>');
    newWindow.document.close();
    newWindow.print();
}

// Função para limpar o tabuleiro (definição de exemplo, pois não foi fornecida)
function limparTabuleiro() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tabuleiro = [];
    document.getElementById('lista-imagens').innerHTML = '';
}

// Adiciona os event listeners fora da função EscolhaTabuleiro para que sejam registrados apenas uma vez.
document.getElementById('imprimirTabuleiros').addEventListener('click', imprimirTabuleiros);
document.getElementById('imprimirImagens').addEventListener('click', imprimirImagens);
document.getElementById('limpar').addEventListener('click', limparTabuleiro);
