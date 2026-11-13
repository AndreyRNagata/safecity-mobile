/** Componentes que exibem o nível de risco (sempre com cor + ícone + texto). */
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { Espaco, NIVEIS, Raio } from '@/constants/tema';
import { useTema } from '@/hooks/use-tema';
import { formatarDistancia, nivelPorScore } from '@/services/risco';
import type { AvaliacaoRisco, NivelRisco } from '@/types';

import { Texto } from './ui';

export function SeloRisco({ nivel, compacto }: { nivel: NivelRisco; compacto?: boolean }) {
  const n = NIVEIS[nivel];
  return (
    <View
      accessible
      accessibilityLabel={`Risco ${n.rotulo}`}
      style={[styles.selo, compacto && styles.seloCompacto, { backgroundColor: n.cor }]}>
      <Ionicons name={n.icone} size={compacto ? 14 : 18} color={n.corTexto} />
      <Texto variante={compacto ? 'legenda' : 'pequeno'} cor={n.corTexto} style={styles.textoSelo}>
        {n.rotulo}
      </Texto>
    </View>
  );
}

/** Cartão principal da tela inicial: "qual o risco aqui, agora?". */
export function CartaoRisco({ avaliacao }: { avaliacao: AvaliacaoRisco }) {
  const n = NIVEIS[avaliacao.nivel];
  const indice = Math.round(avaliacao.score * 100);
  const local = avaliacao.zona
    ? `${avaliacao.zona.nome} · ${formatarDistancia(avaliacao.distanciaM)}`
    : 'Nenhum ponto de risco mapeado por perto';
  const relatos =
    avaliacao.relatosProximos > 0
      ? `${avaliacao.relatosProximos} ${avaliacao.relatosProximos === 1 ? 'relato recente' : 'relatos recentes'} a até 400 m`
      : 'Nenhum relato recente por perto';

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLiveRegion="polite"
      accessibilityLabel={`Risco ${n.rotulo} de furto de celular agora, às ${avaliacao.hora} horas. Índice ${indice} de 100. ${n.resumo} Local de referência: ${local}. ${relatos}.`}
      style={[styles.cartaoRisco, { backgroundColor: n.cor }]}>
      <View style={styles.linha}>
        <Ionicons name={n.icone} size={40} color={n.corTexto} />
        <View style={styles.flex}>
          <Texto variante="pequeno" cor={n.corTexto}>
            Risco de furto de celular · {avaliacao.hora}h
          </Texto>
          <Texto variante="destaque" cor={n.corTexto}>
            {n.rotulo}
          </Texto>
        </View>
        <View style={styles.indice}>
          <Texto variante="subtitulo" cor={n.corTexto}>
            {indice}
          </Texto>
          <Texto variante="legenda" cor={n.corTexto}>
            de 100
          </Texto>
        </View>
      </View>
      <Texto variante="corpoForte" cor={n.corTexto}>
        {n.resumo}
      </Texto>
      <View style={styles.linhaInfo}>
        <Ionicons name="location" size={16} color={n.corTexto} />
        <Texto variante="pequeno" cor={n.corTexto} style={styles.flex}>
          {local}
        </Texto>
      </View>
      <View style={styles.linhaInfo}>
        <Ionicons name="people" size={16} color={n.corTexto} />
        <Texto variante="pequeno" cor={n.corTexto} style={styles.flex}>
          {relatos}
        </Texto>
      </View>
    </View>
  );
}

/** Gráfico de barras simples (sem biblioteca) com resumo para leitor de tela. */
export function GraficoHoras({
  valores,
  horaDestaque,
  altura = 96,
}: {
  valores: { hora: number; score: number }[];
  horaDestaque?: number;
  altura?: number;
}) {
  const tema = useTema();
  const piores = [...valores].sort((a, b) => b.score - a.score).slice(0, 2);
  const resumo = `Gráfico de risco por horário. Maior risco às ${piores
    .map((p) => `${p.hora} horas (${NIVEIS[nivelPorScore(p.score)].rotulo})`)
    .join(' e às ')}.`;
  const mostrarTodosRotulos = valores.length <= 8;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={resumo}>
      <View style={[styles.grafico, { height: altura }]}>
        {valores.map(({ hora, score }) => {
          const nivel = nivelPorScore(score);
          const destaque = hora === horaDestaque;
          return (
            <View key={hora} style={styles.coluna}>
              <View
                style={[
                  styles.barra,
                  {
                    height: Math.max(4, score * altura),
                    backgroundColor: NIVEIS[nivel].cor,
                    borderColor: destaque ? tema.texto : 'transparent',
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.rotulosGrafico}>
        {valores.map(({ hora }, i) => (
          <View key={hora} style={styles.coluna}>
            {(mostrarTodosRotulos || i % 3 === 0) && (
              <Texto
                variante="legenda"
                secundario={hora !== horaDestaque}
                style={hora === horaDestaque ? styles.rotuloDestaque : undefined}>
                {hora}h
              </Texto>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export function Legenda() {
  return (
    <View style={styles.legenda} accessibilityLabel="Legenda dos níveis de risco">
      {(Object.keys(NIVEIS) as NivelRisco[]).map((nivel) => (
        <SeloRisco key={nivel} nivel={nivel} compacto />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: Espaco.md,
    paddingVertical: 6,
    borderRadius: Raio.pill,
  },
  seloCompacto: { paddingHorizontal: Espaco.sm, paddingVertical: 3 },
  textoSelo: { fontWeight: '700' },
  cartaoRisco: { borderRadius: Raio.lg, padding: Espaco.lg, gap: Espaco.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.md },
  indice: { alignItems: 'center' },
  linhaInfo: { flexDirection: 'row', alignItems: 'center', gap: Espaco.xs },
  grafico: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  coluna: { flex: 1, alignItems: 'center' },
  barra: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 2 },
  rotulosGrafico: { flexDirection: 'row', gap: 3, marginTop: 4 },
  rotuloDestaque: { fontWeight: '800' },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: Espaco.xs },
});
