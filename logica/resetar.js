function resetar() {
    if (confirm("Tem certeza que deseja reiniciar o tabuleiro?")) {
        usedImages.forEach(row => row.fill(null));
        imageHistory.length = 0;
        desenharTabuleiro();
        mensagem.textContent = "Tabuleiro vazio";
        document.querySelector('button[onclick="limpar()"]').disabled = true;
        document.querySelector('button[onclick="reiniciar()"]').disabled = true;
    }
}

// Função para reiniciar o jogo
function reiniciarJogo() {
    iniciarJogo();
}

// Função para reiniciar o jogo e embaralhar as imagens
document.getElementById("reiniciar").addEventListener("click", function () {
    embaralhar(imagens); // Embaralha as imagens ao reiniciar
      window.location.href = "../index.html"; // Redireciona para a página incial
    });
  } else {
    alert("Por favor, escolha um tamanho entre 2 e 6.");
    window.location.href = "./instrucao.html";
  }
});

