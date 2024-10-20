import pygame
import os
import sys
import random
from método import tela_inicial, criar_tabuleiro, pode_colocar, desenhar_tabuleiro, limpar_tabuleiro, tabuleiro_completo
from Instruções import iniciar_jogo

# Inicializa o pygame
pygame.init()

# Método para reiniciar o jogo
def reiniciar_jogo():
    global tabuleiro, n
    n = tela_inicial()
    if n not in [2, 3, 4, 5, 6]:
        raise ValueError("Tamanho inválido. Por favor, escolha entre 2, 3, 4, 5 ou 6.")
    tabuleiro = criar_tabuleiro(n)

# Solicita o tamanho do tabuleiro ao usuário através da tela inicial
n = tela_inicial()
if n not in [2, 3, 4, 5, 6]:
    raise ValueError("Tamanho inválido. Por favor, escolha entre 2, 3, 4, 5 ou 6.")

# Busca automaticamente as imagens na pasta 'imagens'
pasta_imagens = 'imagens'
imagens = [os.path.join(pasta_imagens, f) for f in os.listdir(pasta_imagens) if f.endswith('.jpeg') or f.endswith('.jpg')]
if not imagens:
    raise ValueError("Nenhuma imagem JPEG encontrada na pasta 'imagens'.")

# Dobra a lista de imagens para garantir que haja imagens suficientes
imagens *= 2
random.shuffle(imagens)

# Cria o tabuleiro
tabuleiro = criar_tabuleiro(n)

# Configurações da tela
tela = pygame.display.set_mode((800, 700))  # Aumenta a altura da tela para acomodar a mensagem de erro
pygame.display.set_caption('Jogo de Tabuleiro')

# Variáveis para arrastar e soltar
arrastando = False
imagem_arrastada = None
pos_inicial = (0, 0)
mensagem = ""

# Loop principal do jogo
rodando = True
while rodando:
    for evento in pygame.event.get():
        if evento.type == pygame.QUIT:
            rodando = False
        elif evento.type == pygame.MOUSEBUTTONDOWN:
            x, y = evento.pos
            if x > 620:
                for i, img_path in enumerate(imagens):
                    img_rect = pygame.Rect(620, 60 + i * 60, 50, 50)
                    if img_rect.collidepoint(evento.pos):
                        arrastando = True
                        imagem_arrastada = img_path
                        pos_inicial = evento.pos
                        break
            botao_limpar = pygame.Rect(620, 500, 150, 50)
            botao_reiniciar = pygame.Rect(620, 560, 150, 50)
            botao_fechar = pygame.Rect(620, 620, 150, 50)  # Certifique-se de que o botão reiniciar está definido
            if botao_limpar.collidepoint(evento.pos):
                limpar_tabuleiro(tabuleiro)
                mensagem = ""
            elif botao_reiniciar.collidepoint(evento.pos):
                tabuleiro = criar_tabuleiro(n)
                random.shuffle(imagens)  # Embaralha as imagens novamente
                reiniciar_jogo()
            elif botao_fechar.collidepoint(evento.pos):
                pygame.quit()
                sys.exit()

 elif evento.type == pygame.MOUSEBUTTONUP:
            if arrastando:
                x, y = evento.pos
                tamanho_celula = 600 // n
                coluna = x // tamanho_celula
                linha = y // tamanho_celula
                if 0 <= coluna < n and 0 <= linha < n:
                    if pode_colocar(tabuleiro, imagem_arrastada, linha, coluna):
                        tabuleiro[linha][coluna] = imagem_arrastada
                        tabuleiro_completo(tabuleiro)
                        mensagem = ""
                    else:
                        mensagem = "Imagem já utilizada em uma linha ou coluna."
                arrastando = False
                imagem_arrastada = None
        elif evento.type == pygame.MOUSEMOTION:
            if arrastando:
                pos_inicial = evento.pos

    tela.fill((255, 255, 255))
    desenhar_tabuleiro(tela, tabuleiro, imagens, mensagem)

    # Verifica se o tabuleiro está completamente preenchido
    if tabuleiro_completo(tabuleiro):
        fonte = pygame.font.Font(None, 100)
        mensagem_vitoria = fonte.render("Você Conseguiu!", True, (0, 255, 0))
        tela.blit(mensagem_vitoria, (20, 600))

    if arrastando and imagem_arrastada:
        img = pygame.image.load(imagem_arrastada)
        img = pygame.transform.scale(img, (50, 50))
        tela.blit(img, pos_inicial)
        
    pygame.display.flip()

pygame.quit()