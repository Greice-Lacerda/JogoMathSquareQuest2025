// Obtém as referências para o canvas e seu contexto de desenho 2D
const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

// Função principal que executa a lógica da página ao ser carregada
function configurarPagina() {
    // 1. Solicitar o tamanho do tabuleiro
    let n = parseInt(prompt("Digite o tamanho do tabuleiro (entre 2 e 6):"));

    // Valida a entrada do usuário
    if (isNaN(n) || n < 2 || n > 6) {
        alert("Tamanho inválido. Por favor, recarregue a página e escolha um número entre 2 e 6.");
        // Limpa a área de mensagens e o tabuleiro se a entrada for inválida
        document.getElementById('mensagens').innerText = "Tamanho de tabuleiro inválido.";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Lista completa de imagens disponíveis
    const imagens = [
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

    // Função para embaralhar a ordem dos itens em um array (algoritmo Fisher-Yates)
    function embaralhar(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // Embaralha as imagens para garantir que sejam diferentes a cada vez
    embaralhar(imagens);

    // 2. Desenhar o tabuleiro no canvas
    const tamanho = n;
    const cellSize = canvas.width / tamanho; // Calcula o tamanho de cada célula
    
    // Limpa qualquer desenho anterior
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha a grade
    for (let row = 0; row < tamanho; row++) {
        for (let col = 0; col < tamanho; col++) {
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }

    // 3. Exibir o número de imagens correspondente ao tamanho do tabuleiro
    const divListaImagens = document.getElementById('lista-imagens');
    divListaImagens.innerHTML = ''; // Limpa a lista de imagens anterior

    // Cria e adiciona um elemento <img> para cada imagem necessária
    for (let i = 0; i < tamanho; i++) {
        const imgElement = document.createElement('img');
        imgElement.src = imagens[i]; // O caminho já está correto no array
        imgElement.alt = imagens[i].split('/').pop(); // Usa o nome do arquivo como texto alternativo
        imgElement.className = 'imagem-lista'; // Define uma classe para possível estilização
        
        // **CORREÇÃO PRINCIPAL**: Adiciona o elemento de imagem à div
        divListaImagens.appendChild(imgElement);
    }
}

// Executa a função principal assim que o script é carregado
configurarPagina();