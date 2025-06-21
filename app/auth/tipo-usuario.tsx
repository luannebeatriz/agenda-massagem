import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TipoUsuarioScreen() {
  const router = useRouter();

  const handleTipoSelecionado = (tipo: 'cliente' | 'massagista') => {
    router.push(`/auth/registro?tipo=${tipo}` as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Como você gostaria de usar o app?</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.option, styles.clienteOption]}
            onPress={() => handleTipoSelecionado('cliente')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sou Cliente</Text>
              <Text style={styles.optionDescription}>
                Quero agendar massagens e encontrar profissionais
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, styles.massagistaOption]}
            onPress={() => handleTipoSelecionado('massagista')}
          >
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Sou Massagista</Text>
              <Text style={styles.optionDescription}>
                Quero oferecer meus serviços e gerenciar agendamentos
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.linkText}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  option: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clienteOption: {
    backgroundColor: Colors.primary,
  },
  massagistaOption: {
    backgroundColor: Colors.secondary,
  },
  optionContent: {
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  optionDescription: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
});
