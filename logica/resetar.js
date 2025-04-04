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
