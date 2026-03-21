# Product Docs

## Purpose
Centralize the product documentation for the project in a structure that is easier to navigate by context and process.

## Folder Structure

### `foundation/`
Core product definition and roadmap.

### `strategy/`
Strategy model, presets, triggers, and indicator contract.

### `experience/`
Web flows, screen structure, onboarding, layouts, and wireframes.

### `quality/`
Acceptance criteria and quality gates.

### `planning/`
Execution planning, epics, and role-based task breakdowns.

## Recommended Reading Order

### Product foundation
- [Concept and vision](./foundation/PRODUCT_CONCEPT.en.md)
- [Phased roadmap](./foundation/PRODUCT_PHASES.en.md)

### Strategy and presets
- [Preset working session](./strategy/PRODUCT_PRESETS.en.md)
- [Initial preset proposal](./strategy/PRODUCT_PRESETS_PROPOSAL.en.md)
- [Preset validation against the contract](./strategy/PRODUCT_PRESETS_CONTRACT_FIT.en.md)
- [Final MVP presets](./strategy/PRODUCT_PRESETS_FINAL.en.md)

### Strategy contract
- [Trigger and operator contract](./strategy/PRODUCT_TRIGGER_CONTRACT.en.md)
- [Final indicator catalog](./strategy/PRODUCT_INDICATORS_CATALOG.en.md)

### Web experience
- [MVP onboarding](./experience/PRODUCT_ONBOARDING.en.md)
- [MVP web experience](./experience/PRODUCT_WEB_EXPERIENCE.en.md)
- [Navigation and visual organization](./experience/PRODUCT_WEB_NAVIGATION.en.md)
- [Onboarding screen layout](./experience/PRODUCT_ONBOARDING_LAYOUT.en.md)
- [Detailed dashboard layout](./experience/PRODUCT_DASHBOARD_LAYOUT.en.md)
- [Detailed presets screen layout](./experience/PRODUCT_PRESETS_LAYOUT.en.md)
- [Detailed current trades screen layout](./experience/PRODUCT_CURRENT_TRADES_LAYOUT.en.md)
- [Detailed history screen layout](./experience/PRODUCT_HISTORY_LAYOUT.en.md)
- [Textual wireframes](./experience/PRODUCT_WIREFRAMES.en.md)

### Quality criteria
- [Acceptance criteria by screen](./quality/PRODUCT_SCREEN_ACCEPTANCE_CRITERIA.en.md)
- [Onboarding acceptance criteria](./quality/PRODUCT_ONBOARDING_ACCEPTANCE_CRITERIA.en.md)

### Execution planning
- [MVP open decisions checklist](./planning/MVP_OPEN_DECISIONS.en.md)
- [MVP handoff pack](./planning/MVP_HANDOFF_PACK.en.md)
- [MVP scope lock](./planning/MVP_SCOPE_LOCK.en.md)
- [MVP epics and tasks](./planning/PRODUCT_EPICS_AND_TASKS.en.md)
- [MVP design tasks and deliverables](./planning/PRODUCT_DESIGN_TASKS_AND_DELIVERABLES.en.md)
- [MVP development tasks and deliverables](./planning/PRODUCT_DEV_TASKS_AND_DELIVERABLES.en.md)
- [MVP sprint plan](./planning/PRODUCT_SPRINT_PLAN.en.md)
- [Sprint 1 detailed plan](./planning/sprint-1/README.md)
- [Sprint 2 detailed plan](./planning/sprint-2/README.md)
- [Sprint 3 detailed plan](./planning/sprint-3/README.md)
- [Sprint 4 detailed plan](./planning/sprint-4/README.md)
- [Sprint 5 detailed plan](./planning/sprint-5/README.md)

## Decisions Already Locked
- trading bot focused on ease of use
- presets as the main configuration mechanism
- mandatory `stop loss` and `take profit`
- 3 MVP presets: `Safer`, `Balanced`, `More active`
- dashboard as the operational center
- manual trade intervention via `market order`
- mandatory onboarding with Solana wallet + Pacifica API keys

## Important Product Rules
- the user must connect a Solana wallet before main usage
- the user must provide valid Pacifica API keys
- without completed onboarding, the Dashboard must stay locked
- the MVP interface must not expose JSON or technical logic
- any change outside the MVP scope lock must be consulted before implementation
- the product must be primarily English and built with i18n from day one

## Language Convention
- the product UI is English-first and must support i18n
- English documents: `*.en.md`
- Portuguese documents: `*.pt-BR.md`

## Portuguese References
Portuguese equivalents live in the same subfolder with the same base filename and the `.pt-BR.md` suffix.
