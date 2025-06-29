/**
 * Tribal Wars – Balanceador de Recursos (1 viagem por mercador)
 * Revisão 2025‑06‑29
 * Autor original: Haja.Paciencia  |  Revisado por ChatGPT
 *
 * COMO USAR
 * 1. Abra a visão geral de produção (game.php?screen=overview_villages&mode=prod&page=-1).
 * 2. Cole TODO este script no console ou em um bookmarklet.
 * 3. Confirme o prompt “Gerar X ordens de mercado?”.
 * 4. O script coleta os dados, calcula as remessas e envia (1 viagem/mercador livre).
 *
 * Parâmetros de `balanceResources` (opcionais):
 *   keepRatio – fração mínima de estoque nas vilas send‑only  [0‑1] (padrão 0.30)
 *   carry     – carga de 1 mercador (padrão 1000)
 *   round     – arredondar para múltiplos de carry? (padrão true)
 */

/* ------------------------------------------------------------------ *
 * F U N Ç Õ E S   A U X I L I A R E S                                 *
 * ------------------------------------------------------------------ */

const ceilTo = (v, step) => Math.ceil(v / step) * step;
const sleep  = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ *
 * B A L A N C E A M E N T O                                           *
 * ------------------------------------------------------------------ */

function balanceResources(villas, {
  keepRatio = 0.30,
  carry     = 1000,
  round     = true,
} = {}) {

  const TYPES = ['wood', 'stone', 'iron'];

  const senders   = villas.filter(v => v.sendOnly);
  const receivers = villas.filter(v => !v.sendOnly);

  villas.forEach(v => {
    v.excess  = { wood:0, stone:0, iron:0 };
    v.deficit = { wood:0, stone:0, iron:0 };
    v.capLeft = v.merchants * carry;
  });

  /* ------------ 1. EXCESSO / DÉFICIT ----------------------------- */
  TYPES.forEach(r => {
    const totalRes   = villas   .reduce((s,v) => s + v.res[r], 0);
    const keepSum    = senders  .reduce((s,v) => s + keepRatio * v.store, 0);
    const recipStore = receivers.reduce((s,v) => s + v.store, 0);
    const g = (totalRes - keepSum) / recipStore;

    senders.forEach(v => {
      v.excess[r] = Math.max(0, v.res[r] - keepRatio * v.store);
    });

    receivers.forEach(v => {
      const target = g * v.store;
      if (v.res[r] >= target) {
        v.excess [r] = v.res[r] - target;
      } else {
        v.deficit[r] = target - v.res[r];
      }
    });
  });

  /* ------------ 2. LIMITE DE MERCADORES -------------------------- */
  villas.forEach(v => {
    const totalExc = TYPES.reduce((s,r) => s + v.excess[r], 0);
    if (totalExc > v.capLeft && totalExc > 0) {
      const f = v.capLeft / totalExc;
      TYPES.forEach(r => v.excess[r] *= f);
    }
  });

  /* ------------ 3. EMPARELHAMENTO -------------------------------- */
  const orders = [];

  TYPES.forEach(r => {

    const donors = villas
      .filter(v => v.excess[r]  > 0)
      .sort((a,b) => b.excess [r] - a.excess [r]);

    const takers = receivers
      .filter(v => v.deficit[r] > 0)
      .sort((a,b) => b.deficit[r] - a.deficit[r]);

    let i = 0, j = 0;
    while (i < donors.length && j < takers.length) {

      const d = donors[i];
      const t = takers[j];

      const sendable   = Math.min(d.excess[r], d.capLeft);
      const receivable = Math.min(
        t.deficit[r],
        t.store - (t.res[r] + (t.incoming?.[r] || 0))
      );

      if (sendable   <= 0) { i++; continue; }
      if (receivable <= 0) { j++; continue; }

      let qty = Math.min(sendable, receivable);

      if (round) {
        qty = ceilTo(qty, carry);
        qty = Math.min(qty, sendable, receivable);
      }

      if (qty > 0) {
        orders.push({
          from: d.id, to: t.id,
          wood : r === 'wood'  ? qty : 0,
          stone: r === 'stone' ? qty : 0,
          iron : r === 'iron'  ? qty : 0
        });

        d.excess [r] -= qty;
        d.capLeft     = Math.max(0, d.capLeft - qty);
        t.deficit[r] -= qty;
        t.incoming = t.incoming || { wood:0, stone:0, iron:0 };
        t.incoming[r] += qty;
      }

      if (d.excess [r] <= 0 || d.capLeft <= 0) i++;
      if (t.deficit[r] <= 0)                      j++;
    }
  });

  return orders;
}

