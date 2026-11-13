/**
 * Cliente da API do SafeCity.
 *
 * A URL vem da variável EXPO_PUBLIC_API_URL (arquivo .env). Ela pode apontar para:
 *  - o mock local (json-server, `npm run api`), ou
 *  - o backend da equipe (disciplinas de SOA / C#), desde que siga o mesmo contrato.
 *
 * Contrato:
 *   GET  /zonas        -> ZonaRisco[]
 *   GET  /ocorrencias  -> RelatoComunidade[]
 *   POST /ocorrencias  -> cria um relato (sem dados pessoais)
 *
 * Sem API configurada ou sem internet, o app continua funcionando com o último
 * cache salvo no SQLite ou com os dados simulados embutidos (mock-api/db.json).
 */
import mock from '../../mock-api/db.json';

import type { Relato, RelatoComunidade, TipoRelato, ZonaRisco } from '@/types';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');
const TEMPO_LIMITE_MS = 6000;

export const apiConfigurada = API_URL.length > 0;
export const enderecoApi = API_URL;

export class ApiIndisponivelError extends Error {
  constructor(motivo: string) {
    super(motivo);
    this.name = 'ApiIndisponivelError';
  }
}

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  if (!apiConfigurada) throw new ApiIndisponivelError('API não configurada');

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      ...init,
      signal: controle.signal,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
    });
    if (!resposta.ok) throw new ApiIndisponivelError(`HTTP ${resposta.status}`);
    return (await resposta.json()) as T;
  } catch (erro) {
    if (erro instanceof ApiIndisponivelError) throw erro;
    throw new ApiIndisponivelError(erro instanceof Error ? erro.message : 'Falha de rede');
  } finally {
    clearTimeout(timer);
  }
}

const TIPOS_RELATO: TipoRelato[] = ['furto', 'roubo', 'tentativa', 'suspeita'];
const ehNumero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Aceita só zonas bem formadas: protege o app de respostas inesperadas do backend. */
export function validarZonas(dados: unknown): ZonaRisco[] {
  if (!Array.isArray(dados)) return [];
  return dados.filter((z): z is ZonaRisco => {
    return (
      !!z &&
      typeof z === 'object' &&
      typeof z.id === 'string' &&
      typeof z.nome === 'string' &&
      ehNumero(z.latitude) &&
      ehNumero(z.longitude) &&
      ehNumero(z.raioMetros) &&
      Array.isArray(z.riscoPorHora) &&
      z.riscoPorHora.length === 24 &&
      z.riscoPorHora.every(ehNumero)
    );
  }).map((z) => ({
    ...z,
    bairro: typeof z.bairro === 'string' ? z.bairro : '',
    dicas: Array.isArray(z.dicas) ? z.dicas.filter((d) => typeof d === 'string') : [],
    ocorrenciasUltimos30Dias: ehNumero(z.ocorrenciasUltimos30Dias) ? z.ocorrenciasUltimos30Dias : 0,
  }));
}

export function validarRelatosComunidade(dados: unknown): RelatoComunidade[] {
  if (!Array.isArray(dados)) return [];
  return dados.filter(
    (r): r is RelatoComunidade =>
      !!r &&
      typeof r === 'object' &&
      TIPOS_RELATO.includes(r.tipo) &&
      ehNumero(r.latitude) &&
      ehNumero(r.longitude) &&
      typeof r.ocorridoEm === 'string',
  );
}

export async function buscarZonas(): Promise<ZonaRisco[]> {
  const zonas = validarZonas(await requisitar<unknown>('/zonas'));
  if (zonas.length === 0) throw new ApiIndisponivelError('A API não retornou zonas válidas');
  return zonas;
}

export async function buscarRelatosComunidade(): Promise<RelatoComunidade[]> {
  return validarRelatosComunidade(await requisitar<unknown>('/ocorrencias'));
}

/** Envia só o necessário: tipo, local aproximado e horário. Nada de descrição ou dados do usuário. */
export async function enviarRelato(relato: Relato): Promise<void> {
  await requisitar('/ocorrencias', {
    method: 'POST',
    body: JSON.stringify({
      tipo: relato.tipo,
      // 3 casas decimais ≈ 100 m: suficiente para o mapa de risco, sem expor o endereço exato.
      latitude: Math.round(relato.latitude * 1000) / 1000,
      longitude: Math.round(relato.longitude * 1000) / 1000,
      ocorridoEm: relato.ocorridoEm,
    }),
  });
}

/** Dados simulados embutidos no app, usados quando não há API nem cache. */
export async function carregarMock(): Promise<{
  zonas: ZonaRisco[];
  relatos: RelatoComunidade[];
}> {
  // Pequena espera para simular a latência de rede e exibir o estado de carregamento.
  await new Promise((resolver) => setTimeout(resolver, 400));
  const relatos = validarRelatosComunidade(mock.ocorrencias);
  // Os relatos simulados "envelhecem"; deslocamos as datas para que o mais recente
  // seja de 1 hora atrás, mantendo a demonstração coerente em qualquer dia.
  const maisRecente = Math.max(...relatos.map((r) => Date.parse(r.ocorridoEm)));
  const deslocamento = relatos.length > 0 ? Date.now() - 60 * 60 * 1000 - maisRecente : 0;
  return {
    zonas: validarZonas(mock.zonas),
    relatos: relatos.map((r) => ({
      ...r,
      ocorridoEm: new Date(Date.parse(r.ocorridoEm) + deslocamento).toISOString(),
    })),
  };
}
