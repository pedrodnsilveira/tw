/**
 * Tribal Wars – Balanceador de Recursos (1 viagem por mercador)
 * By Haja.Paciencia
 * COMO USAR ───────────────
 * 1.  Monte um array `villas` no seguinte formato (exemplo logo abaixo).
 * 2.  Cole ESTE SCRIPT inteiro no console, no “Comando” ou num *bookmarklet*.
 * 3.  Chame `balanceResources(villas, { keepRatio: 0.30 })`.
 * 4.  O script devolve um array `orders` com as remessas (já em múltiplos de 1000).
 * 5.  Gere suas ordens de mercado a partir de `orders`.
 *
 * PARÂMETROS (opcionais) ───────────────
 *  keepRatio   → fração do armazém que vilas “send‑only” devem manter (0 – 1). Default = 0.30
 *  carry       → carga de 1 mercador. Default = 1000
 *  round       → se true, arredonda cada remessa p/ múltiplo de carry. Default = true
 *
 * ESTRUTURA DE DADOS ───────────────
 *  vila = {
 *    id:        '12345',        // ou outro identificador
 *    name:      'Aldeia 001',
 *    store:     30000,          // capacidade do armazém
 *    merchants: 18,             // mercadores LIVRES (cada um carrega 1000)
 *    sendOnly:  false,          // true = só envia, nunca recebe
 *    res: { wood: 12000, clay: 8000, iron: 15000 }
 *  }
 *
 *  order = {
 *    from:  'id da origem',
 *    to:    'id do destino',
 *    wood:  0 | 1000 | …,
 *    clay:  0 | 1000 | …,
 *    iron:  0 | 1000 | …
 *  }
 */

// ---------- FUNÇÕES AUXILIARES ----------

// múltiplo superior de `step`
const ceilTo = (value, step) => Math.ceil(value / step) * step;

// ordenação DESC por atributo
const desc = key => (a, b) => b[key] - a[key];

// ---------- FUNÇÃO PRINCIPAL ----------
function balanceResources(villas, {
  keepRatio = 0.30,
  carry     = 1000,
  round     = true,
} = {}) {

  // separa conjuntos
  const senders   = villas.filter(v => v.sendOnly);
  const receivers = villas.filter(v => !v.sendOnly);

  // pre‑inicializa estruturas
  villas.forEach(v => {
    v.excess  = { wood: 0, clay: 0, iron: 0 };
    v.deficit = { wood: 0, clay: 0, iron: 0 };
    v.capLeft = v.merchants * carry;           // 1 viagem por mercador
  });

  // -------- 1. EXCESSO / DÉFICIT --------
  ['wood', 'clay', 'iron'].forEach(resType => {

    // soma total do recurso e soma da capacidade receptora
    const totalRes   = villas.reduce((s, v) => s + v.res[resType], 0);
    const keepSum    = senders.reduce((s, v) => s + keepRatio * v.store, 0);
    const recipStore = receivers.reduce((s, v) => s + v.store, 0);

    // nível‑alvo somente entre receptores
    const g = (totalRes - keepSum) / recipStore;

    // send‑only
    senders.forEach(v => {
      const minKeep = keepRatio * v.store;
      v.excess [resType] = Math.max(0, v.res[resType] - minKeep);
      // déficit fica zero – nunca recebem
    });

    // receptores
    receivers.forEach(v => {
      const target = g * v.store;
      if (v.res[resType] >= target) {
        v.excess [resType] = v.res[resType] - target;
      } else {
        v.deficit[resType] = target - v.res[resType];
      }
    });
  });

  // -------- 2. ESCALA PELO LIMITE DE CARGA --------
  villas.forEach(v => {
    const totalExc = ['wood', 'clay', 'iron']
      .reduce((s, r) => s + v.excess[r], 0);

    if (totalExc > v.capLeft && totalExc > 0) {
      const f = v.capLeft / totalExc;
      ['wood', 'clay', 'iron'].forEach(r => v.excess[r] *= f);
    }
  });

  // -------- 3. EMPARELHAMENTO --------
  const orders = [];

  ['wood', 'clay', 'iron'].forEach(resType => {

    // listas mutáveis de doadores e receptores
    const donors = villas
      .filter(v => v.excess[resType] > 0)
      .sort(desc('excess', resType));

    const takers = receivers
      .filter(v => v.deficit[resType] > 0)
      .sort(desc('deficit', resType));

    // ponteiros
    let i = 0, j = 0;
    while (i < donors.length && j < takers.length) {
      const d = donors[i], t = takers[j];

      // quanto ainda posso enviar/receber
      const sendable  = Math.min(d.excess[resType], d.capLeft);
      const receivable = Math.min(
        t.deficit[resType],
        t.store - (t.res[resType] + t.incoming?.[resType] || 0)
      );

      if (sendable <= 0) { i++; continue; }
      if (receivable <= 0) { j++; continue; }

      // quantidade bruta a transferir
      let qty = Math.min(sendable, receivable);

      // opcionalmente arredonda p/ múltiplo de carry
      if (round) qty = ceilTo(qty, carry);

      if (qty > 0) {
        // registra ordem
        orders.push({
          from: d.id, to: t.id,
          wood:  resType === 'wood' ? qty : 0,
          clay:  resType === 'clay' ? qty : 0,
          iron:  resType === 'iron' ? qty : 0
        });

        // desconta dos saldos
        d.excess [resType] -= qty;
        d.capLeft         -= qty;
        t.deficit[resType] -= qty;
        t.incoming = t.incoming || { wood:0, clay:0, iron:0 };
        t.incoming[resType] += qty;
      }

      // avança ponteiros se algum “zerou”
      if (d.excess[resType] <= 0 || d.capLeft <= 0) i++;
      if (t.deficit[resType] <= 0)                   j++;
    }
  });

  return orders;
}

