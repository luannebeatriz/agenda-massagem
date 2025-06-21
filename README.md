# Agenda Massagem App

Sistema de agendamento para massagistas e clientes, permitindo gerenciar horários, serviços e agendamentos de forma simples e eficiente.

## Funcionalidades

- **Autenticação**: Login e cadastro para clientes e massagistas
- **Agendamentos**: Criar, confirmar, reagendar e cancelar agendamentos
- **Gestão de Serviços**: Massagistas podem oferecer diferentes tipos de serviços
- **Interface Intuitiva**: Design moderno e responsivo
- **Calendário**: Visualização de datas e horários disponíveis

## Tecnologias

- React Native com Expo
- TypeScript
- Expo Router (navegação)
- AsyncStorage (persistência local)
- Material Icons

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/luannebeatriz/agenda-massagem
cd agenda-massagem
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm run start
```

4. Use o Expo Go no seu dispositivo ou um emulador para visualizar o app.

## Estrutura do Projeto

```
app/                 # Telas da aplicação
├── auth/           # Autenticação (login, registro)
├── cliente/        # Área do cliente
└── massagista/     # Área da massagista

components/         # Componentes reutilizáveis
services/          # Lógica de negócio e APIs
types/             # Definições de tipos TypeScript
constants/         # Cores e constantes
```

## Como Usar

1. **Cadastro**: Escolha entre cliente ou massagista
2. **Login**: Acesse sua conta
3. **Agendamento**: Clientes podem agendar serviços
4. **Gestão**: Massagistas gerenciam seus agendamentos

