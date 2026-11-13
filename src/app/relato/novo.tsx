/** Formulário de novo relato: salva no SQLite e tenta enviar para a API. */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { Botao, CampoTexto, Cartao, Chip, GrupoChips, Icone, Tela, Texto } from '@/components/ui';
import { TIPOS_RELATO } from '@/constants/relatos';
import { Espaco } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';
import { distanciaMetros, formatarDistancia } from '@/services/risco';
import type { TipoRelato } from '@/types';

const QUANDO = [
  { id: 'agora', rotulo: 'Agora', horasAtras: 0 },
  { id: '1h', rotulo: 'Há 1 hora', horasAtras: 1 },
  { id: '3h', rotulo: 'Há 3 horas', horasAtras: 3 },
  { id: 'ontem', rotulo: 'Ontem', horasAtras: 24 },
] as const;

const LIMITE_DESCRICAO = 280;

/** Volta para a tela anterior; se o formulário foi aberto direto pelo link, vai para a lista. */
function voltar() {
  if (router.canGoBack()) router.back();
  else router.replace('/relatos');
}

export default function NovoRelato() {
  const { posicao, zonas, adicionarRelato } = useApp();
  const tema = useTema();
  const [tipo, setTipo] = useState<TipoRelato | null>(null);
  const [quando, setQuando] = useState<(typeof QUANDO)[number]['id']>('agora');
  const [referencia, setReferencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const zonaProxima = useMemo(() => {
    if (!posicao || zonas.length === 0) return null;
    return zonas
      .map((zona) => ({ zona, distancia: distanciaMetros(posicao, zona) }))
      .sort((a, b) => a.distancia - b.distancia)[0];
  }, [posicao, zonas]);

  const salvar = async () => {
    if (!tipo) {
      setErro('Escolha o que aconteceu.');
      AccessibilityInfo.announceForAccessibility('Escolha o que aconteceu.');
      return;
    }
    if (!posicao) {
      setErro('Ainda não temos sua localização. Ative o GPS ou o modo demonstração.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      const horasAtras = QUANDO.find((q) => q.id === quando)?.horasAtras ?? 0;
      const relato = await adicionarRelato({
        tipo,
        latitude: posicao.latitude,
        longitude: posicao.longitude,
        referencia: referencia.trim() || null,
        descricao: descricao.trim() || null,
        ocorridoEm: new Date(Date.now() - horasAtras * 3600 * 1000).toISOString(),
      });
      AccessibilityInfo.announceForAccessibility(
        relato.sincronizado ? 'Relato enviado. Obrigado!' : 'Relato salvo no celular. Obrigado!',
      );
      voltar();
    } catch {
      setErro('Não foi possível salvar o relato. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Tela semAreaSuperior>
      <Texto secundario>
        Leva menos de um minuto. Não pedimos nome, CPF ou telefone, e o local enviado é aproximado
        (cerca de 100 m).
      </Texto>

      <View style={styles.bloco}>
        <Texto variante="subtitulo" accessibilityRole="header">
          O que aconteceu?
        </Texto>
        <GrupoChips rotulo="O que aconteceu">
          {(Object.keys(TIPOS_RELATO) as TipoRelato[]).map((t) => (
            <Chip
              key={t}
              rotulo={TIPOS_RELATO[t].rotulo}
              icone={TIPOS_RELATO[t].icone}
              selecionado={tipo === t}
              onPress={() => setTipo(t)}
            />
          ))}
        </GrupoChips>
        {tipo && (
          <Texto variante="pequeno" secundario>
            {TIPOS_RELATO[tipo].descricao}
          </Texto>
        )}
      </View>

      <View style={styles.bloco}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Quando?
        </Texto>
        <GrupoChips rotulo="Quando aconteceu">
          {QUANDO.map((q) => (
            <Chip key={q.id} rotulo={q.rotulo} selecionado={quando === q.id} onPress={() => setQuando(q.id)} />
          ))}
        </GrupoChips>
      </View>

      <Cartao>
        <View style={styles.linha}>
          <Icone nome="location" />
          <Texto variante="corpoForte" style={styles.flex}>
            Onde: sua localização atual
          </Texto>
        </View>
        <Texto secundario>
          {!posicao
            ? 'Buscando localização…'
            : posicao.origem === 'demo'
              ? `Modo demonstração: ${posicao.rotulo}`
              : zonaProxima
                ? `Perto de ${zonaProxima.zona.nome} (${formatarDistancia(zonaProxima.distancia)})`
                : 'Localização obtida pelo GPS'}
        </Texto>
      </Cartao>

      <CampoTexto
        rotulo="Ponto de referência (opcional)"
        ajuda="Ex.: saída da estação, ponto de ônibus, em frente à farmácia."
        value={referencia}
        onChangeText={setReferencia}
        maxLength={80}
        returnKeyType="next"
      />

      <CampoTexto
        rotulo="Detalhes (opcional)"
        ajuda="Não escreva nomes, placas ou dados pessoais."
        value={descricao}
        onChangeText={setDescricao}
        maxLength={LIMITE_DESCRICAO}
        multiline
        numberOfLines={3}
        style={styles.areaTexto}
      />
      <Texto variante="legenda" secundario style={styles.contador}>
        {descricao.length}/{LIMITE_DESCRICAO}
      </Texto>

      {erro && (
        <Texto cor={tema.erroTexto} variante="corpoForte" accessibilityRole="alert">
          {erro}
        </Texto>
      )}

      <Botao rotulo="Salvar relato" icone="checkmark-circle" grande carregando={salvando} onPress={salvar} />
      <Botao rotulo="Cancelar" variante="fantasma" onPress={voltar} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bloco: { gap: Espaco.sm },
  linha: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm },
  areaTexto: { minHeight: 96, textAlignVertical: 'top' },
  contador: { alignSelf: 'flex-end', marginTop: -Espaco.md },
});
