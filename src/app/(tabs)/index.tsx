/** Início: "qual é o risco de furto de celular aqui, agora?" */
import { router } from 'expo-router';
import { type ReactNode, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { CartaoRisco, GraficoHoras } from '@/components/risco';
import { Botao, Cartao, Icone, Tela, Texto, TituloSecao } from '@/components/ui';
import { Espaco, NIVEIS } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';
import { enderecoApi } from '@/services/api';
import { previsaoProximasHoras } from '@/services/risco';
import { formatarDataHora, formatarTempoRelativo } from '@/utils/formatos';

const DICAS_GERAIS = [
  'Ande com o celular no bolso da frente ou dentro da bolsa fechada.',
  'Ative a senha de tela e a biometria. Desative a visualização de notificações na tela bloqueada.',
  'Cadastre seu aparelho e uma pessoa de confiança no programa Celular Seguro.',
];

export default function Inicio() {
  const {
    avaliacao,
    posicao,
    statusLocalizacao,
    tentarLocalizacaoNovamente,
    zonas,
    hora,
    fonteDados,
    carregandoDados,
    atualizadoEm,
    recarregarDados,
    config,
    atualizarConfig,
    ultimoAlerta,
    agora,
  } = useApp();

  const previsao = useMemo(
    () => (posicao && zonas.length > 0 ? previsaoProximasHoras(posicao, zonas, hora, 6) : []),
    [posicao, zonas, hora],
  );

  const riscoElevado = avaliacao?.nivel === 'alto' || avaliacao?.nivel === 'muito_alto';
  const dicas = riscoElevado && avaliacao?.zona ? avaliacao.zona.dicas : DICAS_GERAIS;
  const alertaRecente =
    ultimoAlerta && agora - Date.parse(ultimoAlerta.criadoEm) < 30 * 60 * 1000 ? ultimoAlerta : null;

  const usarDemo = () => atualizarConfig({ modoDemo: true });

  let conteudoRisco: ReactNode;
  if (zonas.length === 0 && carregandoDados) {
    conteudoRisco = <Carregando texto="Carregando as previsões de risco…" />;
  } else if (statusLocalizacao === 'negada' || statusLocalizacao === 'indisponivel') {
    conteudoRisco = (
      <Cartao>
        <Icone nome="location-outline" tamanho={28} />
        <Texto variante="corpoForte">
          {statusLocalizacao === 'negada'
            ? 'Sem permissão para usar sua localização.'
            : 'Não foi possível descobrir sua localização.'}
        </Texto>
        <Texto secundario>
          O SafeCity usa a localização só no seu celular para calcular o risco. Ela nunca é enviada.
        </Texto>
        <Botao rotulo="Tentar de novo" icone="refresh" onPress={tentarLocalizacaoNovamente} />
        <Botao rotulo="Usar modo demonstração" variante="secundario" icone="flask" onPress={usarDemo} />
      </Cartao>
    );
  } else if (!avaliacao) {
    conteudoRisco = <Carregando texto="Buscando sua localização…" />;
  } else if (!avaliacao.dentroDaArea) {
    conteudoRisco = (
      <Cartao>
        <Icone nome="map-outline" tamanho={28} />
        <Texto variante="corpoForte">Você está fora da área coberta.</Texto>
        <Texto secundario>
          Por enquanto, o SafeCity tem previsões para a cidade de São Paulo. Use o modo demonstração
          para ver como o app funciona.
        </Texto>
        <Botao rotulo="Usar modo demonstração" icone="flask" onPress={usarDemo} />
      </Cartao>
    );
  } else {
    conteudoRisco = <CartaoRisco avaliacao={avaliacao} />;
  }

  return (
    <Tela titulo="SafeCity" subtitulo="Alerta preventivo contra furto de celular">
      <LinhaLocalizacao
        texto={
          statusLocalizacao === 'demo'
            ? `Modo demonstração: ${posicao?.rotulo ?? ''}${config.horaSimulada != null ? ` · ${config.horaSimulada}h` : ''}`
            : statusLocalizacao === 'ok'
              ? 'Usando o GPS do celular'
              : 'Localização indisponível'
        }
        demo={statusLocalizacao === 'demo'}
      />

      {conteudoRisco}

      {alertaRecente && (
        <Cartao accessibilityRole="alert">
          <View style={styles.linha}>
            <Icone nome="notifications" />
            <Texto variante="corpoForte" style={styles.flex}>
              Alerta emitido {formatarTempoRelativo(alertaRecente.criadoEm)}
            </Texto>
          </View>
          <Texto secundario>
            Risco {NIVEIS[alertaRecente.nivel].rotulo.toLowerCase()} perto de {alertaRecente.zonaNome}.
            Guarde o celular e fique atento ao redor.
          </Texto>
        </Cartao>
      )}

      <Botao
        rotulo="Fui roubado(a)"
        variante="perigo"
        icone="alarm"
        grande
        dica="Abre o passo a passo da Hora de Ouro para bloquear linha, bancos e aparelho"
        onPress={() => router.push({ pathname: '/hora-de-ouro', params: { iniciar: '1' } })}
      />

      {avaliacao?.dentroDaArea && previsao.length > 0 && (
        <Cartao>
          <TituloSecao icone="time-outline">Próximas horas</TituloSecao>
          <Texto secundario>Use para escolher o melhor horário para passar por aqui.</Texto>
          <GraficoHoras valores={previsao} horaDestaque={hora} />
        </Cartao>
      )}

      <Cartao>
        <TituloSecao icone="bulb-outline">{riscoElevado ? 'O que fazer agora' : 'Dicas de prevenção'}</TituloSecao>
        {dicas.map((dica) => (
          <View key={dica} style={styles.linhaDica}>
            <Icone nome="checkmark-circle" tamanho={20} />
            <Texto style={styles.flex}>{dica}</Texto>
          </View>
        ))}
      </Cartao>

      <FonteDados
        fonte={fonteDados}
        atualizadoEm={atualizadoEm}
        carregando={carregandoDados}
        aoAtualizar={recarregarDados}
      />
    </Tela>
  );
}

function Carregando({ texto }: { texto: string }) {
  const tema = useTema();
  return (
    <Cartao accessibilityLiveRegion="polite" style={styles.carregando}>
      <ActivityIndicator size="large" color={tema.primaria} />
      <Texto>{texto}</Texto>
    </Cartao>
  );
}

function LinhaLocalizacao({ texto, demo }: { texto: string; demo: boolean }) {
  return (
    <View style={styles.linha} accessible accessibilityLabel={texto}>
      <Icone nome={demo ? 'flask-outline' : 'navigate-outline'} tamanho={18} />
      <Texto variante="pequeno" secundario style={styles.flex}>
        {texto}
      </Texto>
      {demo && (
        <Botao
          rotulo="Alterar"
          variante="fantasma"
          onPress={() => router.push('/perfil')}
          accessibilityLabel="Alterar local e horário da demonstração"
        />
      )}
    </View>
  );
}

function FonteDados({
  fonte,
  atualizadoEm,
  carregando,
  aoAtualizar,
}: {
  fonte: 'api' | 'cache' | 'mock';
  atualizadoEm: string | null;
  carregando: boolean;
  aoAtualizar: () => void;
}) {
  const textos = {
    api: {
      icone: 'cloud-done-outline' as const,
      titulo: 'Previsões atualizadas pela API',
      detalhe: `${enderecoApi}${atualizadoEm ? ` · ${formatarTempoRelativo(atualizadoEm)}` : ''}`,
    },
    cache: {
      icone: 'cloud-offline-outline' as const,
      titulo: 'Sem conexão: usando dados salvos no celular',
      detalhe: atualizadoEm ? `Última atualização em ${formatarDataHora(atualizadoEm)}` : '',
    },
    mock: {
      icone: 'flask-outline' as const,
      titulo: 'Dados simulados (mock)',
      detalhe: 'Previsões fictícias para demonstração. Veja o README para ligar a API.',
    },
  }[fonte];

  return (
    <Cartao>
      <View style={styles.linha}>
        <Icone nome={textos.icone} />
        <Texto variante="corpoForte" style={styles.flex}>
          {textos.titulo}
        </Texto>
      </View>
      {!!textos.detalhe && (
        <Texto variante="pequeno" secundario>
          {textos.detalhe}
        </Texto>
      )}
      <Botao
        rotulo="Atualizar dados"
        variante="secundario"
        icone="refresh"
        carregando={carregando}
        onPress={aoAtualizar}
      />
    </Cartao>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm },
  linhaDica: { flexDirection: 'row', alignItems: 'flex-start', gap: Espaco.sm },
  carregando: { alignItems: 'center', paddingVertical: Espaco.xl },
});
