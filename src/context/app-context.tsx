/**
 * Estado global do SafeCity: configurações, dados de risco, posição, relatos
 * e o monitor que dispara os alertas preventivos.
 */
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

import { NIVEIS } from '@/constants/tema';
import {
  APARELHO_PADRAO,
  CONFIGURACOES_PADRAO,
  excluirRelato,
  inserirRelato,
  lerAparelho,
  lerCacheZonas,
  lerConfiguracoes,
  listarRelatos,
  marcarRelatoSincronizado,
  type NovoRelato,
  registrarAlerta,
  salvarAparelho,
  salvarCacheZonas,
  salvarConfiguracoes,
} from '@/db/banco';
import { type StatusLocalizacao, useLocalizacao } from '@/hooks/use-localizacao';
import {
  buscarRelatosComunidade,
  buscarZonas,
  carregarMock,
  enviarRelato,
} from '@/services/api';
import { notificarAgora, prepararNotificacoes } from '@/services/notificacoes';
import { avaliarRisco } from '@/services/risco';
import type {
  AlertaRegistrado,
  Aparelho,
  AvaliacaoRisco,
  Configuracoes,
  FonteDados,
  Posicao,
  Relato,
  RelatoComunidade,
  ZonaRisco,
} from '@/types';

/** Intervalo mínimo entre dois alertas para a mesma zona. */
const INTERVALO_ALERTAS_MS = 30 * 60 * 1000;

interface ValorApp {
  carregado: boolean;
  config: Configuracoes;
  atualizarConfig: (parcial: Partial<Configuracoes>) => Promise<void>;
  escalaFonte: number;

  aparelho: Aparelho;
  salvarDadosAparelho: (dados: Aparelho) => Promise<void>;

  zonas: ZonaRisco[];
  /** Relatos do usuário + da comunidade, sem duplicatas. */
  relatosRecentes: RelatoComunidade[];
  fonteDados: FonteDados;
  carregandoDados: boolean;
  atualizadoEm: string | null;
  recarregarDados: () => Promise<void>;

  relatos: Relato[];
  adicionarRelato: (novo: NovoRelato) => Promise<Relato>;
  removerRelato: (id: number) => Promise<void>;

  posicao: Posicao | null;
  statusLocalizacao: StatusLocalizacao;
  tentarLocalizacaoNovamente: () => void;

  hora: number;
  /** Relógio do app (ms), atualizado a cada minuto. */
  agora: number;
  avaliacao: AvaliacaoRisco | null;
  ultimoAlerta: AlertaRegistrado | null;
}

