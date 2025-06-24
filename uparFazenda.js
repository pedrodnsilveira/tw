// =============================================
// VALIDAÇÃO DE CONTEXTO
// =============================================
if (!window.location.href.includes("screen=overview_villages&mode=prod")) {
    alert("O script precisa ser executado na página de Visualizações -> Produção");
    throw new Error("Script interrompido. Página incorreta.");
}

// =============================================
// CONSTANTES GLOBAIS E CONFIGURAÇÕES
// =============================================
const STORAGE_KEY = "recursos_vilas_usadas";
const TEMPO_ESPERA = 4 * 60 * 60 * 1000; // 4 horas
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

const VillagesIDs = {};

// =============================================
// FUNÇÕES DE LOCALSTORAGE
// =============================================
function carregarVilasValidas() {
    const agora = Date.now();
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    for (const [vilaId, timestamp] of Object.entries(dados)) {
        if (agora - timestamp >= TEMPO_ESPERA) {
            delete dados[vilaId];
        }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    return dados;
}

function marcarVilaComoUsada(vilaId, vilasUsadas) {
    vilasUsadas[vilaId] = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vilasUsadas));
}

// =============================================
// FUNÇÕES DE COLETA DE DADOS DA TABELA
// =============================================
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

function getRecursosVilas(linhas) {
    const finalizadas = [], naoFinalizadas = [];

    linhas.forEach((linha) => {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 7) return;

        const vila = getCoord(celulas[1].innerText.trim());
        const link = celulas[1].querySelector('a[href*="village="]');
        const url = new URL(link.href, window.location.origin);
        VillagesIDs[vila] = url.searchParams.get("village");

        const [atual, max] = celulas[6].innerText.trim().split("/").map(Number);
        const mercadores = parseInt(celulas[5].innerText.trim().split("/")[0], 10);
        const recursos = getRecursosDeCelula(celulas[3]);

        const destino = [vila, recursos.madeira, recursos.argila, recursos.ferro, mercadores];
        (atual < 23850 ? naoFinalizadas : finalizadas).push(destino);
    });

    return [finalizadas, naoFinalizadas];
}

