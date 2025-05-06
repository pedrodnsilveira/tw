if (!window.location.href.includes("screen=overview_villages")) {
    alert("O script deve ser rodado na tela de visualização de aldeias");
    throw new Error("Parando execução do script"); // Para execução
}

// Seleciona todos os spans com a classe 'quickedit-content'
const spans = document.querySelectorAll('.quickedit-content');

const villageIds = [];

// Preenche o array villageIds com os IDs de aldeias
spans.forEach(span => {
    const link = span.querySelector('a');
    if (link) {
        const href = link.getAttribute('href');
        const params = new URLSearchParams(href.split('?')[1]);
        const villageId = params.get('village');
        if (villageId) {
            villageIds.push(villageId);
        }
    }
});

// Função para realizar a ação no link
function realizarAcao(elemento) {
    if (elemento) {
        elemento.click();
    } else {
        console.error("Elemento não encontrado:", elemento);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

for (let item of villageIds) {
    const url = "https://br134.tribalwars.com.br/game.php?village=" + item + "&screen=am_farm";
    
    // Atualiza a URL para carregar a página da aldeia (isso vai recarregar a página)
    window.location.href = url;

    // Seleciona o botão desejado
    let elemento = document.querySelector('a[class$="farm_icon farm_icon_b"]');

    // Verifica se o elemento está bloqueado
    if (elemento && elemento.classList.contains('start_locked')) {
        // Se estiver bloqueado, pula para o próximo item
        continue;
    } else {
        // Se não estiver bloqueado, executa a ação
        function realizarAcao() {
            elemento.click();
        }
        
        //numeros aleatorios
        var tempo = Math.floor(Math.random() * (850 - 300)) + 300;

        setTimeout(function() {
            realizarAcao();
            setInterval(realizarAcao, tempo);
        }, tempo);
    }
    (async () => {
        await sleep(60000); // 60000 ms = 1 minuto
    })();
}