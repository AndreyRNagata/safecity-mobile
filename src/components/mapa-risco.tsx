/**
 * Mapa de risco (Android/iOS) com react-native-maps.
 * Funciona no Expo Go sem chave de API. Na web é usado mapa-risco.web.tsx.
 */
import { Fragment, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { NIVEIS, Raio } from '@/constants/tema';
import { nivelPorScore, riscoDaZona } from '@/services/risco';
import type { Posicao, RelatoComunidade, ZonaRisco } from '@/types';

export interface MapaRiscoProps {
  zonas: ZonaRisco[];
  hora: number;
  posicao: Posicao | null;
  relatos: Pick<RelatoComunidade, 'latitude' | 'longitude'>[];
  aoSelecionarZona: (id: string) => void;
}

const CENTRO_SP = { latitude: -23.5505, longitude: -46.6333 };
const ZOOM = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

export function MapaRisco({ zonas, hora, posicao, relatos, aoSelecionarZona }: MapaRiscoProps) {
  const mapa = useRef<MapView>(null);

  // Acompanha a posição (GPS ou local da demonstração).
  useEffect(() => {
    if (posicao) {
      mapa.current?.animateToRegion(
        { latitude: posicao.latitude, longitude: posicao.longitude, ...ZOOM },
        600,
      );
    }
  }, [posicao]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...(posicao ?? CENTRO_SP), ...ZOOM }}
        showsUserLocation={posicao?.origem === 'gps'}
        accessibilityLabel="Mapa dos pontos de risco. A lista abaixo do mapa traz as mesmas informações.">
        {zonas.map((zona) => {
          const nivel = NIVEIS[nivelPorScore(riscoDaZona(zona, hora))];
          const centro = { latitude: zona.latitude, longitude: zona.longitude };
          return (
            <Fragment key={zona.id}>
              <Circle
                center={centro}
                radius={zona.raioMetros}
                fillColor={`${nivel.cor}55`}
                strokeColor={nivel.cor}
                strokeWidth={2}
              />
              <Marker
                coordinate={centro}
                title={zona.nome}
                description={`Risco ${nivel.rotulo.toLowerCase()} às ${hora}h · toque para ver detalhes`}
                pinColor={nivel.cor}
                onCalloutPress={() => aoSelecionarZona(zona.id)}
              />
            </Fragment>
          );
        })}

        {relatos.map((r, i) => (
          <Circle
            key={`relato-${i}`}
            center={{ latitude: r.latitude, longitude: r.longitude }}
            radius={35}
            fillColor="#7C3AEDAA"
            strokeColor="#5B21B6"
            strokeWidth={1}
          />
        ))}

        {posicao?.origem === 'demo' && (
          <Marker
            coordinate={{ latitude: posicao.latitude, longitude: posicao.longitude }}
            title="Você (modo demonstração)"
            description={posicao.rotulo}
            pinColor="#1D4ED8"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 340, borderRadius: Raio.lg, overflow: 'hidden' },
});
