# Layout Detalhado da Tela de Onboarding

## Objetivo
Definir a estrutura visual e o fluxo da tela de onboarding do MVP, garantindo que o usuário conecte sua wallet Solana e informe suas credenciais da Pacifica antes de acessar o produto.

## Função da Tela
A tela de onboarding deve responder a três perguntas:
- minha conta está pronta para operar?
- o que falta configurar?
- o que acontece depois que eu concluir isso?

## Princípio de Layout
O onboarding deve ser um fluxo curto, guiado e bloqueante.

Ele não deve parecer:
- uma tela técnica
- um formulário longo
- uma tela secundária

Ele deve parecer:
- uma preparação obrigatória
- um checklist simples
- uma porta de entrada para o produto

## Estrutura Desktop

### Faixa 1: Header de Onboarding
Conteúdo:
- título: `Set up your account`
- subtítulo curto explicando que a configuração é necessária para operar o bot
- indicador de progresso em 2 etapas

Objetivo:
- deixar claro que existe um fluxo curto e finito
- reduzir ansiedade de configuração

### Faixa 2: Card de Wallet
Conteúdo:
- título: `Connect Solana wallet`
- descrição curta do porquê isso é necessário
- status atual: `Not connected`, `Connected`, ou `Error`
- botão principal: `Connect wallet`

Objetivo:
- tornar o primeiro passo explícito
- mostrar o estado atual sem ambiguidade

### Faixa 3: Card de Pacifica API Keys
Conteúdo:
- título: `Connect Pacifica account`
- campo para API key
- campo para secret ou credencial exigida pelo fluxo técnico adotado
- status atual: `Not validated`, `Validating`, `Valid`, ou `Error`
- botão principal: `Validate credentials`

Objetivo:
- concentrar a configuração de credenciais em um bloco claro
- validar antes de liberar o produto

### Faixa 4: Painel de Estado da Conta
Conteúdo:
- wallet conectada ou não
- credenciais Pacifica válidas ou não
- saldo carregado ou não
- resumo: `Ready to continue` ou `Setup incomplete`

Objetivo:
- dar uma leitura final da prontidão da conta

### Faixa 5: Bloco de Ação Final
Conteúdo:
- botão principal: `Continue to Dashboard`
- botão desabilitado até que os requisitos estejam completos

Objetivo:
- impedir avanço prematuro
- deixar clara a próxima ação

## Estrutura Visual Recomendada

### Grid Desktop
- 12 colunas
- header ocupa largura total
- wallet ocupa 6 colunas
- Pacifica API ocupa 6 colunas
- painel de estado ocupa largura total
- ação final ocupa largura total

### Hierarquia Visual
- status de conclusão deve ser sempre visível
- erros devem aparecer próximos ao campo problemático
- o botão final deve ter destaque apenas quando o onboarding estiver completo

## Comportamento Mobile

### Ordem dos blocos
1. Header
2. Wallet
3. Pacifica API keys
4. Estado da conta
5. Ação final

### Regras
- um card por vez em largura total
- CTA final fixo na parte inferior quando possível
- mensagens de erro curtas e visíveis

## Estados da Tela

### Estados globais
- carregando
- aguardando wallet
- aguardando credenciais
- validando credenciais
- pronto para continuar
- erro

### Estados da wallet
- não conectada
- conectando
- conectada
- erro

### Estados da Pacifica
- não informada
- preenchida
- validando
- válida
- inválida

## Regras de Produto
- o usuário não deve acessar o Dashboard sem concluir onboarding
- o fluxo deve bloquear avanço até wallet e credenciais válidas
- mensagens devem ser acionáveis
- o onboarding deve deixar claro que o produto precisa dessas permissões para operar

## O que não incluir no MVP
- tutoriais longos
- excesso de texto explicativo
- múltiplas etapas desnecessárias
- configurações avançadas de credencial

## Recomendação Final
A tela de onboarding deve ser curta, clara e rígida. O objetivo é remover incerteza operacional antes do primeiro uso.
