document.addEventListener('DOMContentLoaded', function () {

    // 1. Selecionar os elementos da página
    const userLogicInput = document.getElementById('userLogicInput');
    const moduloInput = document.getElementById('moduloInput');
    const clearLogicBtn = document.getElementById('clearLogicBtn');
    const clearModuloBtn = document.getElementById('clearModuloBtn');
    const startGameBtn = document.getElementById('startGameBtn');
    const errorMessage = document.getElementById('errorMessage');

    // --- Verificação de Elementos Essenciais ---
    const essentialElements = {
        userLogicInput: userLogicInput,
        moduloInput: moduloInput,
        startGameBtn: startGameBtn,
        errorMessage: errorMessage
    };

    let missingElement = false;
    for (const id in essentialElements) {
        if (!essentialElements[id]) {
            console.error(`[ERRO CRÍTICO DE CONFIGURAÇÃO] O elemento HTML com id="${id}" não foi encontrado.`);
            missingElement = true;
        }
    }
    if (missingElement) {
        if (errorMessage) {
            errorMessage.textContent = 'Erro de configuração. Elementos essenciais não encontrados (F12).';
        }
        return;
    }
    // --- Fim da Verificação ---


    // 2. Adicionar funcionalidade aos botões "Limpar"
    if (clearLogicBtn) {
        clearLogicBtn.addEventListener('click', function () {
            userLogicInput.value = '';
            errorMessage.textContent = '';
        });
    }

    if (clearModuloBtn) {
        clearModuloBtn.addEventListener('click', function () {
            moduloInput.value = '';
            errorMessage.textContent = '';
        });
    }

    // 3. Adicionar funcionalidade ao botão "Iniciar Jogo"
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function () {
            errorMessage.textContent = '';

            // --- Validação da Lógica (String) ---
            const logicString = userLogicInput.value.trim();
            if (!logicString) {
                errorMessage.textContent = 'Erro: Por favor, digite a expressão lógica.';
                userLogicInput.focus();
                return;
            }

            // --- Validação do Módulo ---
            const moduloString = moduloInput.value.trim();
            if (!moduloString) {
                errorMessage.textContent = 'Erro: Por favor, digite o valor do módulo.';
                moduloInput.focus();
                return;
            }

            const moduloValue = parseInt(moduloString, 10);

            if (isNaN(moduloValue) || moduloValue < 2 || moduloValue > 6) {
                errorMessage.textContent = 'Erro: O módulo deve ser um número inteiro entre 2 e 6.';
                moduloInput.focus();
                return;
            }

            // --- Validação de Sintaxe e Criação da Função ---
            let userFunction;
            try {
                userFunction = new Function('a', 'b', `return ${logicString}`);
                // [CORREÇÃO 1-BASED] Teste inicial 1,1
                userFunction(1, 1);
            } catch (e) {
                errorMessage.textContent = `Erro de sintaxe na expressão: ${e.message}. Verifique a lógica.`;
                console.error("Erro de sintaxe na lógica do usuário:", e);
                userLogicInput.focus();
                return;
            }

            // --- Validação de Execução (Simulação) ---
            console.log(`Iniciando simulação 1-BASED com Modulo ${moduloValue}...`);
            let simulationError = null;

            // ===================================================================
            // [CORREÇÃO CRÍTICA 1-BASED]
            // O array de entradas agora é 1-based (de 1 a N) para corresponder
            // à lógica do jogo NivelD5.
            const possibleInputs = [];
            for (let i = 1; i <= moduloValue; i++) {
                possibleInputs.push(i);
            }
            // ===================================================================

            // Loop de simulação
            for (const a of possibleInputs) {
                for (const b of possibleInputs) {
                    try {
                        // [CORREÇÃO 1-BASED] Testando com (1,1), (1,2), ..., (N,N)
                        let rawResult = userFunction(a, b);

                        if (typeof rawResult !== 'number' || !isFinite(rawResult)) {
                            simulationError = `A lógica falhou para a(=${a}) e b(=${b}): Resultado não foi um número finito (${rawResult}).`;
                            console.error(simulationError);
                            break;
                        }

                    } catch (e) {
                        simulationError = `Erro ao executar a lógica para a(=${a}) e b(=${b}): ${e.message}.`;
                        console.error(simulationError, e);
                        break;
                    }
                }
                if (simulationError) {
                    break;
                }
            }

            // Se houve erro na simulação, exibe e para
            if (simulationError) {
                errorMessage.textContent = `Erro durante a simulação: ${simulationError} Verifique sua lógica.`;
                userLogicInput.focus();
                return;
            }

            console.log("Simulação concluída com sucesso.");

            // --- Se tudo for válido ---
            const encodedLogic = encodeURIComponent(logicString);
            const encodedModulo = encodeURIComponent(moduloValue);

            // [CORREÇÃO] O nome do arquivo da página do Jogo
            // Se o seu arquivo HTML do jogo se chama NivelD5.html, está correto.
            const nextPageUrl = `NivelD5.html?logic=${encodedLogic}&modulo=${encodedModulo}`;
            console.log("Navegando para:", nextPageUrl);
            window.location.href = nextPageUrl;
        });
    }

}); // Fim do DOMContentLoaded