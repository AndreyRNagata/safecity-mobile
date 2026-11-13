import { useColorScheme } from 'react-native';

import { Cores, type PaletaCores } from '@/constants/tema';

export function useTema(): PaletaCores {
  return useColorScheme() === 'dark' ? Cores.escuro : Cores.claro;
}
