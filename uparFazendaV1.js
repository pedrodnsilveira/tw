/*TRATAMENTO DE ERRO DE EXECUÇÃO*/
if (!window.location.href.includes("screen=overview_villages&mode=prod")) {
    alert("O script precisa ser executado na página de Visualizações -> Produção");
    throw new Error("Script interrompido. Página incorreta.");
}

const CAP_POR_MERCADOR = 1000;

const recursosPorCapacidade = {
    1002: { madeira: 620, argila: 642, ferro: 383 },
    1174: { madeira: 806, argila: 848, ferro: 494 },
    1376: { madeira: 1048, argila: 1119, ferro: 637 },
    1613: { madeira: 1363, argila: 1477, ferro: 822 },
    1891: { madeira: 1772, argila: 1950, ferro: 1060 },
    2216: { madeira: 2303, argila: 2574, ferro: 1368 },
    2598: { madeira: 2994, argila: 3398, ferro: 1764 },
    3045: { madeira: 3893, argila: 4486, ferro: 2276 },
    3569: { madeira: 5060, argila: 5921, ferro: 2936 },
    4183: { madeira: 6579, argila: 7816, ferro: 3787 },
    4904: { madeira: 8552, argila: 10317, ferro: 4886 },
    5748: { madeira: 11118, argila: 13618, ferro: 6302 },
    6737: { madeira: 14453, argila: 17976, ferro: 8130 },
    7896: { madeira: 18789, argila: 23728, ferro: 10488 },
    9255: { madeira: 24426, argila: 31321, ferro: 13529 },
    10848: { madeira: 31754, argila: 41344, ferro: 17453 },
    12715: { madeira: 41280, argila: 54574, ferro: 22514 },
    14904: { madeira: 53664, argila: 72037, ferro: 29043 },
    17469: { madeira: 69763, argila: 95089, ferro: 37466 },
    20476: { madeira: 90692, argila: 125517, ferro: 48331 }
};
var VillagesIDs = {};

const tabela = document.getElementById("production_table");
const linhas = tabela.querySelectorAll("tr");

const vilasParaUpar = getVilasNecessariasUparFazenda(linhas);
const [vilasFinalizadas, vilasNaoFinalizadas] = getRecursosVilas(linhas);
const rotas = distribuirRecursos(vilasParaUpar, vilasFinalizadas, vilasNaoFinalizadas);
const rotasComId = substituirCoordenadaPorId(rotas,VillagesIDs);

/*console.log(vilasParaUpar);
console.log(vilasFinalizadas);
console.log(vilasNaoFinalizadas);
console.log(VillagesIDs);
console.log(rotasComId);*/

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processarEnviosComIntervalo(dados) {
    for (const item of dados) {
        sendResource(item[0], item[1], item[2], item[3], item[4]);
        await sleep(500); // espera 0,5 segundo entre envios
    }
}

function formatarMensagemEnvios(envios) {
    let mensagem = "Envios:\nORIGEM -> DESTINO : Madeira,Argila,Ferro\n";

    for (const [origem, destino, madeira, argila, ferro] of envios) {
        mensagem += `${origem} -> ${destino} : ${madeira},${argila},${ferro}\n`;
    }

    mensagem += "\nComeçar?";
    return mensagem;
}

if (rotas.length < 1) {
    alert("Nenhum envio disponível ou necessário");
}
else{
    const msg = formatarMensagemEnvios(rotas);
    if (confirm(msg)) {
        processarEnviosComIntervalo(rotasComId);
    }
}

// ================================
// Funções Auxiliares
// ================================

function getCoord(str) {
    const match = str.match(/\((\d+\|\d+)\)/);
    return match ? match[1] : null;
}

function calcularDistancia(coord1, coord2) {
    const [x1, y1] = coord1.split('|').map(Number);
    const [x2, y2] = coord2.split('|').map(Number);
    return +Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2).toFixed(2);
}

function parseNumeroTexto(texto) {
    return parseInt(texto.replace(/\D/g, ''), 10);
}

function getRecursosDeCelula(celula) {
    return {
        madeira: parseNumeroTexto(celula.querySelector(".res.wood")?.innerText || '0'),
        argila: parseNumeroTexto(celula.querySelector(".res.stone")?.innerText || '0'),
        ferro: parseNumeroTexto(celula.querySelector(".res.iron")?.innerText || '0')
    };
}

function substituirCoordenadaPorId(array, dicionario) {
    return array.map(linha => {
        const novaLinha = [...linha];
        if (dicionario[linha[0]]) novaLinha[0] = dicionario[linha[0]];
        if (dicionario[linha[1]]) novaLinha[1] = dicionario[linha[1]];
        return novaLinha;
    });
}


// ================================
// Coleta de Dados da Tabela
// ================================

function getRecursosVilas(linhas) {
    const finalizadas = [];
    const naoFinalizadas = [];

    linhas.forEach((linha) => {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 7) return;

        const vila = getCoord(celulas[1].innerText.trim());

        const link = celulas[1].querySelector('a[href*="village="]');
        const url = new URL(link.href, window.location.origin); // Usa a URL base da página atual
        const villageId = url.searchParams.get("village");
        VillagesIDs[vila] = villageId;

        const [atual, max] = celulas[6].innerText.trim().split("/").map(Number);

        const mercadoresDisponiveis = parseInt(celulas[5].innerText.trim().split("/")[0], 10);
        const recursos = getRecursosDeCelula(celulas[3]);

        if (atual < 23850) naoFinalizadas.push([vila, recursos.madeira, recursos.argila, recursos.ferro, mercadoresDisponiveis]);
        else finalizadas.push([vila, recursos.madeira, recursos.argila, recursos.ferro, mercadoresDisponiveis]);
    });

    return [finalizadas,naoFinalizadas];
}

