const coordenadas = Array.from(document.querySelectorAll('#villages_list tbody tr'))
    .map(row => {
        const colCount = row.children.length;
        const index = colCount === 3 ? 1 : (colCount === 4 ? 2 : -1);
        return index >= 0 ? row.children[index]?.textContent.trim() : null;
    })
    .filter(coord => coord && coord.includes('|'))
    .join(' ');

alert(coordenadas);
