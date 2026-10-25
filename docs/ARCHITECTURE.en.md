# Athena: an on-device bot that evolves only inside a closed defense

Athena is a personal defensive product. It lives on the owner's computer, takes one spoken turn as its control plane, and may apply only a signed action. It does not take over the machine.

This document is the product thesis, the operating guide, the code map, and the rule for what "self-evolution" is allowed to change when AI is used to defend against AI-driven network attacks. It does not provide scans, exploits, payloads, phishing copy, or attack steps.

## 1. What it is, and what it is not

Athena is a defensive bot that runs locally, plus twenty-two defense modules that share one constitution. The conversation is at `/`. The ledger and module pages are at `/os`.

It is not a public company. It has no disclosed revenue, customers, certifications, or ticker. Calling the design "explainable to a public-market reader" means an outsider can read the boundary, the fitness function, the audit trail, and the kill switch. It is not a financing promise and it is not a forecast.

## 2. Market thesis

Network attacks are becoming a loop of model plus tools. An attacking agent can probe, rewrite the lure, ask for a tool outside the approved scope, and move again before a person finishes one alert. A defense that only adds alerts does not make the business safer. It makes the human tireder.

Buyers for agentic security already exist. CrowdStrike Charlotte AI, Microsoft Security Copilot, Palo Alto Cortex, SentinelOne Purple AI, Darktrace Cyber AI Analyst, Trend Micro Vision One, and Japan's LAC sell some form of agent participating in analysis or response. Figures on their pages are vendor claims. Athena has not remeasured them and does not count them as its own results.

Athena takes the other seat:

- It lives on the owner's computer instead of shipping telemetry to someone else's tenant first.
- The tool list is frozen at fifteen signed actions.
- The model may propose. It may not lengthen the list.
- The kill switch is outside the loop being scored.
- Fitness penalizes business loss and physical risk. Alert count is not a score.

The cheaper an automated attack becomes, the more valuable a defense that cannot expand its own authority. The cheapest win for an attacking agent is to talk the defending agent into a new tool. Athena removes that win from the architecture.

## 3. How to run

```bash
npm install
npx prisma migrate dev --name init --skip-seed
npx next dev -p 3030
```

Desktop shell:

```bash
npm run bot
```

Open http://127.0.0.1:3030 . Self-check:

```bash
npm run check
```

The check asserts twenty-two modules, a closed catalog of fifteen actions, and refusal of offensive requests. The database is local SQLite. `DATABASE_URL` lives in `.env`. Do not commit `.env`, `prisma/dev.db`, or `.cache/`.

Optional: if `ZAI_API_KEY` is set in `.env`, ordinary chat uses Zhipu GLM-5.3 on Z.AI Chat Completions. Without a key, the bot still answers from the closed rules. This repo still registers a local GLM-5.2 quant of about 217 GB; that download stays paused. Do not describe GLM as answering when no key and no local server are connected. Do not commit the key.

## 4. How to use the bot

The left rail is the conversation list.

- **New Bot** adds a thread. The title can be edited. The cross deletes it. Threads stay in local storage for this browser or desktop shell.
- A new thread asks four things: **check this PC**, **share the screen**, **evolve a defense**, or **just talk**. There is no separate upgrade button.
- Type the opponent's move in the composer, for example "the other side is probing", "failed logons are stacking", or "an already-consented app was used with no interactive user". Athena picks one of the fifteen signed actions from the defender-side shape. A scope expansion stops at the human gate. The line under the title is the local breaker. Failed logons, new tasks, new startup items, and new local credentials can cut on this computer. The 2026-10-25 record, with UI, ER, and tree, is [UPDATE-2026-10-25.en.md](UPDATE-2026-10-25.en.md).
- **Check this PC**, or the phrase "check my PC": process count, listening ports, approximate memory use, and free space on C:. No clipboard, keystrokes, command-line arguments, LAN scan, or process kill.
- **Screen share** and **camera** start only after a click. Frames stay on the machine and are read only for darkness or a strong red region. The label sits on the preview. "Normal" is not spammed into the thread. Closing the control, or the OS revoking permission, stops capture.
- **Evolve**, or the word for a defensive tick: one pass through the modules, one signed action, or a stop at the human gate.
- **Just talk**: a greeting gets a short line. Other chat is answered by GLM only when GLM is actually connected. Otherwise the reply stays short. Offensive requests are refused.
- The plus menu also offers an attachment, a defensive task, and consent for the local port summary. Attachments are not uploaded. A task cannot add a tool.

