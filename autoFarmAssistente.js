let urlAtual = window.location.href;
alert(urlAtual);
if (!urlAtual.includes("screen=overview_villages")) {
    alert("O script deve ser rodado na tela de visualização de aldeias");
    return;
}