const AppContext = createContext<ValorApp | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();

  const [carregado, setCarregado] = useState(false);
  const [config, setConfig] = useState<Configuracoes>(CONFIGURACOES_PADRAO);
  const configRef = useRef(config);
  const [aparelho, setAparelho] = useState<Aparelho>(APARELHO_PADRAO);
  const [relatos, setRelatos] = useState<Relato[]>([]);

  const [zonas, setZonas] = useState<ZonaRisco[]>([]);
  const [relatosComunidade, setRelatosComunidade] = useState<RelatoComunidade[]>([]);
  const [fonteDados, setFonteDados] = useState<FonteDados>('mock');
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);

  const [ultimoAlerta, setUltimoAlerta] = useState<AlertaRegistrado | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  // Relógio: reavalia o risco a cada minuto (o risco muda com o horário).
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Dados locais (SQLite).
  useEffect(() => {
    let ativo = true;
    (async () => {
      const [c, a, r] = await Promise.all([lerConfiguracoes(db), lerAparelho(db), listarRelatos(db)]);
      if (!ativo) return;
      configRef.current = c;
      setConfig(c);
      setAparelho(a);
      setRelatos(r);
      setCarregado(true);
    })();
    return () => {
      ativo = false;
    };
  }, [db]);

  /** Envia para a API os relatos que foram salvos offline. */
  const sincronizarPendentes = useCallback(async () => {
    const pendentes = (await listarRelatos(db)).filter((r) => !r.sincronizado);
    if (pendentes.length === 0) return;
    for (const relato of pendentes) {
      try {
        await enviarRelato(relato);
        await marcarRelatoSincronizado(db, relato.id);
      } catch {
        break; // API caiu no meio: tenta de novo na próxima atualização.
      }
    }
    setRelatos(await listarRelatos(db));
  }, [db]);

  /** API -> cache SQLite -> mock embutido, nessa ordem. */
  const carregarDados = useCallback(async () => {
    try {
      const [zonasApi, relatosApi] = await Promise.all([
        buscarZonas(),
        buscarRelatosComunidade().catch(() => [] as RelatoComunidade[]),
      ]);
      setZonas(zonasApi);
      setRelatosComunidade(relatosApi);
      setFonteDados('api');
      setAtualizadoEm(new Date().toISOString());
      await salvarCacheZonas(db, zonasApi);
      await sincronizarPendentes();
    } catch {
      const cache = await lerCacheZonas(db);
      if (cache.zonas.length > 0) {
        setZonas(cache.zonas);
        setRelatosComunidade([]);
        setFonteDados('cache');
        setAtualizadoEm(cache.atualizadoEm);
      } else {
        const mock = await carregarMock();
        setZonas(mock.zonas);
        setRelatosComunidade(mock.relatos);
        setFonteDados('mock');
        setAtualizadoEm(null);
      }
    } finally {
      setCarregandoDados(false);
    }
  }, [db, sincronizarPendentes]);

  // Primeira carga (o estado inicial já é "carregando"; o estado só muda após a resposta).
  useEffect(() => {
    (async () => {
      await carregarDados();
    })();
  }, [carregarDados]);

  const recarregarDados = useCallback(async () => {
    setCarregandoDados(true);
    await carregarDados();
  }, [carregarDados]);

  const atualizarConfig = useCallback(
    async (parcial: Partial<Configuracoes>) => {
      const nova = { ...configRef.current, ...parcial };
      configRef.current = nova;
      setConfig(nova);
      await salvarConfiguracoes(db, nova);
    },
    [db],
  );

  const salvarDadosAparelho = useCallback(
    async (dados: Aparelho) => {
      setAparelho(dados);
      await salvarAparelho(db, dados);
    },
    [db],
  );

  const adicionarRelato = useCallback(
    async (novo: NovoRelato) => {
      let relato = await inserirRelato(db, novo);
      try {
        await enviarRelato(relato);
        await marcarRelatoSincronizado(db, relato.id);
        relato = { ...relato, sincronizado: true };
      } catch {
        // Fica salvo só no celular e é enviado depois (sincronizarPendentes).
      }
      setRelatos(await listarRelatos(db));
      return relato;
    },
    [db],
  );

  const removerRelato = useCallback(
    async (id: number) => {
      await excluirRelato(db, id);
      setRelatos((lista) => lista.filter((r) => r.id !== id));
    },
    [db],
  );

  const {
    posicao,
    status: statusLocalizacao,
    tentarNovamente: tentarLocalizacaoNovamente,
  } = useLocalizacao(config.modoDemo, config.localDemoId);

  const hora =
    config.modoDemo && config.horaSimulada != null ? config.horaSimulada : new Date(agora).getHours();

  // Com a API ativa, os relatos já enviados voltam na lista da comunidade:
  // usamos só os pendentes locais para não contar o mesmo relato duas vezes.
  const relatosRecentes = useMemo(
    () => [
      ...(fonteDados === 'api' ? relatos.filter((r) => !r.sincronizado) : relatos),
      ...relatosComunidade,
    ],
    [fonteDados, relatos, relatosComunidade],
  );

  const avaliacao = useMemo(() => {
    if (!posicao || zonas.length === 0) return null;
    return avaliarRisco(posicao, zonas, hora, relatosRecentes, agora);
  }, [posicao, zonas, hora, relatosRecentes, agora]);

  // Pede permissão de notificação quando os alertas estão ligados.
  useEffect(() => {
    if (carregado && config.alertasAtivos) prepararNotificacoes();
  }, [carregado, config.alertasAtivos]);

  // Monitor de alertas preventivos.
  const ultimosAlertas = useRef<Record<string, number>>({});
  useEffect(() => {
    // Ao trocar local/horário da demonstração, o alerta pode disparar de novo.
    ultimosAlertas.current = {};
  }, [config.modoDemo, config.localDemoId, config.horaSimulada]);

  useEffect(() => {
    if (!carregado || !config.alertasAtivos || !avaliacao?.zona) return;
    if (avaliacao.nivel !== 'alto' && avaliacao.nivel !== 'muito_alto') return;

    const zona = avaliacao.zona;
    const anterior = ultimosAlertas.current[zona.id];
    if (anterior && Date.now() - anterior < INTERVALO_ALERTAS_MS) return;
    ultimosAlertas.current[zona.id] = Date.now();

    const nivel = NIVEIS[avaliacao.nivel];
    const titulo = `Risco ${nivel.rotulo.toLowerCase()} de furto de celular`;
    const corpo = `${zona.nome}: guarde o celular agora. ${zona.dicas[0] ?? ''}`.trim();

    (async () => {
      const alerta = await registrarAlerta(db, {
        zonaId: zona.id,
        zonaNome: zona.nome,
        nivel: avaliacao.nivel,
        score: avaliacao.score,
      });
      setUltimoAlerta(alerta);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      AccessibilityInfo.announceForAccessibility(`${titulo}. ${corpo}`);
      await notificarAgora(titulo, corpo);
    })();
  }, [avaliacao, carregado, config.alertasAtivos, db]);

  const valor: ValorApp = {
    carregado,
    config,
    atualizarConfig,
    escalaFonte: config.textoGrande ? 1.25 : 1,
    aparelho,
    salvarDadosAparelho,
    zonas,
    relatosRecentes,
    fonteDados,
    carregandoDados,
    atualizadoEm,
    recarregarDados,
    relatos,
    adicionarRelato,
    removerRelato,
    posicao,
    statusLocalizacao,
    tentarLocalizacaoNovamente,
    hora,
    agora,
    avaliacao,
    ultimoAlerta,
  };

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp(): ValorApp {
  const valor = useContext(AppContext);
  if (!valor) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return valor;
}
