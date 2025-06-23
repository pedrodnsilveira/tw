<?php
function getLatLongFromAddress($address) {
    // Substitua por sua chave real da API
    $apiKey = 'AIzaSyCTEm8wiVZlkBbgTBA45P1gO0Nh74JoixE';

    // Codifica o endereço para URL
    $addressEncoded = urlencode($address);

    // Monta a URL
    $url = "https://maps.googleapis.com/maps/api/geocode/json?address={$addressEncoded}&key={$apiKey}";

    // Faz a requisição
    $response = file_get_contents($url);
    
    // Verifica se houve erro na requisição
    if ($response === FALSE) {
        return null;
    }

    // Decodifica o JSON
    $json = json_decode($response, true);

    // Verifica se tem resultados válidos
    if (isset($json['results'][0]['geometry']['location'])) {
        $location = $json['results'][0]['geometry']['location'];
        return [
            'latitude' => $location['lat'],
            'longitude' => $location['lng']
        ];
    } else {
        return null;
    }
}

function getEnderecos(){
    // Configurações do banco de dados
    $host = 'localhost';
    $db = 'receba';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    // Conexão com o banco usando PDO
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);

        // Consulta os endereços
        $sql = "select CONCAT(tx_endereco, ',', nr_numeroCasa,',',tx_bairro,',',cidade,',',estado) as endereco from familia;";
        $stmt = $pdo->query($sql);

        // Exibe os endereços
        while ($row = $stmt->fetch()) {
            //pega as coordenadas aqui
            $coordenadas = getLatLongFromAddress($row['endereco']);
            echo "Latitude: " . $coordenadas['latitude'] . "\n";
            echo "Longitude: " . $coordenadas['longitude'] . "\n";
            //faz o update aqui
        }

    } catch (PDOException $e) {
        echo "Erro na conexão ou na consulta: " . $e->getMessage();
    }
}

// Exemplo de uso
/*$endereco = 'Rua luiz andrade,67,Parana,Jeronimo Monteiro,ES';
$coordenadas = getLatLongFromAddress($endereco);

if ($coordenadas) {
    echo "Latitude: " . $coordenadas['latitude'] . "\n";
    echo "Longitude: " . $coordenadas['longitude'] . "\n";
} else {
    echo "Não foi possível obter as coordenadas.";
}
?>*/