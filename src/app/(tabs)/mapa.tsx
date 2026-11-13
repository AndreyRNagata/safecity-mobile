/** Mapa e lista dos pontos de risco no horário atual. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MapaRisco } from '@/components/mapa-risco';
import { Legenda, SeloRisco } from '@/components/risco';
import { Cartao, Chip, GrupoChips, Tela, Texto, TituloSecao } from '@/components/ui';
import { ALVO_TOQUE_MIN, Espaco, NIVEIS, Raio } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';
import { distanciaMetros, formatarDistancia, nivelPorScore, riscoDaZona } from '@/services/risco';

type Ordem = 'risco' | 'distancia';

export default function Mapa() {
  const { zonas, hora, posicao, relatosRecentes } = useApp();
  const tema = useTema();
  const [ordem, setOrdem] = useState<Ordem>('risco');

  const lista = useMemo(() => {
    const itens = zonas.map((zona) => {
      const valor = riscoDaZona(zona, hora);
      return {
        zona,
        valor,
        nivel: nivelPorScore(valor),
        distancia: posicao ? distanciaMetros(posicao, zona) : null,
      };
    });
    return itens.sort((a, b) =>
      ordem === 'distancia' && a.distancia != null && b.distancia != null
        ? a.distancia - b.distancia
        : b.valor - a.valor,
    );
  }, [zonas, hora, posicao, ordem]);

  const abrirZona = (id: string) => router.push({ pathname: '/zona/[id]', params: { id } });

  return (
    <Tela titulo="Mapa de risco" subtitulo={`Previsão para as ${hora}h. Toque em um ponto para ver detalhes.`}>
      <MapaRisco
        zonas={zonas}
        hora={hora}
        posicao={posicao}
        relatos={relatosRecentes}
        aoSelecionarZona={abrirZona}
      />
      <Legenda />
      <View style={styles.linha}>
        <View style={[styles.pontoRelato]} />
        <Texto variante="pequeno" secundario>
          Pontos roxos: relatos de cidadãos nos últimos dias
        </Texto>
      </View>

      <TituloSecao icone="list">Pontos monitorados</TituloSecao>
      <GrupoChips rotulo="Ordenar lista">
        <Chip rotulo="Maior risco" selecionado={ordem === 'risco'} onPress={() => setOrdem('risco')} />
        <Chip
          rotulo="Mais perto"
          selecionado={ordem === 'distancia'}
          onPress={() => setOrdem('distancia')}
        />
      </GrupoChips>

      {lista.length === 0 && (
        <Cartao>
          <Texto>Nenhum ponto carregado ainda.</Texto>
        </Cartao>
      )}

      {lista.map(({ zona, nivel, distancia }) => (
        <Pressable
          key={zona.id}
          onPress={() => abrirZona(zona.id)}
          accessibilityRole="button"
          accessibilityLabel={`${zona.nome}, ${zona.bairro}. Risco ${NIVEIS[nivel].rotulo} às ${hora} horas${
            distancia != null ? `, a ${formatarDistancia(distancia)} de você` : ''
          }.`}
          accessibilityHint="Abre os detalhes e a previsão do dia"
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: tema.superficie, borderColor: tema.borda, opacity: pressed ? 0.85 : 1 },
          ]}>
          <View style={styles.flex}>
            <Texto variante="corpoForte">{zona.nome}</Texto>
            <Texto variante="pequeno" secundario>
              {zona.bairro}
              {distancia != null ? ` · ${formatarDistancia(distancia)}` : ''}
            </Texto>
            <SeloRisco nivel={nivel} compacto />
          </View>
          <Ionicons name="chevron-forward" size={22} color={tema.textoSecundario} />
        </Pressable>
      ))}
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm },
  pontoRelato: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#5B21B6',
  },
  item: {
    minHeight: ALVO_TOQUE_MIN + 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.md,
    padding: Espaco.lg,
    borderRadius: Raio.lg,
    borderWidth: 1,
  },
});