function getVillas(){
    /*URLReq = "game.php?&screen=overview_villages&mode=prod&page=-1&";
    var villagesData = [];
    $.get(URLReq, function () {
        console.log("Managed to grab the page");
    }).done(function (page) {*/
        const page = document.documentElement.innerHTML;
        allWoodObjects = $(page).find(".res.wood,.warn_90.wood,.warn.wood");
        allClayObjects = $(page).find(".res.stone,.warn_90.stone,.warn.stone");
        allIronObjects = $(page).find(".res.iron,.warn_90.iron,.warn.iron")
        allVillages = $(page).find(".quickedit-vn");

        //grabbing wood amounts
        for (var i = 0; i < allWoodObjects.length; i++) {
            n = allWoodObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allWoodTotals.push(n);
        };

        //grabbing clay amounts
        for (var i = 0; i < allClayObjects.length; i++) {
            n = allClayObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allClayTotals.push(n);
        };

        //grabbing iron amounts
        for (var i = 0; i < allIronObjects.length; i++) {
            n = allIronObjects[i].textContent;
            n = n.replace(/\./g, '').replace(',', '');
            allIronTotals.push(n);
        };

        //grabbing warehouse capacity
        for (var i = 0; i < allVillages.length; i++) {
            warehouseCapacity.push(allIronObjects[i].parentElement.nextElementSibling.innerHTML);
        };

        //grabbing available merchants and total merchants
        for (var i = 0; i < allVillages.length; i++) {
            availableMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
            totalMerchants.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
        };

        //grabbing used farmspace and total farmspace
        for (var i = 0; i < allVillages.length; i++) {
            farmSpaceUsed.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[1]);
            farmSpaceTotal.push(allIronObjects[i].parentElement.nextElementSibling.nextElementSibling.nextElementSibling.innerText.match(/(\d*)\/(\d*)/)[2]);
        };

        //making one big array to work with
        for (var i = 0; i < allVillages.length; i++) {
            so = false;
            if (farmSpaceUsed[i] >= 24000) so = true;
            villagesData.push({
                "id": allVillages[i].dataset.id,
                "name": allVillages[i].innerText.trim().match(/\d+\|\d+/)[0],
                "store": warehouseCapacity[i],
                "merchants": availableMerchants[i],
                "sendOnly": so,
                "res":{"wood": allWoodTotals[i],
                "stone": allClayTotals[i],
                "iron": allIronTotals[i]}
                //"url": allVillages[i].children[0].children[0].href,
                //"name": allVillages[i].innerText.trim(),
                //"totalMerchants": totalMerchants[i],
                //"farmSpaceUsed": farmSpaceUsed[i],
                //"farmSpaceTotal": farmSpaceTotal[i]
            });
        };
    //});
    return villagesData;
}
console.log("OK");
const villas = getVillas();
console.table(villas);
const orders = balanceResources(villas, { keepRatio:0.0 });
console.table(orders);

// ───────── ENVIO ─────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processarEnviosComIntervalo(dados) {
    for (const item of dados) {
        sendResource(item[0], item[1], item[2], item[3], item[4]);
        await sleep(800); // espera 0,5 segundo entre envios
    }
}

function sendResource(sourceID, targetID, wood, stone, iron) {
    const payload = { target_id: targetID, wood, stone, iron };
    TribalWars.post("market", { ajaxaction: "map_send", village: sourceID }, payload, (res) => {
        UI.SuccessMessage(res.message);
        console.log(res.message);
    }, false);
}

if (confirm("Começar?")) {
    processarEnviosComIntervalo(orders);
}
// ───────── EXEMPLO DE USO ─────────
/*
const villas = [
  {
    id:'001', name:'Vila 1', store:30000, merchants:10, sendOnly:false,
    res:{ wood:20000, clay:5000, iron:10000 }
  },
  {
    id:'002', name:'Vila 2', store:24000, merchants:12, sendOnly:true,
    res:{ wood:25000, clay:22000, iron:24000 }
  },
  {
    id:'003', name:'Vila 3', store:18000, merchants: 8, sendOnly:false,
    res:{ wood: 2000, clay:12000, iron: 3000 }
  }
];

const orders = balanceResources(villas, { keepRatio:0.40 });
console.table(orders);
*/
