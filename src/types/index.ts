/** Tipos de domínio do SafeCity. */

export type NivelRisco = 'baixo' | 'moderado' | 'alto' | 'muito_alto';

export type TipoLocal = 'estacao' | 'terminal' | 'avenida' | 'rua' | 'praca';

/**
 * Zona de risco com a previsão do modelo de Machine Learning.
 * `riscoPorHora` tem 24 posições (0h a 23h), com valores de 0 a 1:
 * a probabilidade prevista de furto/roubo de celular naquele horário.
 */
export interface ZonaRisco {
  id: string;
  nome: string;
  bairro: string;
  tipo: TipoLocal;
  latitude: number;
  longitude: number;
  raioMetros: number;
  riscoPorHora: number[];
  ocorrenciasUltimos30Dias: number;
  dicas: string[];
}

export type TipoRelato = 'furto' | 'roubo' | 'tentativa' | 'suspeita';

/** Relato registrado pelo próprio usuário (salvo no SQLite). */
export interface Relato {
  id: number;
  tipo: TipoRelato;
  descricao: string | null;
  referencia: string | null;
  latitude: number;
  longitude: number;
  ocorridoEm: string;
  criadoEm: string;
  sincronizado: boolean;
}

/** Relato vindo da API (outros cidadãos). Sem nenhum dado pessoal. */
export interface RelatoComunidade {
  id: string | number;
  tipo: TipoRelato;
  latitude: number;
  longitude: number;
  ocorridoEm: string;
}

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export type OrigemPosicao = 'gps' | 'demo';

export interface Posicao extends Coordenada {
  origem: OrigemPosicao;
  rotulo?: string;
}

export interface AvaliacaoRisco {
  /** Índice combinado de 0 a 1. */
  score: number;
  nivel: NivelRisco;
  /** Zona que mais contribui para o risco (ou a mais próxima). */
  zona: ZonaRisco | null;
  distanciaM: number | null;
  hora: number;
  relatosProximos: number;
  /** false quando o usuário está longe de todas as zonas mapeadas. */
  dentroDaArea: boolean;
}

export type FonteDados = 'api' | 'cache' | 'mock';

export type Operadora = 'vivo' | 'claro' | 'tim' | 'outra' | '';

export interface Aparelho {
  modelo: string;
  imei: string;
  operadora: Operadora;
  telefoneOperadora: string;
  contatoNome: string;
  contatoTelefone: string;
}

export interface Configuracoes {
  alertasAtivos: boolean;
  textoGrande: boolean;
  modoDemo: boolean;
  localDemoId: string;
  /** Hora usada no lugar do relógio (apenas no modo demonstração). */
  horaSimulada: number | null;
}

export interface AlertaRegistrado {
  id: number;
  zonaId: string;
  zonaNome: string;
  nivel: NivelRisco;
  score: number;
  criadoEm: string;
}
