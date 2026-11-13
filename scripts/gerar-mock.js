/**
 * Gera mock-api/db.json com dados SIMULADOS para o SafeCity.
 *
 * - "zonas": pontos de São Paulo com a previsão de risco por hora (0h–23h),
 *   no mesmo formato que o modelo de ML da equipe deve exportar.
 * - "ocorrencias": relatos de cidadãos fictícios, sem nenhum dado pessoal.
 *
 * Os valores NÃO são dados oficiais. Os perfis de horário imitam o padrão
 * descrito nos dados abertos da SSP-SP (picos de deslocamento e vida noturna),
 * mas cada número aqui é inventado e reproduzível (semente fixa).
 *
 * Uso: npm run gerar-mock
 */
const fs = require('fs');
const path = require('path');

// Gerador pseudoaleatório com semente fixa, para o arquivo sair sempre igual.
let semente = 2026;
function aleatorio() {
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
}

const PERFIS = {
  transporte: [0.15, 0.1, 0.08, 0.06, 0.08, 0.25, 0.55, 0.85, 0.8, 0.5, 0.4, 0.42, 0.45, 0.42, 0.4, 0.45, 0.6, 0.88, 0.92, 0.75, 0.55, 0.4, 0.3, 0.2],
  comercial: [0.1, 0.08, 0.06, 0.05, 0.05, 0.1, 0.2, 0.35, 0.55, 0.7, 0.8, 0.85, 0.88, 0.85, 0.82, 0.8, 0.78, 0.72, 0.6, 0.45, 0.3, 0.22, 0.15, 0.12],
  noturno: [0.75, 0.7, 0.6, 0.4, 0.25, 0.15, 0.12, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.4, 0.38, 0.4, 0.45, 0.55, 0.65, 0.75, 0.82, 0.88, 0.9, 0.85],
};

const DICAS = {
  estacao: [
    'Guarde o celular antes de passar pela catraca e ao entrar no vagão.',
    'Evite usar o celular perto das portas: o "puxão" costuma acontecer na saída do trem.',
    'Fique no meio do vagão e leve a mochila na frente do corpo.',
  ],
  terminal: [
    'Na fila do ônibus, mantenha o celular no bolso da frente ou dentro da bolsa.',
    'Evite usar o celular na janela do ônibus parado no terminal.',
    'Se precisar consultar a rota, faça isso antes de chegar ao terminal.',
  ],
  avenida: [
    'Não use o celular na beira da calçada: motos e bicicletas fazem arrastão.',
    'Se precisar atender, entre em uma loja ou encoste em uma parede.',
    'Desconfie de quem se aproxima pedindo informação.',
  ],
  rua: [
    'À noite, peça a corrida de aplicativo de dentro do bar ou restaurante.',
    'Evite andar com o celular na mão olhando o mapa.',
    'Prefira trechos iluminados e com movimento.',
  ],
  praca: [
    'Evite ficar parado mexendo no celular em pontos de ônibus.',
    'Combine encontros em locais iluminados e com comércio aberto.',
    'Fones chamam atenção: tire-os em locais vazios.',
  ],
};

// [id, nome, bairro, tipo, lat, lng, raio (m), mistura de perfis, intensidade, ocorrências/30 dias]
const ZONAS = [
  ['se', 'Praça da Sé e Estação Sé', 'Sé', 'estacao', -23.5503, -46.6339, 350, { comercial: 0.6, transporte: 0.4 }, 1.0, 412],
  ['republica', 'Estação República', 'República', 'estacao', -23.5442, -46.6424, 300, { transporte: 1 }, 0.95, 298],
  ['luz', 'Estação da Luz', 'Luz', 'estacao', -23.5357, -46.6352, 300, { transporte: 1 }, 0.9, 231],
  ['bras', 'Estação Brás e Rua Oriente', 'Brás', 'terminal', -23.5455, -46.6165, 400, { comercial: 1 }, 0.95, 356],
  ['dom-pedro', 'Terminal Parque Dom Pedro II', 'Sé', 'terminal', -23.548, -46.629, 300, { transporte: 1 }, 0.85, 205],
  ['paulista-consolacao', 'Av. Paulista × R. da Consolação', 'Consolação', 'avenida', -23.5571, -46.662, 300, { transporte: 0.5, noturno: 0.5 }, 0.85, 264],
  ['paulista-masp', 'Av. Paulista – MASP e Trianon', 'Bela Vista', 'avenida', -23.5614, -46.6559, 250, { comercial: 1 }, 0.7, 187],
  ['augusta', 'Rua Augusta (Baixo Augusta)', 'Consolação', 'rua', -23.553, -46.653, 300, { noturno: 1 }, 0.9, 219],
  ['liberdade', 'Praça da Liberdade', 'Liberdade', 'praca', -23.5555, -46.6355, 250, { comercial: 0.6, noturno: 0.4 }, 0.65, 134],
  ['vergueiro', 'Estação Vergueiro', 'Aclimação', 'estacao', -23.5689, -46.6398, 250, { transporte: 1 }, 0.6, 98],
  ['largo-batata', 'Largo da Batata', 'Pinheiros', 'praca', -23.5668, -46.6936, 300, { noturno: 0.5, transporte: 0.5 }, 0.8, 176],
  ['santo-amaro', 'Largo 13 de Maio', 'Santo Amaro', 'praca', -23.6527, -46.7092, 350, { comercial: 1 }, 0.9, 241],
  ['lapa', 'Terminal e Estação Lapa', 'Lapa', 'terminal', -23.5228, -46.7039, 300, { transporte: 1 }, 0.7, 121],
  ['itaquera', 'Terminal Corinthians-Itaquera', 'Itaquera', 'terminal', -23.5424, -46.4712, 400, { transporte: 1 }, 0.75, 143],
];

function arred(valor, casas = 2) {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

const zonas = ZONAS.map(([id, nome, bairro, tipo, latitude, longitude, raioMetros, mistura, intensidade, ocorrencias]) => {
  const riscoPorHora = Array.from({ length: 24 }, (_, hora) => {
    let valor = 0;
    for (const [perfil, peso] of Object.entries(mistura)) valor += PERFIS[perfil][hora] * peso;
    valor = valor * intensidade + (aleatorio() - 0.5) * 0.08;
    return arred(Math.min(0.97, Math.max(0.03, valor)));
  });
  return {
    id,
    nome,
    bairro,
    tipo,
    latitude,
    longitude,
    raioMetros,
    riscoPorHora,
    ocorrenciasUltimos30Dias: ocorrencias,
    dicas: DICAS[tipo],
  };
});

// Relatos fictícios da comunidade nas últimas 72 horas, perto das zonas mais críticas.
const TIPOS = ['furto', 'roubo', 'tentativa', 'suspeita'];
const agora = Date.now();
const ocorrencias = [];
for (let i = 0; i < 18; i++) {
  const zona = zonas[Math.floor(aleatorio() * 8)];
  ocorrencias.push({
    id: i + 1,
    tipo: TIPOS[Math.floor(aleatorio() * TIPOS.length)],
    latitude: arred(zona.latitude + (aleatorio() - 0.5) * 0.004, 5),
    longitude: arred(zona.longitude + (aleatorio() - 0.5) * 0.004, 5),
    ocorridoEm: new Date(agora - Math.floor(aleatorio() * 72) * 3600 * 1000).toISOString(),
  });
}

const destino = path.join(__dirname, '..', 'mock-api', 'db.json');
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify({ zonas, ocorrencias }, null, 2) + '\n');
console.log(`Gerado ${destino}: ${zonas.length} zonas e ${ocorrencias.length} relatos simulados.`);
