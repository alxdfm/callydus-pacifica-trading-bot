# Onboarding do MVP

## Objetivo
Definir o fluxo inicial obrigatório para que o usuário consiga operar o bot com segurança mínima no MVP.

## Premissa
Antes de acessar Dashboard, Presets ou Trades, o usuário precisa concluir a configuração da conta.

## Passos Obrigatórios

### 1. Conectar wallet Solana
O produto deve exigir conexão da wallet Solana do usuário.

Objetivos:
- identificar o contexto do usuário
- permitir associação da conta ao uso do produto
- preparar a experiência para operação autenticada

### 2. Informar API keys da Pacifica
O produto deve exigir o cadastro das credenciais da Pacifica necessárias para operar.

Objetivos:
- permitir leitura de saldo, posições e histórico
- permitir envio de ordens pelo bot
- validar que a conta está apta para operar

## Regras de Produto
- sem wallet conectada, o usuário não acessa o fluxo principal
- sem API keys válidas, o bot não pode ser ativado
- o produto deve validar conexão e credenciais antes de liberar o Dashboard
- erros de autenticação devem ser claros e acionáveis

## Fluxo Recomendado
1. Conectar wallet Solana.
2. Informar API key da Pacifica.
3. Validar credenciais.
4. Exibir confirmação de conta pronta.
5. Liberar acesso ao Dashboard.

## Dados mínimos esperados após onboarding
- wallet conectada
- credenciais Pacifica válidas
- status de conexão saudável
- saldo carregado com sucesso

## Critérios de Aceite
- o usuário não consegue ativar preset sem concluir onboarding
- o sistema informa claramente se a wallet não está conectada
- o sistema informa claramente se a API key é inválida
- após onboarding válido, o Dashboard abre com saldo e status da conta
