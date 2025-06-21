import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import AuthService from '@/services/AuthService';
import { AgendamentoDetalhado, Usuario } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ClienteHome() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      // Carregar usuário logado
      const usuarioLogado = await AuthService.obterUsuarioLogado();
      setUsuario(usuarioLogado);

      // Carregar agendamentos
      const agendamentosData =
        await AgendamentoService.obterAgendamentosCliente();

      // Ordenar: pendentes primeiro, depois por data mais recente
      const agendamentosOrdenados = agendamentosData.sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (b.status === 'pendente' && a.status !== 'pendente') return 1;
        return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
      });

      setAgendamentos(agendamentosOrdenados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Falha ao carregar seus agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await carregarDados();
    setRefreshing(false);
  };

  const handleCancelarAgendamento = (agendamento: AgendamentoDetalhado) => {
    Alert.alert(
      'Cancelar Agendamento',
      `Deseja cancelar o agendamento com ${agendamento.massagista.nome}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AgendamentoService.cancelarAgendamento(agendamento.id);
              Alert.alert('Sucesso', 'Agendamento cancelado com sucesso');
              carregarDados(); // Recarregar lista
            } catch (error) {
              console.error('Erro ao cancelar:', error);
              Alert.alert('Erro', 'Falha ao cancelar agendamento');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return Colors.warning;
      case 'confirmado':
        return Colors.success;
      case 'cancelado':
        return Colors.danger;
      case 'concluido':
        return Colors.primary;
      default:
        return Colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'schedule';
      case 'confirmado':
        return 'check-circle';
      case 'cancelado':
        return 'cancel';
      case 'concluido':
        return 'done-all';
      default:
        return 'help';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'confirmado':
        return 'Confirmado';
      case 'cancelado':
        return 'Cancelado';
      case 'concluido':
        return 'Concluído';
      default:
        return status;
    }
  };

  const renderAgendamento = ({ item }: { item: AgendamentoDetalhado }) => {
    const isPendente = item.status === 'pendente';
    const isConfirmado = item.status === 'confirmado';
    const podeSerCancelado = isPendente || isConfirmado;

    return (
      <TouchableOpacity
        style={[
          styles.agendamentoCard,
          isPendente && styles.agendamentoPendente,
          isConfirmado && styles.agendamentoConfirmado,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dataText}>
              {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
            </Text>
            <Text style={styles.horaText}>{item.hora}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + '20' },
            ]}
          >
            <MaterialIcons
              name={getStatusIcon(item.status) as any}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.massagistaInfo}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={24} color={Colors.textLight} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.massagistaNome}>{item.massagista.nome}</Text>
              <Text style={styles.servicoNome}>{item.servico.nome}</Text>
              <Text style={styles.servicoPreco}>R$ {item.servico.preco}</Text>
            </View>
          </View>

          {podeSerCancelado && (
            <TouchableOpacity
              style={styles.cancelarButton}
              onPress={() => handleCancelarAgendamento(item)}
            >
              <MaterialIcons name="close" size={18} color={Colors.danger} />
              <Text style={styles.cancelarText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.observacoes && (
          <View style={styles.observacoesContainer}>
            <Text style={styles.observacoesText}>
              &ldquo;{item.observacoes}&rdquo;
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando seus agendamentos...</Text>
      </SafeAreaView>
    );
  }

  const agendamentosPendentes = agendamentos.filter(
    (a) => a.status === 'pendente'
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com saudação */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.saudacao}>
            Olá, {usuario?.nome?.split(' ')[0] || 'Cliente'}! 👋
          </Text>
          <Text style={styles.subtitulo}>
            {agendamentosPendentes.length > 0
              ? `Você tem ${agendamentosPendentes.length} agendamento${
                  agendamentosPendentes.length > 1 ? 's' : ''
                } pendente${agendamentosPendentes.length > 1 ? 's' : ''}`
              : 'Tudo em dia com seus agendamentos!'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.novoAgendamentoButton}
          onPress={() => router.push('/cliente/massagistas' as any)}
        >
          <MaterialIcons name="add" size={24} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Botão destacado para novo agendamento se não houver nenhum */}
      {agendamentos.length === 0 && (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="event-available"
            size={64}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyTitle}>Nenhum agendamento ainda</Text>
          <Text style={styles.emptyMessage}>
            Que tal agendar sua primeira massagem?
          </Text>
          <TouchableOpacity
            style={styles.primeiroAgendamentoButton}
            onPress={() => router.push('/cliente/massagistas' as any)}
          >
            <MaterialIcons name="spa" size={20} color={Colors.textLight} />
            <Text style={styles.primeiroAgendamentoText}>Agendar Agora</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de agendamentos */}
      {agendamentos.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Seus Agendamentos</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/cliente/massagistas')}
            >
              <MaterialIcons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addButtonText}>Novo</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={agendamentos}
            renderItem={renderAgendamento}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
              />
            }
          />
        </>
      )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  saudacao: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  novoAgendamentoButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  primeiroAgendamentoButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  primeiroAgendamentoText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
  },
  addButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  agendamentoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agendamentoPendente: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    backgroundColor: Colors.warningBackground,
  },
  agendamentoConfirmado: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    backgroundColor: Colors.successBackground,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginRight: 12,
  },
  horaText: {
    fontSize: 16,
    color: Colors.textSecondary,
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  massagistaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  massagistaNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  servicoNome: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  servicoPreco: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  cancelarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.danger + '20',
  },
  cancelarText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  observacoesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  observacoesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
