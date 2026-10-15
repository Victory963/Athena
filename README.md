# Athena

Local defensive demo, also called the bounded self-evolving defense OS (有界自演化防守 OS). Twenty-two defense modules share one evolution loop, one audit ledger, and one kill switch. The tenants and documents are fictional. There are no attack steps.

Athena is not a public company. It has no disclosed revenue, customers, or compliance certifications. See the in-app roadmap for the honest gap list.

## English / 中文

Athena watches synthetic telemetry, classifies defender-visible shapes (steady cadence, tool-use bursts, scope creep), and may apply only an action from a closed list of 15. A human must approve any new tool, data source, or objective. The kill switch sits outside the evaluated loop. Telemetry stays in local SQLite.

Athena 观察虚构遥测，识别节奏过稳、工具调用突发和范围扩张，并且只能使用 15 个封闭执行器。新工具、新数据源和新目标必须先问人。杀开关不在被评估的模型里。遥测留在本机 SQLite。

## Run

```bash
npm install
npx prisma migrate dev --name init --skip-seed
npm run dev
```

Open http://localhost:3000. The first visit writes the SQLite demo. The database file is `prisma/dev.db`. To reset, stop the server, delete that file, and run `npx prisma migrate dev` again.

`.env` contains only `DATABASE_URL="file:./dev.db"`. There are no API keys.

`npm run check` runs the module and signal self-check.

## What a judge can click

- `/` control plane, tick, and governance decisions that do not merge new tools
- `/modules/<slug>` one evolution pass, rollback, human approve or reject
- `/architecture` defensive controls and three synthetic signal buttons
- `/swot` sourced comparison with public defensive products
- `/roadmap` Nasdaq-grade gaps
- `/audit` and `/api/audit/export` local demo ledger
- `/api/status`, `POST /api/tick`, `POST /api/kill`, `POST /api/modules/<slug>/run`, `POST /api/signals`

## Boundary

The loop may observe this tenant's telemetry, infer a policy class, propose one closed actuator, score it on a frozen holdout, and promote it only when fitness rises inside the business and physical budgets. Fitness is attacker cost minus business loss minus four times physical risk. Alert count can rise on a tick and cannot by itself promote an antibody.

The evaluated proposal cannot pay, contact an attacker, notify customers or regulators, enter another network, fine-tune a base model, add a tool, add a data source, change the objective, or clear the kill switch.

Public notes about autonomous pentest agents were used only as architecture lessons: self-hosting, a human scope boundary, a stop control outside the model, an audit ledger, and the defender-visible shapes above. Those products were not installed, and their prompts and procedures are not in this repository.