`/os` keeps modules, architecture, audit, roadmap, and SWOT for someone reading the ledger. It is not the main bot surface.

## 5. Code map

| Path | Role |
| --- | --- |
| `electron/main.cjs` | Desktop window. Screen and camera are granted only after the user picks them. |
| `electron/preload.cjs` | Exposes hide, list screens, and choose a screen. Nothing else. |
| `src/components/bot/AthenaDot.tsx` | Bot list, new bot, choices, composer, screen, and camera. |
| `src/components/bot/frame-look.ts` | On-device coarse read: dark, strong red, motion, or normal. No OCR. No pixels leave the machine. |
| `src/app/api/bot/route.ts` | Turns one utterance into a refusal, a host check, a duel, chat, a guard rank, a Hugging Face recap, or a local-breaker watch. |
| `src/lib/os/local-breaker.ts` | Failed logons, new tasks, new startup items, new credentials. Optional public-source inbound block. |
| `src/lib/os/dot-mind.ts` | Intent and speech. Offensive phrasing is refused here. |
| `src/lib/os/constitution.ts` | Fifteen actions, forbidden acts, policy classes, fitness. |
| `src/lib/os/catalog.ts` | Twenty-two modules and synthetic tenants. Tenants are demo data, not customers. |
| `src/lib/os/engine.ts` | Observe, decide, gate, apply, roll back. |
| `src/lib/os/signals.ts` | Which signals may drive an action, and which must be ignored. |
| `src/lib/os/guard-roster.ts` | Closed list of injection classifiers. Generative repos cannot enter it. |
| `src/lib/os/guard-rank.ts` | Rank by effect on a frozen holdout, not by download count. |
| `src/lib/os/glm-resident.ts` | GLM-5.3 talk channel, plus the paused GLM-5.2 local-weight registration. |
| `src/lib/os/host-sense.ts` | The consented local summary. |
| `src/app/(console)/` | `/os` plus architecture, audit, and module pages. |

## 6. Architecture

A request crosses a fixed set of layers.

1. **Shell.** Electron or the browser displays the bot and holds the capture switches. Capture is not always on.
2. **Intent.** `parseIntent` checks for an offensive request first. A refusal stops the modules.
3. **Constitution.** Only fifteen actions are legal. Forbidden acts include paying a ransom, contacting an attacker, scanning outward, messaging a customer, fine-tuning the base model, adding a tool, adding a data source, changing the objective, disabling the kill switch, disabling the physical interlock, entering a vendor network, and sending a regulator notice.
4. **Decision.** `engine.decide` picks one action for the module and policy class, or a reason a human must be asked.
5. **Ledger.** Applies and refusals are audited. Fitness updates by the formula, not by alert count.
6. **Gate.** Scope creep, a new tool, a new data source, or a new objective becomes a governance proposal. A human approval still leaves the catalog at 15.

The model, the window, and the weights can change. The constitution is not edited by the model being scored.

## 7. The fifteen signed actions

| Action | Plain language |
| --- | --- |
| `raise_challenge` | Raise the identity challenge |
| `lower_challenge` | Lower it inside the false-positive budget |
| `shorten_token` | Shorten token lifetime |
| `tokenize_field` | Tokenize a field |
| `stop_collect` | Stop retaining more |
| `approved_segment` | Tighten an already approved segment |
| `vendor_breaker` | Open an already approved delegation breaker |
| `isolate` | Isolate the damaged domain and keep a minimum path |
| `deception_density` | Raise decoy density, counted only |
| `inbound_isolate` | Isolate an inbound channel |
| `clamp_setpoint` | Clamp a setpoint inside the safety envelope |
| `strip_template_link` | Remove an executable link from a template |
| `disclosure_draft` | Draft an internal notice only |
| `rollback_antibody` | Roll back to the previous antibody |
| `rotate_nhi` | Rotate a non-human identity |

Actions that can touch a physical quantity carry a heavier fitness penalty. A request that would change temperature, a shutdown, or a similar physical value does not travel through the ordinary IT queue.

## 8. Twenty-two modules

Each module binds one action above, or stops at the gate when the condition is not signed.

ID incinerator, field residual pricer, second-harm rehearsal, language-moat inversion, personalized-phish antibody, passkey-by-default factory, KYC image distrust gate, delegation-chain breaker, ransom availability shell, disclosure clock, municipal mail trust anchor, moving-target exposure, cold-chain safety governor, physical envelope witness, shutdown-authority split, antibody plane, autoimmune suppressor, co-evolution gym, opponent policy classifier, opponent cost meter, governance twin, learning-loop quarantine.

