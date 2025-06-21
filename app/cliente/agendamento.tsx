import DateTimeSelector from '@/components/DateTimeSelector';
import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import AuthService from '@/services/AuthService';
import { Massagista, Servico } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Agendamento() {
  const { massagistaId, servicoId } = useLocalSearchParams();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [massagista, setMassagista] = useState<Massagista | null>(null);
  const [servico, setServico] = useState<Servico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Buscar dados da massagista
        const massagistaData = await AuthService.obterMassagistaPorId(
          massagistaId as string
        );
        if (!massagistaData) {
          Alert.alert('Erro', 'Massagista não encontrada');
          router.back();
          return;
        }

        setMassagista(massagistaData);

        // Buscar serviço
        const servicoData = massagistaData.servicos.find(
          (s) => s.id === servicoId
        );
        if (!servicoData) {
          Alert.alert('Erro', 'Serviço não encontrado');
          router.back();
          return;
        }

        setServico(servicoData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        Alert.alert('Erro', 'Falha ao carregar dados do agendamento');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [massagistaId, servicoId, router]);

  const handleConfirmarAgendamento = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Erro', 'Por favor, selecione data e horário');
      return;
    }

    if (!massagista || !servico) {
      Alert.alert('Erro', 'Dados do agendamento não encontrados');
      return;
    }

    try {
      setLoading(true);

      // Criar agendamento usando o serviço
      const resultado = await AgendamentoService.criarAgendamento({
        massagistaId: massagista.id,
        servicoId: servico.id,
        data: selectedDate,
        hora: selectedTime,
      });

      if (!resultado.sucesso) {
        Alert.alert('Erro', resultado.mensagem);
        return;
      }

      Alert.alert(
        'Agendamento Confirmado!',
        `Seu agendamento foi confirmado para ${selectedDate.split('-').reverse().join('/')} às ${selectedTime}`,
        [
          {
            text: 'OK',
            onPress: () => router.push('/cliente'),
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      Alert.alert('Erro', 'Falha ao confirmar agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  if (!servico || !massagista) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>
          Dados do agendamento não encontrados
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Resumo do Serviço */}
        <View style={styles.resumoSection}>
          <Text style={styles.sectionTitle}>Resumo do Agendamento</Text>
          <View style={styles.resumoCard}>
            <Text style={styles.massagistaNome}>{massagista.nome}</Text>
            <Text style={styles.servicoNome}>{servico.nome}</Text>
            <View style={styles.servicoInfo}>
              <Text style={styles.servicoDuracao}>
                {servico.duracao} minutos
              </Text>
              <Text style={styles.servicoPreco}>R$ {servico.preco}</Text>
            </View>
          </View>
        </View>

        {/* Seleção de Data e Hora */}
        {massagista && (
          <DateTimeSelector
            massagistaId={massagista.id}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
          />
        )}

        {/* Confirmação */}
        {selectedDate && selectedTime && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.confirmarButton}
              onPress={handleConfirmarAgendamento}
            >
              <Text style={styles.confirmarButtonText}>
                Confirmar Agendamento
              </Text>
            </TouchableOpacity>

            <Text style={styles.confirmacaoTexto}>
              Você está agendando {servico.nome} com {massagista.nome} para{' '}
              {selectedDate.split('-').reverse().join('/')} às{' '}
              {selectedTime}
            </Text>
          </View>
        )}
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
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    marginTop: 12,
    padding: 20,
  },
  resumoSection: {
    backgroundColor: Colors.surface,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  resumoCard: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  massagistaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  servicoNome: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  servicoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicoDuracao: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  servicoPreco: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  confirmarButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmarButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmacaoTexto: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
