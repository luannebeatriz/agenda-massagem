import { Colors } from '@/constants/Colors';
import AuthService from '@/services/AuthService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function IndexScreen() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const usuarioLogado = await AuthService.obterUsuarioLogado();

        if (usuarioLogado) {
          // Usuário já está logado, redirecionar para a área apropriada
          if (usuarioLogado.tipo === 'cliente') {
            router.replace('/cliente');
          } else {
            router.replace('/massagista');
          }
        } else {
          // Usuário não está logado, ir para tela de login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Erro ao verificar status de autenticação:', error);
        // Em caso de erro, ir para login
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
