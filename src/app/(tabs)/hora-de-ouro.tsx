/**
 * Hora de Ouro: passo a passo para os primeiros 60 minutos depois do furto/roubo.
 * O progresso fica salvo no SQLite, então sobrevive se o app for fechado.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { Botao, Cartao, Tela, Texto, TituloSecao } from '@/components/ui';
import {
  type AcaoPasso,
  DURACAO_HORA_DE_OURO_MIN,
  OPERADORAS,
  PASSOS_HORA_DE_OURO,
  type PassoHoraDeOuro,
} from '@/constants/hora-de-ouro';
import { ALVO_TOQUE_MIN, Espaco, Raio } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import {
  alternarPasso,
  finalizarSessao,
  iniciarSessao,
  listarSessoesFinalizadas,
  sessaoAtiva,
  type SessaoHoraDeOuro,
} from '@/db/banco';
import { useTema } from '@/hooks/use-tema';
import { avisar, confirmar, formatarCronometro, formatarDataHora } from '@/utils/formatos';

export default function HoraDeOuro() {
  const db = useSQLiteContext();
  const { iniciar } = useLocalSearchParams<{ iniciar?: string }>();
  const [sessao, setSessao] = useState<SessaoHoraDeOuro | null>(null);
  const [historico, setHistorico] = useState<SessaoHoraDeOuro[]>([]);
  const [carregado, setCarregado] = useState(false);

  const anunciarInicio = () =>
    AccessibilityInfo.announceForAccessibility(
      'Hora de Ouro iniciada. Siga os passos na ordem. O cronômetro está contando.',
    );

  const carregar = useCallback(
    async (iniciarAutomaticamente: boolean) => {
      let ativa = await sessaoAtiva(db);
      if (!ativa && iniciarAutomaticamente) {
        ativa = await iniciarSessao(db);
        anunciarInicio();
      }
      setSessao(ativa);
      setHistorico(await listarSessoesFinalizadas(db));
      setCarregado(true);
    },
    [db],
  );

  // Vindo do botão "Fui roubado(a)" da tela inicial (?iniciar=1): começa direto, sem toque extra.
  useFocusEffect(
    useCallback(() => {
      const automatico = iniciar === '1';
      if (automatico) router.setParams({ iniciar: undefined });
      carregar(automatico);
    }, [carregar, iniciar]),
  );

  const comecar = async () => {
    setSessao(await iniciarSessao(db));
    anunciarInicio();
  };

  const marcar = async (passoId: string, concluido: boolean) => {
    if (!sessao) return;
    await alternarPasso(db, sessao.id, passoId, concluido);
    setSessao(await sessaoAtiva(db));
  };

  const encerrar = async () => {
    if (!sessao) return;
    const ok = await confirmar(
      'Encerrar a Hora de Ouro?',
      'O progresso fica salvo no histórico. Você pode iniciar de novo quando quiser.',
      'Encerrar',
    );
    if (!ok) return;
    await finalizarSessao(db, sessao.id);
    await carregar(false);
  };

  if (!carregado) return <Tela titulo="Hora de Ouro">{null}</Tela>;

  return sessao ? (
    <SessaoEmAndamento sessao={sessao} aoMarcar={marcar} aoEncerrar={encerrar} />
  ) : (
    <Inicio historico={historico} aoComecar={comecar} />
  );
}

/* ------------------------------------------------------------------------ */

function Inicio({ historico, aoComecar }: { historico: SessaoHoraDeOuro[]; aoComecar: () => void }) {
  const { aparelho } = useApp();
  const preparado = {
    imei: !!aparelho.imei,
    operadora: !!aparelho.operadora,
    contato: !!aparelho.contatoTelefone,
  };
  const tudoPronto = preparado.imei && preparado.operadora && preparado.contato;

  return (
    <Tela
      titulo="Hora de Ouro"
      subtitulo="Os primeiros 60 minutos depois do furto são decisivos: é quando tentam acessar seus bancos e contas.">
      <Botao
        rotulo="Fui roubado(a): começar agora"
        variante="perigo"
        icone="alarm"
        grande
        dica="Inicia o cronômetro e mostra o que fazer, passo a passo"
        onPress={aoComecar}
      />

      <Cartao>
        <TituloSecao icone="shield-checkmark-outline">Prepare-se antes</TituloSecao>
        <Texto secundario>
          Com esses dados salvos, você age mais rápido. Eles ficam só neste celular.
        </Texto>
        <ItemPreparo ok={preparado.imei} texto="IMEI do aparelho (disque *#06#)" />
        <ItemPreparo ok={preparado.operadora} texto="Sua operadora" />
        <ItemPreparo ok={preparado.contato} texto="Contato de confiança" />
        {!tudoPronto && (
          <Botao
            rotulo="Completar no Perfil"
            variante="secundario"
            icone="create-outline"
            onPress={() => router.push('/perfil')}
          />
        )}
      </Cartao>

      <Cartao>
        <TituloSecao icone="list-outline">O que você vai fazer</TituloSecao>
        {PASSOS_HORA_DE_OURO.map((p, i) => (
          <Texto key={p.id}>
            {i + 1}. {p.titulo} <Texto variante="pequeno" secundario>({p.janela})</Texto>
          </Texto>
        ))}
      </Cartao>

      {historico.length > 0 && (
        <Cartao>
          <TituloSecao icone="time-outline">Histórico</TituloSecao>
          {historico.map((s) => {
            const feitos = Object.keys(s.passos).length;
            const duracao =
              s.finalizadaEm != null ? Date.parse(s.finalizadaEm) - Date.parse(s.iniciadaEm) : 0;
            return (
              <Texto key={s.id} variante="pequeno">
                {formatarDataHora(s.iniciadaEm)} · {feitos} de {PASSOS_HORA_DE_OURO.length} passos ·{' '}
                {formatarCronometro(duracao)}
              </Texto>
            );
          })}
        </Cartao>
      )}
    </Tela>
  );
}

