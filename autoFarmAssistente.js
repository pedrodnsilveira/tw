if (!window.location.href.includes("screen=overview_villages")) {
    alert("O script deve ser rodado na tela de visualização de aldeias");
    throw new Error("Parando execução do script"); // Para execução
}

(function () {
    const url = window.location.href;

    // Utilidade para salvar progresso no armazenamento local
    function salvarProgresso(lista, indice) {
        localStorage.setItem("listaAldeiasFarm", JSON.stringify(lista));
        localStorage.setItem("indiceAtualFarm", indice.toString());
    }

    // Primeira fase: capturar os IDs das aldeias na tela de overview
    if (url.includes("screen=overview_villages")) {
        const spans = document.querySelectorAll('.quickedit-content');
        const ids = [];

        spans.forEach(span => {
            const link = span.querySelector('a');
            if (link) {
                const href = link.getAttribute('href');
                const params = new URLSearchParams(href.split('?')[1]);
                const id = params.get('village');
                if (id) ids.push(id);
            }
        });

        if (ids.length === 0) {
            alert("Nenhuma aldeia encontrada.");
            return;
        }

        salvarProgresso(ids, 0);
        window.location.href = `https://br134.tribalwars.com.br/game.php?village=${ids[0]}&screen=am_farm`;
        return;
    }

    // Segunda fase: na tela de farm, processar a aldeia atual
    if (url.includes("screen=am_farm")) {
        const lista = JSON.parse(localStorage.getItem("listaAldeiasFarm") || "[]");
        let indice = parseInt(localStorage.getItem("indiceAtualFarm") || "0");

        if (!lista.length || indice >= lista.length) {
            alert("Farm concluído!");
            localStorage.removeItem("listaAldeiasFarm");
            localStorage.removeItem("indiceAtualFarm");
            return;
        }

        // Espera o carregamento do DOM e executa a ação
        window.addEventListener('load', () => {
            setTimeout(() => {
                const botao = document.querySelector('a[class$="farm_icon farm_icon_b"]');

                if (botao && !botao.classList.contains('start_locked')) {
                    botao.click(); // Executa farm
                }

                indice++;
                salvarProgresso(lista, indice);

                if (indice < lista.length) {
                    const proxima = lista[indice];
                    const delay = Math.floor(Math.random() * (5000 - 3000)) + 3000; // 3 a 5 segundos

                    setTimeout(() => {
                        window.location.href = `https://br134.tribalwars.com.br/game.php?village=${proxima}&screen=am_farm`;
                    }, delay);
                } else {
                    alert("Farm concluído!");
                    localStorage.removeItem("listaAldeiasFarm");
                    localStorage.removeItem("indiceAtualFarm");
                }
            }, 1000); // Espera 1s após carregar a página
        });
    }
})();
