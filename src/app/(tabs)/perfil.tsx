/** Perfil: dados do aparelho (só no celular), preferências e indicadores de impacto. */
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import {
  Botao,
  CampoTexto,
  Cartao,
  Chip,
  GrupoChips,
  Icone,
  LinhaSwitch,
  Tela,
  Texto,
  TituloSecao,
} from '@/components/ui';
import { OPERADORAS, PASSOS_CRITICOS } from '@/constants/hora-de-ouro';
import { HORAS_DEMO, LOCAIS_DEMO } from '@/constants/locais-demo';
import { Espaco } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { type Indicadores, lerIndicadores } from '@/db/banco';
import { useTema } from '@/hooks/use-tema';
import type { Aparelho, Operadora } from '@/types';
import { apenasDigitos, imeiValido } from '@/utils/formatos';

export default function Perfil() {
  const { config, atualizarConfig, carregado } = useApp();

  return (
    <Tela titulo="Perfil" subtitulo="Seus dados ficam só neste celular.">
      {/* A key recria o formulário quando os dados do SQLite terminam de carregar. */}
      <FormularioAparelho key={carregado ? 'pronto' : 'carregando'} />

      <Cartao>
        <TituloSecao icone="options-outline">Preferências</TituloSecao>
        <LinhaSwitch
          rotulo="Alertas preventivos"
          descricao="Avisa com vibração e notificação quando você entra em um ponto de risco alto."
          valor={config.alertasAtivos}
          aoMudar={(v) => atualizarConfig({ alertasAtivos: v })}
        />
        <LinhaSwitch
          rotulo="Texto maior"
          descricao="Aumenta as letras de todo o app."
          valor={config.textoGrande}
          aoMudar={(v) => atualizarConfig({ textoGrande: v })}
        />
        <LinhaSwitch
          rotulo="Modo demonstração"
          descricao="Simula estar em São Paulo, sem usar o GPS. Útil para apresentar o app."
          valor={config.modoDemo}
          aoMudar={(v) => atualizarConfig({ modoDemo: v, horaSimulada: v ? config.horaSimulada : null })}
        />
        {config.modoDemo && (
          <View style={styles.demo}>
            <Texto variante="corpoForte">Local simulado</Texto>
            <GrupoChips rotulo="Local simulado">
              {LOCAIS_DEMO.map((l) => (
                <Chip
                  key={l.id}
                  rotulo={l.rotulo}
                  selecionado={config.localDemoId === l.id}
                  onPress={() => atualizarConfig({ localDemoId: l.id })}
                />
              ))}
            </GrupoChips>
            <Texto variante="corpoForte">Horário simulado</Texto>
            <GrupoChips rotulo="Horário simulado">
              <Chip
                rotulo="Hora real"
                selecionado={config.horaSimulada == null}
                onPress={() => atualizarConfig({ horaSimulada: null })}
              />
              {HORAS_DEMO.map((h) => (
                <Chip
                  key={h}
                  rotulo={`${h}h`}
                  selecionado={config.horaSimulada === h}
                  onPress={() => atualizarConfig({ horaSimulada: h })}
                />
              ))}
            </GrupoChips>
          </View>
        )}
      </Cartao>

      <PainelImpacto />

      <Cartao>
        <TituloSecao icone="information-circle-outline">Sobre o SafeCity</TituloSecao>
        <Texto secundario>
          CitizenTech da Global Solution FIAP 2026. Previne furtos de celular com alertas baseados em
          Machine Learning e guia o cidadão na Hora de Ouro depois do roubo.
        </Texto>
        <Texto secundario>
          Privacidade (LGPD): IMEI, contato e histórico ficam só no SQLite deste celular. A API recebe
          apenas relatos anônimos, com local aproximado.
        </Texto>
        <Texto secundario>ODS 11 (cidades seguras), ODS 16 (paz e instituições) e ODS 9 (inovação).</Texto>
      </Cartao>
    </Tela>
  );
}

/* ------------------------------------------------------------------------ */

