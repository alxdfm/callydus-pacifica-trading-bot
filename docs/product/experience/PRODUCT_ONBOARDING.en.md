# MVP Onboarding

## Objective
Define the mandatory initial flow so the user can operate the bot with minimum safety in the MVP.

## Assumption
Before accessing Dashboard, Presets, or Trades, the user must complete account setup.

## Mandatory Steps

### 1. Connect Solana wallet
The product must require the user to connect their Solana wallet.

Objectives:
- identify the user context
- associate the account with product usage
- prepare the experience for authenticated operation

### 2. Provide Pacifica API keys
The product must require the Pacifica credentials needed to operate.

Objectives:
- allow balance, position, and history reading
- allow order submission by the bot
- validate that the account is ready to operate

## Product Rules
- without a connected wallet, the user cannot access the main flow
- without valid API keys, the bot cannot be activated
- the product must validate connection and credentials before unlocking the Dashboard
- authentication errors must be clear and actionable

## Recommended Flow
1. Connect Solana wallet.
2. Provide Pacifica API key.
3. Validate credentials.
4. Show account-ready confirmation.
5. Unlock Dashboard access.

## Minimum data expected after onboarding
- connected wallet
- valid Pacifica credentials
- healthy connection status
- balance loaded successfully

## Acceptance Criteria
- the user cannot activate a preset without completing onboarding
- the system clearly informs when the wallet is not connected
- the system clearly informs when the API key is invalid
- after valid onboarding, the Dashboard opens with balance and account status