function ItemPreparo({ ok, texto }: { ok: boolean; texto: string }) {
  const tema = useTema();
  return (
    <View style={styles.linha} accessible accessibilityLabel={`${texto}: ${ok ? 'salvo' : 'pendente'}`}>
      <Ionicons
        name={ok ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={ok ? tema.sucesso : tema.textoSecundario}
      />
      <Texto style={styles.flex}>{texto}</Texto>
      <Texto variante="pequeno" secundario>
        {ok ? 'Salvo' : 'Pendente'}
      </Texto>
    </View>
  );
}

/* ------------------------------------------------------------------------ */

function SessaoEmAndamento({
  sessao,
  aoMarcar,
  aoEncerrar,
}: {
  sessao: SessaoHoraDeOuro;
  aoMarcar: (passoId: string, concluido: boolean) => void;
  aoEncerrar: () => void;
}) {
  const tema = useTema();
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const decorrido = agora - Date.parse(sessao.iniciadaEm);
  const limite = DURACAO_HORA_DE_OURO_MIN * 60 * 1000;
  const restante = limite - decorrido;
  const feitos = PASSOS_HORA_DE_OURO.filter((p) => sessao.passos[p.id]).length;
  const progresso = feitos / PASSOS_HORA_DE_OURO.length;
  const proximo = PASSOS_HORA_DE_OURO.find((p) => !sessao.passos[p.id]);

  return (
    <Tela titulo="Hora de Ouro" subtitulo="Siga na ordem. Marque cada passo quando terminar.">
      <View
        style={[styles.cronometro, { backgroundColor: restante > 0 ? tema.perigo : tema.superficieAlt }]}
        accessible
        accessibilityRole="timer"
        accessibilityLabel={`Tempo desde o início: ${Math.floor(decorrido / 60000)} minutos. ${feitos} de ${PASSOS_HORA_DE_OURO.length} passos concluídos.`}>
        <Texto variante="pequeno" cor={restante > 0 ? '#FFFFFF' : tema.texto}>
          Tempo desde o início
        </Texto>
        <Texto variante="destaque" cor={restante > 0 ? '#FFFFFF' : tema.texto}>
          {formatarCronometro(decorrido)}
        </Texto>
        <Texto variante="corpoForte" cor={restante > 0 ? '#FFFFFF' : tema.texto}>
          {restante > 0
            ? `Faltam ${Math.ceil(restante / 60000)} min da Hora de Ouro`
            : 'A Hora de Ouro passou, mas ainda vale concluir os passos.'}
        </Texto>
        <View style={[styles.trilhaProgresso, restante <= 0 && { backgroundColor: tema.borda }]}>
          <View
            style={[
              styles.barraProgresso,
              { width: `${Math.round(progresso * 100)}%` },
              restante <= 0 && { backgroundColor: tema.sucesso },
            ]}
          />
        </View>
        <Texto variante="pequeno" cor={restante > 0 ? '#FFFFFF' : tema.texto}>
          {feitos} de {PASSOS_HORA_DE_OURO.length} passos concluídos
        </Texto>
      </View>

      {PASSOS_HORA_DE_OURO.map((passo, i) => (
        <CartaoPasso
          key={passo.id}
          numero={i + 1}
          passo={passo}
          concluido={!!sessao.passos[passo.id]}
          atual={proximo?.id === passo.id}
          aoMarcar={(v) => aoMarcar(passo.id, v)}
        />
      ))}

      <Botao rotulo="Encerrar Hora de Ouro" variante="secundario" icone="stop-circle-outline" onPress={aoEncerrar} />
    </Tela>
  );
}

function CartaoPasso({
  numero,
  passo,
  concluido,
  atual,
  aoMarcar,
}: {
  numero: number;
  passo: PassoHoraDeOuro;
  concluido: boolean;
  atual: boolean;
  aoMarcar: (concluido: boolean) => void;
}) {
  const tema = useTema();
  return (
    <Cartao style={atual && { borderColor: tema.perigo, borderWidth: 3 }}>
      <Pressable
        onPress={() => aoMarcar(!concluido)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: concluido }}
        accessibilityLabel={`Passo ${numero}: ${passo.titulo}. ${passo.janela}.${passo.critico ? ' Prioritário.' : ''}`}
        accessibilityHint={concluido ? 'Toque para desmarcar' : 'Toque para marcar como feito'}
        style={styles.cabecalhoPasso}>
        <Ionicons
          name={concluido ? 'checkbox' : 'square-outline'}
          size={32}
          color={concluido ? tema.sucesso : tema.texto}
        />
        <View style={styles.flex}>
          <Texto
            variante="corpoForte"
            style={concluido ? styles.riscado : undefined}
            secundario={concluido}>
            {numero}. {passo.titulo}
          </Texto>
          <Texto variante="pequeno" secundario>
            {passo.janela}
            {passo.critico ? ' · prioritário' : ''}
          </Texto>
        </View>
      </Pressable>
      {!concluido && (
        <>
          <Texto>{passo.descricao}</Texto>
          {passo.acoes.map((acao, i) => (
            <BotaoAcao key={i} acao={acao} />
          ))}
        </>
      )}
    </Cartao>
  );
}

