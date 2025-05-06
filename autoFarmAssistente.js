// Seleciona todos os spans com a classe 'quickedit-content'
const spans = document.querySelectorAll('.quickedit-content');

const villageIds = [];

spans.forEach(span => {
    // Seleciona o primeiro <a> dentro do span
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

//console.log(villageIds); // Exibe um array com todos os IDs de village encontrados
alert("IDs das aldeias:\n" + villageIds.join(", "));
var url = "https://br134.tribalwars.com.br/game.php?village="+villageIds[0]+"&screen=am_farm";
window.location.href = url;


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