/*TRATAMENTOS DE ERRO DE EXECUÇÃO*/
if (!window.location.href.includes("screen=report&mode=all")) {
    alert("O script precisa ser executado na página de relatórios, na pasta 'Novos Relatórios' ou 'Todos'");
    throw new Error("Script interrompido. Página incorreta.");
}

const playerFilter = document.getElementById('filter_subject')?.value || '';
if (playerFilter === '') {
    alert("Antes de executar você deve filtrar pelo nome (completo e correto) de algum jogador.");
    throw new Error("Script interrompido. Página incorreta.");
}
/*TRATAMENTOS DE ERRO DE EXECUÇÃO*/

let recursos = {
    Madeira: 0,
    Argila: 0,
    Ferro: 0
};
let totalLinks = 0;
let linksProcessados = 0;

async function fetchContent(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const resources = [...doc.querySelectorAll('span.nowrap')].filter(
            el => el.classList.length === 1 && el.classList.contains('nowrap')
        );

        resources.forEach(resource => {
            const elem = resource.querySelector('[title], [data-title]');
            const title = elem?.getAttribute('title') || elem?.getAttribute('data-title');
            const rawText = resource.innerText || resource.textContent;
            const value = parseInt(rawText.replace(/\D/g, ''), 10);

            if (title && !isNaN(value) && recursos.hasOwnProperty(title)) {
                recursos[title] += value;
            }
        });

        linksProcessados++;
        if (linksProcessados === totalLinks) {
            exibirResultado();
        }
    } catch (error) {
        console.error("Erro ao acessar " + url + ": ", error);
        linksProcessados++;
        if (linksProcessados === totalLinks) {
            exibirResultado();
        }
    }
}

function exibirResultado() {
    let mensagem = '';
    for (let chave in recursos) {
        mensagem += `${chave}: ${recursos[chave]}\n`;
    }
    alert(mensagem);
    location.reload();
}

async function realizaAcao(tipo) {
    recursos = {
        Madeira: 0,
        Argila: 0,
        Ferro: 0
    };
    linksProcessados = 0;

    const playerFilter = document.getElementById('filter_subject')?.value || '';

    let filtro = "forneceu " + playerFilter; // Enviados
    if (tipo === 1) {
        filtro = playerFilter + " forneceu"; // Recebidos
    }

    const links = [...document.querySelectorAll('a.report-link')].filter(
        link => link.textContent.includes(filtro)
    );
    totalLinks = links.length;

    if (totalLinks === 0) {
        const acao = tipo === 1 ? "RECEBIDOS" : "ENVIADOS";
        const msg = `Nenhum relatório de recursos ${acao} foi encontrado para o jogador ${playerFilter}`;
        alert(msg);
        return;
    }

    // Usando um loop for...of para garantir que as requisições sejam feitas sequencialmente
    for (let link of links) {
        if (link.textContent.toLowerCase().includes('forneceu')) {
            await fetchContent(link.href); // Espera a requisição anterior terminar antes de chamar a próxima
        }
    }
}

(function () {
    // Cria o overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';

    // Cria a caixa de diálogo
    const dialog = document.createElement('div');
    dialog.style.background = '#fff';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '8px';
    dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    dialog.innerHTML = `
        <p>Escolha uma opção:</p>
        <label><input type="radio" name="opcao" value="0" checked> Enviados</label><br>
        <label><input type="radio" name="opcao" value="1"> Recebidos</label><br><br>
        <button id="confirmarBtn">Confirmar</button>
        <button id="cancelarBtn">Cancelar</button>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Adiciona eventos aos botões
    const confirmarBtn = dialog.querySelector('#confirmarBtn');
    const cancelarBtn = dialog.querySelector('#cancelarBtn');

    confirmarBtn.addEventListener('click', function () {
        const selecionado = dialog.querySelector('input[name="opcao"]:checked');
        realizaAcao(parseInt(selecionado.value));
        document.body.removeChild(overlay);
    });

    cancelarBtn.addEventListener('click', function () {
        document.body.removeChild(overlay);
    });
})();
