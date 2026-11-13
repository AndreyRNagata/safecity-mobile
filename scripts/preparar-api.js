/**
 * Cria mock-api/db.local.json a partir de mock-api/db.json (só na primeira vez).
 * O json-server grava os relatos recebidos (POST) no arquivo local,
 * assim o db.json versionado no Git continua limpo.
 */
const fs = require('fs');
const path = require('path');

const origem = path.join(__dirname, '..', 'mock-api', 'db.json');
const destino = path.join(__dirname, '..', 'mock-api', 'db.local.json');

if (!fs.existsSync(destino) || process.argv.includes('--reset')) {
  fs.copyFileSync(origem, destino);
  console.log('mock-api/db.local.json criado a partir de db.json');
}