function getVilasNecessariasUparFazenda(linhas) {
    const resultado = [];

    linhas.forEach((linha) => {
        const celulas = linha.querySelectorAll("td");
        if (celulas.length < 7) return;

        const [atual, max] = celulas[6].innerText.trim().split("/").map(Number);
        if (max > 23000 || max - atual >= 400) return;
        if (celulas[7].querySelector('img[data-title*="Fazenda"]')) return;

        const vila = getCoord(celulas[1].innerText.trim());
        const link = celulas[1].querySelector('a[href*="village="]');
        VillagesIDs[vila] = new URL(link.href, window.location.origin).searchParams.get("village");

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

// =============================================
// LÓGICA DE ENVIO DE RECURSOS
// =============================================
function distribuirRecursos(uparFazenda, vilasFinalizadas, vilasNaoFinalizadas) {
    const resultado = [];

    const fontesIniciais = vilasFinalizadas.map(v => ({ ...formatarFonte(v), tipo: 'finalizada' }));
    const fontesBackup = vilasNaoFinalizadas.map(v => ({ ...formatarFonte(v), tipo: 'naoFinalizada' }));

    for (const [dest, mNec, aNec, fNec] of uparFazenda) {
        let falta = { madeira: mNec, argila: aNec, ferro: fNec };
        let fontes = fontesIniciais.slice();
        let usandoBackup = false;

        while ((falta.madeira > 0 || falta.argila > 0 || falta.ferro > 0) && fontes.length > 0) {
            fontes.sort((a, b) => calcularDistancia(a.coord, dest) - calcularDistancia(b.coord, dest));

            for (const fonte of fontes) {
                if (fonte.mercadores <= 0) continue;

                const capTotal = fonte.mercadores * CAP_POR_MERCADOR;
                const totalNec = falta.madeira + falta.argila + falta.ferro;
                if (totalNec <= 0) break;

                const proporcao = {
                    madeira: falta.madeira / totalNec,
                    argila: falta.argila / totalNec,
                    ferro: falta.ferro / totalNec
                };

                let envio = {
                    madeira: Math.min(fonte.madeira, Math.floor(capTotal * proporcao.madeira), falta.madeira),
                    argila: Math.min(fonte.argila, Math.floor(capTotal * proporcao.argila), falta.argila),
                    ferro: Math.min(fonte.ferro, Math.floor(capTotal * proporcao.ferro), falta.ferro)
                };

                let total = envio.madeira + envio.argila + envio.ferro;
                let restante = capTotal - total;

                while (restante > 0) {
                    if (falta.madeira > envio.madeira && fonte.madeira > envio.madeira) envio.madeira++, restante--;
                    else if (falta.argila > envio.argila && fonte.argila > envio.argila) envio.argila++, restante--;
                    else if (falta.ferro > envio.ferro && fonte.ferro > envio.ferro) envio.ferro++, restante--;
                    else break;
                }

                if (total <= 0) continue;

                fonte.madeira -= envio.madeira;
                fonte.argila -= envio.argila;
                fonte.ferro -= envio.ferro;
                fonte.mercadores -= Math.ceil((envio.madeira + envio.argila + envio.ferro) / CAP_POR_MERCADOR);

                falta.madeira -= envio.madeira;
                falta.argila -= envio.argila;
                falta.ferro -= envio.ferro;

                resultado.push([fonte.coord, dest, envio.madeira, envio.argila, envio.ferro]);
                if (falta.madeira <= 0 && falta.argila <= 0 && falta.ferro <= 0) break;
            }

            if ((falta.madeira > 0 || falta.argila > 0 || falta.ferro > 0) && !usandoBackup) {
                fontes = fontesBackup.slice();
                usandoBackup = true;
            } else break;
        }
    }

    return resultado;

    function formatarFonte([coord, madeira, argila, ferro, mercadores]) {
        return {
            coord,
            madeira: Number(madeira),
            argila: Number(argila),
            ferro: Number(ferro),
            mercadores: Number(mercadores)
        };
    }
}

function sendResource(sourceID, targetID, wood, stone, iron) {
    const payload = { target_id: targetID, wood, stone, iron };
    TribalWars.post("market", { ajaxaction: "map_send", village: sourceID }, payload, (res) => {
        UI.SuccessMessage(res.message);
        console.log(res.message);
    }, false);
    marcarVilaComoUsada(targetID, vilasUsadas);
}

function substituirCoordenadaPorId(arr, mapa) {
    return arr.map(([o, d, ...rec]) => [mapa[o] || o, mapa[d] || d, ...rec]);
}

// =============================================
// EXECUÇÃO PRINCIPAL
// =============================================
(async () => {
    const tabela = document.getElementById("production_table");
    const linhas = tabela.querySelectorAll("tr");

    const vilasUsadas = carregarVilasValidas();
    const vilasParaUpar = getVilasNecessariasUparFazenda(linhas);
    const [vilasFinalizadas, vilasNaoFinalizadas] = getRecursosVilas(linhas);

    const vilasUpando = Object.entries(VillagesIDs)
        .filter(([coord, id]) => vilasUsadas.hasOwnProperty(id))
        .map(([coord]) => coord);

    const vilasFiltradas = vilasParaUpar.filter(([coord]) => !vilasUpando.includes(coord));
    const rotas = distribuirRecursos(vilasFiltradas, vilasFinalizadas, vilasNaoFinalizadas);
    const rotasComId = substituirCoordenadaPorId(rotas, VillagesIDs);

    if (rotas.length === 0) {
        alert("Nenhum envio disponível ou necessário");
        return;
    }

    const msg = formatarMensagemEnvios(rotas);
    if (confirm(msg)) {
        for (const item of rotasComId) {
            sendResource(...item);
            await new Promise(r => setTimeout(r, 500)); // 0.5s entre envios
        }
    }

    function formatarMensagemEnvios(envios) {
        let msg = "Envios:\nORIGEM -> DESTINO : Madeira,Argila,Ferro\n";
        for (const [o, d, m, a, f] of envios) msg += `${o} -> ${d} : ${m},${a},${f}\n`;
        return msg + "\nComeçar?";
    }
})();
