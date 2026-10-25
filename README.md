# Athena

[中文](docs/ARCHITECTURE.zh.md) · [English](docs/ARCHITECTURE.en.md) · [日本語](docs/ARCHITECTURE.ja.md)

Athena 是住在这台电脑上的个人防守 Bot。它用对话当控制面，只从 15 个已签名动作里选一个。新工具、新数据源、新目标必须问人，批准也不会把清单变长。杀开关在被评估的循环外面。

Athena is a personal defensive bot that lives on this computer. Conversation is the control plane. It may apply only one action from a closed list of fifteen. New tools, data sources, and objectives stay with a human, and approval still does not lengthen the list. The kill switch sits outside the loop being evaluated.

Athena は、このコンピュータに住む個人向け防御ボットです。会話が制御面です。署名済みの 15 動作から一つだけ選べます。新しい道具、データ源、目的は人の承認が必要で、承認しても一覧は長くなりません。キルスイッチは評価される循環の外にあります。

Athena 不是上市公司，没有已披露的营收、客户或认证。下面的市场判断是产品论点，不是财务预测。

Athena is not a public company. It has no disclosed revenue, customers, or certifications. The market argument below is a product thesis, not a forecast.

Athena は上場企業ではなく、開示された売上、顧客、認証はありません。以下の市場論は製品の論点であり、財務予測ではありません。

## 为什么这是一个市场

攻击方已经把模型接进工具循环：试探、改写话术、扩大范围、在人反应过来之前换动作。防守方如果只增加告警，适应度不会上升。CrowdStrike、Microsoft、Palo Alto、SentinelOne、Darktrace、Trend Micro 等已经在卖带代理的安全分析。这些是厂商自述，不是 Athena 的测评。空出来的位置是另一端：一个住在机主电脑上、工具清单封死、杀开关不交给模型的个人 Bot。

Attackers already put models inside tool loops: probe, rewrite the lure, widen scope, and change the move before a person reacts. Adding alerts does not raise fitness. CrowdStrike, Microsoft, Palo Alto, SentinelOne, Darktrace, Trend Micro, and others already sell agentic security analysis. Those are vendor claims, not Athena measurements. The open seat is the other end: a personal bot that lives on the owner's machine, with a frozen tool list and a kill switch the model cannot hold.

攻撃側はすでに、探査、文言の書き換え、範囲の拡大、人の反応より速い手替えを、モデルと道具の循環に入れています。警報を増やすだけでは適応度は上がりません。CrowdStrike、Microsoft、Palo Alto、SentinelOne、Darktrace、Trend Micro などは、エージェント型のセキュリティ分析を販売しています。これらはベンダーの自述であり、Athena の測定ではありません。空いている席は反対側です。所有者の機械に住み、道具一覧が封じてあり、キルスイッチをモデルが持てない個人ボットです。

## 自主进化在这里指什么

进化不是让模型自己加工具。循环是：观察己方遥测 → 推断对手政策形状 → 提议一个已签名动作 → 在冻结的留出集上评估 → 晋升或交给人 → 失败就回滚。适应度 = 攻击方成本 − 业务损失 − 4 × 物理风险。告警数量不能晋升。对手分析读的是防守侧的形状（节奏、工具突发、范围扩张、泄漏字段标记、重复序列、停顿、委托方健康、设定值漂移），不读攻击载荷，不进对方网络。

Evolution here does not let the model add tools. The loop is: observe own telemetry, infer the opponent policy shape, propose one signed action, evaluate on a frozen holdout, promote or ask a human, roll back on failure. Fitness = attacker cost − business loss − 4 × physical risk. Alert count cannot promote. Opponent analysis reads shapes on the defender's side. It does not read attack payloads and does not enter the other party's network.

ここでの進化は、モデルが自分で道具を増やすことではありません。循環は、自陣の計測を見る、相手の政策形状を推定する、署名済み動作を一つ提案する、凍結したホールドアウトで評価する、昇格するか人に尋ねる、失敗したら戻す、です。適応度 = 攻撃側コスト − 事業損失 − 4 × 物理リスク。警報数では昇格しません。相手の分析は防御側の形状だけを読み、攻撃ペイロードは読まず、相手のネットワークにも入りません。

## 怎么用

```bash
npm install
npx prisma migrate dev --name init --skip-seed
npx next dev -p 3030
```

桌面窗口：

```bash
npm run bot
```

打开 http://127.0.0.1:3030 。左边可以新建 Bot。可选：查这台电脑、共享画面、演化防守、先聊聊。标题下面是本机断路读数。在输入框写对方这一手，Athena 按防守侧形状从十五个动作里选一个。失败登录、新计划任务、新启动项、新本地凭据会在本机切断，不等云端仪表盘。闲聊在设置了 `ZAI_API_KEY` 时走智谱 GLM-5.3。查电脑只读进程数、监听端口、内存占用和 C 盘剩余空间。共享画面和摄像头只有点了才开，画面不外传。进攻请求会被拒绝。密钥不要提交。

2026-10-25 本机断路器、GLM-5.3、UI、功能、ER 图和目录树： [中文](docs/UPDATE-2026-10-25.zh.md) · [English](docs/UPDATE-2026-10-25.en.md) · [日本語](docs/UPDATE-2026-10-25.ja.md)

模型栈分支上的五席、车道和代码： [中文](docs/MODEL-STACK.zh.md) · [English](docs/MODEL-STACK.en.md) · [日本語](docs/MODEL-STACK.ja.md)

2026-10-22 六层宪法与对话出招： [中文](docs/UPDATE-2026-10-22.zh.md) · [English](docs/UPDATE-2026-10-22.en.md) · [日本語](docs/UPDATE-2026-10-22.ja.md)

Desktop window: `npm run bot`. Open http://127.0.0.1:3030 . The left rail can create a bot. Choices: check this PC, share the screen, evolve a defense, or just talk. The line under the title is the local breaker. Type the opponent's move and Athena picks one of the fifteen signed actions. Failed logons, new tasks, new startup items, and new local credentials can cut on this computer. Chat uses GLM-5.3 when `ZAI_API_KEY` is set. A PC check reads process count, listening ports, memory use, and free space on C:. Screen share and the camera start only after a click. Offensive requests are refused. Do not commit the key.

デスクトップは `npm run bot`。http://127.0.0.1:3030 を開きます。左で Bot を新規作成できます。題名の下は本機ブレーカです。入力欄に相手の一手を書くと、十五動作の一つを選びます。失敗ログオン、新しいタスク、新しいスタートアップ、新しいローカル資格情報はこの機械で切断できます。`ZAI_API_KEY` があるとき、雑談は GLM-5.3 です。PC 検査はプロセス数、待受ポート、メモリ、C: の空きだけです。画面共有とカメラはクリック後だけ開きます。攻撃の依頼は拒否します。鍵はコミットしません。

详细架构、二十二个模块、十五个动作、代码地图和边界： [中文](docs/ARCHITECTURE.zh.md) · [English](docs/ARCHITECTURE.en.md) · [日本語](docs/ARCHITECTURE.ja.md)

`npm run check` 会核对模块数、封闭清单和拒绝进攻请求。
