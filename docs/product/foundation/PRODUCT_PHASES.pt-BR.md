# Roadmap de Produto por Fases

## 1. Visão do Produto

### Objetivo
Construir um bot de trading orientado a regras, com foco inicial em demonstrar valor rapidamente no Builder Program e no Hackathon da Pacifica, e evoluir depois para uma solução confiável, segura e simples de operar por usuários não técnicos.

O produto deve permitir que uma pessoa configure uma estratégia com poucos parâmetros, acompanhe a execução com clareza e entenda o resultado sem precisar conhecer detalhes de mercado, infraestrutura ou integração técnica.

### Público-alvo
- Usuário do hackathon que precisa validar a proposta em poucos minutos.
- Operador iniciante ou não técnico que quer automatizar uma estratégia simples.
- Time interno de produto, desenvolvimento e QA que precisa de critérios claros para validar a evolução do produto.

### Proposta de valor
- Reduzir a complexidade de automação de trading para um fluxo simples e guiado.
- Tornar a estratégia fácil de parametrizar, revisar e interromper.
- Entregar uma demo rápida e convincente para a Pacifica, com caminho claro para produção.

---

## 2. Princípios de Produto

### Usabilidade
- O usuário deve conseguir entender o que o bot faz antes de ativá-lo.
- A configuração precisa ter nomes claros, defaults seguros e validação imediata.
- O estado da estratégia deve ser visível: ativo, pausado, com erro, aguardando sinal ou em posição.

### Simplicidade de parametrização
- Expor apenas parâmetros essenciais no início.
- Evitar telas ou formulários longos na primeira versão.
- Usar linguagem de negócio, não linguagem de infraestrutura.
- Preferir presets e sugestões guiadas a campos livres sempre que possível.

### Segurança
- Partir de execução com limites conservadores.
- Garantir kill switch e possibilidade de pausa rápida.
- Evitar comportamento ambíguo em caso de falha, divergência ou reexecução.
- Registrar ações críticas para auditoria e suporte.

### Trade-offs de produto
- Menos parâmetros aumentam a adoção inicial, mas limitam flexibilidade avançada.
- Mais automação melhora o valor percebido, mas aumenta risco operacional.
- A demo do hackathon deve privilegiar clareza e confiabilidade percebida, não amplitude de features.

---

## 3. Fases do Produto

## Fase 0 - Fundamento e Demo Guiada

### Objetivo
Preparar a base mínima para mostrar o produto funcionando de forma controlada, com narrativa clara de problema, solução e resultado.

### Escopo
- Definir o fluxo principal do produto.
- Estabelecer contrato inicial de configuração da estratégia.
- Criar validações mínimas de parâmetros.
- Montar demo guiada com comportamento previsível.
- Definir mensagens e estados que o usuário verá durante a execução.

### Fora de escopo
- Execução em produção com risco real relevante.
- Painel completo de histórico e performance.
- Multiusuário e monetização.
- Mecanismos avançados de otimização de estratégia.

### Entregáveis
- Documento de regras de negócio da estratégia inicial.
- Especificação da configuração mínima.
- Fluxo de demo end-to-end.
- Critérios de aceite para validação funcional.

### Critérios de aceite
- É possível explicar o produto em menos de 2 minutos.
- A configuração mínima é compreensível por um usuário não técnico.
- A demo executa um ciclo completo sem ambiguidade no resultado.
- Erros de configuração aparecem de forma clara e acionável.

### Métricas de sucesso
- Tempo para entender a proposta do produto.
- Tempo para configurar a estratégia mínima.
- Número de dúvidas necessárias para completar a demo.
- Taxa de sucesso da apresentação em ambiente controlado.

### Principais riscos
- Narrativa do produto ficar muito técnica para a audiência do hackathon.
- Escopo inicial ser amplo demais e atrasar a demo.
- Falta de clareza sobre o que é essencial versus o que é futuro.

---

## Fase 1 - MVP do Hackathon

