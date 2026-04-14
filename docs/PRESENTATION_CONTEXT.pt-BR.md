# Callydus — Contexto de Apresentação

> Base para slides e roteiro de apresentação do produto.  
> Pacifica 2026 Hackathon — Abril 2026

---

## 1. O que é o Callydus

O **Callydus** é um trading bot automatizado para a Pacifica — a exchange de contratos perpétuos da Solana.

A proposta é simples: **qualquer pessoa pode operar estratégias profissionais de trading na Pacifica sem precisar ficar de olho no mercado e sem precisar escrever uma linha de código.**

O produto tem três partes que trabalham juntas:

- **App web** — painel operacional onde o usuário configura e monitora o bot
- **API** — camada que processa comandos, guarda estado e integra com a Pacifica de forma segura
- **Worker** — processo contínuo que avalia sinais, executa ordens e fecha posições em tempo real

---

## 2. O problema que resolve

### 2.1 Trading sistemático é inacessível para a maioria

Executar uma estratégia de trading de forma consistente exige:
- monitorar o mercado 24h por dia, 7 dias por semana
- agir no momento certo sem hesitar
- aplicar as regras da estratégia sem deixar emoção interferir
- calcular e aplicar stop loss e take profit em toda operação

Isso é humanamente inviável de forma sustentável. Traders profissionais usam bots. Traders comuns ficam sem essa vantagem.

### 2.2 A Pacifica é uma exchange técnica

A Pacifica tem uma API poderosa, mas usá-la diretamente exige:
- entender o protocolo de assinatura com Agent Wallet
- saber construir e enviar ordens de mercado
- lidar com fluxos de reconhecimento de posição e aplicação de proteção (TP/SL)
- reconciliar estado local com a exchange em tempo real

Isso coloca uma barreira de entrada técnica significativa para qualquer trader que queira automatizar suas operações.

### 2.3 O gap entre estratégia e execução

Mesmo traders que entendem análise técnica — EMAs, RSI, ATR, volume — não têm como transformar esse conhecimento em um bot operacional sem investir semanas de desenvolvimento.

**O Callydus fecha esse gap.**

---

## 3. Como o produto funciona

### 3.1 Onboarding em três etapas

1. **Conecta a Solana wallet** (Phantom ou Backpack)
2. **Aprova o builder code** da Pacifica — autorização única da conta, feita direto no frontend com a wallet principal
3. **Fornece a Agent Wallet** — a chave operacional que o bot usa para assinar ordens; nunca volta ao browser depois de salva

Resultado: conta pronta para operar em minutos, sem terminal, sem configuração técnica.

### 3.2 YOUR Strategy — o construtor de estratégia personalizada

O **YOUR Strategy** é um wizard guiado de 7 passos que permite ao usuário construir a própria estratégia do zero:

- construir regras de entrada (long e short) usando indicadores técnicos reais: EMA, SMA, RSI, Volume, ATR
- combinar regras com lógica AND/OR
- configurar stop loss estático ou baseado em ATR
- configurar take profit com múltiplo de risco (Risk/Reward)
- ver um **backtest preview** dos últimos 7 dias antes de ativar

Sem escrever código. Sem planilha. Sem terminal.

### 3.4 Dashboard operacional

Após ativar o bot, o usuário acompanha tudo em uma tela:

- **saldo da conta** e **PnL agregado** em tempo real
- **status do bot**: rodando, pausado, inativo, erro
- **trades atuais**: direção, símbolo, preço de entrada, preço atual, PnL do trade, status
- **histórico de trades**: resultado, motivo de encerramento, timestamp

### 3.5 Controle manual sem parar o bot

O usuário pode **fechar um trade específico** a qualquer momento, sem pausar o bot. O produto registra a intenção e o worker executa o fechamento real na Pacifica com uma ordem `reduce_only` — garantindo que a posição seja zerada na exchange, não apenas no read model local.

---

## 4. O que está entregue hoje

| Funcionalidade | Status |
|---|---|
| Onboarding com Solana wallet + Agent Wallet | ✅ Funcionando |
| Aprovação do builder code via wallet principal | ✅ Funcionando |
| YOUR Strategy — wizard guiado | ✅ Funcionando |
| Backtest preview (últimos 7 dias) | ✅ Funcionando |
| Dashboard com saldo, PnL, status do bot | ✅ Funcionando |
| Abertura de ordens reais na Pacifica | ✅ Funcionando |
| Stop loss e take profit aplicados em toda posição | ✅ Funcionando |
| Fechamento automático via TP/SL | ✅ Funcionando |
| Fechamento manual de trade individual | ✅ Funcionando |
| Histórico de trades encerrados | ✅ Funcionando |
| Pausa e retomada do bot | ✅ Funcionando |
| Readiness check antes de operar | ✅ Funcionando |
| Indicadores: EMA, SMA, RSI, ATR, Volume | ✅ Funcionando |

---

## 5. Diferenciais técnicos

### Segurança da Agent Wallet
A private key da Agent Wallet é **criptografada no recebimento** e nunca volta ao frontend. O browser nunca vê a chave depois do onboarding. O worker a usa apenas em memória durante a assinatura de ordens.

### Motor de estratégia unificado
O mesmo motor que calcula indicadores e avalia sinais no backtest preview é o que roda no worker em produção. Sem divergência entre simulação e execução real.

