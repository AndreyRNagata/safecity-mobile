/**
 * Versão web do mapa: o react-native-maps não roda no navegador.
 * A lista de pontos (renderizada pela tela) continua disponível.
 */
import { Cartao, Icone, Texto } from './ui';

import type { MapaRiscoProps } from './mapa-risco';

export function MapaRisco(_props: MapaRiscoProps) {
  return (
    <Cartao accessibilityRole="text">
      <Icone nome="map" tamanho={28} />
      <Texto variante="corpoForte">O mapa aparece no app para Android e iPhone.</Texto>
      <Texto secundario>
        Abra pelo Expo Go para ver os pontos coloridos no mapa. Aqui no navegador, use a lista
        abaixo, que traz as mesmas informações.
      </Texto>
    </Cartao>
  );
}
