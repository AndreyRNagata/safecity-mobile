/**
 * Componentes básicos com acessibilidade embutida:
 * rótulos para leitor de tela, papéis (button, header, radio...), área de toque
 * mínima de 48 dp, contraste AA e texto que respeita a opção "Texto maior".
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALVO_TOQUE_MIN, Espaco, Raio, Tipografia, type VarianteTexto } from '@/constants/tema';
import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

/* --------------------------------- Texto --------------------------------- */

interface TextoProps extends TextProps {
  variante?: VarianteTexto;
  cor?: string;
  secundario?: boolean;
}

export function Texto({ variante = 'corpo', cor, secundario, style, ...props }: TextoProps) {
  const tema = useTema();
  const { escalaFonte } = useApp();
  const base = Tipografia[variante];
  return (
    <Text
      {...props}
      style={[
        {
          ...base,
          fontSize: base.fontSize * escalaFonte,
          lineHeight: base.lineHeight * escalaFonte,
          color: cor ?? (secundario ? tema.textoSecundario : tema.texto),
        },
        style,
      ]}
    />
  );
}

/* --------------------------------- Botão --------------------------------- */

type VarianteBotao = 'primario' | 'perigo' | 'secundario' | 'fantasma';

interface BotaoProps {
  rotulo: string;
  onPress: () => void;
  variante?: VarianteBotao;
  icone?: NomeIcone;
  grande?: boolean;
  desabilitado?: boolean;
  carregando?: boolean;
  dica?: string;
  accessibilityLabel?: string;
}