function BotaoAcao({ acao }: { acao: AcaoPasso }) {
  const { aparelho } = useApp();

  const ligar = (numero: string) => Linking.openURL(`tel:${numero}`).catch(() => avisar('Não foi possível ligar', `Disque ${numero} de outro telefone.`));
  const abrir = (url: string) => Linking.openURL(url).catch(() => avisar('Não foi possível abrir', url));

  switch (acao.tipo) {
    case 'ligar':
      return <Botao rotulo={acao.rotulo} icone="call" onPress={() => ligar(acao.numero)} />;
    case 'link':
      return <Botao rotulo={acao.rotulo} icone="open-outline" variante="secundario" onPress={() => abrir(acao.url)} />;
    case 'ligar_operadora': {
      if (aparelho.operadora === 'outra' && aparelho.telefoneOperadora) {
        return (
          <Botao rotulo={`Ligar para a operadora (${aparelho.telefoneOperadora})`} icone="call" onPress={() => ligar(aparelho.telefoneOperadora)} />
        );
      }
      if (aparelho.operadora && aparelho.operadora !== 'outra') {
        const op = OPERADORAS[aparelho.operadora];
        return <Botao rotulo={`Ligar para a ${op.nome} (${op.numero})`} icone="call" onPress={() => ligar(op.numero)} />;
      }
      return (
        <View style={styles.operadoras}>
          {Object.values(OPERADORAS).map((op) => (
            <Botao key={op.nome} rotulo={`${op.nome} ${op.numero}`} icone="call" variante="secundario" onPress={() => ligar(op.numero)} />
          ))}
        </View>
      );
    }
    case 'ligar_contato':
      return aparelho.contatoTelefone ? (
        <Botao
          rotulo={`Ligar para ${aparelho.contatoNome || 'contato de confiança'}`}
          icone="person"
          variante="secundario"
          onPress={() => ligar(aparelho.contatoTelefone)}
        />
      ) : (
        <Texto variante="pequeno" secundario>
          Dica: cadastre um contato de confiança no Perfil.
        </Texto>
      );
    case 'copiar_imei':
      return aparelho.imei ? (
        <Botao
          rotulo={`Copiar IMEI ${aparelho.imei}`}
          icone="copy-outline"
          variante="secundario"
          accessibilityLabel="Copiar o IMEI do aparelho"
          onPress={async () => {
            await Clipboard.setStringAsync(aparelho.imei);
            avisar('IMEI copiado', 'Cole no formulário do BO ou informe à operadora.');
          }}
        />
      ) : (
        <Texto variante="pequeno" secundario>
          IMEI não cadastrado. Ele aparece na caixa do aparelho e na nota fiscal.
        </Texto>
      );
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm, minHeight: 32 },
  cronometro: { borderRadius: Raio.lg, padding: Espaco.lg, gap: Espaco.xs },
  trilhaProgresso: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
    marginTop: Espaco.sm,
  },
  barraProgresso: { height: '100%', backgroundColor: '#FFFFFF' },
  cabecalhoPasso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.md,
    minHeight: ALVO_TOQUE_MIN,
  },
  riscado: { textDecorationLine: 'line-through' },
  operadoras: { gap: Espaco.sm },
});