function getVilasNecessariasUparFazenda(linhas) {
    const resultado = [];

    linhas.forEach((linha) => {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 7) return;

        const [atual, max] = celulas[6].innerText.trim().split("/").map(Number);
        if (max > 23000 || max - atual >= 100) return;

        const hasFazendaNaFila = celulas[7].querySelector('img[data-title*="Fazenda"]');
        if (hasFazendaNaFila) return;

        const vila = getCoord(celulas[1].innerText.trim());

        const link = celulas[1].querySelector('a[href*="village="]');
        const url = new URL(link.href, window.location.origin); // Usa a URL base da página atual
        const villageId = url.searchParams.get("village");
        VillagesIDs[vila] = villageId;

        const recursos = getRecursosDeCelula(celulas[3]);
        const nec = recursosPorCapacidade[max];

        resultado.push([
            vila,
            Math.max(nec.madeira - recursos.madeira, 0),
            Math.max(nec.argila - recursos.argila, 0),
            Math.max(nec.ferro - recursos.ferro, 0)
        ]);
    });

    return resultado;
}

// ================================
// Distribuição de Recursos
// ================================

function distribuirRecursos(uparFazenda, vilasFinalizadas, vilasNaoFinalizadas) {
    const capacidadePorMercador = 1000;
    const resultado = [];

    // Formata e separa as fontes em iniciais e backup
    const fontesIniciais = vilasFinalizadas.map(v => ({ ...formataFonte(v), tipo: 'finalizada' }));
    const fontesBackup = vilasNaoFinalizadas.map(v => ({ ...formataFonte(v), tipo: 'naoFinalizada' }));

    for (const [destino, necMadeira, necArgila, necFerro] of uparFazenda) {
        let falta = { madeira: necMadeira, argila: necArgila, ferro: necFerro };
        let usandoBackup = false;
        let fontesAtuais = fontesIniciais.slice();

        while ((falta.madeira > 0 || falta.argila > 0 || falta.ferro > 0) && fontesAtuais.length) {
            // Ordena pelas mais próximas
            fontesAtuais.sort((a, b) =>
                                calcularDistancia(a.coord, destino) - calcularDistancia(b.coord, destino)
                                );

            for (const fonte of fontesAtuais) {
                if (fonte.mercadores <= 0) continue;

                const capacidadeTotal = fonte.mercadores * capacidadePorMercador;
                const totalNec = falta.madeira + falta.argila + falta.ferro;
                if (totalNec <= 0) break;

                // Proporções de cada recurso
                const proporcao = {
                    madeira: falta.madeira / totalNec,
                    argila: falta.argila / totalNec,
                    ferro: falta.ferro / totalNec
                };

                // Cálculo inicial
                let envio = {
                    madeira: Math.min(fonte.madeira, Math.floor(capacidadeTotal * proporcao.madeira), falta.madeira),
                    argila: Math.min(fonte.argila, Math.floor(capacidadeTotal * proporcao.argila), falta.argila),
                    ferro: Math.min(fonte.ferro, Math.floor(capacidadeTotal * proporcao.ferro), falta.ferro)
                };

                // Completa o restante de forma balanceada
                let totalEnviado = envio.madeira + envio.argila + envio.ferro;
                let restante = capacidadeTotal - totalEnviado;
                while (restante > 0) {
                    if (falta.madeira > envio.madeira && fonte.madeira > envio.madeira) {
                        envio.madeira++; restante--;
                    } else if (falta.argila > envio.argila && fonte.argila > envio.argila) {
                        envio.argila++; restante--;
                    } else if (falta.ferro > envio.ferro && fonte.ferro > envio.ferro) {
                        envio.ferro++; restante--;
                    } else {
                        break;
                    }
                }

                const usados = envio.madeira + envio.argila + envio.ferro;
                if (usados <= 0) continue;

                // Atualiza fonte
                fonte.madeira -= envio.madeira;
                fonte.argila -= envio.argila;
                fonte.ferro -= envio.ferro;
                fonte.mercadores -= Math.ceil(usados / capacidadePorMercador);

                // Atualiza falta
                falta.madeira -= envio.madeira;
                falta.argila -= envio.argila;
                falta.ferro -= envio.ferro;

                resultado.push([fonte.coord, destino, envio.madeira, envio.argila, envio.ferro]);

                if (falta.madeira <= 0 && falta.argila <= 0 && falta.ferro <= 0) break;
            }

            // Se ainda faltar recurso e já tentou somente fontes iniciais, muda para backup
            if ((falta.madeira > 0 || falta.argila > 0 || falta.ferro > 0) && !usandoBackup) {
                usandoBackup = true;
                fontesAtuais = fontesBackup.slice();
            } else {
                break;
            }
        }
    }

    return resultado;

    function formataFonte([coord, madeira, argila, ferro, mercadores]) {
        return {
            coord,
            madeira: Number(madeira),
            argila:  Number(argila),
            ferro:   Number(ferro),
            mercadores: Number(mercadores)
        };
    }
}

function sendResource(sourceID, targetID, woodAmount, stoneAmount, ironAmount) {
    var e = { "target_id": targetID, "wood": woodAmount, "stone": stoneAmount, "iron": ironAmount };
    TribalWars.post("market", {
        ajaxaction: "map_send", village: sourceID
    }, e, function (e) {
        UI.SuccessMessage(e.message);
        console.log(e.message);
    },!1);
}
