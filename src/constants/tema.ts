import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { NivelRisco } from '@/types';

/**
 * Paleta com contraste mínimo de 4,5:1 (WCAG AA) entre texto e fundo,
 * nos modos claro e escuro.
 */
export const Cores = {
  claro: {
    fundo: '#F4F6FA',
    superficie: '#FFFFFF',
    superficieAlt: '#EAEEF5',
    texto: '#0F172A',
    textoSecundario: '#475569',
    borda: '#CBD5E1',
    primaria: '#1D4ED8',
    primariaTexto: '#FFFFFF',
    perigo: '#B91C1C',
    perigoTexto: '#FFFFFF',
    erroTexto: '#B91C1C',
    sucesso: '#15803D',
    foco: '#1D4ED8',
  },
  escuro: {
    fundo: '#0B1120',
    superficie: '#131C31',
    superficieAlt: '#1E293B',
    texto: '#F1F5F9',
    textoSecundario: '#CBD5E1',
    borda: '#334155',
    primaria: '#3B82F6',
    primariaTexto: '#0B1120',
    perigo: '#DC2626',
    perigoTexto: '#FFFFFF',
    erroTexto: '#FCA5A5',
    sucesso: '#22C55E',
    foco: '#93C5FD',
  },
} as const;

export type PaletaCores = { [K in keyof typeof Cores.claro]: string };

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

/** Cada nível tem cor, rótulo e ícone: a informação nunca depende só da cor. */
export const NIVEIS: Record<
  NivelRisco,
  { rotulo: string; cor: string; corTexto: string; icone: NomeIcone; resumo: string }
> = {
  baixo: {
    rotulo: 'Baixo',
    cor: '#15803D',
    corTexto: '#FFFFFF',
    icone: 'shield-checkmark',
    resumo: 'Poucos registros neste local e horário.',
  },
  moderado: {
    rotulo: 'Moderado',
    cor: '#A15C07',
    corTexto: '#FFFFFF',
    icone: 'information-circle',
    resumo: 'Fique atento ao usar o celular na rua.',
  },
  alto: {
    rotulo: 'Alto',
    cor: '#C2410C',
    corTexto: '#FFFFFF',
    icone: 'warning',
    resumo: 'Muitos furtos neste local e horário. Guarde o celular.',
  },
  muito_alto: {
    rotulo: 'Muito alto',
    cor: '#991B1B',
    corTexto: '#FFFFFF',
    icone: 'alert-circle',
    resumo: 'Ponto crítico agora. Evite usar o celular aqui.',
  },
};

export const Espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Raio = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

/** Tamanho mínimo de área de toque recomendado (Android: 48dp, iOS: 44pt). */
export const ALVO_TOQUE_MIN = 48;

export const Tipografia = {
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  corpo: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  corpoForte: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  pequeno: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  legenda: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  destaque: { fontSize: 40, lineHeight: 46, fontWeight: '800' },
} as const;

export type VarianteTexto = keyof typeof Tipografia;
