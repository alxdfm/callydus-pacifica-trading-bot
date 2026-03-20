# Onboarding Acceptance Criteria

## Objective
Define objective acceptance criteria for the MVP onboarding flow.

## Functional Criteria
- onboarding must require a Solana wallet connection
- onboarding must require Pacifica credentials
- the system must validate credentials before unlocking product access
- the `Continue to Dashboard` button must stay disabled while onboarding is incomplete
- after successful validation, the Dashboard must be unlocked

## UX Criteria
- the user must understand that onboarding has two main steps
- the status of each step must be visible
- errors must be shown close to the failure point
- the next action must always be clear

## Content Criteria
- the screen must explain simply why the wallet is required
- the screen must explain simply why Pacifica credentials are required
- the screen must not expose unnecessary technical details

## State Criteria
- disconnected wallet must block progress
- invalid credentials must block progress
- validation in progress must be visible
- ready account state must be displayed unambiguously

## Mobile Criteria
- the screen must work in a single-column layout
- fields and buttons must remain accessible without breaking flow
- error messages must remain legible

## Final Acceptance Criterion
Onboarding is accepted when the user can:
- connect the Solana wallet
- validate Pacifica credentials
- understand that the account is ready
- access the Dashboard only after valid completion of the flow
