document.addEventListener('DOMContentLoaded', function () {
    const listaImagens = document.getElementById('lista-imagens');
    const listaCombinacoes = document.getElementById('lista-combinacoes');
    const mensagem = document.getElementById('mensagensD');
    const proximoNivel = document.getElementById('proximo-nivel');
    const errorSound = new Audio('../sons/Erro.mp3');
    const clapSound = new Audio('../sons/Aplausos.mp3');
    const fieldsetCombinacoes = document.getElementById('fieldset-combinacao');
    const botaoExibirCombinacoes = document.getElementById('Exibir-combinacoes');
    const botaoLimparTabuleiro = document.getElementById('limpar-tabuleiro');
    let tabuleiro = {}; // Inicializa o tabuleiro
    let combinacoesGeradas = []; // Inicializa as combinações geradas
    let canvas, ctx, tamanhoTabuleiro, cellWidth, cellHeight;

    const todasImagens = [
        '../imagens/abelha.jpeg', '../imagens/bispo.jpeg', '../imagens/bola.jpeg', '../imagens/carro.jpeg', '../imagens/cavalo.jpeg',
        '../imagens/circulo.jpeg', '../imagens/coração.png', '../imagens/estrela.jpeg', '../imagens/flor.jpeg', '../imagens/peao.jpeg',
        '../imagens/quadrado.jpeg', '../imagens/Rainha.jpeg', '../imagens/Rei.jpeg', '../imagens/torre.jpeg', '../imagens/triangulo.jpeg'
    ];

    function getUrlParameter(param) {
        const urlParams = 3; //new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function embaralharImagens(imagens) {
        for (let i = imagens.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [imagens[i], imagens[j]] = [imagens[j], imagens[i]];
        }
        return imagens;
    }

    function selecionarImagensPorTamanho(tamanhoTabuleiro) {
        let totalCelulas = 3 * 3;
        return todasImagens.slice(0, totalCelulas);
    }

    function carregarImagens(imagens, callback) {
        let imagensCarregadas = {};
        let imagensRestantes = imagens.length;
        listaImagens.innerHTML = '';
        imagens.forEach((imgNome) => {
            let img = new Image();
            img.src = imgNome;
            img.classList.add('draggable');
            img.draggable = true;
            img.id = imgNome;
            img.onload = () => {
                listaImagens.appendChild(img);
                imagensCarregadas[imgNome] = img;
                imagensRestantes--;
                if (imagensRestantes === 0) {
                    callback(imagensCarregadas);
                    combinacoesGeradas = gerarCombinacoes(imagens); // Armazena combinações geradas
                }
            };
        });
    }

    function gerarCombinacoes(imagens) {
        const combinacoes = [];
        let contador = 1;
        for (let i = 0; i < imagens.length; i++) {
            for (let j = 0; j < imagens.length; j++) {
                combinacoes.push({ id: contador++, combinacao: [imagens[i], imagens[j]] });
            }
        }
        exibirCombinacoes(combinacoes);
        return combinacoes;
    }

    function exibirCombinacoes(combinacoes) {
        listaCombinacoes.innerHTML = '';
        combinacoes.forEach(item => {
            const divComb = document.createElement('div');
            divComb.textContent = `${item.id}: ${item.combinacao[0]} + ${item.combinacao[1]}`;
            listaCombinacoes.appendChild(divComb);
        });
    }

    function desenharTabuleiro(ctx, imagensCarregadas, tabuleiro, tamanhoTabuleiro, cellWidth, cellHeight) {
        for (let row = 0; row < tamanhoTabuleiro; row++) {
            for (let col = 0; col < tamanhoTabuleiro; col++) {
                ctx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
                if (tabuleiro[`${row},${col}`]) {
                    tabuleiro[`${row},${col}`].forEach((imgNome, idx) => {
                        let img = imagensCarregadas[imgNome];
                        let space = 10;
                        let totalWidth = (cellWidth * 0.4) * 2 + space;
                        let x = col * cellWidth + (cellWidth - totalWidth) / 2 + (idx * (cellWidth * 0.4 + space));
                        let y = row * cellHeight + (cellHeight - cellHeight * 0.8) / 2;
                        ctx.drawImage(img, x, y, cellWidth * 0.4, cellHeight * 0.8);
                    });
                }
            }
        }
    }

    function verificarCombinacao(combinacao, combinacoesGeradas) {
        for (let i = 0; i < combinacoesGeradas.length; i++) {
            let comb = combinacoesGeradas[i].combinacao;
            if (comb[0] === combinacao[0] && comb[1] === combinacao[1]) {
                combinacoesGeradas.splice(i, 1);
                exibirCombinacoes(combinacoesGeradas);
                return true;
            }
        }
        return false;
    }

    function verificarRestricoes(col, tabuleiro, imgNome, posicao) {
        for (let row = 0; row < Object.keys(tabuleiro).length / 2; row++) {
            const celula = tabuleiro[`${row},${col}`];
            if (!celula) continue;
            if (posicao === 0 && celula[0] === imgNome) {
                return false;
            }
            if (posicao === 1 && celula[1] === imgNome) {
                return false;
            }
        }
        return true;
    }

    function redesenharTabuleiro(ctx, imagensCarregadas, tabuleiro, tamanhoTabuleiro, cellWidth, cellHeight) {
        for (let row = 0; row < tamanhoTabuleiro; row++) {
            for (let col = 0; col < tamanhoTabuleiro; col++) {
                ctx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    botaoLimparTabuleiro.addEventListener('click', function () {
        for (let key in tabuleiro) {
            tabuleiro[key] = [];
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redesenharTabuleiro(ctx, {}, {}, tamanhoTabuleiro, cellWidth, cellHeight);
        let imagensSelecionadas = selecionarImagensPorTamanho(tamanhoTabuleiro);
        combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);
        exibirCombinacoes(combinacoesGeradas);
        mensagem.textContent = 'Tabuleiro limpo e combinações reiniciadas!';
    });

    botaoExibirCombinacoes.addEventListener('click', function () {
        if (fieldsetCombinacoes.style.display === 'none' || fieldsetCombinacoes.style.display === '') {
            fieldsetCombinacoes.style.display = 'block';
            botaoExibirCombinacoes.textContent = 'Ocultar Combinações';
        } else {
            fieldsetCombinacoes.style.display = 'none';
            botaoExibirCombinacoes.textContent = 'Exibir Combinações';
        }
    });

    function main() {
        canvas = document.getElementById('tela');
        ctx = canvas.getContext('2d');
        let tamanhoTabuleiroParam = getUrlParameter('tamanhoTabuleiro');
        tamanhoTabuleiro = 2; // Valor padrão para o tamanho do tabuleiro
        if (isNaN(tamanhoTabuleiro) || tamanhoTabuleiro <= 0 || tamanhoTabuleiro > todasImagens.length) {
            mensagem.textContent = 'Erro: Tamanho do tabuleiro inválido.';
            return;
        }
        listaCombinacoes.style.gridTemplateColumns = `repeat(${tamanhoTabuleiro}, 1fr)`;
        let larguraDisponivel = window.innerWidth * 0.8;
        let alturaDisponivel = window.innerHeight * 0.8;
        cellWidth = Math.min(larguraDisponivel / tamanhoTabuleiro, 120);
        cellHeight = Math.min(alturaDisponivel / tamanhoTabuleiro, 80);
        embaralharImagens(todasImagens);
        let imagensSelecionadas = selecionarImagensPorTamanho(tamanhoTabuleiro);
        carregarImagens(imagensSelecionadas, (imagensCarregadas) => {
            combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);
            function desenhar() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                desenharTabuleiro(ctx, imagensCarregadas, tabuleiro, tamanhoTabuleiro, cellWidth, cellHeight);
            }
            desenhar();
            listaImagens.addEventListener('dragstart', function (e) {
                e.dataTransfer.setData('text/plain', e.target.id);
            });
            canvas.addEventListener('dragover', function (e) {
                e.preventDefault();
            });
            canvas.addEventListener('drop', function (e) {
                e.preventDefault();
                let imgNome = e.dataTransfer.getData('text/plain');
                let col = Math.floor(e.offsetX / cellWidth);
                let row = Math.floor(e.offsetY / cellHeight);
                if (row < tamanhoTabuleiro && col < tamanhoTabuleiro) {
                    if (!tabuleiro[`${row},${col}`]) tabuleiro[`${row},${col}`] = [];
                    mensagem.textContent = '';
                    let posicao = tabuleiro[`${row},${col}`].length;
                    if (verificarRestricoes(col, tabuleiro, imgNome, posicao)) {
                        tabuleiro[`${row},${col}`].push(imgNome);
                        desenhar();
                        if (tabuleiro[`${row},${col}`].length === 2) {
                            let combinacao = tabuleiro[`${row},${col}`];
                            if (!verificarCombinacao(combinacao, combinacoesGeradas)) {
                                errorSound.play();
                                mensagem.textContent = "Essa combinação já foi utilizada.";
                                tabuleiro[`${row},${col}`] = [];
                                desenhar();
                            }
                            if (combinacoesGeradas.length === 0) {
                                mensagem.textContent = "Parabéns! Você conseguiu completar o tabuleiro.";
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                                clapSound.play();
                                proximoNivel.style.display = 'inline';
                                combinacoesGeradas = gerarCombinacoes(imagensSelecionadas);
                                exibirCombinacoes(combinacoesGeradas);
                            }
                        }
                    } else {
                        mensagem.textContent = "Essa imagem já foi inserida nessa coluna.";
                        errorSound.play();
                    }
                }
            });
        });
    }
    main();
});