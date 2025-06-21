import { Colors } from '@/constants/Colors';
import AgendamentoService from '@/services/AgendamentoService';
import { AgendamentoDetalhado } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MassagistaHome() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar agendamentos na primeira renderização e sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      carregarAgendamentos();
    }, [])
  );

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const agendamentosData =
        await AgendamentoService.obterAgendamentosMassagista();

      // Filtrar apenas agendamentos futuros (a partir de hoje)
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação apenas por data

      const agendamentosProximos = agendamentosData.filter((ag) => {
        const dataAgendamento = new Date(ag.data + 'T00:00:00');
        return dataAgendamento >= hoje;
      });

      // Ordenar por data e hora
      agendamentosProximos.sort((a, b) => {
        const dataA = new Date(a.data + 'T' + a.hora);
        const dataB = new Date(b.data + 'T' + b.hora);
        return dataA.getTime() - dataB.getTime();
      });

      setAgendamentos(agendamentosProximos);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      Alert.alert('Erro', 'Falha ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  const handleLigar = (cliente: string, telefone: string) => {
    Alert.alert(
      'Ligar para Cliente',
      `Deseja ligar para ${cliente}?\n${telefone}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ligar',
          onPress: () => {
            const phoneNumber = telefone.replace(/\D/g, '');
            Linking.openURL(`tel:${phoneNumber}`);
          },
        },
      ]
    );
  };

  const handleMensagem = (cliente: string, telefone: string) => {
    Alert.alert(
      'Enviar Mensagem',
      `Deseja enviar mensagem para ${cliente}?\n${telefone}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'WhatsApp',
          onPress: () => {
            const phoneNumber = telefone.replace(/\D/g, '');
            const message = encodeURIComponent(
              `Olá ${cliente}! Sua massagem está confirmada para hoje.`
            );
            Linking.openURL(
              `whatsapp://send?phone=55${phoneNumber}&text=${message}`
            );
          },
        },
        {
          text: 'SMS',
          onPress: () => {
            const phoneNumber = telefone.replace(/\D/g, '');
            const message = encodeURIComponent(
              `Olá ${cliente}! Sua massagem está confirmada para hoje.`
            );
            Linking.openURL(`sms:${phoneNumber}?body=${message}`);
          },
        },
      ]
    );
  };

  const handleAdicionarAgendamento = () => {
    Alert.alert(
      'Novo Agendamento',
      'Escolha como deseja adicionar um novo agendamento:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Agendamento Manual',
          onPress: () => {
            router.push('/massagista/agendamento-manual' as any);
          },
        },
      ]
    );
  };

  const handleEditar = (agendamento: AgendamentoDetalhado) => {
    // Diferentes opções baseadas no status do agendamento
    const opcoes: any[] = [];

    // Sempre permitir cancelar o dialog
    opcoes.push({ text: 'Fechar', style: 'cancel' });

    // Se o agendamento está pendente, permitir confirmar
    if (agendamento.status === 'pendente') {
      opcoes.push({
        text: 'Confirmar',
        onPress: async () => {
          try {
            await AgendamentoService.confirmarAgendamento(agendamento.id);
            Alert.alert('Sucesso', 'Agendamento confirmado!');
            carregarAgendamentos();
          } catch (error) {
            console.error('Erro ao confirmar agendamento:', error);
            Alert.alert('Erro', 'Falha ao confirmar agendamento');
          }
        },
      });
    }

    // Se o agendamento está confirmado, permitir concluir
    if (agendamento.status === 'confirmado') {
      opcoes.push({
        text: 'Concluir Atendimento',
        onPress: async () => {
          Alert.alert(
            'Concluir Atendimento',
            `Confirma que o atendimento de ${agendamento.cliente.nome} foi realizado?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sim, Concluir',
                onPress: async () => {
                  try {
                    await AgendamentoService.concluirAgendamento(agendamento.id);
                    Alert.alert('Sucesso', 'Atendimento concluído com sucesso!');
                    carregarAgendamentos();
                  } catch (error) {
                    console.error('Erro ao concluir agendamento:', error);
                    Alert.alert('Erro', 'Falha ao concluir agendamento');
                  }
                },
              },
            ]
          );
        },
      });
    }

    if (agendamento.status !== 'cancelado' && agendamento.status !== 'concluido') {
      opcoes.push({
        text: 'Reagendar',
        onPress: () => {
          router.push(
            `/massagista/reagendar?agendamentoId=${agendamento.id}` as any
          );
        },
      });
    }

    // Permitir cancelar apenas se não estiver já cancelado ou concluído
    if (
      agendamento.status !== 'cancelado' &&
      agendamento.status !== 'concluido'
    ) {
      opcoes.push({
        text: 'Cancelar Agendamento',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Confirmar Cancelamento',
            'Tem certeza que deseja cancelar este agendamento?',
            [
              { text: 'Não', style: 'cancel' },
              {
                text: 'Sim, Cancelar',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await AgendamentoService.cancelarAgendamento(
                      agendamento.id
                    );
                    Alert.alert(
                      'Cancelado',
                      'Agendamento cancelado com sucesso'
                    );
                    carregarAgendamentos();
                  } catch (error) {
                    console.error('Erro ao cancelar agendamento:', error);
                    Alert.alert('Erro', 'Falha ao cancelar agendamento');
                  }
                },
              },
            ]
          );
        },
      });
    }

    Alert.alert(
      'Editar Agendamento',
      `Cliente: ${agendamento.cliente.nome}\nServiço: ${
        agendamento.servico.nome
      }\nHorário: ${agendamento.hora}\nStatus: ${
        agendamento.status === 'confirmado'
          ? 'Confirmado'
          : agendamento.status === 'cancelado'
          ? 'Cancelado'
          : agendamento.status === 'concluido'
          ? 'Concluído'
          : 'Pendente'
      }`,
      opcoes
    );
  };

  const formatarData = (dataISO: string) => {
    const data = new Date(dataISO + 'T00:00:00');
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderAgendamento = ({ item }: { item: AgendamentoDetalhado }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.timeContainer}>
          <Text style={styles.data}>{formatarData(item.data)}</Text>
          <Text style={styles.horario}>{item.hora}</Text>
          <Text style={styles.duracao}>{item.servico.duracao}min</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.cliente}>{item.cliente.nome}</Text>
          <Text style={styles.servico}>{item.servico.nome}</Text>
          <Text style={styles.valor}>R$ {item.servico.preco}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.statusBadge,
            item.status === 'confirmado'
              ? styles.badgeConfirmado
              : item.status === 'cancelado'
              ? styles.badgeCancelado
              : item.status === 'concluido'
              ? styles.badgeConcluido
              : styles.badgePendente,
          ]}
          onPress={() => {
            if (item.status === 'pendente') {
              Alert.alert(
                'Confirmar Agendamento',
                `Confirmar agendamento de ${item.cliente.nome}?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Confirmar',
                    onPress: async () => {
                      try {
                        await AgendamentoService.confirmarAgendamento(item.id);
                        Alert.alert(
                          'Confirmado',
                          'Agendamento confirmado com sucesso!'
                        );
                        carregarAgendamentos();
                      } catch (error) {
                        console.error('Erro ao confirmar:', error);
                        Alert.alert('Erro', 'Falha ao confirmar agendamento');
                      }
                    },
                  },
                ]
              );
            } else if (item.status === 'confirmado') {
              Alert.alert(
                'Concluir Atendimento',
                `Confirma que o atendimento de ${item.cliente.nome} foi realizado?`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Sim, Concluir',
                    onPress: async () => {
                      try {
                        await AgendamentoService.concluirAgendamento(item.id);
                        Alert.alert(
                          'Concluído',
                          'Atendimento concluído com sucesso!'
                        );
                        carregarAgendamentos();
                      } catch (error) {
                        console.error('Erro ao concluir:', error);
                        Alert.alert('Erro', 'Falha ao concluir agendamento');
                      }
                    },
                  },
                ]
              );
            }
          }}
        >
          <MaterialIcons
            name={
              item.status === 'confirmado'
                ? 'check-circle'
                : item.status === 'cancelado'
                ? 'cancel'
                : item.status === 'concluido'
                ? 'done-all'
                : 'schedule'
            }
            size={14}
            color={Colors.textLight}
          />
          <Text style={styles.badgeText}>
            {item.status === 'confirmado'
              ? 'Confirmado'
              : item.status === 'cancelado'
              ? 'Cancelado'
              : item.status === 'concluido'
              ? 'Concluído'
              : 'Pendente'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLigar(item.cliente.nome, item.cliente.telefone)}
        >
          <MaterialIcons name="phone" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>Ligar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            handleMensagem(item.cliente.nome, item.cliente.telefone)
          }
        >
          <MaterialIcons name="message" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>Mensagem</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditar(item)}
        >
          <MaterialIcons name="edit" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando agendamentos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{hoje}</Text>
          <Text style={styles.title}>Minha Agenda</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{agendamentos.length}</Text>
            <Text style={styles.statLabel}>Próximos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              R${' '}
              {agendamentos
                .filter((item) => item.status !== 'cancelado')
                .reduce(
                  (total: number, item: AgendamentoDetalhado) =>
                    total + item.servico.preco,
                  0
                )}
            </Text>
            <Text style={styles.statLabel}>Faturamento</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {
                agendamentos.filter((ag) => {
                  const dataAgendamento = new Date(ag.data + 'T00:00:00');
                  const hoje = new Date();
                  hoje.setHours(0, 0, 0, 0);
                  return dataAgendamento.getTime() === hoje.getTime();
                }).length
              }
            </Text>
            <Text style={styles.statLabel}>Hoje</Text>
          </View>
        </View>
      </View>

      {/* Lista de agendamentos */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Próximos Agendamentos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAdicionarAgendamento}
        >
          <MaterialIcons name="add" size={20} color={Colors.textLight} />
        </TouchableOpacity>
      </View>

      {agendamentos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="event-busy" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Nenhum agendamento próximo</Text>
          <Text style={styles.emptySubText}>
            Que tal aproveitar para descansar?
          </Text>
        </View>
      ) : (
        <FlatList
          data={agendamentos}
          renderItem={renderAgendamento}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
  },
  header: {
    backgroundColor: Colors.secondary,
    padding: 20,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 14,
    color: Colors.textLight,
    opacity: 0.9,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textLight,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    opacity: 0.8,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  data: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  horario: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  duracao: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  info: {
    flex: 1,
  },
  cliente: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  servico: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  valor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.success,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 90,
    justifyContent: 'center',
  },
  badgeConfirmado: {
    backgroundColor: Colors.success,
  },
  badgePendente: {
    backgroundColor: Colors.warning,
  },
  badgeCancelado: {
    backgroundColor: Colors.danger,
  },
  badgeConcluido: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textLight,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
});