export function Botao({
  rotulo,
  onPress,
  variante = 'primario',
  icone,
  grande,
  desabilitado,
  carregando,
  dica,
  accessibilityLabel,
}: BotaoProps) {
  const tema = useTema();
  const estilos: Record<VarianteBotao, { fundo: string; texto: string; borda: string }> = {
    primario: { fundo: tema.primaria, texto: tema.primariaTexto, borda: tema.primaria },
    perigo: { fundo: tema.perigo, texto: tema.perigoTexto, borda: tema.perigo },
    secundario: { fundo: tema.superficie, texto: tema.texto, borda: tema.borda },
    fantasma: { fundo: 'transparent', texto: tema.primaria, borda: 'transparent' },
  };
  const e = estilos[variante];
  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? rotulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [
        styles.botao,
        grande && styles.botaoGrande,
        { backgroundColor: e.fundo, borderColor: e.borda, opacity: inativo ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      {carregando ? (
        <ActivityIndicator color={e.texto} />
      ) : (
        icone && <Ionicons name={icone} size={grande ? 26 : 20} color={e.texto} />
      )}
      <Texto variante={grande ? 'subtitulo' : 'corpoForte'} cor={e.texto} style={styles.textoBotao}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

/* -------------------------------- Cartão -------------------------------- */

export function Cartao({ style, children, ...props }: ViewProps & { children: ReactNode }) {
  const tema = useTema();
  return (
    <View
      {...props}
      style={[styles.cartao, { backgroundColor: tema.superficie, borderColor: tema.borda }, style]}>
      {children}
    </View>
  );
}

/* --------------------------------- Chip --------------------------------- */

interface ChipProps {
  rotulo: string;
  selecionado: boolean;
  onPress: () => void;
  icone?: NomeIcone;
  /** 'radio' para escolha única, 'checkbox' para múltipla. */
  papel?: 'radio' | 'checkbox';
}

export function Chip({ rotulo, selecionado, onPress, icone, papel = 'radio' }: ChipProps) {
  const tema = useTema();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={papel}
      accessibilityLabel={rotulo}
      accessibilityState={papel === 'radio' ? { selected: selecionado } : { checked: selecionado }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selecionado ? tema.primaria : tema.superficie,
          borderColor: selecionado ? tema.primaria : tema.borda,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {(icone || selecionado) && (
        <Ionicons
          name={selecionado ? 'checkmark' : icone!}
          size={18}
          color={selecionado ? tema.primariaTexto : tema.texto}
        />
      )}
      <Texto variante="pequeno" cor={selecionado ? tema.primariaTexto : tema.texto} style={styles.textoChip}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

export function GrupoChips({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={rotulo} style={styles.grupoChips}>
      {children}
    </View>
  );
}

/* ----------------------------- Campo de texto ---------------------------- */

interface CampoTextoProps extends TextInputProps {
  rotulo: string;
  ajuda?: string;
  erro?: string | null;
}

export function CampoTexto({ rotulo, ajuda, erro, style, ...props }: CampoTextoProps) {
  const tema = useTema();
  const { escalaFonte } = useApp();
  return (
    <View style={styles.campo}>
      <Texto variante="corpoForte">{rotulo}</Texto>
      {ajuda && (
        <Texto variante="pequeno" secundario>
          {ajuda}
        </Texto>
      )}
      <TextInput
        {...props}
        accessibilityLabel={rotulo}
        accessibilityHint={ajuda}
        placeholderTextColor={tema.textoSecundario}
        style={[
          styles.input,
          {
            color: tema.texto,
            backgroundColor: tema.superficie,
            borderColor: erro ? tema.perigo : tema.borda,
            fontSize: 17 * escalaFonte,
          },
          style,
        ]}
      />
      {erro && (
        <Texto variante="pequeno" cor={tema.erroTexto} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      )}
    </View>
  );
}

/* ---------------------------- Linha com switch --------------------------- */

interface LinhaSwitchProps {
  rotulo: string;
  descricao?: string;
  valor: boolean;
  aoMudar: (valor: boolean) => void;
}

export function LinhaSwitch({ rotulo, descricao, valor, aoMudar }: LinhaSwitchProps) {
  const tema = useTema();
  return (
    <Pressable
      onPress={() => aoMudar(!valor)}
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityHint={descricao}
      accessibilityState={{ checked: valor }}
      style={styles.linhaSwitch}>
      <View style={styles.flex}>
        <Texto variante="corpoForte">{rotulo}</Texto>
        {descricao && (
          <Texto variante="pequeno" secundario>
            {descricao}
          </Texto>
        )}
      </View>
      <Switch
        value={valor}
        onValueChange={aoMudar}
        trackColor={{ true: tema.primaria, false: tema.borda }}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      />
    </Pressable>
  );
}

/* --------------------------------- Tela --------------------------------- */

interface TelaProps {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
  /** Sem rolagem (ex.: tela com mapa). */
  fixa?: boolean;
  /** Tela aberta por cima das abas (já tem cabeçalho nativo). */
  semAreaSuperior?: boolean;
}

export function Tela({ titulo, subtitulo, children, fixa, semAreaSuperior }: TelaProps) {
  const tema = useTema();
  const cabecalho = titulo ? (
    <View style={styles.cabecalho}>
      <Texto variante="titulo" accessibilityRole="header">
        {titulo}
      </Texto>
      {subtitulo && <Texto secundario>{subtitulo}</Texto>}
    </View>
  ) : null;

  return (
    <SafeAreaView
      edges={semAreaSuperior ? ['left', 'right'] : ['top', 'left', 'right']}
      style={[styles.flex, { backgroundColor: tema.fundo }]}>
      {fixa ? (
        <View style={[styles.flex, styles.conteudoFixo]}>
          {cabecalho}
          {children}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          {cabecalho}
          {children}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export function TituloSecao({ children, icone }: { children: string; icone?: NomeIcone }) {
  const tema = useTema();
  return (
    <View style={styles.tituloSecao}>
      {icone && <Ionicons name={icone} size={22} color={tema.texto} />}
      <Texto variante="subtitulo" accessibilityRole="header">
        {children}
      </Texto>
    </View>
  );
}

export function Icone({ nome, tamanho = 22, cor }: { nome: NomeIcone; tamanho?: number; cor?: string }) {
  const tema = useTema();
  return <Ionicons name={nome} size={tamanho} color={cor ?? tema.texto} accessible={false} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  conteudo: {
    padding: Espaco.lg,
    paddingBottom: Espaco.xxl * 2,
    gap: Espaco.lg,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  conteudoFixo: { padding: Espaco.lg, gap: Espaco.md },
  cabecalho: { gap: Espaco.xs, marginBottom: Espaco.xs },
  botao: {
    minHeight: ALVO_TOQUE_MIN + 4,
    paddingHorizontal: Espaco.lg,
    paddingVertical: Espaco.md,
    borderRadius: Raio.md,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espaco.sm,
  },
  botaoGrande: { minHeight: 68, borderRadius: Raio.lg },
  textoBotao: { textAlign: 'center', flexShrink: 1 },
  cartao: {
    borderRadius: Raio.lg,
    borderWidth: 1,
    padding: Espaco.lg,
    gap: Espaco.sm,
  },
  chip: {
    minHeight: ALVO_TOQUE_MIN,
    paddingHorizontal: Espaco.lg,
    borderRadius: Raio.pill,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.xs,
  },
  textoChip: { fontWeight: '600' },
  grupoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espaco.sm },
  campo: { gap: Espaco.xs },
  input: {
    minHeight: ALVO_TOQUE_MIN + 4,
    borderWidth: 2,
    borderRadius: Raio.md,
    paddingHorizontal: Espaco.md,
    paddingVertical: Espaco.sm,
    marginTop: Espaco.xs,
  },
  linhaSwitch: {
    minHeight: ALVO_TOQUE_MIN + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.md,
  },
  tituloSecao: { flexDirection: 'row', alignItems: 'center', gap: Espaco.sm, marginTop: Espaco.sm },
});
