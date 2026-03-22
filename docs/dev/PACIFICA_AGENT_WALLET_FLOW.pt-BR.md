# Pacifica Agent Wallet Flow

## Objetivo
Formalizar o fluxo técnico recomendado para autenticação e operação com a Pacifica no MVP, reduzindo a exposição de credenciais sensíveis e evitando o uso da private key principal da wallet do usuário dentro do produto.

## Decisão Técnica
O produto não deve coletar nem armazenar a private key da wallet principal do usuário.

O fluxo recomendado passa a ser:
- conectar a wallet Solana principal do usuário
- identificar a conta principal da Pacifica pela public key dessa wallet
- criar ou conectar um `Agent Wallet` dedicado para automação
- armazenar apenas o segredo do `Agent Wallet`, nunca o segredo da wallet principal
- usar o `Agent Wallet` para assinar requests operacionais da Pacifica

## Motivação
Esse fluxo reduz risco porque:
- evita transformar o produto em custodiante da private key principal do usuário
- limita o escopo do segredo armazenado pelo sistema
- separa autenticação principal de automação operacional
- mantém a integração mais aderente ao modelo oficial de `API Agent Keys / Agent Wallets`

## Modelo Mental
### Wallet principal
Responsável por:
- identidade do usuário
- vínculo da conta
- autorização inicial

### Agent Wallet
Responsável por:
- assinatura operacional de requests da Pacifica
- execução automatizada do bot
- uso controlado no backend/worker

## Regras Obrigatórias
- a private key principal nunca deve ser pedida no onboarding do produto
- a private key principal nunca deve ser persistida no banco
- o browser não deve reenviar a private key principal para backend algum
- o backend só pode armazenar material criptografado do `Agent Wallet`
- o `Agent Wallet` deve ser tratado como credencial crítica, mas de escopo reduzido

## Fluxo Recomendado de Onboarding

### Etapa 1: Conectar wallet principal
O usuário conecta sua wallet Solana principal.

Objetivos:
- identificar a conta principal
- provar posse da wallet no contexto do app
- iniciar o estado do onboarding

### Etapa 2: Criar ou conectar Agent Wallet
O usuário cria ou vincula um `Agent Wallet` para uso do bot.

Objetivos:
- separar automação da wallet principal
- preparar a credencial operacional para a Pacifica

### Etapa 3: Validar capacidade operacional
O sistema valida que o `Agent Wallet` está apto a operar em nome da conta esperada.

Objetivos:
- impedir onboarding parcialmente válido
- garantir que a automação conseguirá assinar requests reais

### Etapa 4: Armazenar segredo criptografado do Agent Wallet
O segredo do `Agent Wallet` é armazenado com criptografia forte e acesso restrito.

Objetivos:
- proteger o segredo em repouso
- restringir acesso ao worker e ao fluxo controlado de validação

### Etapa 5: Liberar o produto
Com wallet principal conectada e `Agent Wallet` validado, o onboarding pode ser concluído.

## Dados que o Produto Deve Tratar

### Deve tratar
- `main wallet public key`
- `agent wallet public key`
- `encrypted agent private key ref`
- estado de validação do agent wallet
- fingerprint ou identificador seguro da credencial

### Não deve tratar
- private key principal do usuário em texto puro
- armazenamento persistente da private key principal
- qualquer fluxo que use a wallet principal como credencial operacional do bot

## Implicações para Modelagem
A modelagem deve evoluir de uma leitura parecida com a POC:
- `PACIFICA_ACCOUNT`
- `PACIFICA_PRIVATE_KEY`
- `PACIFICA_AGENT_WALLET`

Para um modelo de produto mais seguro:
- `main wallet public key`
- `agent wallet public key`
- `encrypted agent private key ref`
- `credential validation status`

## Implicações para UX
O onboarding deve deixar claro que:
- a wallet principal identifica e autoriza
- o `Agent Wallet` é o mecanismo operacional do bot
- o produto não pede a private key principal para operar
- a etapa de conexão operacional existe por segurança, não por complexidade gratuita

## Implicações para Backend
- a API não deve receber private key principal como payload do fluxo oficial
- o worker deve ser o principal consumidor do segredo do `Agent Wallet`
- logs não podem serializar segredos ou payloads sensíveis
- o segredo deve ficar protegido por KMS ou mecanismo equivalente

## Implicações para Deploy e Segurança
- segredos do `Agent Wallet` devem ser criptografados em repouso
- acesso ao segredo deve ser controlado por ambiente e serviço
- rotação e invalidação precisam ser possíveis
- auditoria mínima de validação e uso deve existir

## Regra de Escopo
Para o MVP, isso não significa abrir um fluxo técnico complexo ao usuário. Significa apenas trocar a credencial operacional armazenada:
- de private key principal
- para credencial dedicada de automação

## Próximas Atualizações Necessárias
Esse fluxo deve ser refletido em:
- docs de produto sobre onboarding
- docs de produto sobre handoff de Sprint 1
- modelagem de dados e contratos compartilhados
- UI do onboarding
- política de segredos do projeto
