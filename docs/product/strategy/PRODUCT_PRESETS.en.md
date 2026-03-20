# Product Presets

## Objective
Define simple and clear presets so the user can start a strategy without building everything from scratch.

## Role in the Product
Presets are the core of the first product experience.

They need to:
- reduce complexity
- speed up setup
- increase user confidence
- support a fast hackathon demo

## Design Principles
- few presets at the beginning
- easy-to-understand names
- always-visible mandatory parameters
- safe defaults
- short explanation of expected behavior
- each preset should have some prior manual validation, when available, as a reference for behavior
- make it explicit that a preset is a strategy suggestion, not a guarantee of returns

## Preset Structure
Each preset should include at least:
- name
- intended use
- risk level
- underlying indicator logic
- editable parameters
- short description
- note that it is a suggestion, not a guarantee

## Risk Levels
Initial catalog suggestion:
- Safer
- Balanced
- More active

Notes:
- risk level should help the user understand the preset profile
- it should not be presented as a prediction of outcome
- it must remain consistent with the actual strategy behavior

## Initial Direction for the 3 Presets
- Safer: lower frequency, more protection, more selectivity
- Balanced: balance between frequency and protection
- More active: focus on opportunity volume with looser rules

## General Rules
- `stop loss` and `take profit` are mandatory in every preset
- presets can combine simple indicators
- the user may adjust some values, but should not need to understand the full logic to operate
- the first version should avoid too much flexibility
- if there is prior manual validation, it should be used only as a product reference

## Manual Validation Reference
One option is to use prior manual validation, for example by recreating the same logic in a tool like TradingView Pine Script, to observe historical behavior and help shape the preset.

This should be treated as:
- supporting evidence for preset design
- a behavior reference
- not as a guarantee of future performance

## Open Questions
- which indicators compose each preset
- which parameters will be editable per risk level
- how the product will present risk level in a simple way
- how to communicate manual validation without implying return promises
