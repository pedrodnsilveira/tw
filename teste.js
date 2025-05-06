const urlAtual = window.location.href;

if (!(urlAtual.includes("screen=overview_villages"))) {
    alert("O script deve ser rodado na tela de visualização de aldeias");
    return;
}

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
//alert("IDs das aldeias:\n" + villageIds.join(", "));
for (let item of villageIds) {
    var url = "https://br134.tribalwars.com.br/game.php?village="+item+"&screen=am_farm";
    window.location.href = url;

    let elemento = document.querySelector('a[class$="farm_icon farm_icon_b"]');

    if (elemento && elemento.classList.contains('start_locked')) {
        continue;
    } else {
        (function () {
            //if (confirm("Começar o envio?")) {
            /*function realizarAcao() {
                //let linkB = document.querySelector('a[class$="farm_icon farm_icon_b"]');
                if (elemento) {
                    elemento.click();
                } else {
                    console.error("Elemento não encontrado:", elemento);
                }
            }*/
            elemento.click();
    
            var tempo = Math.floor(Math.random() * (850 - 300)) + 300;
    
            setTimeout(function () {
                realizarAcao();
                setInterval(realizarAcao, tempo);
            }, tempo);
            //}
        })();
    }
}