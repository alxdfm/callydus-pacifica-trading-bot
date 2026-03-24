# Referencia de Finalizacao do MVP

## Objetivo
Consolidar os ajustes transversais da Sprint 5: consistência visual, estados vazios, loading, erro, interações críticas, revisão responsiva e handoff final.

## Consistência Visual
- tipografia, spacing e blocos principais seguem o mesmo sistema entre onboarding, presets, dashboard, trades e history
- badges, chips e CTAs mantêm semântica estável entre telas
- títulos, subtítulos e hierarquia de blocos preservam a mesma cadência visual

## Estados Vazios
Cobertura mínima:
- sem trades atuais
- sem histórico
- sem preset ativo
- sem dados temporários de conta

Regras:
- estado vazio orienta, não dramatiza
- CTA contextual aparece quando houver próximo passo claro

## Loading
Cobertura mínima:
- onboarding
- dashboard
- listas de trades
- ativação de preset
- encerramento manual

Regras:
- distinguir loading de página, loading de bloco e loading de ação
- manter estrutura estável com skeleton ou loading inline quando fizer sentido

## Erros
Cobertura mínima:
- erro de credencial
- erro de carregamento de dados
- erro ao ativar preset
- erro ao encerrar trade
- indisponibilidade temporária da Pacifica

Regras:
- usar inline, banner ou modal conforme severidade e proximidade da ação
- toda falha relevante sugere próximo passo quando houver recuperação possível

## Interações Críticas
Cobertura mínima:
- conectar wallet
- validar credenciais
- ativar preset
- pausar ou retomar bot
- encerrar trade manualmente

Regras:
- hover, pressed, disabled e loading precisam parecer intencionais
- ações destrutivas e sensíveis exigem confiança visual

## Revisão Responsiva
- fluxo completo deve continuar utilizável em desktop e mobile
- nenhuma tela principal deve depender de scroll horizontal
- strings traduzidas maiores não podem quebrar hierarquia ou CTA principal

## Handoff Final
O pacote final de design do MVP deve apontar para:
- [ONBOARDING_STATE_MATRIX.pt-BR.md](./ONBOARDING_STATE_MATRIX.pt-BR.md)
- [PRESETS_STRUCTURE.pt-BR.md](./PRESETS_STRUCTURE.pt-BR.md)
- [PRESETS_REFERENCE.pt-BR.md](./PRESETS_REFERENCE.pt-BR.md)
- [DASHBOARD_REFERENCE.pt-BR.md](./DASHBOARD_REFERENCE.pt-BR.md)
- [OPERATIONS_REFERENCE.pt-BR.md](./OPERATIONS_REFERENCE.pt-BR.md)

## Orientação de i18n
- separar grupos de mensagem por domínio da tela
- evitar concatenação de frases longas
- manter labels curtas, auto-contidas e previsíveis para tradução
