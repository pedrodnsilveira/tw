if (!window.location.href.includes("screen=overview_villages")) {
    alert("O script deve ser rodado na tela de visualização de aldeias");
    throw new Error("Parando execução do script"); // Para execução
}

(function () {
    const urlAtual = window.location.href;

    // Função para salvar estado
    function salvarProgresso(aldeias, indice) {
        localStorage.setItem("aldeiasParaFarm", JSON.stringify(aldeias));
        localStorage.setItem("indiceAtualFarm", indice.toString());
    }

    // Se estivermos na tela de overview_villages, coletamos os IDs
    if (urlAtual.includes("screen=overview_villages")) {
        const spans = document.querySelectorAll('.quickedit-content');
        const villageIds = [];

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

        if (villageIds.length === 0) {
            alert("Nenhuma aldeia encontrada.");
            return;
        }

        salvarProgresso(villageIds, 0);
        window.location.href = `https://br134.tribalwars.com.br/game.php?village=${villageIds[0]}&screen=am_farm`;
        return;
    }

    // Se estivermos na tela de farm, processamos a aldeia atual
    if (urlAtual.includes("screen=am_farm")) {
        const aldeias = JSON.parse(localStorage.getItem("aldeiasParaFarm") || "[]");
        let indice = parseInt(localStorage.getItem("indiceAtualFarm") || "0");

        if (!aldeias.length || indice >= aldeias.length) {
            alert("Farm concluído para todas as aldeias!");
            localStorage.removeItem("aldeiasParaFarm");
            localStorage.removeItem("indiceAtualFarm");
            return;
        }

        const processar = () => {
            let botao = document.querySelector('a[class$="farm_icon farm_icon_b"]');

            if (botao && !botao.classList.contains('start_locked')) {
                botao.click();
            }

            indice++;
            salvarProgresso(aldeias, indice);

            if (indice < aldeias.length) {
                const proxima = aldeias[indice];
                const tempo = Math.floor(Math.random() * (1000 - 500)) + 500;

                setTimeout(() => {
                    window.location.href = `https://br134.tribalwars.com.br/game.php?village=${proxima}&screen=am_farm`;
                }, tempo);
            } else {
                alert("Farm concluído para todas as aldeias!");
                localStorage.removeItem("aldeiasParaFarm");
                localStorage.removeItem("indiceAtualFarm");
            }
        };

        // Espera o DOM carregar antes de tentar clicar
        window.addEventListener('load', () => {
            setTimeout(processar, 1000); // espera 1s após o carregamento
        });
    }
})();