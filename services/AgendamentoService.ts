import AsyncStorage from '@react-native-async-storage/async-storage';
import { Agendamento, AgendamentoDetalhado, AgendamentoResponse, CriarAgendamentoRequest, Usuario } from '../types';
import AuthService from './AuthService';

// Chaves do AsyncStorage
const STORAGE_KEYS = {
  AGENDAMENTOS: '@agenda_massagem:agendamentos',
  HORARIOS_DISPONIVEIS: '@agenda_massagem:horarios_disponiveis',
};

class AgendamentoService {
  // Criar novo agendamento
  async criarAgendamento(dadosAgendamento: CriarAgendamentoRequest): Promise<AgendamentoResponse> {
    try {
      const usuarioLogado = await AuthService.obterUsuarioLogado();

      if (!usuarioLogado || usuarioLogado.tipo !== 'cliente') {
        return { sucesso: false, mensagem: 'Usuário deve estar logado como cliente' };
      }

      // Verificar se horário está disponível
      const horarioDisponivel = await this.verificarDisponibilidade(
        dadosAgendamento.massagistaId,
        dadosAgendamento.data,
        dadosAgendamento.hora
      );

      if (!horarioDisponivel) {
        return { sucesso: false, mensagem: 'Horário não está mais disponível' };
      }

      // Verificar se massagista e serviço existem
      const massagista = await AuthService.obterMassagistaPorId(dadosAgendamento.massagistaId);
      if (!massagista) {
        return { sucesso: false, mensagem: 'Massagista não encontrada' };
      }

      const servico = massagista.servicos.find(s => s.id === dadosAgendamento.servicoId);
      if (!servico) {
        return { sucesso: false, mensagem: 'Serviço não encontrado' };
      }

      // Criar agendamento
      const novoAgendamento: Agendamento = {
        id: this.gerarId(),
        clienteId: usuarioLogado.id,
        massagistaId: dadosAgendamento.massagistaId,
        servicoId: dadosAgendamento.servicoId,
        data: dadosAgendamento.data,
        hora: dadosAgendamento.hora,
        status: 'pendente',
        observacoes: dadosAgendamento.observacoes,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      // Salvar agendamento
      await this.salvarAgendamento(novoAgendamento);

      return {
        sucesso: true,
        mensagem: 'Agendamento criado com sucesso!',
        agendamento: novoAgendamento
      };
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao criar agendamento. Tente novamente.'
      };
    }
  }