function FormularioAparelho() {
  const { aparelho, salvarDadosAparelho } = useApp();
  const tema = useTema();
  const [form, setForm] = useState<Aparelho>(aparelho);
  const [erroImei, setErroImei] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const mudar = (campo: keyof Aparelho, valor: string) => {
    setSalvo(false);
    setForm((f) => ({ ...f, [campo]: valor }));
  };

  const salvar = async () => {
    if (form.imei && !imeiValido(form.imei)) {
      setErroImei('IMEI inválido. Confira os 15 números (disque *#06#).');
      return;
    }
    setErroImei(null);
    await salvarDadosAparelho({
      ...form,
      modelo: form.modelo.trim(),
      contatoNome: form.contatoNome.trim(),
    });
    setSalvo(true);
    AccessibilityInfo.announceForAccessibility('Dados do aparelho salvos.');
  };

  const operadoras: { id: Operadora; rotulo: string }[] = [
    ...Object.entries(OPERADORAS).map(([id, op]) => ({ id: id as Operadora, rotulo: op.nome })),
    { id: 'outra', rotulo: 'Outra' },
  ];

  return (
    <Cartao>
      <TituloSecao icone="phone-portrait-outline">Meu aparelho</TituloSecao>
      <Texto secundario>Usado na Hora de Ouro para agir rápido. Nada disso sai do celular.</Texto>

      <CampoTexto
        rotulo="Modelo do celular"
        placeholder="Ex.: Galaxy A15"
        value={form.modelo}
        onChangeText={(v) => mudar('modelo', v)}
        maxLength={40}
      />
      <CampoTexto
        rotulo="IMEI"
        ajuda="Disque *#06# para ver. Também está na caixa e na nota fiscal."
        placeholder="15 números"
        keyboardType="number-pad"
        value={form.imei}
        onChangeText={(v) => mudar('imei', apenasDigitos(v))}
        maxLength={15}
        erro={erroImei}
      />

      <Texto variante="corpoForte">Operadora</Texto>
      <GrupoChips rotulo="Operadora">
        {operadoras.map((op) => (
          <Chip
            key={op.id}
            rotulo={op.rotulo}
            selecionado={form.operadora === op.id}
            onPress={() => mudar('operadora', op.id)}
          />
        ))}
      </GrupoChips>
      {form.operadora === 'outra' && (
        <CampoTexto
          rotulo="Telefone da central da operadora"
          keyboardType="phone-pad"
          value={form.telefoneOperadora}
          onChangeText={(v) => mudar('telefoneOperadora', apenasDigitos(v))}
          maxLength={15}
        />
      )}

      <CampoTexto
        rotulo="Contato de confiança"
        ajuda="Quem pode te ajudar a bloquear tudo (e acionar o Celular Seguro)."
        placeholder="Nome"
        value={form.contatoNome}
        onChangeText={(v) => mudar('contatoNome', v)}
        maxLength={40}
      />
      <CampoTexto
        rotulo="Telefone do contato"
        placeholder="(11) 90000-0000"
        keyboardType="phone-pad"
        value={form.contatoTelefone}
        onChangeText={(v) => mudar('contatoTelefone', apenasDigitos(v))}
        maxLength={13}
      />

      <Botao rotulo="Salvar dados do aparelho" icone="save-outline" onPress={salvar} />
      {salvo && (
        <View style={styles.linha} accessibilityLiveRegion="polite">
          <Icone nome="checkmark-circle" cor={tema.sucesso} />
          <Texto>Salvo neste celular.</Texto>
        </View>
      )}
    </Cartao>
  );
}

function PainelImpacto() {
  const db = useSQLiteContext();
  const [dados, setDados] = useState<Indicadores | null>(null);

  useFocusEffect(
    useCallback(() => {
      lerIndicadores(db, PASSOS_CRITICOS).then(setDados);
    }, [db]),
  );

  const itens = [
    { icone: 'notifications-outline' as const, valor: dados?.alertasRecebidos, rotulo: 'alertas preventivos recebidos' },
    { icone: 'megaphone-outline' as const, valor: dados?.relatosRegistrados, rotulo: 'relatos registrados' },
    { icone: 'alarm-outline' as const, valor: dados?.sessoesHoraDeOuro, rotulo: 'vezes que usou a Hora de Ouro' },
    {
      icone: 'stopwatch-outline' as const,
      valor: dados?.minutosMedioPassosCriticos != null ? `${dados.minutosMedioPassosCriticos} min` : '—',
      rotulo: 'para bloquear bancos, chip e acionar o Celular Seguro (média)',
    },
  ];

  return (
    <Cartao>
      <TituloSecao icone="trending-up-outline">Seu impacto</TituloSecao>
      <Texto variante="pequeno" secundario>
        Indicadores calculados a partir do banco local do app.
      </Texto>
      {itens.map((item) => (
        <View
          key={item.rotulo}
          style={styles.linha}
          accessible
          accessibilityLabel={`${item.valor ?? 0} ${item.rotulo}`}>
          <Icone nome={item.icone} />
          <Texto variante="subtitulo">{item.valor ?? 0}</Texto>
          <Texto style={styles.flex}>{item.rotulo}</Texto>
        </View>
      ))}
    </Cartao>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm },
  demo: { gap: Espaco.sm, marginTop: Espaco.xs },
});
