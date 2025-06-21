import { Colors } from '@/constants/Colors';
import AuthService from '@/services/AuthService';
import { Massagista } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function MassagistasListagem() {
  const router = useRouter();
  const [massagistas, setMassagistas] = useState<Massagista[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar massagistas do AsyncStorage
  useFocusEffect(
    useCallback(() => {
      carregarMassagistas();
    }, [])
  );

  const carregarMassagistas = async () => {
    try {
      setLoading(true);
      const massagistasData = await AuthService.obterTodasMassagistas();
      setMassagistas(massagistasData);
    } catch (error) {
      console.error('Erro ao carregar massagistas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularPrecoMinimo = (servicos: any[]) => {
    if (!servicos || servicos.length === 0) return 0;
    return Math.min(...servicos.map(s => s.preco));
  };

  const handleAgendar = (massagistaId: string, event: any) => {
    event.stopPropagation();
    router.push(`/massagista/${massagistaId}` as any);
  };

  const renderMassagista = ({ item }: { item: Massagista }) => {
    const precoMinimo = calcularPrecoMinimo(item.servicos);
    const especialidadesText = item.servicos.map(servico => servico.nome).join(', ') || 'Massagem geral';
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/massagista/${item.id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <MaterialIcons name='person' size={32} color={Colors.textLight} />
          </View>
          <View style={styles.info}>
            <Text style={styles.nome}>{item.nome}</Text>
            <Text style={styles.especialidade}>{especialidadesText}</Text>
            <View style={styles.rating}>
              <MaterialIcons name='star' size={16} color={Colors.gold} />
              <Text style={styles.ratingText}>
                {item.avaliacao > 0 ? item.avaliacao.toFixed(1) : 'Novo'}
              </Text>
              <MaterialIcons name='location-on' size={16} color={Colors.textSecondary} />
              <Text style={styles.cidadeText}>{item.cidade}</Text>
            </View>
          </View>
          <View style={styles.price}>
            <Text style={styles.priceText}>
              R$ {precoMinimo > 0 ? precoMinimo : 'A definir'}
            </Text>
            <Text style={styles.priceLabel}>a partir de</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.status}>
            <MaterialIcons
              name="check-circle"
              size={16}
              color={Colors.success}
            />
            <Text style={styles.statusText}>
              Disponível
            </Text>
          </View>

          <TouchableOpacity
            style={styles.agendarButton}
            onPress={(event) => handleAgendar(item.id, event)}
          >
            <Text style={styles.agendarButtonText}>
              Agendar
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Massagistas Próximas</Text>
          <Text style={styles.subtitle}>
            {loading ? 'Carregando...' : `${massagistas.length} profissionais encontradas`}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={Colors.primary} />
          <Text style={styles.loadingText}>Carregando massagistas...</Text>
        </View>
      ) : (
        <FlatList
          data={massagistas}
          renderItem={renderMassagista}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  especialidade: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
    marginRight: 12,
  },
  cidadeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  price: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.successBackground,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
    color: Colors.success,
  },
  agendarButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  agendarButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
