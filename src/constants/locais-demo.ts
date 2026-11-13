/**
 * Locais usados no modo demonstração: permitem mostrar o app funcionando
 * (por exemplo, no vídeo) mesmo fora de São Paulo ou sem GPS.
 */
export const LOCAIS_DEMO = [
  { id: 'paulista-consolacao', rotulo: 'Av. Paulista (FIAP Paulista)', latitude: -23.5574, longitude: -46.6612 },
  { id: 'se', rotulo: 'Praça da Sé', latitude: -23.5505, longitude: -46.6336 },
  { id: 'augusta', rotulo: 'Rua Augusta', latitude: -23.5532, longitude: -46.6528 },
  { id: 'fiap-lins', rotulo: 'FIAP Aclimação (Lins)', latitude: -23.5735, longitude: -46.6233 },
] as const;

export const HORAS_DEMO = [8, 13, 18, 22] as const;

export function localDemo(id: string) {
  return LOCAIS_DEMO.find((l) => l.id === id) ?? LOCAIS_DEMO[0];
}
