/**
 * Banco de dados local (SQLite) do SafeCity.
 *
 * Tudo que é pessoal (IMEI, contato de confiança, histórico) fica SOMENTE aqui,
 * no aparelho. A API recebe apenas relatos anônimos.
 */
import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  AlertaRegistrado,
  Aparelho,
  Configuracoes,
  NivelRisco,
  Relato,
  TipoRelato,
  ZonaRisco,
} from '@/types';

export const NOME_BANCO = 'safecity.db';
const VERSAO_ATUAL = 1;

/** Cria/atualiza as tabelas. Chamado pelo SQLiteProvider antes de abrir o app. */
export async function migrarBanco(db: SQLiteDatabase): Promise<void> {
  // Chaves estrangeiras valem por conexão, então ligamos a cada abertura.
  await db.execAsync('PRAGMA foreign_keys = ON');
  const linha = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versao = linha?.user_version ?? 0;
  if (versao >= VERSAO_ATUAL) return;

  if (versao < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS relatos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        descricao TEXT,
        referencia TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        ocorrido_em TEXT NOT NULL,
        criado_em TEXT NOT NULL,
        sincronizado INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS zonas_cache (
        id TEXT PRIMARY KEY NOT NULL,
        dados TEXT NOT NULL,
        atualizado_em TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zona_id TEXT NOT NULL,
        zona_nome TEXT NOT NULL,
        nivel TEXT NOT NULL,
        score REAL NOT NULL,
        criado_em TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hora_ouro_sessoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iniciada_em TEXT NOT NULL,
        finalizada_em TEXT
      );

      CREATE TABLE IF NOT EXISTS hora_ouro_passos (
        sessao_id INTEGER NOT NULL,
        passo_id TEXT NOT NULL,
        concluido_em TEXT NOT NULL,
        PRIMARY KEY (sessao_id, passo_id),
        FOREIGN KEY (sessao_id) REFERENCES hora_ouro_sessoes (id) ON DELETE CASCADE
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${VERSAO_ATUAL}`);
}

/* ---------------------------- Configurações ---------------------------- */

export const CONFIGURACOES_PADRAO: Configuracoes = {
  alertasAtivos: true,
  textoGrande: false,
  modoDemo: false,
  localDemoId: 'paulista-consolacao',
  horaSimulada: null,
};

export const APARELHO_PADRAO: Aparelho = {
  modelo: '',
  imei: '',
  operadora: '',
  telefoneOperadora: '',
  contatoNome: '',
  contatoTelefone: '',
};

async function lerJson<T extends object>(db: SQLiteDatabase, chave: string, padrao: T): Promise<T> {
  const linha = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM configuracoes WHERE chave = ?',
    chave,
  );
  if (!linha) return padrao;
  try {
    return { ...padrao, ...(JSON.parse(linha.valor) as Partial<T>) };
  } catch {
    return padrao;
  }
}

async function gravarJson(db: SQLiteDatabase, chave: string, valor: object): Promise<void> {
  await db.runAsync(
    'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    chave,
    JSON.stringify(valor),
  );
}

export const lerConfiguracoes = (db: SQLiteDatabase) =>
  lerJson(db, 'configuracoes', CONFIGURACOES_PADRAO);
export const salvarConfiguracoes = (db: SQLiteDatabase, c: Configuracoes) =>
  gravarJson(db, 'configuracoes', c);
export const lerAparelho = (db: SQLiteDatabase) => lerJson(db, 'aparelho', APARELHO_PADRAO);
export const salvarAparelho = (db: SQLiteDatabase, a: Aparelho) => gravarJson(db, 'aparelho', a);

/* ------------------------------- Relatos ------------------------------- */

interface LinhaRelato {
  id: number;
  tipo: TipoRelato;
  descricao: string | null;
  referencia: string | null;
  latitude: number;
  longitude: number;
  ocorrido_em: string;
  criado_em: string;
  sincronizado: number;
}

const paraRelato = (l: LinhaRelato): Relato => ({
  id: l.id,
  tipo: l.tipo,
  descricao: l.descricao,
  referencia: l.referencia,
  latitude: l.latitude,
  longitude: l.longitude,
  ocorridoEm: l.ocorrido_em,
  criadoEm: l.criado_em,
  sincronizado: l.sincronizado === 1,
});

export async function listarRelatos(db: SQLiteDatabase): Promise<Relato[]> {
  const linhas = await db.getAllAsync<LinhaRelato>(
    'SELECT * FROM relatos ORDER BY ocorrido_em DESC, id DESC',
  );
  return linhas.map(paraRelato);
}

export type NovoRelato = Omit<Relato, 'id' | 'criadoEm' | 'sincronizado'>;

export async function inserirRelato(db: SQLiteDatabase, novo: NovoRelato): Promise<Relato> {
  const criadoEm = new Date().toISOString();
  const resultado = await db.runAsync(
    `INSERT INTO relatos (tipo, descricao, referencia, latitude, longitude, ocorrido_em, criado_em, sincronizado)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    novo.tipo,
    novo.descricao,
    novo.referencia,
    novo.latitude,
    novo.longitude,
    novo.ocorridoEm,
    criadoEm,
  );
  return { ...novo, id: resultado.lastInsertRowId, criadoEm, sincronizado: false };
}

export async function marcarRelatoSincronizado(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE relatos SET sincronizado = 1 WHERE id = ?', id);
}

export async function excluirRelato(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM relatos WHERE id = ?', id);
}

/* ---------------------------- Cache de zonas --------------------------- */

export async function salvarCacheZonas(db: SQLiteDatabase, zonas: ZonaRisco[]): Promise<void> {
  const agora = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM zonas_cache');
    for (const zona of zonas) {
      await db.runAsync(
        'INSERT INTO zonas_cache (id, dados, atualizado_em) VALUES (?, ?, ?)',
        zona.id,
        JSON.stringify(zona),
        agora,
      );
    }
  });
}