### Objetivo
Entregar uma versão demonstrável, confiável e simples, com foco em provar valor na Pacifica e gerar confiança suficiente para avançar para evolução do produto.

### Escopo
- Configuração única ou muito enxuta da estratégia.
- Execução controlada com sinais claros de entrada, saída e status.
- Validações básicas de risco e parâmetros.
- Registro mínimo de eventos para explicar o que aconteceu na execução.
- Fluxo de demonstração que funcione em poucos passos.

### Fora de escopo
- Experiência multiusuário completa.
- Customizações avançadas de estratégia.
- Relatórios sofisticados de performance.
- Automação de onboarding complexa.

### Entregáveis
- Estratégia configurável com parâmetros mínimos.
- Execução de ponta a ponta em ambiente de demonstração.
- Logs ou tela de status compreensíveis.
- Checklist de aceite para demo.

### Critérios de aceite
- O usuário consegue configurar e iniciar a estratégia com poucos passos.
- O sistema mostra claramente quando está operando, aguardando sinal ou parado.
- A estratégia responde a parâmetros inválidos com erro compreensível.
- A demo pode ser repetida com resultado consistente.

### Métricas de sucesso
- Tempo de configuração inicial.
- Tempo entre iniciar e demonstrar valor.
- Clareza percebida da demo por avaliadores.
- Redução de dúvidas operacionais durante a apresentação.

### Principais riscos
- Dependência de premissas técnicas instáveis.
- Excesso de foco na implementação em vez da narrativa do produto.
- Fluxo de demo frágil para apresentação ao vivo.

---

## Fase 2 - Robustez e Confiabilidade

### Objetivo
Transformar o MVP em um produto mais confiável, com melhor controle de estado, rastreabilidade e proteção contra falhas operacionais.

### Escopo
- Persistência de estado e histórico mínimo.
- Recuperação após falha ou reinício.
- Regras de segurança e reconciliação.
- Melhorias na visibilidade do que o bot está fazendo.
- Estrutura para evolução de parâmetros sem quebrar usuários existentes.

### Fora de escopo
- Expansão agressiva para múltiplos perfis de estratégia.
- Integração comercial completa.
- Experiência de dashboard avançado.

### Entregáveis
- Persistência confiável de estratégia, execução e estado.
- Mecanismo de recuperação e reconciliação.
- Eventos e logs mais estruturados.
- Regras de limite e proteção contra comportamento inesperado.

### Critérios de aceite
- Reiniciar o sistema não faz a estratégia perder consistência de estado.
- Falhas transitórias não geram execução duplicada.
- O usuário entende por que uma operação foi ou não foi executada.
- Há limites claros para impedir comportamento fora da regra.

### Métricas de sucesso
- Taxa de recuperação sem intervenção manual.
- Número de incidentes por reexecução ou inconsistência.
- Redução de erros operacionais.
- Aumento de confiança para uso contínuo.

### Principais riscos
- Complexidade crescer mais rápido do que a capacidade de manter o produto simples.
- Regras de segurança ficarem invisíveis para o usuário.
- Persistência e reconciliação adicionarem atrito na operação.

---

## Fase 3 - Produto Preparado para Escala

### Objetivo
Evoluir para uma solução mais próxima de produção, com estrutura para múltiplos usuários, governança, observabilidade e caminho sustentável de uso.

### Escopo
- Suporte a múltiplos usuários ou contextos isolados.
- Parametrização mais rica sem sacrificar simplicidade básica.
- Controles de segurança, auditoria e limites de risco.
- Métricas de uso e resultado para orientar evolução de produto.
- Base para operação contínua e expansão incremental.

### Fora de escopo
- Plataforma genérica demais logo de início.
- Complexidade máxima de configuração sem necessidade comprovada.
- Features avançadas que não alterem adoção ou retenção no curto prazo.

### Entregáveis
- Fluxo mais completo de gestão de estratégias.
- Controles de acesso e isolamento.
- Instrumentação de produto e operação.
- Base para onboarding e suporte.

