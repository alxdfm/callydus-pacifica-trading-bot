# MVP Textual Wireframes

## Objective
Translate layout and navigation decisions into textual wireframes to guide design, frontend, and QA without structural ambiguity.

## 1. Dashboard

### Desktop
```text
+----------------------------------------------------------------------------------+
| Topbar: Pacifica Connected | Bot Active | Balance | [Pause Bot]                 |
+----------------------------------------------------------------------------------+
| Sidebar         | Dashboard                                                     |
| - Dashboard     | "Account connected. Bot active with Medium preset."          |
| - Presets       +------------------+------------------+------------------------+
| - Current       | Balance          | PnL              | Active Trades          |
| - History       | $12,450          | +$184            | 2                      |
|                 +------------------+------------------+------------------------+
|                 +--------------------------------------------------------------+
|                 | Active Preset: Medium                                        |
|                 | Risk: Medium | Symbol: BTC/USDC | Timeframe: 15m            |
|                 | Long: ON | Short: ON | Position Size: 5%                    |
|                 | [Review Preset] [Change Preset]                              |
|                 +--------------------------------------+-----------------------+
|                 | Current Trades                       | Recent Trades         |
|                 | 2 open trades                        | Closed recently       |
|                 |--------------------------------------|-----------------------|
|                 | LONG BTC/USDC                        | LONG BTC/USDC         |
|                 | Entry 64200 | Now 64510 | +1.2%      | Closed by target      |
|                 | Status: Open         [Close]         | +2.0% | 12:42         |
|                 |--------------------------------------|-----------------------|
|                 | SHORT ETH/USDC                       | SHORT ETH/USDC        |
|                 | Entry 3510 | Now 3488 | +0.6%        | Closed manually       |
|                 | Status: Open         [Close]         | +0.4% | 11:18         |
|                 +--------------------------------------+-----------------------+
|                 +--------------------------------------------------------------+
|                 | Alerts                                                       |
|                 | Reconciliation OK                                            |
|                 | No execution errors                                          |
|                 +--------------------------------------------------------------+
+----------------------------------------------------------------------------------+
```

### Mobile
```text
+----------------------------------------+
| Dashboard                              |
| Pacifica Connected | Bot Active        |
| [Pause Bot]                            |
+----------------------------------------+
| Balance                                |
| $12,450                                |
+----------------------------------------+
| PnL                                    |
| +$184                                  |
+----------------------------------------+
| Active Trades                          |
| 2                                      |
+----------------------------------------+
| Active Preset: Medium                  |
| Risk: Medium | BTC/USDC | 15m          |
| Long ON | Short ON | Size 5%           |
| [Review] [Change]                      |
+----------------------------------------+
| Current Trades                         |
| LONG BTC/USDC                          |
| Entry 64200 | +1.2%                    |
| [Close]                                |
|----------------------------------------|
| SHORT ETH/USDC                         |
| Entry 3510 | +0.6%                     |
| [Close]                                |
+----------------------------------------+
| Recent Trades                          |
| LONG BTC/USDC | Closed by target       |
| SHORT ETH/USDC | Closed manually       |
+----------------------------------------+
| Alerts                                 |
| Reconciliation OK                      |
+----------------------------------------+
| Bottom Nav: Dashboard | Presets | Now  |
|              History                 |
+----------------------------------------+
```

## 2. Presets

### Desktop
```text
+----------------------------------------------------------------------------------+
| Topbar: Pacifica Connected | Bot Ready | Balance | [Back to Dashboard]         |
+----------------------------------------------------------------------------------+
| Sidebar         | Presets                                                       |
| - Dashboard     | "Choose a preset. Logic is already configured."              |
| - Presets       | "Stop loss and take profit are mandatory in all presets."    |
| - Current       +------------------+------------------+------------------------+
| - History       | Conservative     | Medium           | Neutral                |
|                 | Risk: Low        | Risk: Medium     | Risk: Medium           |
|                 | Frequency: Low   | Frequency: Mid   | Frequency: High        |
|                 | Focus: Protection| Focus: Balance   | Focus: Opportunity     |
|                 | [Select]         | [Select]         | [Select]               |
|                 +------------------+------------------+------------------------+
|                 +--------------------------------------------------------------+
|                 | Quick Comparison                                             |
|                 | Risk | Frequency | Entry Style | Stop | Take Profit          |
|                 | Low  | Lower     | Selective   | ATR  | RR 2.0              |
|                 | Med  | Balanced  | Confirmed   | 1.2% | RR 2.0              |
|                 | Med  | Higher    | Looser      | 1.0% | RR 1.6              |
|                 +--------------------------------------+-----------------------+
|                 | Selected Preset: Medium              | Activation            |
|                 | Balanced preset with volume          | Ready to activate     |
|                 | confirmation and trend alignment.    | Preset: Medium        |
|                 |                                      | Symbol: BTC/USDC      |
|                 | Symbol: [ BTC/USDC                ]  | Size: 5%              |
|                 | Position Size: [ 5 ] %              | Long: ON              |
|                 | Long: [ON]   Short: [ON]            | Short: ON             |
|                 | Strategy suggestion only.           | [Activate Preset]     |
|                 | Not a guarantee of return.          | [Cancel]              |
|                 +--------------------------------------+-----------------------+
+----------------------------------------------------------------------------------+
```

### Mobile
```text
+----------------------------------------+
| Presets                                |
| Choose a preset with ready logic.      |
| TP and SL are mandatory in all presets.|
+----------------------------------------+
| Conservative                           |
| Risk: Low | Frequency: Low             |
| Focus: Protection                      |
| [Select]                               |
+----------------------------------------+
| Medium                                 |
| Risk: Medium | Frequency: Balanced     |
| Focus: Balance                         |
| [Select]                               |
+----------------------------------------+
| Neutral                                |
| Risk: Medium | Frequency: Higher       |
| Focus: Opportunity                     |
| [Select]                               |
+----------------------------------------+
| Comparison                             |
| Conservative: safer, fewer entries     |
| Medium: balanced                       |
| Neutral: more activity                 |
+----------------------------------------+
| Selected Preset: Medium                |
| Symbol: [ BTC/USDC ]                   |
| Position Size: [ 5 ] %                 |
| Long: [ON]                             |
| Short: [ON]                            |
| Suggestion only, not return guarantee. |
+----------------------------------------+
| [Activate Preset]                      |
+----------------------------------------+
| Bottom Nav: Dashboard | Presets | Now  |
|              History                 |
+----------------------------------------+
```

## Reading Rules
- the wireframe defines structure and priority, not final aesthetics
- the Dashboard prioritizes state and action
- the Presets screen prioritizes comparison and activation
- navigation must remain shallow and predictable

## Final Recommendation
Use these wireframes as the implementation baseline before visual refinement.
