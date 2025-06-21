import DateTimeSelector from '@/components/DateTimeSelector';
import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import AuthService from '@/services/AuthService';
import { Servico, Usuario } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function AgendamentoManual() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Usuario[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [massagistaId, setMassagistaId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Dados do formulário
  const [clienteSelecionado, setClienteSelecionado] = useState<Usuario | null>(
    null
  );
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesDisponiveis = await AuthService.obterTodosClientes();
      setClientes(clientesDisponiveis);

      // Carregar serviços da massagista logada
      const massagistaLogada = await AuthService.obterUsuarioLogado();

      if (massagistaLogada?.tipo === 'massagista') {
        setMassagistaId(massagistaLogada.id);
        
        const massagista = await AuthService.obterMassagistaPorId(
          massagistaLogada.id
        );

        if (massagista?.servicos && massagista.servicos.length > 0) {
          setServicos(massagista.servicos);
        } else {
          setServicos([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar dados necessários');
    }
  };

  const validarFormulario = () => {
    if (!clienteSelecionado) {
      Alert.alert('Erro', 'Selecione um cliente');
      return false;
    }
    if (!servicoSelecionado) {
      Alert.alert('Erro', 'Selecione um serviço');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('Erro', 'Selecione uma data');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Erro', 'Selecione um horário');
      return false;
    }
    return true;
  };

  const handleSalvar = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const resultado = await AgendamentoService.criarAgendamentoManual({
        clienteId: clienteSelecionado!.id,
        servicoId: servicoSelecionado!.id,
        data: selectedDate,
        hora: selectedTime,
        observacoes: observacoes.trim() || undefined,
      });

      if (resultado.sucesso) {
        Alert.alert('Sucesso', 'Agendamento criado com sucesso!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Erro', resultado.mensagem);
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      Alert.alert('Erro', 'Falha ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Novo Agendamento Manual</Text>
            <Text style={styles.subtitle}>
              Crie um agendamento para um cliente específico
            </Text>

            {/* Seleção de Cliente */}
            <View style={styles.section}>
              <Text style={styles.label}>Cliente *</Text>
              {clienteSelecionado ? (
                <TouchableOpacity
                  style={[styles.selectedItem, styles.selectedClient]}
                  onPress={() => setClienteSelecionado(null)}
                >
                  <View style={styles.selectedItemContent}>
                    <MaterialIcons
                      name="person"
                      size={24}
                      color={Colors.primary}
                    />
                    <View style={styles.selectedItemText}>
                      <Text style={styles.selectedItemName}>
                        {clienteSelecionado.nome}
                      </Text>
                      <Text style={styles.selectedItemDescription}>
                        {clienteSelecionado.email}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                >
                  {clientes.map((cliente) => (
                    <TouchableOpacity
                      key={cliente.id}
                      style={styles.clienteCard}
                      onPress={() => setClienteSelecionado(cliente)}
                    >
                      <MaterialIcons
                        name="person"
                        size={24}
                        color={Colors.primary}
                      />
                      <Text style={styles.clienteNome}>{cliente.nome}</Text>
                      <Text style={styles.clienteEmail}>{cliente.email}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* Seleção de Serviço */}
            <View style={styles.section}>
              <Text style={styles.label}>Serviço *</Text>
              {servicoSelecionado ? (
                <TouchableOpacity
                  style={[styles.selectedItem, styles.selectedService]}
                  onPress={() => setServicoSelecionado(null)}
                >
                  <View style={styles.selectedItemContent}>
                    <MaterialIcons
                      name="spa"
                      size={24}
                      color={Colors.secondary}
                    />
                    <View style={styles.selectedItemText}>
                      <Text style={styles.selectedItemName}>
                        {servicoSelecionado.nome}
                      </Text>
                      <Text style={styles.selectedItemDescription}>
                        {servicoSelecionado.duracao}min • R${' '}
                        {servicoSelecionado.preco}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.servicosGrid}>
                  {servicos.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialIcons
                        name="spa"
                        size={48}
                        color={Colors.textMuted}
                      />
                      <Text style={styles.emptyText}>
                        Nenhum serviço encontrado
                      </Text>
                      <Text style={styles.emptySubText}>
                        Verifique se você selecionou serviços durante o registro
                      </Text>
                    </View>
                  ) : (
                    servicos.map((servico) => (
                      <TouchableOpacity
                        key={servico.id}
                        style={styles.servicoCard}
                        onPress={() => setServicoSelecionado(servico)}
                      >
                        <MaterialIcons
                          name="spa"
                          size={24}
                          color={Colors.secondary}
                        />
                        <Text style={styles.servicoNome}>{servico.nome}</Text>
                        <Text style={styles.servicoInfo}>
                          {servico.duracao}min • R$ {servico.preco}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Seleção de Data e Hora */}
            {massagistaId && (
              <DateTimeSelector
                massagistaId={massagistaId}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateSelect={setSelectedDate}
                onTimeSelect={setSelectedTime}
              />
            )}

            {/* Observações */}
            <View style={styles.section}>
              <Text style={styles.label}>Observações</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Observações adicionais (opcional)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSalvar}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.saveButtonText}>Salvando...</Text>
            ) : (
              <>
                <MaterialIcons name="save" size={20} color={Colors.textLight} />
                <Text style={styles.saveButtonText}>Salvar</Text>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectedClient: {
    borderColor: Colors.primary,
  },
  selectedService: {
    borderColor: Colors.secondary,
  },
  selectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedItemText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  selectedItemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  horizontalScroll: {
    maxHeight: 150,
  },
  clienteCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clienteNome: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  clienteEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  servicosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  servicoCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    margin: 6,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  servicoNome: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  servicoInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
    backgroundColor: Colors.secondary,
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
