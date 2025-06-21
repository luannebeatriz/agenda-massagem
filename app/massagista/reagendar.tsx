import DateTimeSelector from '@/components/DateTimeSelector';
import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import { AgendamentoDetalhado } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Reagendar() {
  const router = useRouter();
  const { agendamentoId } = useLocalSearchParams<{ agendamentoId: string }>();

  const [agendamento, setAgendamento] = useState<AgendamentoDetalhado | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Dados do formulário
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [motivoReagendamento, setMotivoReagendamento] = useState('');

  const carregarAgendamento = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar todos os agendamentos da massagista e encontrar o específico
      const agendamentos =
        await AgendamentoService.obterAgendamentosMassagista();
      const agendamentoEncontrado = agendamentos.find(
        (a) => a.id === agendamentoId
      );

      if (agendamentoEncontrado) {
        setAgendamento(agendamentoEncontrado);
      } else {
        Alert.alert('Erro', 'Agendamento não encontrado', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamento:', error);
      Alert.alert('Erro', 'Falha ao carregar dados do agendamento');
    } finally {
      setLoading(false);
    }
  }, [agendamentoId, router]);

  useEffect(() => {
    carregarAgendamento();
  }, [carregarAgendamento]);

  const validarFormulario = () => {
    if (!selectedDate) {
      Alert.alert('Erro', 'Selecione uma data');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Erro', 'Selecione um horário');
      return false;
    }
    if (!motivoReagendamento.trim()) {
      Alert.alert('Erro', 'Digite o motivo do reagendamento');
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario() || !agendamento) return;

    setSalvando(true);
    try {
      const resultado = await AgendamentoService.reagendarAgendamento({
        agendamentoId: agendamento.id,
        novaData: selectedDate,
        novaHora: selectedTime,
        motivo: motivoReagendamento.trim(),
      });

      if (resultado.sucesso) {
        Alert.alert('Sucesso', 'Agendamento reagendado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Erro', resultado.mensagem);
      }
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      Alert.alert('Erro', 'Falha ao reagendar agendamento');
    } finally {
      setSalvando(false);
    }
  };

  const sugestoesMotivoComuns = [
    'Emergência',
    'Conflito de horário',
    'Solicitação do cliente',
    'Problema pessoal',
    'Reagendamento por conveniência',
    'Alteração na agenda',
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Carregando agendamento...</Text>
      </SafeAreaView>
    );
  }

  if (!agendamento) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Agendamento não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Reagendar Agendamento</Text>
            <Text style={styles.subtitle}>
              Altere a data e horário do agendamento
            </Text>

            {/* Informações atuais */}
            <View style={styles.currentInfoContainer}>
              <Text style={styles.currentInfoTitle}>Agendamento atual:</Text>
              <View style={styles.currentInfoRow}>
                <MaterialIcons name="person" size={20} color={Colors.primary} />
                <Text style={styles.currentInfoText}>
                  {agendamento.cliente.nome}
                </Text>
              </View>
              <View style={styles.currentInfoRow}>
                <MaterialIcons name="spa" size={20} color={Colors.secondary} />
                <Text style={styles.currentInfoText}>
                  {agendamento.servico.nome}
                </Text>
              </View>
              <View style={styles.currentInfoRow}>
                <MaterialIcons
                  name="schedule"
                  size={20}
                  color={Colors.textMuted}
                />
                <Text style={styles.currentInfoText}>
                  {new Date(agendamento.data).toLocaleDateString('pt-BR')} às{' '}
                  {agendamento.hora}
                </Text>
              </View>
            </View>

            {/* Seleção de Nova Data e Hora */}
            {agendamento && (
              <DateTimeSelector
                massagistaId={agendamento.massagistaId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setSelectedDate}
                onTimeSelect={setSelectedTime}
              />
            )}

            {/* Motivo */}
            <View style={styles.section}>
              <Text style={styles.label}>Motivo do Reagendamento *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={motivoReagendamento}
                onChangeText={setMotivoReagendamento}
                placeholder="Por que você está reagendando este agendamento?"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Sugestões de motivos */}
            <View style={styles.section}>
              <Text style={styles.label}>Motivos comuns:</Text>
              <View style={styles.suggestionsContainer}>
                {sugestoesMotivoComuns.map((sugestao, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => setMotivoReagendamento(sugestao)}
                  >
                    <Text style={styles.suggestionText}>{sugestao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Botões de ação */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <Text style={styles.saveButtonText}>Reagendando...</Text>
            ) : (
              <>
                <MaterialIcons
                  name="event"
                  size={20}
                  color={Colors.textLight}
                />
                <Text style={styles.saveButtonText}>Reagendar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  currentInfoContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  currentInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  currentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentInfoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  suggestionChip: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: 8,
  },
});
