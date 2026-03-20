# Critérios de Aceite do Onboarding

## Objetivo
Definir critérios de aceite objetivos para o fluxo de onboarding do MVP.

## Critérios Funcionais
- o onboarding deve exigir conexão de wallet Solana
- o onboarding deve exigir credenciais da Pacifica
- o sistema deve validar as credenciais antes de liberar o acesso ao produto
- o botão `Continue to Dashboard` deve permanecer desabilitado enquanto o onboarding estiver incompleto
- após validação bem-sucedida, o Dashboard deve ser liberado

## Critérios de UX
- o usuário deve entender que o onboarding tem duas etapas principais
- o estado de cada etapa deve ser visível
- erros devem ser exibidos próximos ao ponto de falha
- a próxima ação deve estar sempre clara

## Critérios de Conteúdo
- a tela deve explicar de forma simples por que a wallet é necessária
- a tela deve explicar de forma simples por que as credenciais da Pacifica são necessárias
- a tela não deve expor detalhes técnicos desnecessários

## Critérios de Estado
- wallet desconectada deve bloquear avanço
- credenciais inválidas devem bloquear avanço
- validação em andamento deve ser visível
- conta pronta deve ser exibida de forma inequívoca

## Critérios Mobile
- a tela deve funcionar em coluna única
- os campos e botões devem permanecer acessíveis sem quebra de fluxo
- mensagens de erro devem continuar legíveis

## Critério Final de Aceite
O onboarding é aceito quando o usuário consegue:
- conectar a wallet Solana
- validar as credenciais da Pacifica
- entender que a conta está pronta
- acessar o Dashboard somente após a conclusão válida do fluxo
