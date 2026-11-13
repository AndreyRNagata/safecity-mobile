import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { useApp } from '@/context/app-context';
import { useTema } from '@/hooks/use-tema';

type NomeIcone = ComponentProps<typeof Ionicons>['name'];

function icone(ativo: NomeIcone, inativo: NomeIcone) {
  function IconeAba({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? ativo : inativo} size={26} color={String(color)} />;
  }
  return IconeAba;
}

export default function TabsLayout() {
  const tema = useTema();
  const { escalaFonte } = useApp();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.primaria,
        tabBarInactiveTintColor: tema.textoSecundario,
        tabBarStyle: { backgroundColor: tema.superficie, borderTopColor: tema.borda, minHeight: 64 },
        tabBarLabelStyle: { fontSize: 12 * escalaFonte, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: icone('shield', 'shield-outline'),
          tabBarAccessibilityLabel: 'Início: risco onde você está agora',
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Mapa',
          tabBarIcon: icone('map', 'map-outline'),
          tabBarAccessibilityLabel: 'Mapa dos pontos de risco',
        }}
      />
      <Tabs.Screen
        name="hora-de-ouro"
        options={{
          title: 'Fui roubado',
          tabBarIcon: icone('alarm', 'alarm-outline'),
          tabBarActiveTintColor: tema.perigo,
          tabBarAccessibilityLabel: 'Fui roubado: guia da Hora de Ouro',
        }}
      />
      <Tabs.Screen
        name="relatos"
        options={{
          title: 'Relatos',
          tabBarIcon: icone('megaphone', 'megaphone-outline'),
          tabBarAccessibilityLabel: 'Relatos de furto e roubo',
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: icone('person-circle', 'person-circle-outline'),
          tabBarAccessibilityLabel: 'Perfil, meu aparelho e configurações',
        }}
      />
    </Tabs>
  );
}
