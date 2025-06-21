// Tipos de usuário
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  cidade: string;
  bio?: string;
  tipo: 'cliente' | 'massagista';
  criadoEm: string;
}

export interface Massagista extends Usuario {
  servicos: Servico[];
  avaliacao: number;
  totalAvaliacoes: number;
}

export interface Servico {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
  descricao: string;
}

// Tipos para autenticação
export interface LoginRequest {
  email: string;
  senha: string;
}

export type RegistroRequest = Omit<Usuario, 'id' | 'criadoEm'>;

export interface AuthResponse {
  sucesso: boolean;
  mensagem: string;
  usuario?: Usuario;
}

// Tipos para agendamentos
export interface Agendamento {
  id: string;
  clienteId: string;
  massagistaId: string;
  servicoId: string;
  data: string;
  hora: string;
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido';
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AgendamentoDetalhado extends Agendamento {
  cliente: Usuario;
  massagista: Massagista;
  servico: Servico;
}

// Interfaces para o AgendamentoService
export interface CriarAgendamentoRequest {
  massagistaId: string;
  servicoId: string;
  data: string;
  hora: string;
  observacoes?: string;
}

export interface AgendamentoResponse {
  sucesso: boolean;
  mensagem: string;
  agendamento?: Agendamento;
}
