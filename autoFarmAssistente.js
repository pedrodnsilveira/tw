(function () {
    if (confirm("Começar o envio?")) {
        function realizarAcao() {
            let linkB = document.querySelector('a[class$="farm_icon farm_icon_b"]');
            if (linkB) {
                linkB.click();
            } else {
                console.error("Elemento não encontrado:", linkB);
            }
        }

        var numeroAleatorio2 = Math.floor(Math.random() * (850 - 300)) + 300;

        setTimeout(function () {
            realizarAcao();
            setInterval(realizarAcao, numeroAleatorio2);
        }, numeroAleatorio2);
    }
})();