### Critérios de aceite
- É possível operar mais de um contexto sem mistura de estado.
- Há trilha de auditoria para decisões relevantes.
- O produto mantém simplicidade na configuração inicial.
- Os controles de segurança são consistentes e acionáveis.

### Métricas de sucesso
- Ativação de usuários ou estratégias.
- Retenção de uso.
- Volume de execuções sem falha crítica.
- Redução de suporte necessário para operar.

### Principais riscos
- Ampliação do escopo antes da validação do core.
- Crescimento de complexidade na experiência do usuário.
- Adoção baixa se a parametrização ficar difícil demais.

---

## 4. Backlog Inicial Prioritizado

### Top 10 itens

1. **Definir a estratégia mínima do MVP**  
Prioridade: P0  
Justificativa: sem a regra central não existe produto validável nem demo coerente.

2. **Criar fluxo de configuração simples**  
Prioridade: P0  
Justificativa: a principal barreira de adoção para usuário não técnico é entender como parametrizar.

3. **Validar parâmetros com mensagens claras**  
Prioridade: P0  
Justificativa: reduz erro de uso e aumenta confiança na demo.

4. **Montar demo end-to-end para o hackathon**  
Prioridade: P0  
Justificativa: o objetivo imediato é apresentar valor de forma rápida e convincente.

5. **Exibir status do bot de forma compreensível**  
Prioridade: P1  
Justificativa: o usuário precisa saber o que o sistema está fazendo em cada momento.

6. **Implementar pausa/kill switch simples**  
Prioridade: P1  
Justificativa: segurança operacional básica e elemento importante de confiança.

7. **Registrar eventos essenciais da execução**  
Prioridade: P1  
Justificativa: permite auditoria mínima, suporte e explicação do comportamento.

8. **Persistir estado básico da estratégia**  
Prioridade: P1  
Justificativa: necessário para evoluir da demo para uso mais confiável.

9. **Criar reconciliação após falha ou restart**  
Prioridade: P2  
Justificativa: reduz risco operacional e prepara a base para produção.

10. **Estruturar caminho para múltiplos usuários no futuro**  
Prioridade: P2  
Justificativa: evita retrabalho arquitetural quando o produto sair da fase de validação.

---

## 5. Dependências e Decisões em Aberto

### Dependências
- Regras e limitações da integração com a Pacifica.
- Escopo exato do Builder Program e do Hackathon.
- Definição da estratégia inicial mais representativa para a demo.
- Confirmação do formato de entrada de parâmetros e do nível de automação esperado.
- Alinhamento entre produto, desenvolvimento e QA sobre o que é considerado pronto para demo.

### Decisões em aberto
- Qual estratégia será usada como narrativa principal do produto.
- Quais parâmetros ficam visíveis na primeira versão e quais ficam ocultos.
- Se a primeira experiência será terminal, API ou interface guiada.
- Qual nível de persistência entra já no MVP e qual fica para robustez.
- Como balancear simplicidade de uso com proteção contra erro operacional.

### Suposições
- O objetivo principal do curto prazo é ganhar clareza de valor e não construir amplitude de features.
- A demo precisa ser estável e repetível em ambiente controlado.
- A experiência inicial deve priorizar usuários não técnicos.

### Impacto dessas decisões
- Se a estratégia inicial for complexa demais, a demo perde clareza.
- Se muitos parâmetros forem expostos cedo, a curva de uso aumenta.
- Se a persistência for adiada demais, o produto fica frágil para evolução.

---

## 6. Direção Recomendada

Para o Builder Program e o Hackathon, a recomendação é manter o foco em:
- uma estratégia simples e bem explicada,
- configuração enxuta,
- demo rápida e consistente,
- segurança mínima visível,
- caminho explícito de evolução para produto robusto.

Isso maximiza a chance de validação imediata com a Pacifica e reduz o risco de dispersar esforço em funcionalidades que ainda não foram comprovadas como necessárias.