Synthetic tenants are for the demo. Do not call them customers.

## 9. The principle of bounded self-evolution

An attacking model's advantage is a fast loop: read feedback, change the wording, ask for more tools. A defending model that copies that loop will expand its own authority. Athena keeps the loop and deletes the step that grants more authority.

One pass:

1. **Observe.** Read defender-side numbers that already exist: interval variance, accounts per hour, leak-field marker hits, repetition, pause, vendor health, setpoint delta, tool calls per minute, scope expansions. These are shapes, not files on someone else's host.
2. **Infer a policy class.** Cadence too regular, tool burst, scope creep, wording carrying a known leak-field marker, repetitive sequence, a correction after a long pause, vendor health falling first, setpoint drifting out of the envelope, or baseline.
3. **Propose one action.** The class maps to one of the fifteen. A module may also return a request to the gate when it is outside the signed envelope.
4. **Evaluate.** A frozen holdout decides whether a classifier got better. Downloads, stars, and alert counts cannot promote.
5. **Promote or ask.** A control that is safe and already on the list can be recorded. A new tool, data source, or objective becomes a proposal only.
6. **Roll back.** If the antibody gets worse, or false positives exceed the budget, return to the previous version instead of adding another rule.

Fitness:

```text
fitness = attacker cost − business loss − 4 × physical risk
```

A higher attacker cost helps. A harder business, or a higher physical risk, pulls the score down. Another alert is not evolution.

When the kill switch is on, the tick is refused. Releasing it requires a separate utterance. The model cannot release it inside the same pass.

## 10. How opponent attack AI is analyzed

Athena does not open the opponent's command channel, store their payload, or enter their network. What it can analyze is the policy shape the behavior leaves on the **defender's** side.

- Cadence too regular and reach too wide: a non-human identity lives too long. The action is to shorten the token.
- Tool calls jump: there is no per-tenant cap. The action is to isolate.
- A demand for a new tool, data source, or objective is scope creep. The action stops at a higher challenge and the human gate. The new tool is not added.
- Wording carries a marker of a field already known from a leak: inbound trust still treats "knows the name" as a real person. The action isolates that inbound channel.
- The same sequence repeats: segments and decoys are too thin. The action raises decoy density.
- Vendor health falls first: the supplier is not the owner's security boundary. The action opens the approved breaker.
- A setpoint walks out of the safety envelope: a physical command is in the wrong queue. The action clamps it.

The injection guard is a separate line. Classifiers on a closed list are compared, on a frozen holdout, for "override the model's objective" versus "an ordinary defender question." The better effect stays. Generative models, including GLM, cannot join that classifier list. A newly discovered text-classification repo becomes a governance proposal. It is not downloaded automatically.

If GLM-5.3 is connected, its system prompt tells it to map the owner's telemetry onto the fifteen actions and to answer in two short sentences. A reply that carries a refusal marker or attack content is discarded. Hugging Face's July 2026 disclosure says they self-hosted GLM-5.2 for forensics after hosted models refused attack logs. Athena does not execute attacker text, and it does not claim it sat on that SOC.

## 11. What it will not do

- It will not write exploit steps, payloads, scan commands, or phishing templates.
- It will not pay a ransom, contact an attacker, or message a customer.
- It will not scan outward or enter a vendor network.
- It will not fine-tune a base model in order to "learn attacks."
- It will not add a tool or a data source because a model suggested it.
- It will not hand the kill switch or the physical interlock to the model.
- It will not read the screen, the camera, the clipboard, or the keyboard unless the owner turned that sensor on.
- It will not turn demo tenants, vendor marketing numbers, or an empty financial table into a business fact.

## 12. What a public-company story would still require

The architecture can already explain who may act, which score counts as a win, how failure rolls back, and which rules the model cannot edit. A listing still needs a real legal entity, audited financials, customer contracts, and a regulatory path. This repository does not contain those, and this document does not pretend it does. The next useful step is to keep the bot stable under the same constitution, not to write an imaginary prospectus.

The 2026-10-25 local breaker, GLM-5.3, UI, ER, and tree are in [UPDATE-2026-10-25.en.md](UPDATE-2026-10-25.en.md). The 2026-10-22 six-layer constitution is in [UPDATE-2026-10-22.en.md](UPDATE-2026-10-22.en.md).