/* ------------------------------------------------------------------ *
 * C O L E T A   D E   D A D O S                                       *
 * ------------------------------------------------------------------ */

function getVillas() {

  const $page = $(document.documentElement);

  const woodTotals      = [];
  const stoneTotals     = [];
  const ironTotals      = [];
  const warehouseCaps   = [];
  const availMerchants  = [];
  const farmUsed        = [];

  const woodEls  = $page.find('.res.wood, .warn_90.wood, .warn.wood');
  const stoneEls = $page.find('.res.stone, .warn_90.stone, .warn.stone');
  const ironEls  = $page.find('.res.iron, .warn_90.iron, .warn.iron');
  const villageEls = $page.find('.quickedit-vn');

  const num = txt => Number(txt.replace(/\./g,'').replace(',',''));

  woodEls .each((_,el) => woodTotals .push(num(el.textContent)));
  stoneEls.each((_,el) => stoneTotals.push(num(el.textContent)));
  ironEls .each((_,el) => ironTotals .push(num(el.textContent)));

  villageEls.each((i,el) => {
    const row = ironEls[i].parentElement;

    warehouseCaps .push(Number(row.nextElementSibling.textContent.replace(/\D/g,'')));

    const mercMatch = row.nextElementSibling.nextElementSibling.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    availMerchants.push(Number(mercMatch[1]));

    const farmMatch = row.nextElementSibling.nextElementSibling.nextElementSibling.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    farmUsed.push(Number(farmMatch[1]));
  });

  /* ----- estrutura final ----------------------------------------- */
  const villas = [];
  villageEls.each((i,el) => {
    villas.push({
      id:        el.dataset.id,
      name:      el.textContent.trim().match(/\d+\|\d+/)[0],
      store:     warehouseCaps [i],
      merchants: availMerchants[i],
      sendOnly:  farmUsed[i] >= 24000,
      res: {
        wood : woodTotals [i],
        stone: stoneTotals[i],
        iron : ironTotals [i]
      }
    });
  });

  return villas;
}

/* ------------------------------------------------------------------ *
 * E N V I O   A U T O M Á T I C O                                     *
 * ------------------------------------------------------------------ */

function sendResource(sourceID, targetID, wood, stone, iron) {
  const payload = { target_id: targetID, wood, stone, iron };
  TribalWars.post(
    'market',
    { ajaxaction:'map_send', village:sourceID },
    payload,
    res => UI.SuccessMessage(res.message),
    false
  );
}

async function processarEnviosComIntervalo(orders) {
  for (const o of orders) {
    sendResource(o.from, o.to, o.wood, o.stone, o.iron);
    await sleep(800);   // 0,8 s entre envios
  }
}

/* ------------------------------------------------------------------ *
 * I N I C I A                                                        *
 * ------------------------------------------------------------------ */

console.log('Coletando dados...');
const villas  = getVillas();
console.table(villas);

console.log('Calculando remessas...');
const orders  = balanceResources(villas, { keepRatio:0.0 });
console.table(orders);

if (orders.length === 0) {
  UI.InfoMessage('Nenhuma remessa necessária.');
} else if (confirm(`Gerar ${orders.length} ordens de mercado?`)) {
  processarEnviosComIntervalo(orders);
}
