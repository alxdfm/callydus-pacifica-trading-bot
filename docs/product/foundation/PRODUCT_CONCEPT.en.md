# Product Concept

## Main Hypothesis
A simple trading bot with few parameters and fine-grained trade-level control is a strong fit for Pacifica's Hackathon because it combines a fast demo with an experience that non-technical users can understand quickly.

## Product Direction
The product should be positioned as a simple strategy builder, not as a complex trading platform.

The main differentiator is not the number of indicators. It is:
- fast configuration using familiar indicators
- automated execution with `stop loss` and `take profit`
- trade-level control without stopping the bot entirely
- clear visibility into account activity

## Target Audience
- Hackathon participant who needs to understand the idea quickly.
- Beginner user who wants to automate a strategy without technical complexity.
- Operator who wants to monitor and intervene in open trades without pausing the full bot.

## Main Flow
1. The user defines a simple strategy.
2. The user selects indicators and basic parameters.
3. The user configures entry trigger, `stop loss`, and `take profit`.
4. The user starts the bot.
5. The bot keeps monitoring the market.
6. When the trigger occurs, the bot opens the trade with the configured protection.
7. The user tracks balance, PnL, open trades, and history.
8. The user can close a specific trade without stopping the whole bot.

## Initial Decisions
- The default strategy is not defined yet.
- The product will support presets.
- Trade-level control in the first version will only allow closing by `market order`.
- The initial interface will be web-based.
- `stop loss` and `take profit` will be mandatory in every preset.

## Trade States
When I mentioned trade states, I meant the statuses the user sees in the trade list.

For the first version, the minimum suggested states are:
- waiting for entry
- open
- closed by target
- closed by stop
- closed manually
- execution error

## Core Features
- current Pacifica account balance
- list of open and closed trades
- account and trade-level PnL
- identification of trades created by the platform
- manual action per individual trade
- simple indicator configuration

## Account Dashboard
The account dashboard will be the first web screen.

The exact data is still open, but the direction is to show:
- current balance
- aggregated PnL
- active trades
- recent trades
- identification of platform-created trades
- overall bot status

## Presets Session
Preset design will be handled in a dedicated product session because it is the core of the experience.

In that session, we will define:
- which presets exist at the beginning
- which indicators each preset uses
- which parameters are fixed
- which parameters remain editable
- how each preset is named in simple, non-technical language
- how to make clear that each preset is a suggestion based on prior validation, not a guarantee of return

## UX Differentiators
- few screens
- simple language
- safe defaults
- very clear states
- direct trade actions

## Product Risks
- exposing too many indicators too early
- making configuration too technical for non-technical users
- mixing hackathon demo priorities with final product scope
- making trade-level control confusing

## Trade-offs
- fewer parameters improve adoption and demo speed, but reduce flexibility
- more indicators improve power, but reduce clarity
- trade-level intervention improves control, but requires careful operational design to avoid inconsistency

## Open Questions
- What will be the product's first default strategy?
- Will the user build everything from scratch or start from presets?
- Will trade-level control allow only closing, or also parameter edits?
- Will the first interface be web, terminal, or a minimal UI layer?
- Which trade states must be visible in the first version?