export async function lerCacheZonas(
  db: SQLiteDatabase,
): Promise<{ zonas: ZonaRisco[]; atualizadoEm: string | null }> {
  const linhas = await db.getAllAsync<{ dados: string; atualizado_em: string }>(
    'SELECT dados, atualizado_em FROM zonas_cache',
  );
  const zonas: ZonaRisco[] = [];
  for (const linha of linhas) {
    try {
      zonas.push(JSON.parse(linha.dados) as ZonaRisco);
    } catch {
      // Linha corrompida: ignora e segue com as demais.
    }
  }
  return { zonas, atualizadoEm: linhas[0]?.atualizado_em ?? null };
}

/* ------------------------------- Alertas ------------------------------- */

export async function registrarAlerta(
  db: SQLiteDatabase,
  dados: { zonaId: string; zonaNome: string; nivel: NivelRisco; score: number },
): Promise<AlertaRegistrado> {
  const criadoEm = new Date().toISOString();
  const r = await db.runAsync(
    'INSERT INTO alertas (zona_id, zona_nome, nivel, score, criado_em) VALUES (?, ?, ?, ?, ?)',
    dados.zonaId,
    dados.zonaNome,
    dados.nivel,
    dados.score,
    criadoEm,
  );
  return { id: r.lastInsertRowId, criadoEm, ...dados };
}

/* ----------------------------- Hora de Ouro ---------------------------- */

export interface SessaoHoraDeOuro {
  id: number;
  iniciadaEm: string;
  finalizadaEm: string | null;
  passos: Record<string, string>;
}

async function passosDaSessao(db: SQLiteDatabase, sessaoId: number) {
  const linhas = await db.getAllAsync<{ passo_id: string; concluido_em: string }>(
    'SELECT passo_id, concluido_em FROM hora_ouro_passos WHERE sessao_id = ?',
    sessaoId,
  );
  return Object.fromEntries(linhas.map((l) => [l.passo_id, l.concluido_em]));
}

export async function sessaoAtiva(db: SQLiteDatabase): Promise<SessaoHoraDeOuro | null> {
  const linha = await db.getFirstAsync<{ id: number; iniciada_em: string }>(
    'SELECT id, iniciada_em FROM hora_ouro_sessoes WHERE finalizada_em IS NULL ORDER BY id DESC LIMIT 1',
  );
  if (!linha) return null;
  return {
    id: linha.id,
    iniciadaEm: linha.iniciada_em,
    finalizadaEm: null,
    passos: await passosDaSessao(db, linha.id),
  };
}

