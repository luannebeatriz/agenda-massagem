import { Colors } from '@/constants/Colors';
import AuthService from '@/services/AuthService';
import { RegistroRequest, Servico } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  bio: string;
  senha: string;
  confirmarSenha: string;
}

export default function RegistroScreen() {
  const { tipo } = useLocalSearchParams<{ tipo: 'cliente' | 'massagista' }>();
  const [loading, setLoading] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<'dados' | 'servicos'>('dados');
  const [servicosSelecionados, setServicosSelecionados] = useState<Servico[]>(
    []
  );
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      cidade: '',
      bio: '',
      senha: '',
      confirmarSenha: '',
    },
  });

  const senhaValue = watch('senha');

  // Serviços disponíveis para seleção
  const servicosDisponiveis: Omit<Servico, 'id'>[] = [
    {
      nome: 'Massagem Relaxante',
      duracao: 60,
      preco: 80,
      descricao: 'Técnica suave para alívio do estresse',
    },
    {
      nome: 'Massagem Terapêutica',
      duracao: 90,
      preco: 120,
      descricao: 'Tratamento para dores musculares',
    },
    {
      nome: 'Hot Stone',
      duracao: 75,
      preco: 150,
      descricao: 'Massagem com pedras aquecidas',
    },
    {
      nome: 'Massagem Desportiva',
      duracao: 60,
      preco: 95,
      descricao: 'Para atletas e praticantes de exercícios',
    },
    {
      nome: 'Deep Tissue',
      duracao: 90,
      preco: 140,
      descricao: 'Massagem profunda para tensões musculares',
    },
    {
      nome: 'Reflexologia',
      duracao: 45,
      preco: 70,
      descricao: 'Massagem nos pés com pontos reflexos',
    },
    {
      nome: 'Drenagem Linfática',
      duracao: 60,
      preco: 100,
      descricao: 'Para redução de inchaço e retenção',
    },
    {
      nome: 'Massagem Ayurvédica',
      duracao: 75,
      preco: 130,
      descricao: 'Técnica milenar indiana',
    },
  ];

  const onSubmit = async (data: FormData) => {
    if (!tipo) {
      Alert.alert('Erro', 'Tipo de usuário não especificado');
      return;
    }

    // Se for massagista e estiver na primeira etapa, vá para seleção de serviços
    if (tipo === 'massagista' && etapaAtual === 'dados') {
      if (servicosSelecionados.length === 0) {
        setEtapaAtual('servicos');
        return;
      }
    }

    // Se for massagista na segunda etapa e não selecionou serviços
    if (
      tipo === 'massagista' &&
      etapaAtual === 'servicos' &&
      servicosSelecionados.length === 0
    ) {
      Alert.alert('Erro', 'Selecione pelo menos um serviço que você oferece');
      return;
    }

    setLoading(true);
    try {
      const dadosRegistro: RegistroRequest = {
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        telefone: removerMascaraTelefone(data.telefone),
        cidade: data.cidade.trim(),
        bio: data.bio.trim(),
        senha: data.senha,
        tipo: tipo,
      };

      const resultado = await AuthService.registrarUsuario(
        dadosRegistro,
        tipo === 'massagista' ? servicosSelecionados : undefined
      );

      if (resultado.sucesso && resultado.usuario) {
        // Fazer login automático após registro bem-sucedido
        const loginResult = await AuthService.logarUsuario(
          dadosRegistro.email,
          dadosRegistro.senha
        );

        if (loginResult.sucesso) {
          Alert.alert('Sucesso!', 'Conta criada com sucesso!', [
            {
              text: 'OK',
              onPress: () => {
                // Redirecionar baseado no tipo de usuário
                if (resultado.usuario!.tipo === 'cliente') {
                  router.replace('/cliente');
                } else {
                  router.replace('/massagista');
                }
              },
            },
          ]);
        } else {
          Alert.alert('Sucesso!', 'Conta criada! Faça login para continuar.', [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login'),
            },
          ]);
        }
      } else {
        Alert.alert('Erro', resultado.mensagem);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
      console.error('Erro no registro:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServico = (servico: Omit<Servico, 'id'>) => {
    const servicoExiste = servicosSelecionados.find(
      (s) => s.nome === servico.nome
    );

    if (servicoExiste) {
      // Remove o serviço
      setServicosSelecionados((prev) =>
        prev.filter((s) => s.nome !== servico.nome)
      );
    } else {
      // Adiciona o serviço
      setServicosSelecionados((prev) => [...prev, servico as Servico]);
    }
  };

  const voltarParaDados = () => {
    setEtapaAtual('dados');
  };

  const isServicoSelecionado = (servico: Omit<Servico, 'id'>) => {
    return servicosSelecionados.some((s) => s.nome === servico.nome);
  };

  const getTipoTexto = () => {
    return tipo === 'cliente' ? 'Cliente' : 'Massagista';
  };

  const getCorTema = () => {
    return tipo === 'cliente' ? Colors.primary : Colors.secondary;
  };

  // Função para aplicar máscara de telefone
  const formatarTelefone = (text: string) => {
    // Remove tudo que não for número
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Limita a 11 dígitos
    const limitedText = numericText.slice(0, 11);
    
    // Aplica a máscara conforme o número de dígitos
    if (limitedText.length <= 2) {
      return limitedText.length > 0 ? `(${limitedText}` : limitedText;
    } else if (limitedText.length <= 7) {
      return `(${limitedText.slice(0, 2)}) ${limitedText.slice(2)}`;
    } else {
      return `(${limitedText.slice(0, 2)}) ${limitedText.slice(2, 7)}-${limitedText.slice(7)}`;
    }
  };

  // Função para remover máscara do telefone
  const removerMascaraTelefone = (text: string) => {
    return text.replace(/[^0-9]/g, '');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          {etapaAtual === 'dados' ? (
            <>
              <Text style={styles.title}>Criar conta de {getTipoTexto()}</Text>
              <Text style={styles.subtitle}>
                Preencha seus dados para começar
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Seus Serviços</Text>
              <Text style={styles.subtitle}>
                Selecione os serviços que você oferece
              </Text>
            </>
          )}
        </View>

        {/* Formulário de dados */}
        {etapaAtual === 'dados' && (
          <View style={styles.form}>
            <Controller
              control={control}
              name="nome"
              rules={{
                required: 'Nome é obrigatório',
                minLength: {
                  value: 2,
                  message: 'Nome deve ter pelo menos 2 caracteres',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nome completo</Text>
                  <TextInput
                    style={[styles.input, errors.nome && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Seu nome completo"
                    autoCapitalize="words"
                  />
                  {errors.nome && (
                    <Text style={styles.errorText}>{errors.nome.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="seu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="telefone"
              rules={{
                required: 'Telefone é obrigatório',
                validate: (value) => {
                  const numericValue = removerMascaraTelefone(value);
                  if (numericValue.length !== 11) {
                    return 'Telefone deve ter exatamente 11 dígitos';
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Telefone</Text>
                  <TextInput
                    style={[styles.input, errors.telefone && styles.inputError]}
                    value={value}
                    onChangeText={(text) => {
                      const formatted = formatarTelefone(text);
                      onChange(formatted);
                    }}
                    onBlur={onBlur}
                    placeholder="(11) 99999-9999"
                    keyboardType="numeric"
                    maxLength={15} // (11) 99999-9999 = 15 caracteres
                  />
                  {errors.telefone && (
                    <Text style={styles.errorText}>
                      {errors.telefone.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="cidade"
              rules={{
                required: 'Cidade é obrigatória',
                minLength: {
                  value: 2,
                  message: 'Cidade deve ter pelo menos 2 caracteres',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Cidade</Text>
                  <TextInput
                    style={[styles.input, errors.cidade && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Sua cidade"
                    autoCapitalize="words"
                  />
                  {errors.cidade && (
                    <Text style={styles.errorText}>
                      {errors.cidade.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Campo bio apenas para massagistas */}
            {tipo === 'massagista' && (
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Sobre você (opcional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Conte um pouco sobre sua experiência e abordagem..."
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              />
            )}

            <Controller
              control={control}
              name="senha"
              rules={{
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Senha</Text>
                  <TextInput
                    style={[styles.input, errors.senha && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                  />
                  {errors.senha && (
                    <Text style={styles.errorText}>{errors.senha.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmarSenha"
              rules={{
                required: 'Confirmação de senha é obrigatória',
                validate: (value) =>
                  value === senhaValue || 'As senhas não coincidem',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirmar senha</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.confirmarSenha && styles.inputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Confirme sua senha"
                    secureTextEntry
                  />
                  {errors.confirmarSenha && (
                    <Text style={styles.errorText}>
                      {errors.confirmarSenha.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: getCorTema() },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? 'Criando conta...'
                  : tipo === 'massagista' && servicosSelecionados.length === 0
                  ? 'Continuar'
                  : 'Criar conta'}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta? </Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/login' as any)}
              >
                <Text style={[styles.linkText, { color: getCorTema() }]}>
                  Fazer login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tela de seleção de serviços */}
        {etapaAtual === 'servicos' && (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
            <Text style={styles.sectionSubtitle}>
              Selecione os serviços que você oferece. Você pode alterar isso
              depois.
            </Text>

            <View style={styles.servicosGrid}>
              {servicosDisponiveis.map((servico, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.servicoCard,
                    isServicoSelecionado(servico) && styles.servicoCardSelected,
                  ]}
                  onPress={() => toggleServico(servico)}
                >
                  <View style={styles.servicoHeader}>
                    <MaterialIcons
                      name={
                        isServicoSelecionado(servico)
                          ? 'check-circle'
                          : 'radio-button-unchecked'
                      }
                      size={24}
                      color={
                        isServicoSelecionado(servico)
                          ? getCorTema()
                          : Colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.servicoNome,
                        isServicoSelecionado(servico) && {
                          color: getCorTema(),
                        },
                      ]}
                    >
                      {servico.nome}
                    </Text>
                  </View>
                  <Text style={styles.servicoDescricao}>
                    {servico.descricao}
                  </Text>
                  <View style={styles.servicoInfo}>
                    <Text style={styles.servicoDuracao}>
                      {servico.duracao} min
                    </Text>
                    <Text style={styles.servicoPreco}>R$ {servico.preco}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.servicosActions}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={voltarParaDados}
              >
                <Text style={[styles.buttonText, { color: getCorTema() }]}>
                  Voltar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: getCorTema() },
                  servicosSelecionados.length === 0 && styles.buttonDisabled,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit(onSubmit)}
                disabled={servicosSelecionados.length === 0 || loading}
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? 'Criando conta...'
                    : `Criar conta (${servicosSelecionados.length} serviços)`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para seleção de serviços
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  servicosGrid: {
    marginBottom: 24,
  },
  servicoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  servicoCardSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '10',
  },
  servicoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  servicoNome: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  servicoDescricao: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  servicoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicoDuracao: {
    fontSize: 12,
    color: Colors.textMuted,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  servicoPreco: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  servicosActions: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
});
