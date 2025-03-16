import os
import itertools
import pygame

def buscar_imagens(diretorio):
    # Busca todas as imagens na pasta especificada com formatos suportados
    formatos_suportados = ['.png', '.jpg', '.jpeg']
    imagens = [f for f in os.listdir(diretorio) if os.path.isfile(os.path.join(diretorio, f)) and os.path.splitext(f)[1].lower() in formatos_suportados]
    return imagens

def carregar_imagens(diretorio, imagens):
    # Carrega as imagens para uso no Pygame
    imagens_carregadas = {img: pygame.image.load(os.path.join(diretorio, img)) for img in imagens}
    return imagens_carregadas

def desenhar_tabuleiro(tela, imagens_carregadas, tabuleiro, tamanho_tabuleiro, cell_size):
    # Desenha o tabuleiro no Pygame
    for row in range(tamanho_tabuleiro):
        for col in range(tamanho_tabuleiro):
            rect = pygame.Rect(col * cell_size, row * cell_size, cell_size, cell_size)
            pygame.draw.rect(tela, (255, 255, 255), rect, 1)
            if (row, col) in tabuleiro:
                for idx, img_name in enumerate(tabuleiro[(row, col)]):
                    img = pygame.transform.scale(imagens_carregadas[img_name], (cell_size // 2, cell_size // 2))
                    x = col * cell_size + (idx % 2) * (cell_size // 2)
                    y = row * cell_size + (idx // 2) * (cell_size // 2)
                    tela.blit(img, (x, y))

def desenhar_lista_imagens(tela, imagens_carregadas, tamanho_tabuleiro, cell_size):
    # Desenha a lista de imagens abaixo do tabuleiro
    y_offset = tamanho_tabuleiro * cell_size + 10  # Espaço abaixo do tabuleiro
    for i, (img_name, img) in enumerate(imagens_carregadas.items()):
        img = pygame.transform.scale(img, (cell_size, cell_size))
        tela.blit(img, (i * cell_size, y_offset))

def desenhar_lista_combinacoes(tela, combinacoes_imagens, tamanho_tabuleiro, cell_size):
    # Desenha a lista de combinações abaixo da lista de imagens
    y_offset = (tamanho_tabuleiro + 2) * cell_size + 20  # Espaço abaixo da lista de imagens
    fonte = pygame.font.SysFont(None, 24)
    for i, (comb, num) in enumerate(combinacoes_imagens):
        texto_comb = fonte.render(f"{num}: {comb}", True, (255, 255, 255))
        tela.blit(texto_comb, (10, y_offset + i * 24))

def criar_combinacoes(imagens):
    # Cria uma lista de combinações de imagens, permitindo repetição
    combinacoes = list(itertools.product(imagens, repeat=2))
    combinacoes_enumeradas = [(comb, i+1) for i, comb in enumerate(combinacoes)]
    return combinacoes_enumeradas

def main():
    pygame.init()

    diretorio_imagens = 'imagens'  # Pasta onde estão as imagens
    tamanho_tabuleiro = 3  # Tamanho do tabuleiro (3x3)
    cell_size = 100  # Tamanho de cada célula do tabuleiro

    imagens = buscar_imagens(diretorio_imagens)
    imagens_selecionadas = imagens[:tamanho_tabuleiro]  # Seleciona imagens de acordo com o tamanho do tabuleiro (3x3 = 9 imagens)
    imagens_carregadas = carregar_imagens(diretorio_imagens, imagens_selecionadas)
    combinacoes_imagens = criar_combinacoes(imagens_selecionadas)

    largura_tela = tamanho_tabuleiro * cell_size
    altura_tela = (tamanho_tabuleiro + 3) * cell_size + 100  # Altura extra para a lista de imagens e combinações
    tela = pygame.display.set_mode((largura_tela, altura_tela))
    pygame.display.set_caption('Tabuleiro 3x3 com Lista de Imagens e Combinações')

    clock = pygame.time.Clock()
    rodando = True
    imagem_drag = None
    drag_pos = None
    mensagem_erro = ""

    tabuleiro = {}  # Dicionário para armazenar a posição das imagens no tabuleiro
    combinacoes_restantes = dict(combinacoes_imagens)

    while rodando:
        for evento in pygame.event.get():
            if evento.type == pygame.QUIT:
                rodando = False
            elif evento.type == pygame.MOUSEBUTTONDOWN:
                x, y = evento.pos
                if y > tamanho_tabuleiro * cell_size and y < (tamanho_tabuleiro + 1) * cell_size:  # Clique na lista de imagens
                    idx = x // cell_size
                    if idx < len(imagens_selecionadas):
                        imagem_drag = imagens_selecionadas[idx]
                        drag_pos = (x, y)
                else:  # Clique no tabuleiro
                    col = x // cell_size
                    row = y // cell_size
                    if (row, col) in tabuleiro and len(tabuleiro[(row, col)]) < 2:
                        imagem_drag = tabuleiro[(row, col)]
                        drag_pos = (x, y)
            elif evento.type == pygame.MOUSEBUTTONUP and imagem_drag:
                x, y = evento.pos
                col = x // cell_size
                row = y // cell_size
                if row < tamanho_tabuleiro and col < tamanho_tabuleiro:
                    if (row, col) not in tabuleiro:
                        tabuleiro[(row, col)] = []
                    if len(tabuleiro[(row, col)]) < 2:
                        tabuleiro[(row, col)].append(imagem_drag)
                        if len(tabuleiro[(row, col)]) == 2:  # Verifica somente quando a segunda imagem for solta
                            nova_combinacao = tuple(tabuleiro[(row, col)])
                            if nova_combinacao in combinacoes_restantes:
                                del combinacoes_restantes[nova_combinacao]
                                if not combinacoes_restantes:
                                    mensagem_erro = "Parabéns! Você conseguiu completar o tabuleiro."
                            else:                                
                                mensagem_erro = "Erro: combinação já utilizada."
                                tabuleiro[(row, col)] = []  # Limpa a célula que gerou o erro
                imagem_drag = None
                drag_pos = None

        tela.fill((0, 0, 0))  # Limpa a tela
        desenhar_tabuleiro(tela, imagens_carregadas, tabuleiro, tamanho_tabuleiro, cell_size)
        desenhar_lista_imagens(tela, imagens_carregadas, tamanho_tabuleiro, cell_size)
        desenhar_lista_combinacoes(tela, combinacoes_restantes.items(), tamanho_tabuleiro, cell_size)
        if mensagem_erro:
            fonte = pygame.font.SysFont(None, 36)
            texto_erro = fonte.render(mensagem_erro, True, (255, 0, 0))
            tela.blit(texto_erro, (10, 10))

        if imagem_drag:
            img = pygame.transform.scale(imagens_carregadas[imagem_drag], (cell_size, cell_size))
            tela.blit(img, drag_pos)

        pygame.display.flip()
        clock.tick(30)

    pygame.quit()

if __name__ == "__main__":
    main()
