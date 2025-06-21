import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Massagista, RegistroRequest, Servico, Usuario } from '../types';

// Chaves do AsyncStorage
const STORAGE_KEYS = {
  USUARIOS: '@agenda_massagem:usuarios',
  USUARIO_LOGADO: '@agenda_massagem:usuario_logado',
  MASSAGISTAS: '@agenda_massagem:massagistas',
};

class AuthService {
  // Registrar novo usuário
  async registrarUsuario(dadosUsuario: RegistroRequest, servicos?: Servico[]): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const emailExiste = await this.verificarEmailExiste(dadosUsuario.email);
      if (emailExiste) {
        return { sucesso: false, mensagem: 'Este email já está cadastrado' };
      }

      // Criar novo usuário
      const novoUsuario: Usuario = {
        ...dadosUsuario,
        id: this.gerarId(),
        criadoEm: new Date().toISOString(),
      };

      // Salvar usuário
      await this.salvarUsuario(novoUsuario);

      // Se for massagista, criar perfil completo
      if (dadosUsuario.tipo === 'massagista') {
        await this.criarPerfilMassagista(novoUsuario, servicos);
      }

      return {
        sucesso: true,
        mensagem: 'Usuário cadastrado com sucesso!',
        usuario: novoUsuario
      };
    } catch {
      return {
        sucesso: false,
        mensagem: 'Erro ao cadastrar usuário. Tente novamente.'
      };
    }
  }

  // Login do usuário
  async logarUsuario(email: string, senha: string): Promise<AuthResponse> {
    try {
      const usuarios = await this.obterTodosUsuarios();
      const usuario = usuarios.find(u => u.email === email && u.senha === senha);

      if (!usuario) {
        return { sucesso: false, mensagem: 'Email ou senha incorretos' };
      }

      // Salvar usuário logado
      await AsyncStorage.setItem(STORAGE_KEYS.USUARIO_LOGADO, JSON.stringify(usuario));

      return {
        sucesso: true,
        mensagem: 'Login realizado com sucesso!',
        usuario
      };
    } catch (error) {
      console.error('Erro durante login:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao fazer login. Tente novamente.'
      };
    }
  }

  // Obter usuário logado
  async obterUsuarioLogado(): Promise<Usuario | null> {
    try {
      const usuarioStr = await AsyncStorage.getItem(STORAGE_KEYS.USUARIO_LOGADO);
      return usuarioStr ? JSON.parse(usuarioStr) : null;
    } catch (error) {
      console.error('Erro ao obter usuário logado:', error);
      return null;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USUARIO_LOGADO);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  // Verificar se usuário está logado
  async estaLogado(): Promise<boolean> {
    const usuario = await this.obterUsuarioLogado();
    return usuario !== null;
  }

  // Obter massagista por ID
  async obterMassagistaPorId(id: string): Promise<Massagista | null> {
    try {
      const massagistas = await this.obterTodasMassagistas();
      return massagistas.find(m => m.id === id) || null;
    } catch (error) {
      console.error('Erro ao obter massagista por ID:', error);
      return null;
    }
  }

  // Obter todas as massagistas
  async obterTodasMassagistas(): Promise<Massagista[]> {
    try {
      const massagistasStr = await AsyncStorage.getItem(STORAGE_KEYS.MASSAGISTAS);

      if (massagistasStr) {
        return JSON.parse(massagistasStr);
      }

      // Se não existir, criar dados mock e salvar
      const massagistasMock = await this.criarDadosMockMassagistas();
      await AsyncStorage.setItem(STORAGE_KEYS.MASSAGISTAS, JSON.stringify(massagistasMock));
      return massagistasMock;
    } catch (error) {
      console.error('Erro ao obter massagistas:', error);
      return [];
    }
  }

  // Obter todos os usuários (clientes)
  async obterTodosClientes(): Promise<Usuario[]> {
    try {
      const usuarios = await this.obterTodosUsuarios();
      return usuarios.filter(u => u.tipo === 'cliente');
    } catch {
      return [];
    }
  }

  // Atualizar perfil do usuário
  async atualizarPerfil(usuarioAtualizado: Usuario): Promise<boolean> {
    try {
      // Atualizar na lista de usuários
      const usuarios = await this.obterTodosUsuarios();
      const index = usuarios.findIndex(u => u.id === usuarioAtualizado.id);

      if (index !== -1) {
        usuarios[index] = usuarioAtualizado;
        await AsyncStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));

        // Se for o usuário logado, atualizar também
        const usuarioLogado = await this.obterUsuarioLogado();
        if (usuarioLogado && usuarioLogado.id === usuarioAtualizado.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.USUARIO_LOGADO, JSON.stringify(usuarioAtualizado));
        }

        // Se for massagista, atualizar também na lista de massagistas
        if (usuarioAtualizado.tipo === 'massagista') {
          await this.atualizarMassagista(usuarioAtualizado as Massagista);
        }

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Atualizar serviços de uma massagista
  async atualizarServicosMassagista(massagistaId: string, novosServicos: Servico[]): Promise<boolean> {
    try {
      const massagistas = await this.obterTodasMassagistas();
      const index = massagistas.findIndex(m => m.id === massagistaId);

      if (index !== -1) {
        // Atualizar serviços
        massagistas[index].servicos = novosServicos;
        
        await AsyncStorage.setItem(STORAGE_KEYS.MASSAGISTAS, JSON.stringify(massagistas));
        
        // Se for o usuário logado, atualizar também
        const usuarioLogado = await this.obterUsuarioLogado();
        if (usuarioLogado && usuarioLogado.id === massagistaId) {
          const massagistaAtualizada = massagistas[index];
          await AsyncStorage.setItem(STORAGE_KEYS.USUARIO_LOGADO, JSON.stringify(massagistaAtualizada));
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar serviços da massagista:', error);
      return false;
    }
  }

  private async verificarEmailExiste(email: string): Promise<boolean> {
    const usuarios = await this.obterTodosUsuarios();
    return usuarios.some(u => u.email === email);
  }

  private async salvarUsuario(usuario: Usuario): Promise<void> {
    const usuarios = await this.obterTodosUsuarios();
    usuarios.push(usuario);
    await AsyncStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(usuarios));
  }

  private async obterTodosUsuarios(): Promise<Usuario[]> {
    try {
      const usuariosStr = await AsyncStorage.getItem(STORAGE_KEYS.USUARIOS);
      return usuariosStr ? JSON.parse(usuariosStr) : [];
    } catch {
      return [];
    }
  }

  private async criarPerfilMassagista(usuario: Usuario, servicos?: Servico[]): Promise<void> {
    // Gerar IDs únicos para os serviços
    const servicosComId: Servico[] = servicos ? servicos.map(servico => ({
      ...servico,
      id: this.gerarId()
    })) : [];

    const massagista: Massagista = {
      ...usuario,
      servicos: servicosComId,
      avaliacao: 0,
      totalAvaliacoes: 0,
    };

    const massagistas = await this.obterTodasMassagistas();
    massagistas.push(massagista);
    await AsyncStorage.setItem(STORAGE_KEYS.MASSAGISTAS, JSON.stringify(massagistas));
  }

  private async atualizarMassagista(massagistaAtualizada: Massagista): Promise<void> {
    const massagistas = await this.obterTodasMassagistas();
    const index = massagistas.findIndex(m => m.id === massagistaAtualizada.id);

    if (index !== -1) {
      massagistas[index] = massagistaAtualizada;
      await AsyncStorage.setItem(STORAGE_KEYS.MASSAGISTAS, JSON.stringify(massagistas));
    }
  }

  private gerarId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2);
  }

  private async criarDadosMockMassagistas(): Promise<Massagista[]> {
    return [
      {
        id: 'mock_1',
        nome: 'Ana Silva',
        email: 'ana@massagem.com',
        senha: '123456',
        telefone: '(11) 99999-1111',
        cidade: 'São Paulo',
        tipo: 'massagista',
        criadoEm: new Date().toISOString(),
        avaliacao: 4.8,
        totalAvaliacoes: 127,
        bio: 'Massagista certificada com especialização em técnicas de relaxamento e terapias corporais.',
        servicos: [
          { id: '1', nome: 'Massagem Relaxante', duracao: 60, preco: 80, descricao: 'Técnica suave para alívio do estresse' },
          { id: '2', nome: 'Massagem Terapêutica', duracao: 90, preco: 120, descricao: 'Tratamento para dores musculares' },
          { id: '3', nome: 'Hot Stone', duracao: 75, preco: 150, descricao: 'Massagem com pedras aquecidas' }
        ]
      },
      {
        id: 'mock_2',
        nome: 'Carla Santos',
        email: 'carla@massagem.com',
        senha: '123456',
        telefone: '(11) 99999-2222',
        cidade: 'São Paulo',
        tipo: 'massagista',
        criadoEm: new Date().toISOString(),
        avaliacao: 4.9,
        totalAvaliacoes: 89,
        bio: 'Especialista em massagem desportiva e recuperação muscular.',
        servicos: [
          { id: '1', nome: 'Massagem Desportiva', duracao: 60, preco: 95, descricao: 'Para atletas e praticantes de exercícios' }
        ]
      }
    ];
  }

  // Método para limpar todos os dados
  async limparTodosDados(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USUARIOS,
        STORAGE_KEYS.USUARIO_LOGADO,
        STORAGE_KEYS.MASSAGISTAS,
      ]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }

  // Método de debug para limpar dados de massagistas
  async limparDadosMassagistas(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MASSAGISTAS);
      console.log('Dados de massagistas limpos do AsyncStorage');
    } catch (error) {
      console.error('Erro ao limpar dados de massagistas:', error);
    }
  }
}

export default new AuthService();
