import { Colors } from '@/constants/Colors';
import AuthService from '@/services/AuthService';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { Alert, TouchableOpacity } from 'react-native';

export default function ClienteLayout() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AuthService.logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Meus Agendamentos',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textLight,
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <MaterialIcons name="logout" size={24} color={Colors.textLight} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="agendamento"
        options={{
          title: 'Agendar Serviço',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textLight,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="massagistas"
        options={{
          title: 'Escolher Massagista',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: Colors.textLight,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack>
  );
}