  // Criar agendamento manual (por massagista)
  async criarAgendamentoManual(dados: {
    clienteId: string;
    servicoId: string;
    data: string;
    hora: string;
    observacoes?: string;
  }): Promise<AgendamentoResponse> {
    try {
      const usuarioLogado = await AuthService.obterUsuarioLogado();

      if (!usuarioLogado || usuarioLogado.tipo !== 'massagista') {
        return { sucesso: false, mensagem: 'Usuário deve estar logado como massagista' };
      }

      // Verificar se horário está disponível
      const horarioDisponivel = await this.verificarDisponibilidade(
        usuarioLogado.id,
        dados.data,
        dados.hora
      );

      if (!horarioDisponivel) {
        return { sucesso: false, mensagem: 'Horário não está mais disponível' };
      }

      // Verificar se cliente existe
      const clientes = await AuthService.obterTodosClientes();
      const cliente = clientes.find(c => c.id === dados.clienteId);
      if (!cliente) {
        return { sucesso: false, mensagem: 'Cliente não encontrado' };
      }

      // Verificar se serviço existe
      const massagista = await AuthService.obterMassagistaPorId(usuarioLogado.id);
      if (!massagista) {
        return { sucesso: false, mensagem: 'Massagista não encontrada' };
      }

      const servico = massagista.servicos.find(s => s.id === dados.servicoId);
      if (!servico) {
        return { sucesso: false, mensagem: 'Serviço não encontrado' };
      }

      // Criar agendamento
      const novoAgendamento: Agendamento = {
        id: this.gerarId(),
        clienteId: dados.clienteId,
        massagistaId: usuarioLogado.id,
        servicoId: dados.servicoId,
        data: dados.data,
        hora: dados.hora,
        status: 'confirmado', // Agendamento manual já vem confirmado
        observacoes: dados.observacoes,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      // Salvar agendamento
      await this.salvarAgendamento(novoAgendamento);

      return {
        sucesso: true,
        mensagem: 'Agendamento manual criado com sucesso!',
        agendamento: novoAgendamento
      };
    } catch (error) {
      console.error('Erro ao criar agendamento manual:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao criar agendamento manual. Tente novamente.'
      };
    }
  }

  // Obter agendamentos do cliente logado
  async obterAgendamentosCliente(): Promise<AgendamentoDetalhado[]> {
    try {
      const usuarioLogado = await AuthService.obterUsuarioLogado();
      if (!usuarioLogado || usuarioLogado.tipo !== 'cliente') {
        return [];
      }

      const agendamentos = await this.obterTodosAgendamentos();
      const agendamentosCliente = agendamentos.filter(a => a.clienteId === usuarioLogado.id);

      return await this.popularAgendamentosDetalhados(agendamentosCliente);
    } catch (error) {
      console.error('Erro ao obter agendamentos do cliente:', error);
      return [];
    }
  }

  // Obter agendamentos da massagista logada
  async obterAgendamentosMassagista(): Promise<AgendamentoDetalhado[]> {
    try {
      const usuarioLogado = await AuthService.obterUsuarioLogado();
      if (!usuarioLogado || usuarioLogado.tipo !== 'massagista') {
        return [];
      }

      const agendamentos = await this.obterTodosAgendamentos();
      const agendamentosMassagista = agendamentos.filter(a => a.massagistaId === usuarioLogado.id);

      return await this.popularAgendamentosDetalhados(agendamentosMassagista);
    } catch (error) {
      console.error('Erro ao obter agendamentos da massagista:', error);
      return [];
    }
  }

  // Atualizar status do agendamento
  async atualizarStatusAgendamento(agendamentoId: string, novoStatus: Agendamento['status']): Promise<AgendamentoResponse> {
    try {
      const agendamentos = await this.obterTodosAgendamentos();
      const index = agendamentos.findIndex(a => a.id === agendamentoId);

      if (index === -1) {
        return { sucesso: false, mensagem: 'Agendamento não encontrado' };
      }

      agendamentos[index].status = novoStatus;
      agendamentos[index].atualizadoEm = new Date().toISOString();

      await this.salvarTodosAgendamentos(agendamentos);

      return {
        sucesso: true,
        mensagem: 'Status atualizado com sucesso!',
        agendamento: agendamentos[index]
      };
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao atualizar status. Tente novamente.'
      };
    }
  }

  // Cancelar agendamento
  async cancelarAgendamento(agendamentoId: string): Promise<AgendamentoResponse> {
    return await this.atualizarStatusAgendamento(agendamentoId, 'cancelado');
  }

  // Confirmar agendamento (massagista)
  async confirmarAgendamento(agendamentoId: string): Promise<AgendamentoResponse> {
    return await this.atualizarStatusAgendamento(agendamentoId, 'confirmado');
  }

  // Concluir agendamento (massagista)
  async concluirAgendamento(agendamentoId: string): Promise<AgendamentoResponse> {
    return await this.atualizarStatusAgendamento(agendamentoId, 'concluido');
  }

  // Reagendar agendamento (massagista)
  async reagendarAgendamento(dados: {
    agendamentoId: string;
    novaData: string;
    novaHora: string;
    motivo: string;
  }): Promise<AgendamentoResponse> {
    try {
      const usuarioLogado = await AuthService.obterUsuarioLogado();

      if (!usuarioLogado || usuarioLogado.tipo !== 'massagista') {
        return { sucesso: false, mensagem: 'Usuário deve estar logado como massagista' };
      }

      // Buscar o agendamento
      const agendamentos = await this.obterTodosAgendamentos();
      const agendamentoIndex = agendamentos.findIndex(a => a.id === dados.agendamentoId);

      if (agendamentoIndex === -1) {
        return { sucesso: false, mensagem: 'Agendamento não encontrado' };
      }

      const agendamento = agendamentos[agendamentoIndex];

      // Verificar se é da massagista logada
      if (agendamento.massagistaId !== usuarioLogado.id) {
        return { sucesso: false, mensagem: 'Você não tem permissão para reagendar este agendamento' };
      }

      // Se mudou data/hora, verificar disponibilidade do novo horário
      const mudouDataHora = agendamento.data !== dados.novaData || agendamento.hora !== dados.novaHora;

      if (mudouDataHora) {
        const horarioDisponivel = await this.verificarDisponibilidade(
          usuarioLogado.id,
          dados.novaData,
          dados.novaHora
        );

        if (!horarioDisponivel) {
          return { sucesso: false, mensagem: 'Novo horário não está disponível' };
        }
      }

      // Atualizar agendamento
      const agendamentoAtualizado: Agendamento = {
        ...agendamento,
        data: dados.novaData,
        hora: dados.novaHora,
        observacoes: agendamento.observacoes
          ? `${agendamento.observacoes}\n\nREAGENDADO: ${dados.motivo}`
          : `REAGENDADO: ${dados.motivo}`,
        atualizadoEm: new Date().toISOString(),
      };

      agendamentos[agendamentoIndex] = agendamentoAtualizado;
      await this.salvarTodosAgendamentos(agendamentos);

      return {
        sucesso: true,
        mensagem: 'Agendamento reagendado com sucesso!',
        agendamento: agendamentoAtualizado
      };
    } catch (error) {
      console.error('Erro ao reagendar agendamento:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao reagendar agendamento. Tente novamente.'
      };
    }
  }

