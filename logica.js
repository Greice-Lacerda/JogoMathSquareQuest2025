document.addEventListener('DOMContentLoaded', function () {
    const listaImagens = document.getElementById('lista-imagens');
    const listaCombinacoes = document.getElementById('lista-combinacoes'); 
    const mensagem = document.getElementById('mensagem');
    const proximoNivel = document.getElementById('proximo-nivel');
    const errorSound = new Audio('Erro.mp3'); 
    const clapSound = new Audio('aplausos.mp3'); 
    const fieldsetCombinacoes = document.getElementById('fieldset-combinacao'); // Captura o fieldset de combinações
    const botaoExibirCombinacoes = document.getElementById('Exibir-combinacoes'); // Captura o botão de exibir/ocultar combinações
    const todasImagens = [
        'abelha.jpeg', 'bispo.jpeg', 'bola.jpeg', 'carro.jpeg', 'cavalo.jpeg',
        'circulo.jpeg', 'coração.png', 'estrela.jpeg', 'flor.jpeg', 'peao.jpeg',
        'quadrado.jpeg', 'Rainha.jpeg', 'Rei.jpeg', 'torre.jpeg', 'triangulo.jpeg'
    ];

    // Função para embaralhar as imagens (algoritmo Fisher-Yates)
    function embaralharImagens(imagens) {
        for (let i = imagens.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [imagens[i], imagens[j]] = [imagens[j], imagens[i]]; // Troca as posições
        }
        return imagens;
    }

    // Função para obter o valor do parâmetro na URL
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
    // A função principal onde você vai buscar o tamanho do tabuleiro
    function main() {
        let tamanhoTabuleiro = getUrlParameter('tamanhoTabuleiro') 
        tamanhoTabuleiro = parseInt(tamanhoTabuleiro, 10); // Converte para número inteiro
        let cellWidth = 120; 
        let cellHeight = 80;
    }

    // Função para selecionar a quantidade de imagens com base no tamanho do tabuleiro
    function selecionarImagensPorTamanho(tamanhoTabuleiro) {
        let totalCelulas = tamanhoTabuleiro;
        return todasImagens.slice(0, totalCelulas); 
    }

    // Carregar e exibir as imagens na div "lista-imagens"
    function carregarImagens(imagens, callback) {
        let imagensCarregadas = {};
        let imagensRestantes = imagens.length;

        listaImagens.innerHTML = ''; 

        imagens.forEach((imgNome) => {
            let img = new Image();
            img.src = 'imagens/' + imgNome;
            img.classList.add('draggable');
            img.draggable = true;
            img.id = imgNome;

            img.onload = () => {
                listaImagens.appendChild(img);
                imagensCarregadas[imgNome] = img;
                imagensRestantes--;
                if (imagensRestantes === 0) {
                    callback(imagensCarregadas);
                    gerarCombinacoes(imagens);
                }
            };
        });
    }

    // Gera combinações possíveis com repetição e associa um número natural a cada combinação
    function gerarCombinacoes(imagens) {
        const combinacoes = [];
        let contador = 1;

        for (let i = 0; i < imagens.length; i++) {
            for (let j = 0; j < imagens.length; j++) {
                combinacoes.push({ id: contador++, combinacao: [imagens[i], imagens[j]] });
            }
        }

        exibirCombinacoes(combinacoes);
        return combinacoes; // Retornar as combinações geradas
    }

    // Exibe combinações na div "lista-combinacoes"
    function exibirCombinacoes(combinacoes) {
        listaCombinacoes.innerHTML = ''; 
        combinacoes.forEach(item => {
            const divComb = document.createElement('div');
            divComb.textContent = `${item.id}: ${item.combinacao[0]} + ${item.combinacao[1]}`; 
            listaCombinacoes.appendChild(divComb);
        });
    }

    // Desenhar o tabuleiro e as imagens no canvas
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

    // Função principal
    function main() {
        let canvas = document.getElementById('tela');
        let ctx = canvas.getContext('2d');
        let tamanhoTabuleiro = getUrlParameter('tamanhoTabuleiro') //Busca o valor do tabuleiro na página
        tamanhoTabuleiro = parseInt(tamanhoTabuleiro, 10); // Converte para número inteiro
        let cellWidth = 120; 
        let cellHeight = 80; 

        // Embaralha as imagens antes de selecionar por tamanho
        embaralharImagens(todasImagens);

        // Seleciona as imagens embaralhadas com base no tamanho do tabuleiro
        let imagensSelecionadas = selecionarImagensPorTamanho(tamanhoTabuleiro);
        let tabuleiro = {}; 
        let combinacoesGeradas = [];  

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
                    
                    // Limpar mensagem de erro ao iniciar nova combinação
                    mensagem.textContent = '';

                    if (tabuleiro[`${row},${col}`].length < 2) {
                        tabuleiro[`${row},${col}`].push(imgNome);

                        desenhar(); 

                        if (tabuleiro[`${row},${col}`].length === 2) {
                            let combinacao = tabuleiro[`${row},${col}`];
                            console.log(`Combinação na célula (${row}, ${col}): ${combinacao}`);

                            // Verifica se a combinação existe na lista
                            if (!verificarCombinacao(combinacao, combinacoesGeradas)) {
                                errorSound.play(); // Toca som de erro se a combinação não for permitida
                                mensagem.textContent = "Essa combinação já foi utilizada.";
                                // Limpa as imagens da célula
                                tabuleiro[`${row},${col}`] = []; // Limpa as imagens
                                desenhar(); // Atualiza o tabuleiro
                            }

                            // Verifica se todas as combinações foram apagadas
                            if (combinacoesGeradas.length === 0) {
                                mensagem.textContent = "Parabéns! Você conseguiu completar o tabuleiro.";
                                confetti({
                                    particleCount: 100,
                                    spread: 70,
                                    origin: { y: 0.6 }
                                });
                                clapSound.play(); // Toca som de aplauso

                            // Exibe o botão de próximo nível
                            proximoNivel.style.display = 'inline'; // Exibe o botão
                            
                            // Reescreve todas as combinações
                            combinacoesGeradas = gerarCombinacoes(imagensSelecionadas); // Gera novas combinações
                            exibirCombinacoes(combinacoesGeradas); // Exibe as combinações novamente
                            }
                        }
                    } else {
                        errorSound.play(); 
                    }
                }
            });
        });
    }

    // Função para verificar e remover a combinação da lista, com correspondência exata de posições
    function verificarCombinacao(combinacao, combinacoesGeradas) {
        for (let i = 0; i < combinacoesGeradas.length; i++) {
            let comb = combinacoesGeradas[i].combinacao;

            // Verifica se as imagens da combinação são exatamente iguais na mesma ordem
            if (comb[0] === combinacao[0] && comb[1] === combinacao[1]) {
                // Remove a combinação da lista
                combinacoesGeradas.splice(i, 1);
                exibirCombinacoes(combinacoesGeradas); 
                return true; // Combinação encontrada e removida
            }
        }
        return false; // Combinação não encontrada
    }

    // Adiciona evento de clique para alternar visibilidade do fieldset de combinações
    botaoExibirCombinacoes.addEventListener('click', function () {
        if (fieldsetCombinacoes.style.display === 'none' || fieldsetCombinacoes.style.display === '') {
            fieldsetCombinacoes.style.display = 'block'; // Exibe o fieldset de combinações
                    botaoExibirCombinacoes.textContent = 'Ocultar Combinações'; // Muda o texto do botão
                } else {
                    fieldsetCombinacoes.style.display = 'none'; // Oculta o fieldset de combinações
                    botaoExibirCombinacoes.textContent = 'Exibir Combinações'; // Muda o texto do botão
                }
            });

    window.onload = main; 
});