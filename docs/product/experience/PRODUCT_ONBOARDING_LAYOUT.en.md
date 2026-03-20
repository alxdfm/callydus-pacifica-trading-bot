# Detailed Onboarding Screen Layout

## Objective
Define the visual structure and flow of the MVP onboarding screen, ensuring the user connects their Solana wallet and provides Pacifica credentials before accessing the product.

## Screen Function
The onboarding screen should answer three questions:
- is my account ready to operate?
- what is still missing?
- what happens after I complete this?

## Layout Principle
Onboarding should be a short, guided, blocking flow.

It should not feel like:
- a technical screen
- a long form
- a secondary screen

It should feel like:
- a mandatory setup
- a simple checklist
- an entry gate to the product

## Desktop Structure

### Section 1: Onboarding Header
Content:
- title: `Set up your account`
- short subtitle explaining that setup is required to operate the bot
- 2-step progress indicator

Objective:
- make it clear that the flow is short and finite
- reduce setup anxiety

### Section 2: Wallet Card
Content:
- title: `Connect Solana wallet`
- short description of why this is necessary
- current status: `Not connected`, `Connected`, or `Error`
- primary button: `Connect wallet`

Objective:
- make the first step explicit
- show the current state without ambiguity

### Section 3: Pacifica API Keys Card
Content:
- title: `Connect Pacifica account`
- API key field
- secret or credential field required by the chosen technical flow
- current status: `Not validated`, `Validating`, `Valid`, or `Error`
- primary button: `Validate credentials`

Objective:
- keep credential setup in one clear block
- validate before unlocking the product

### Section 4: Account Status Panel
Content:
- wallet connected or not
- Pacifica credentials valid or not
- balance loaded or not
- summary: `Ready to continue` or `Setup incomplete`

Objective:
- provide a final readiness check

### Section 5: Final Action Block
Content:
- primary button: `Continue to Dashboard`
- button disabled until all requirements are complete

Objective:
- prevent premature progression
- make the next action explicit

## Recommended Visual Structure

### Desktop Grid
- 12 columns
- header uses full width
- wallet uses 6 columns
- Pacifica API uses 6 columns
- status panel uses full width
- final action uses full width

### Visual Hierarchy
- completion status must always be visible
- errors must appear close to the problematic field
- the final button should gain emphasis only when onboarding is complete

## Mobile Behavior

### Block order
1. Header
2. Wallet
3. Pacifica API keys
4. Account status
5. Final action

### Rules
- one card at a time in full width
- fixed bottom CTA when possible
- short and visible error messages

## Screen States

### Global states
- loading
- waiting for wallet
- waiting for credentials
- validating credentials
- ready to continue
- error

### Wallet states
- not connected
- connecting
- connected
- error

### Pacifica states
- not provided
- filled
- validating
- valid
- invalid

## Product Rules
- the user must not access the Dashboard without completing onboarding
- the flow must block progress until wallet and credentials are valid
- messages must be actionable
- onboarding must make clear that the product needs these permissions to operate

## Out of MVP
- long tutorials
- too much explanatory text
- unnecessary extra steps
- advanced credential configuration

## Final Recommendation
The onboarding screen should be short, clear, and strict. The goal is to remove operational uncertainty before first use.
