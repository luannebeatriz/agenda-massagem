import { Colors } from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.textPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'Entrar',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="tipo-usuario"
        options={{
          title: 'Escolha seu Perfil',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="registro"
        options={{
          title: 'Criar Conta',
          headerShown: true,
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack>
  );
}
