/**
 * Cálculo do risco no app.
 *
 * O modelo de Machine Learning (disciplina de IA) roda fora do celular e entrega,
 * para cada zona, a probabilidade prevista de furto de celular em cada hora do dia
 * (`riscoPorHora`). O app combina essa previsão com:
 *  1. a distância do cidadão até a zona; e
 *  2. relatos recentes de cidadãos por perto (sinal em tempo real que o modelo ainda não viu).
 */
import type {
  AvaliacaoRisco,
  Coordenada,
  NivelRisco,
  RelatoComunidade,
  ZonaRisco,
} from '@/types';

/** Distância máxima até uma zona para considerar que o usuário está na área coberta. */
export const DISTANCIA_COBERTURA_M = 15_000;
/** Raio em que relatos recentes aumentam o risco. */
export const RAIO_RELATOS_M = 400;
/** Janela de tempo em que um relato ainda conta como recente. */
export const JANELA_RELATOS_MS = 7 * 24 * 60 * 60 * 1000;
const BONUS_POR_RELATO = 0.05;
const BONUS_MAXIMO = 0.15;

export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const R = 6_371_000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 1 dentro do raio da zona; cai até 0 quando a distância chega a 3x o raio. */
export function fatorProximidade(distancia: number, raio: number): number {
  if (distancia <= raio) return 1;
  return Math.max(0, 1 - (distancia - raio) / (2 * raio));
}

export function nivelPorScore(score: number): NivelRisco {
  if (score >= 0.75) return 'muito_alto';
  if (score >= 0.55) return 'alto';
  if (score >= 0.3) return 'moderado';
  return 'baixo';
}

export function riscoDaZona(zona: ZonaRisco, hora: number): number {
  return zona.riscoPorHora[((hora % 24) + 24) % 24] ?? 0;
}

export function contarRelatosProximos(
  posicao: Coordenada,
  relatos: Pick<RelatoComunidade, 'latitude' | 'longitude' | 'ocorridoEm'>[],
  agora: number = Date.now(),
): number {
  return relatos.filter((r) => {
    const quando = Date.parse(r.ocorridoEm);
    return (
      Number.isFinite(quando) &&
      agora - quando <= JANELA_RELATOS_MS &&
      distanciaMetros(posicao, r) <= RAIO_RELATOS_M
    );
  }).length;
}

export function avaliarRisco(
  posicao: Coordenada,
  zonas: ZonaRisco[],
  hora: number,
  relatos: Pick<RelatoComunidade, 'latitude' | 'longitude' | 'ocorridoEm'>[] = [],
  agora: number = Date.now(),
): AvaliacaoRisco {
  let melhor: { zona: ZonaRisco; distancia: number; valor: number } | null = null;
  let maisProxima: { zona: ZonaRisco; distancia: number } | null = null;

  for (const zona of zonas) {
    const distancia = distanciaMetros(posicao, zona);
    const valor = riscoDaZona(zona, hora) * fatorProximidade(distancia, zona.raioMetros);
    if (!melhor || valor > melhor.valor) melhor = { zona, distancia, valor };
    if (!maisProxima || distancia < maisProxima.distancia) maisProxima = { zona, distancia };
  }

  const relatosProximos = contarRelatosProximos(posicao, relatos, agora);
  const bonus = Math.min(BONUS_MAXIMO, relatosProximos * BONUS_POR_RELATO);
  const base = melhor?.valor ?? 0;
  const score = Math.min(1, base + bonus);

  // Se nenhuma zona contribui, mostramos a mais próxima como referência.
  const referencia = melhor && melhor.valor > 0 ? melhor : maisProxima;

  return {
    score,
    nivel: nivelPorScore(score),
    zona: referencia?.zona ?? null,
    distanciaM: referencia ? Math.round(referencia.distancia) : null,
    hora,
    relatosProximos,
    dentroDaArea: !!maisProxima && maisProxima.distancia <= DISTANCIA_COBERTURA_M,
  };
}

/** Previsão para as próximas `quantidade` horas no mesmo local. */
export function previsaoProximasHoras(
  posicao: Coordenada,
  zonas: ZonaRisco[],
  horaInicial: number,
  quantidade = 6,
): { hora: number; score: number; nivel: NivelRisco }[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const hora = (horaInicial + i) % 24;
    const { score, nivel } = avaliarRisco(posicao, zonas, hora);
    return { hora, score, nivel };
  });
}

/** Faixas de horário mais perigosas de uma zona, ex.: "7h–8h e 17h–19h". */
export function horariosCriticos(zona: ZonaRisco, limite = 0.55): string {
  const faixas: [number, number][] = [];
  zona.riscoPorHora.forEach((valor, hora) => {
    if (valor < limite) return;
    const ultima = faixas[faixas.length - 1];
    if (ultima && ultima[1] === hora - 1) ultima[1] = hora;
    else faixas.push([hora, hora]);
  });
  if (faixas.length === 0) return 'nenhum horário crítico previsto';
  // Junta faixas que atravessam a meia-noite (ex.: 19h–23h + 0h–1h = 19h–1h).
  if (faixas.length > 1 && faixas[0][0] === 0 && faixas[faixas.length - 1][1] === 23) {
    const primeira = faixas.shift()!;
    faixas[faixas.length - 1][1] = primeira[1];
  }
  const textos = faixas.map(([ini, fim]) => (ini === fim ? `${ini}h` : `${ini}h–${fim}h`));
  if (textos.length === 1) return textos[0];
  return `${textos.slice(0, -1).join(', ')} e ${textos[textos.length - 1]}`;
}

export function formatarDistancia(metros: number | null): string {
  if (metros == null) return '';
  if (metros < 1000) return `${Math.round(metros / 10) * 10} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}
