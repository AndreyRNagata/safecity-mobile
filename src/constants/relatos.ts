import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { TipoRelato } from '@/types';

export const TIPOS_RELATO: Record<
  TipoRelato,
  { rotulo: string; descricao: string; icone: ComponentProps<typeof Ionicons>['name'] }
> = {
  furto: { rotulo: 'Furto', descricao: 'Levaram sem eu perceber', icone: 'hand-left-outline' },
  roubo: { rotulo: 'Roubo', descricao: 'Com ameaça ou violência', icone: 'warning-outline' },
  tentativa: { rotulo: 'Tentativa', descricao: 'Tentaram, mas não levaram', icone: 'shield-half-outline' },
  suspeita: { rotulo: 'Atitude suspeita', descricao: 'Vi algo estranho no local', icone: 'eye-outline' },
};
