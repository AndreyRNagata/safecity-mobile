/** Detalhes de um ponto de risco: previsão das 24 horas, dicas e relatos por perto. */
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GraficoHoras, SeloRisco } from '@/components/risco';
import { Cartao, Icone, Tela, Texto, TituloSecao } from '@/components/ui';
import { Espaco } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import {
  contarRelatosProximos,
  distanciaMetros,
  formatarDistancia,
  horariosCriticos,
  nivelPorScore,
  riscoDaZona,
} from '@/services/risco';

const NOMES_TIPO = {
  estacao: 'Estação',
  terminal: 'Terminal de ônibus',
  avenida: 'Avenida',
  rua: 'Rua',
  praca: 'Praça / largo',
} as const;

export default function DetalheZona() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { zonas, hora, posicao, relatosRecentes } = useApp();
  const zona = zonas.find((z) => z.id === id);

  if (!zona) {
    return (
      <Tela semAreaSuperior>
        <Texto>Local não encontrado.</Texto>
      </Tela>
    );
  }

  const nivelAgora = nivelPorScore(riscoDaZona(zona, hora));
  const distancia = posicao ? distanciaMetros(posicao, zona) : null;
  const relatosPerto = contarRelatosProximos(zona, relatosRecentes);
  const dia = zona.riscoPorHora.map((score, h) => ({ hora: h, score }));

  return (
    <Tela semAreaSuperior>
      <Stack.Screen options={{ title: zona.nome }} />

      <View style={styles.bloco}>
        <Texto variante="titulo" accessibilityRole="header">
          {zona.nome}
        </Texto>
        <Texto secundario>
          {NOMES_TIPO[zona.tipo]} · {zona.bairro}
          {distancia != null ? ` · a ${formatarDistancia(distancia)} de você` : ''}
        </Texto>
      </View>

      <Cartao>
        <Texto variante="corpoForte">Agora ({hora}h)</Texto>
        <SeloRisco nivel={nivelAgora} />
        <Texto>
          Horários mais perigosos: <Texto variante="corpoForte">{horariosCriticos(zona)}</Texto>.
        </Texto>
      </Cartao>

      <Cartao>
        <TituloSecao icone="bar-chart-outline">Previsão ao longo do dia</TituloSecao>
        <Texto variante="pequeno" secundario>
          Saída do modelo de Machine Learning: probabilidade de furto de celular em cada hora.
        </Texto>
        <GraficoHoras valores={dia} horaDestaque={hora} altura={120} />
      </Cartao>

      <Cartao>
        <TituloSecao icone="stats-chart-outline">Números do local</TituloSecao>
        <View style={styles.linha}>
          <Icone nome="document-text-outline" />
          <Texto style={styles.flex}>
            <Texto variante="corpoForte">{zona.ocorrenciasUltimos30Dias}</Texto> registros nos últimos
            30 dias (dados simulados)
          </Texto>
        </View>
        <View style={styles.linha}>
          <Icone nome="people-outline" />
          <Texto style={styles.flex}>
            <Texto variante="corpoForte">{relatosPerto}</Texto>{' '}
            {relatosPerto === 1 ? 'relato de cidadão' : 'relatos de cidadãos'} na última semana
          </Texto>
        </View>
      </Cartao>

      {zona.dicas.length > 0 && (
        <Cartao>
          <TituloSecao icone="bulb-outline">Como se proteger aqui</TituloSecao>
          {zona.dicas.map((dica) => (
            <View key={dica} style={styles.linhaDica}>
              <Icone nome="checkmark-circle" tamanho={20} />
              <Texto style={styles.flex}>{dica}</Texto>
            </View>
          ))}
        </Cartao>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bloco: { gap: Espaco.xs },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm },
  linhaDica: { flexDirection: 'row', alignItems: 'flex-start', gap: Espaco.sm },
});