  // Verificar disponibilidade de horário
  async verificarDisponibilidade(massagistaId: string, data: string, hora: string): Promise<boolean> {
    try {
      const agendamentos = await this.obterTodosAgendamentos();

      // Verificar se já existe agendamento no mesmo horário
      const conflito = agendamentos.some(a =>
        a.massagistaId === massagistaId &&
        a.data === data &&
        a.hora === hora &&
        a.status !== 'cancelado'
      );

      return !conflito;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  }

  // Obter horários disponíveis para uma data
  async obterHorariosDisponiveis(massagistaId: string, data: string): Promise<string[]> {
    try {
      // Horários de funcionamento (8h às 18h, de 30 em 30 minutos)
      const horariosBase = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00'
      ];

      const agendamentos = await this.obterTodosAgendamentos();

      // Filtrar horários já ocupados
      const horariosOcupados = agendamentos
        .filter(a =>
          a.massagistaId === massagistaId &&
          a.data === data &&
          a.status !== 'cancelado'
        )
        .map(a => a.hora);

      return horariosBase.filter(horario => !horariosOcupados.includes(horario));
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      return [];
    }
  }

  private async obterTodosAgendamentos(): Promise<Agendamento[]> {
    try {
      const agendamentosStr = await AsyncStorage.getItem(STORAGE_KEYS.AGENDAMENTOS);
      return agendamentosStr ? JSON.parse(agendamentosStr) : [];
    } catch (error) {
      console.error('Erro ao obter agendamentos:', error);
      return [];
    }
  }

  private async salvarTodosAgendamentos(agendamentos: Agendamento[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AGENDAMENTOS, JSON.stringify(agendamentos));
    } catch (error) {
      console.error('Erro ao salvar agendamentos:', error);
    }
  }

  private async salvarAgendamento(agendamento: Agendamento): Promise<void> {
    const agendamentos = await this.obterTodosAgendamentos();
    agendamentos.push(agendamento);
    await this.salvarTodosAgendamentos(agendamentos);
  }

  private async popularAgendamentosDetalhados(agendamentos: Agendamento[]): Promise<AgendamentoDetalhado[]> {
    const agendamentosDetalhados: AgendamentoDetalhado[] = [];

    for (const agendamento of agendamentos) {
      // Obter dados do cliente
      const usuarios = await this.obterTodosUsuarios();
      const cliente = usuarios.find(u => u.id === agendamento.clienteId);

      // Obter dados da massagista
      const massagista = await AuthService.obterMassagistaPorId(agendamento.massagistaId);

      // Obter dados do serviço
      const servico = massagista?.servicos.find(s => s.id === agendamento.servicoId);

      if (cliente && massagista && servico) {
        agendamentosDetalhados.push({
          ...agendamento,
          cliente,
          massagista,
          servico,
        });
      }
    }

    return agendamentosDetalhados;
  }

  private async obterTodosUsuarios(): Promise<Usuario[]> {
    try {
      const usuariosStr = await AsyncStorage.getItem('@agenda_massagem:usuarios');
      return usuariosStr ? JSON.parse(usuariosStr) : [];
    } catch (error) {
      console.error('Erro ao obter usuários:', error);
      return [];
    }
  }

  private gerarId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  // Método para limpar todos os agendamentos (útil para desenvolvimento)
  async limparTodosAgendamentos(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AGENDAMENTOS);
    } catch (error) {
      console.error('Erro ao limpar agendamentos:', error);
    }
  }

  // Método de debug para verificar se massagista existe
  async debugVerificarMassagista(massagistaId: string): Promise<void> {
    const massagista = await AuthService.obterMassagistaPorId(massagistaId);
    console.log('Massagista encontrada:', massagista ? massagista.nome : 'Não encontrada');

    if (massagista) {
      console.log('Serviços disponíveis:', massagista.servicos.map(s => `${s.id}: ${s.nome}`));
    }
  }
}

export default new AgendamentoService();
