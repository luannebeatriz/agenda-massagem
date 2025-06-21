import { Colors } from '@/constants/Colors';
import AuthService from '@/services/AuthService';
import { Massagista } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MassagistaPerfil() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [massagista, setMassagista] = useState<Massagista | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados da massagista do AsyncStorage
  useFocusEffect(
    useCallback(() => {
      const carregarMassagista = async () => {
        try {
          setLoading(true);
          const massagistaData = await AuthService.obterMassagistaPorId(id as string);
          setMassagista(massagistaData);
        } catch (error) {
          console.error('Erro ao carregar massagista:', error);
        } finally {
          setLoading(false);
        }
      };

      carregarMassagista();
    }, [id])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size='large' color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!massagista) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name='error' size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Massagista não encontrada</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialIcons
          key={i}
          name={i <= rating ? 'star' : 'star-border'}
          size={16}
          color={Colors.star}
        />
      );
    }
    return stars;
  };

  const handleAgendar = (servicoId: string) => {
    // Navegar para seleção de data/hora
    router.push({
      pathname: '/cliente/agendamento',
      params: {
        massagistaId: massagista.id,
        servicoId: servicoId,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Perfil Principal */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={60} color={Colors.white} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.nome}>{massagista.nome}</Text>
            <Text style={styles.especialidades}>
              {massagista.servicos.map(servico => servico.nome).join(' • ')}
            </Text>

            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(Math.floor(massagista.avaliacao))}
              </View>
              <Text style={styles.ratingText}>
                {massagista.avaliacao} ({massagista.totalAvaliacoes} avaliações)
              </Text>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons
                name="location-on"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.infoText}>{massagista.cidade}</Text>
            </View>
          </View>
        </View>

        {/* Sobre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bioText}>{massagista.bio}</Text>
        </View>

        {/* Serviços */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          {massagista.servicos.map((servico) => (
            <TouchableOpacity
              key={servico.id}
              style={[
                styles.servicoCard,
                selectedService === servico.id && styles.servicoCardSelected,
              ]}
              onPress={() => setSelectedService(servico.id)}
            >
              <View style={styles.servicoHeader}>
                <Text style={styles.servicoNome}>{servico.nome}</Text>
                <Text style={styles.servicoPreco}>R$ {servico.preco}</Text>
              </View>
              <Text style={styles.servicoDuracao}>
                {servico.duracao} minutos
              </Text>
              <Text style={styles.servicoDescricao}>{servico.descricao}</Text>

              <TouchableOpacity
                style={styles.agendarButton}
                onPress={() => handleAgendar(servico.id)}
              >
                <Text style={styles.agendarButtonText}>Agendar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  nome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  especialidades: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  servicoCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  servicoCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  servicoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  servicoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  servicoPreco: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  servicoDuracao: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  servicoDescricao: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  agendarButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  agendarButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});
