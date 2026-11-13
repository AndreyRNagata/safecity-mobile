import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { localDemo } from '@/constants/locais-demo';
import type { Posicao } from '@/types';

export type StatusLocalizacao = 'carregando' | 'ok' | 'negada' | 'indisponivel' | 'demo';

/**
 * Posição do cidadão. Usa o GPS em primeiro plano (atualiza a cada ~30 m)
 * ou um local fixo quando o modo demonstração está ligado.
 */
export function useLocalizacao(modoDemo: boolean, localDemoId: string) {
  const [posicaoGps, setPosicaoGps] = useState<Posicao | null>(null);
  const [status, setStatus] = useState<StatusLocalizacao>('carregando');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (modoDemo) return;

    let cancelado = false;
    let assinatura: Location.LocationSubscription | null = null;

    const atualizar = (loc: Location.LocationObject) => {
      if (cancelado) return;
      setPosicaoGps({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        origem: 'gps',
      });
      setStatus('ok');
    };

    (async () => {
      setStatus('carregando');
      try {
        const permissao = await Location.requestForegroundPermissionsAsync();
        if (cancelado) return;
        if (!permissao.granted) {
          setStatus('negada');
          return;
        }
        atualizar(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 30, timeInterval: 15_000 },
          atualizar,
        );
        if (cancelado) sub.remove();
        else assinatura = sub;
      } catch {
        if (!cancelado) setStatus('indisponivel');
      }
    })();

    return () => {
      cancelado = true;
      assinatura?.remove();
    };
  }, [modoDemo, tentativa]);

  const tentarNovamente = useCallback(() => setTentativa((t) => t + 1), []);

  const posicaoDemo = useMemo<Posicao | null>(() => {
    if (!modoDemo) return null;
    const local = localDemo(localDemoId);
    return { latitude: local.latitude, longitude: local.longitude, origem: 'demo', rotulo: local.rotulo };
  }, [modoDemo, localDemoId]);

  return {
    posicao: posicaoDemo ?? posicaoGps,
    status: (modoDemo ? 'demo' : status) as StatusLocalizacao,
    tentarNovamente,
  };
}