export async function iniciarSessao(db: SQLiteDatabase): Promise<SessaoHoraDeOuro> {
  const existente = await sessaoAtiva(db);
  if (existente) return existente;
  const iniciadaEm = new Date().toISOString();
  const r = await db.runAsync('INSERT INTO hora_ouro_sessoes (iniciada_em) VALUES (?)', iniciadaEm);
  return { id: r.lastInsertRowId, iniciadaEm, finalizadaEm: null, passos: {} };
}

export async function alternarPasso(
  db: SQLiteDatabase,
  sessaoId: number,
  passoId: string,
  concluido: boolean,
): Promise<void> {
  if (concluido) {
    await db.runAsync(
      'INSERT OR REPLACE INTO hora_ouro_passos (sessao_id, passo_id, concluido_em) VALUES (?, ?, ?)',
      sessaoId,
      passoId,
      new Date().toISOString(),
    );
  } else {
    await db.runAsync(
      'DELETE FROM hora_ouro_passos WHERE sessao_id = ? AND passo_id = ?',
      sessaoId,
      passoId,
    );
  }
}

export async function finalizarSessao(db: SQLiteDatabase, sessaoId: number): Promise<void> {
  await db.runAsync(
    'UPDATE hora_ouro_sessoes SET finalizada_em = ? WHERE id = ?',
    new Date().toISOString(),
    sessaoId,
  );
}

export async function listarSessoesFinalizadas(db: SQLiteDatabase): Promise<SessaoHoraDeOuro[]> {
  const linhas = await db.getAllAsync<{ id: number; iniciada_em: string; finalizada_em: string }>(
    'SELECT id, iniciada_em, finalizada_em FROM hora_ouro_sessoes WHERE finalizada_em IS NOT NULL ORDER BY id DESC LIMIT 10',
  );
  return Promise.all(
    linhas.map(async (l) => ({
      id: l.id,
      iniciadaEm: l.iniciada_em,
      finalizadaEm: l.finalizada_em,
      passos: await passosDaSessao(db, l.id),
    })),
  );
}

/* ------------------------- Indicadores de impacto ------------------------ */

export interface Indicadores {
  alertasRecebidos: number;
  relatosRegistrados: number;
  sessoesHoraDeOuro: number;
  /** Minutos médios entre iniciar a Hora de Ouro e concluir os passos críticos. */
  minutosMedioPassosCriticos: number | null;
}

export async function lerIndicadores(
  db: SQLiteDatabase,
  passosCriticos: string[],
): Promise<Indicadores> {
  const contar = async (sql: string) =>
    (await db.getFirstAsync<{ total: number }>(sql))?.total ?? 0;

  const marcadores = passosCriticos.map(() => '?').join(', ');
  // Para cada sessão que concluiu TODOS os passos críticos, mede o tempo até o último deles.
  const tempos = await db.getAllAsync<{ minutos: number }>(
    `SELECT (julianday(MAX(p.concluido_em)) - julianday(s.iniciada_em)) * 24 * 60 AS minutos
       FROM hora_ouro_sessoes s
       JOIN hora_ouro_passos p ON p.sessao_id = s.id AND p.passo_id IN (${marcadores})
      GROUP BY s.id
     HAVING COUNT(DISTINCT p.passo_id) = ?`,
    ...passosCriticos,
    passosCriticos.length,
  );

  return {
    alertasRecebidos: await contar('SELECT COUNT(*) AS total FROM alertas'),
    relatosRegistrados: await contar('SELECT COUNT(*) AS total FROM relatos'),
    sessoesHoraDeOuro: await contar('SELECT COUNT(*) AS total FROM hora_ouro_sessoes'),
    minutosMedioPassosCriticos:
      tempos.length > 0
        ? Math.round(tempos.reduce((soma, t) => soma + t.minutos, 0) / tempos.length)
        : null,
  };
}