### Fluxo de ordem validado em produção
O fluxo de abertura e proteção de posição foi depurado contra a Pacifica real:
1. `create_market_order` — abre a posição
2. Aguarda a posição aparecer em `/positions`
3. Recalcula TP/SL com base no `entryPrice` real (não no preço teórico do sinal)
4. `set_position_tpsl` — aplica a proteção

Isso garante que o stop loss e o take profit são sempre calculados sobre o preço real de entrada, não sobre o preço estimado do sinal.

### Reconciliação com a Pacifica como fonte de verdade
O estado local do produto nunca sobrescreve a intenção operacional do usuário. Se o usuário pediu para fechar um trade, esse pedido é preservado mesmo durante a reconciliação com a exchange.

---

## 6. Arquitetura em 30 segundos

```
Usuário (browser)
      ↓
   App React/Vite
      ↓
   API (Node.js → AWS Lambda)
      ↓                ↓
  Banco Postgres    Worker contínuo
  (Supabase)             ↓
                   Pacifica REST API
                   (ordens, posições)
```

- **App**: SPA em React + Vite. Nunca fala com a Pacifica diretamente.
- **API**: stateless, expõe comandos e leituras. Deploy em AWS Lambda.
- **Worker**: processo sempre ativo. Polling de sinais, execução de ordens, reconciliação.
- **Banco**: PostgreSQL. Estado operacional, credenciais cifradas, histórico de trades.

Ativos suportados hoje: **BTC-PERP**, **ETH-PERP**, **SOL-PERP**

---

## 7. Próximos passos

### Curto prazo — robustez operacional (FM-017)
- **Reconciliação completa com a Pacifica como fonte de verdade**: estado de trades, posições e ordens confirmados contra a exchange a cada sessão
- **Deploy em produção**: app no AWS Amplify / S3+CloudFront, API no AWS Lambda + API Gateway, worker na Oracle Cloud Always Free
- **Indicador de qualidade do snapshot**: quando a Pacifica não responde, o produto sinaliza claramente que o estado exibido é o último conhecido — sem vender dado stale como atualizado

### Médio prazo — expansão do produto
- **Websocket em tempo real**: substituir polling por streams da Pacifica para preços e posições, reduzindo latência e uso de rate limit
- **Alertas operacionais**: notificações quando o bot pausa por erro, quando um trade é fechado por stop, ou quando há falha de reconciliação
- **Gestão de múltiplos ativos simultâneos**: hoje a estratégia opera um símbolo por vez; a evolução permite diversificar dentro da mesma configuração

### Longo prazo — plataforma
- **Multi-conta**: um builder code, múltiplas contas operacionais gerenciadas pelo mesmo painel
- **Métricas avançadas**: drawdown real, sharpe, sequência de wins/losses, curva de capital
- **Marketplace de estratégias**: usuários publicam e compartilham suas estratégias; outros ativam com um clique
- **Trailing stop e ordens condicionais**: expandir o vocabulário de proteção do YOUR Strategy

---

## 8. Roteiro sugerido para a apresentação

### Abertura — o problema (30s)
> "Você tem uma estratégia de trading. Sabe quando entrar, quando sair, quanto arriscar. Mas você não consegue ficar acordado 24 horas esperando o sinal aparecer. Bots de trading existem para resolver isso — mas configurar um bot na Pacifica exige semanas de desenvolvimento. O Callydus muda isso."

### O produto — demo ao vivo (2min)
1. **Onboarding**: mostrar a conexão da wallet e aprovação do builder code
2. **YOUR Strategy**: abrir o wizard, construir uma regra simples (ex: RSI < 30 → long), configurar stop loss e take profit, ver o backtest preview
3. **Ativação**: confirmar e ativar o bot
4. **Dashboard**: mostrar o bot rodando, ver trades atuais com PnL em tempo real
5. **Fechar um trade**: clicar em "Close trade", mostrar que o fechamento acontece na Pacifica

### Diferencial técnico (45s)
> "O que nós construímos não é um bot que executa regras simples. É uma plataforma que traduz estratégias técnicas reais — com indicadores, lógica condicional e gestão de risco — em ordens reais na Pacifica, com fluxo validado em produção."

### Próximos passos (30s)
> "O MVP está funcional e operando em real. O próximo passo é o deploy em produção, reconciliação completa com a Pacifica como fonte de verdade, e expansão das capacidades do YOUR Strategy."

### Encerramento (15s)
> "O Callydus democratiza o trading algorítmico na Pacifica. Qualquer trader — técnico ou não — pode ativar uma estratégia profissional, com proteção de risco obrigatória, em menos de cinco minutos."

---

## 9. Números que impressionam

- **< 5 minutos** do onboarding até o bot ativo
- **3 ativos** suportados: BTC, ETH, SOL
- **7 dias** de backtest preview antes de ativar qualquer estratégia
- **100% das posições** protegidas com stop loss obrigatório
- **0 linhas de código** necessárias para o usuário final

---

## 10. Glossário para a apresentação

| Termo técnico | Como falar para a audiência |
|---|---|
| YOUR Strategy | Sua estratégia personalizada |
| Agent Wallet | Chave operacional do bot |
| Builder code | Autorização da conta na Pacifica |
| Readiness check | Verificação pré-operação |
| Stop loss / Take profit | Proteção de posição |
| Worker | O motor do bot rodando em segundo plano |
| Candle / timeframe | Período de análise da estratégia |
