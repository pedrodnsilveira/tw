const coordenadas = Array.from(document.querySelectorAll('#villages_list tbody tr'))
    .map(row => row.children[1]?.textContent.trim())
    .filter(coord => coord && coord.includes('|'));

alert(coordenadas);
