import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { LogBox, useColorScheme } from 'react-native';

import { Cores } from '@/constants/tema';
import { AppProvider } from '@/context/app-context';
import { migrarBanco, NOME_BANCO } from '@/db/banco';

// Notificações LOCAIS funcionam no Expo Go; o aviso é sobre notificações push, que o app não usa.
LogBox.ignoreLogs(['expo-notifications', '[expo-notifications]']);

export default function RootLayout() {
  const escuro = useColorScheme() === 'dark';
  const cores = escuro ? Cores.escuro : Cores.claro;
  const base = escuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: {
      ...base.colors,
      primary: cores.primaria,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.texto,
      border: cores.borda,
    },
  };

  return (
    <SQLiteProvider databaseName={NOME_BANCO} onInit={migrarBanco}>
      <AppProvider>
        <ThemeProvider value={tema}>
          <StatusBar style={escuro ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerBackTitle: 'Voltar', headerTitleStyle: { fontWeight: '700' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="zona/[id]" options={{ title: 'Detalhes do local' }} />
            <Stack.Screen
              name="relato/novo"
              options={{ title: 'Novo relato', presentation: 'modal' }}
            />
          </Stack>
        </ThemeProvider>
      </AppProvider>
    </SQLiteProvider>
  );
}
