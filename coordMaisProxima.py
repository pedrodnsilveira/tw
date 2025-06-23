import math

def parse_coord(coord_str):
    """Converte '123|456' para (123, 456)"""
    x, y = map(int, coord_str.split('|'))
    return (x, y)

def distancia(c1, c2):
    """Calcula a distância Euclidiana entre dois pares (x, y)"""
    return math.sqrt((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)

def coordenada_mais_proxima(conjunto, referencia):
    ref = parse_coord(referencia)
    coordenadas = [parse_coord(c) for c in conjunto]
    mais_proxima = min(coordenadas, key=lambda c: distancia(c, ref))
    return f"{mais_proxima[0]}|{mais_proxima[1]}"

# Exemplo de uso:
coordenadas = ["432|565","466|546","425|571","422|570","426|561","468|541","431|565","466|542","451|563","467|545","464|544","467|542","468|544","466|544"]

referencia = "478|566"

mais_perto = coordenada_mais_proxima(coordenadas, referencia)
print("Coordenada mais próxima:", mais_perto)
