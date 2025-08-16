/*TRATAMENTOS DE ERRO DE EXECUÇÃO*/
//if (!window.location.href.includes("screen=overview_villages&mode=prod")) {
if (!(window.location.href.includes("screen=overview_villages") && window.location.href.includes("mode=prod"))) {
    alert("O script precisa ser executado na página Visualizações -> Produção");
    throw new Error("Script interrompido. Página incorreta.");
}

function getSumResource(resourceType) {
    const elements = document.querySelectorAll('.res.'+resourceType);
    let total = 0;

    elements.forEach(element => {
        const value = parseInt(element.textContent.replace(/\D/g, ''), 10);
        if (!isNaN(value)) {
            total += value;
        }
    });

    return total;
}

const wood = getSumResource('wood');
const stone = getSumResource('stone');
const iron = getSumResource('iron');
const msg = `Madeira: ${wood} | Argila: ${stone} | Ferro: ${iron}`;
alert(msg);