export const LP_LANGS = ["zh", "en", "ja"] as const;
export type LpLang = (typeof LP_LANGS)[number];

export function isLpLang(value: string): value is LpLang {
  return (LP_LANGS as readonly string[]).includes(value);
}

type Row = { name: string; auto: string; ask: string };
type Group = { title: string; rows: Row[] };

export type LpCopy = {
  htmlLang: string;
  title: string;
  description: string;
  switch: { zh: string; en: string; ja: string };
  demo: string;
  kicker: string;
  headline: string;
  lede: string;
  banner: string;
  facts: { k: string; v: string }[];
  problemTitle: string;
  problemLede: string;
  problems: { n: string; t: string; d: string }[];
  loopTitle: string;
  loopLede: string;
  steps: { t: string; d: string }[];
  catalogTitle: string;
  catalogLede: string;
  colProduct: string;
  colAuto: string;
  colAsk: string;
  groups: Group[];
  haveTitle: string;
  have: string[];
  lackTitle: string;
  lack: string[];
  marketTitle: string;
  market: string;
  founderTitle: string;
  founderBody: string;
  links: { href: string; label: string }[];
  footer: string;
};

const groupsZh: Group[] = [
  {
    title: "身份",
    rows: [
      { name: "证件即焚验证所", auto: "核验通过后把影像换成可撤销句柄", ask: "向征信或警察申报" },
      { name: "字段残值定价所", auto: "代币化伤害高、残值低的非法定字段", ask: "删除法定凭证" },
      { name: "二次伤害排练场", auto: "对已知泄漏组合提高挑战", ask: "给客户自动发信" },
      { name: "语言壁垒倒置", auto: "日语流利不加信任，通行密钥才加", ask: "封禁语言或反制发件人" },
      { name: "个性化钓鱼抗体", auto: "隔离带泄漏标记的入站，改到官方应用确认", ask: "改写外发、抓取外链" },
      { name: "通行密钥默认工厂", auto: "有设备的账户开启通行密钥", ask: "锁死没有手机的接收人" },
      { name: "开户侧影像不信任闸", auto: "引用泄漏影像标记时改为设备绑定挑战", ask: "拒绝全部远程开户" },
    ],
  },
  {
    title: "委托、披露与暴露面",
    rows: [
      { name: "委托链断路器", auto: "健康度下降时拉开已批准的断路器", ask: "改合同、进入对方网络" },
      { name: "勒索可用性壳", auto: "切到最小可行入出库并隔离受损域", ask: "支付、通信、覆盖生产" },
      { name: "披露时钟", auto: "升级内部严重度并生成草稿", ask: "向客户、公众或监管发送" },
      { name: "市政邮件信任锚", auto: "签名、去掉链接、缩短紧急指令", ask: "停掉全部防灾通知" },
      { name: "移动目标暴露面", auto: "轮换非人身份、缩短令牌", ask: "关闭顾客下单" },
    ],
  },
  {
    title: "物理世界",
    rows: [
      { name: "冷链安全调速器", auto: "越界设定值钳位到本地安全态", ask: "反制设备、改配方" },
      { name: "物理包络证", auto: "只放行不变量仍成立的命令", ask: "发明新的不变量" },
      { name: "停机权分离器", auto: "只执行事先签署的停机", ask: "新增停机类别" },
    ],
  },
  {
    title: "操作系统",
    rows: [
      { name: "抗体控制面", auto: "把过关的控制写成可回滚抗体", ask: "改目标或扩大权限" },
      { name: "自身免疫抑制器", auto: "误拦超预算时下调一档挑战", ask: "关掉物理联锁或防灾发送" },
      { name: "共演化健身房", auto: "冻结留出集也通过才晋升", ask: "用评估集再训练" },
      { name: "对手策略分类器", auto: "按己方遥测切换封闭摩擦", ask: "建造攻击模型、对外探测" },
      { name: "对手成本仪表", auto: "在成本下降处加最便宜的一层摩擦", ask: "用告警数单独晋升" },
      { name: "治理孪生", auto: "只签发不可合并的提案", ask: "合并新工具、新数据或新目标" },
      { name: "学习回路检疫所", auto: "漂移时回滚到已签名权重", ask: "用事件日志微调基础模型" },
    ],
  },
];

const groupsEn: Group[] = [
  {
    title: "Identity",
    rows: [
      { name: "Document incinerator", auto: "Replace a passed image with a revocable handle", ask: "File with police or a credit bureau" },
      { name: "Field residual pricer", auto: "Tokenize fields that are cheap to steal and costly to lose", ask: "Delete records the law requires" },
      { name: "Second-harm rehearsal", auto: "Raise the challenge on a known leaked combination", ask: "Message the customer" },
      { name: "Language-moat inversion", auto: "Japanese fluency adds no trust; a passkey does", ask: "Block a language or counter a sender" },
      { name: "Personalized-phish antibody", auto: "Isolate inbound mail that carries a leak marker", ask: "Rewrite outbound mail or fetch links" },
      { name: "Passkey default factory", auto: "Turn on passkeys where a device exists", ask: "Lock out someone with no phone" },
      { name: "Onboarding image gate", auto: "Device-bind when an application cites a leaked image", ask: "Refuse all remote onboarding" },
    ],
  },
  {
    title: "Vendors, disclosure, exposure",
    rows: [
      { name: "Vendor-chain breaker", auto: "Open an approved breaker when health drops", ask: "Edit the contract or enter their network" },
      { name: "Ransom availability shell", auto: "Minimum viable shipping, isolate the damaged domain", ask: "Pay, talk, or restore over production" },
      { name: "Disclosure clock", auto: "Raise internal severity and draft the notice", ask: "Send it to customers, the public, or a regulator" },
      { name: "Municipal mail anchor", auto: "Sign templates, strip links, shorten emergency orders", ask: "Stop all disaster alerts" },
      { name: "Moving-target exposure", auto: "Rotate non-human identities and shorten tokens", ask: "Close customer ordering" },
    ],
  },
  {
    title: "Physical world",
    rows: [
      { name: "Cold-chain governor", auto: "Clamp a set-point and return to local safe state", ask: "Touch the device or change the recipe" },
      { name: "Physical envelope", auto: "Admit only commands whose invariant still holds", ask: "Invent a new invariant" },
      { name: "Shutdown authority", auto: "Execute only a pre-signed shutdown", ask: "Add a new class of shutdown" },
    ],
  },
  {
    title: "Operating system",
    rows: [
      { name: "Antibody plane", auto: "Write a passed control as a reversible antibody", ask: "Change the objective or the permissions" },
      { name: "Autoimmune suppressor", auto: "Lower one challenge step when false blocks exceed budget", ask: "Disable a physical interlock" },
      { name: "Co-evolution gym", auto: "Promote only if the frozen holdout also passes", ask: "Train on the eval set" },
      { name: "Opponent-policy classifier", auto: "Switch closed friction from our own telemetry", ask: "Build an attack model or scan outward" },
      { name: "Attacker-cost meter", auto: "Add the cheapest friction where inferred cost fell", ask: "Promote on alert count alone" },
      { name: "Governance twin", auto: "Issue a proposal that cannot merge", ask: "Merge a new tool, data source, or objective" },
      { name: "Learning quarantine", auto: "Roll back to a signed weight on drift", ask: "Fine-tune the base model on event logs" },
    ],
  },
];

const groupsJa: Group[] = [
  {
    title: "身元",
    rows: [
      { name: "证件即焚验证所", auto: "確認後の画像を取り消し可能なハンドルに替える", ask: "警察や信用機関への届出" },
      { name: "字段残值定价所", auto: "盗まれやすく失うと高い項目をトークン化する", ask: "法定記録の削除" },
      { name: "二次伤害排练场", auto: "既知の漏えい組み合わせで確認を強くする", ask: "顧客への自動送信" },
      { name: "语言壁垒倒置", auto: "日本語の流暢さは信頼にせず、パスキーを足す", ask: "言語の遮断や差出人への反撃" },
      { name: "个性化钓鱼抗体", auto: "漏えい印のある着信を隔離し、公式アプリで確認する", ask: "送信文の改変やリンクの取得" },
      { name: "通行密钥默认工厂", auto: "端末がある口座にパスキーを入れる", ask: "電話を持たない受信者の締め出し" },
      { name: "开户侧影像不信任闸", auto: "漏えい画像を引く申込は端末結合の確認にする", ask: "遠隔開設の全面拒否" },
    ],
  },
  {
    title: "委託、告知、露出",
    rows: [
      { name: "委托链断路器", auto: "健全度が落ちたら承認済みの遮断器を開く", ask: "契約変更や相手ネットワークへの進入" },
      { name: "勒索可用性壳", auto: "最小限の入出庫に切り替え、損傷域を隔離する", ask: "支払い、通信、本番への上書き" },
      { name: "披露时钟", auto: "内部重大度を上げ、告知草案を作る", ask: "顧客・公衆・当局への送付" },
      { name: "市政邮件信任锚", auto: "署名し、リンクを外し、緊急指示を短くする", ask: "防災通知の全面停止" },
      { name: "移动目标暴露面", auto: "非人間IDを回し、トークンを短くする", ask: "顧客の注文経路を閉じる" },
    ],
  },
  {
    title: "物理世界",
    rows: [
      { name: "冷链安全调速器", auto: "包絡を超えた設定値を現地安全状態へ戻す", ask: "機器への反撃や配合の変更" },
      { name: "物理包络证", auto: "不変条件が成り立つ指令だけ通す", ask: "新しい不変条件の発明" },
      { name: "停机权分离器", auto: "事前署名された停止だけ実行する", ask: "新しい停止種別の追加" },
    ],
  },
  {
    title: "オペレーティングシステム",
    rows: [
      { name: "抗体控制面", auto: "合格した制御を巻き戻せる抗体として書く", ask: "目的や権限の変更" },
      { name: "自身免疫抑制器", auto: "誤遮断が予算を超えたら確認を一段下げる", ask: "物理インターロックの解除" },
      { name: "共演化健身房", auto: "凍結した保留集合も通ったときだけ昇格する", ask: "評価集合での再学習" },
      { name: "对手策略分类器", auto: "自テナントの計測だけで閉じた摩擦を切り替える", ask: "攻撃モデルの構築や外部探査" },
      { name: "对手成本仪表", auto: "推定コストが下がった経路に最も安い摩擦を足す", ask: "警報数だけで昇格する" },
      { name: "治理孪生", auto: "マージできない提案だけを出す", ask: "新しい道具・データ・目的の取り込み" },
      { name: "学习回路检疫所", auto: "分布がずれたら署名済み重みへ戻す", ask: "事象ログでの基盤モデル微調整" },
    ],
  },
];

const copy: Record<LpLang, LpCopy> = {
  zh: {
    htmlLang: "zh-CN",
    title: "Athena 项目介绍",
    description: "有界自演化 AI 网络防御系统。二十二个产品，一条演化环，一个杀开关。未上市，无收入。",
    switch: { zh: "中文", en: "English", ja: "日本語" },
    demo: "打开 Bot",
    kicker: "项目介绍 · 2026-10-15 · 不是证券发行",
    headline: "Athena",
    lede: "住在你电脑上的防守 Dot。开口是控制面，不是接管。二十二个产品共用一条演化环、一本审计账和一个杀开关。代理只能从 15 个已签名的执行器里选动作。",
    banner:
      "Athena 没有上市，没有招股书，没有可披露收入、付费客户或认证。申请人是东京的个人。产品是本机演示，租户是虚构的。本页不是估值，也不是购买证券的邀请。",
    facts: [
      { k: "创始人", v: "Tommy Zhao" },
      { k: "所在地", v: "日本东京 131-0021" },
      { k: "阶段", v: "个人项目，未定价" },
      { k: "代码", v: "github.com/Victory963/Athena" },
    ],
    problemTitle: "贵的不再是找入口",
    problemLede: "模型把语言和公开入口的成本打了下来。剩下的损失是目标本身：不可撤销的身份、下一封像本人的信、从察觉到公表的时钟，以及会变成温度和停摆的命令。",
    problems: [
      { n: "01", t: "证件影像", d: "核验通过之后继续保管影像，等于替别人库存不可撤销的身份。" },
      { n: "02", t: "姓名和联系方式", d: "不必有密码。知道名字就够把下一封信写成是写给这个人的。" },
      { n: "03", t: "告知时钟", d: "从察觉到可以对外说明的小时数本身是损失。草稿先留在内部。" },
      { n: "04", t: "物理后果", d: "入出库停止和冷柜设定值是安全和业务事件，不进普通 IT 队列。" },
    ],
    loopTitle: "演化的是控制，不是权限",
    loopLede: "适应度是对手成本减去业务损失，再减去四倍物理风险。告警数不能单独用来晋升。",
    steps: [
      { t: "观察", d: "只读本租户遥测和委托方健康度。" },
      { t: "定向", d: "认出节奏、工具突发、范围请求、泄漏标记、设定值外移。" },
      { t: "提案", d: "从 15 个执行器里选一个。范围扩张不产生自动动作。" },
      { t: "评估", d: "对照冻结留出集。只记住上一次事故的政策会被拒绝。" },
      { t: "晋升", d: "成本上升，且业务和物理回归留在预算内，才写入可回滚抗体。" },
      { t: "闸门", d: "新工具、新数据、新目标由人决定。批准也不会把清单变长。" },
    ],
    catalogTitle: "二十二个产品",
    catalogLede: "前十五个是插在操作系统上的产品。后七个决定什么叫「更好」，以及什么永远不能自动改。",
    colProduct: "产品",
    colAuto: "可以自动改",
    colAsk: "必须停下来问人",
    groups: groupsZh,
    haveTitle: "今天已经能跑的",
    have: [
      "二十二个模块、控制面、三种演示遥测、带来源的 SWOT 和上市缺口页。",
      "杀开关在被评估的循环外面。按下后，晋升和节拍停止。",
      "审计可以导出为本机 JSON。没有签名，也没有 SIEM 投递。",
    ],
    lackTitle: "还没有的",
    lack: [
      "传感器、值班、SSO、租户隔离、价格和 SLA。",
      "收入、客户、审计师和任何交易所身份。",
      "AWS 部署。账号仍在申请，产品跑在本机 SQLite 上。",
    ],
    marketTitle: "和已经在卖的平台",
    market:
      "CrowdStrike、Microsoft、Palo Alto、SentinelOne、Wiz、Darktrace、Trend Micro、LAC、Ensign、CyCraft、奇安信、AhnLab 的公开页面描述的是已经接在终端、身份、云或托管 SOC 上的产品。Athena 不借用他们的检测率。现在能拿出来的是一份可以在本地读完的控制面。",
    founderTitle: "联系",
    founderBody: "Tommy Zhao · 日本东京 131-0021 · +81 090 7900 7956 · vwbrothersystem@gmail.com",
    links: [
      { href: "https://github.com/Victory963/Athena", label: "GitHub" },
      { href: "https://www.linkedin.com/in/shengce-zhao-502469261/", label: "LinkedIn" },
      { href: "/", label: "本地演示" },
      { href: "/swot", label: "SWOT" },
      { href: "/roadmap", label: "上市缺口" },
    ],
    footer: "Athena · 2026-10-15 · 演示数据是虚构的。本页不构成证券发行。",
  },
  en: {
    htmlLang: "en",
    title: "Athena — project introduction",
    description: "A bounded, self-evolving AI defense system. Twenty-two products, one loop, one kill switch. Not listed. No revenue.",
    switch: { zh: "中文", en: "English", ja: "日本語" },
    demo: "Open the Bot",
    kicker: "Project introduction · 15 October 2026 · Not an offering",
    headline: "Athena",
    lede: "A defensive Dot that lives on your machine. Speech is the control plane; takeover is forbidden. Twenty-two products share one loop, one audit ledger, and one kill switch. The agent may choose only from 15 signed actuators.",
    banner:
      "Athena is not listed, has no registration statement, and has no disclosed revenue, paying customers, or certification. The applicant is an individual in Tokyo. The product is a local demo with fictional tenants. This page is not a valuation and not an offer to sell securities.",
    facts: [
      { k: "Founder", v: "Tommy Zhao" },
      { k: "Where", v: "Tokyo 131-0021, Japan" },
      { k: "Stage", v: "Individual project, unpriced" },
      { k: "Code", v: "github.com/Victory963/Athena" },
    ],
    problemTitle: "Finding an entrance is no longer the expensive part",
    problemLede:
      "Models made language and public entry points cheap. What remains costly is the objective: an identity that cannot be revoked, the next letter that knows your name, the hours between discovery and a notice, and a command that becomes temperature or a stopped warehouse.",
    problems: [
      { n: "01", t: "Document images", d: "Keeping an image after the check is inventory of an identity that cannot be reissued." },
      { n: "02", t: "A name and a contact", d: "A password is unnecessary. A name is enough for the next message to look addressed to that person." },
      { n: "03", t: "The disclosure clock", d: "The hours between detection and a notice are themselves a loss. The draft stays internal." },
      { n: "04", t: "Physical consequence", d: "A stopped dock and a refrigeration set-point are safety events, not tickets in an IT queue." },
    ],
    loopTitle: "What evolves is the control, not the permission",
    loopLede: "Fitness is attacker cost minus business loss minus four times physical risk. Alert count cannot promote a control by itself.",
    steps: [
      { t: "Observe", d: "This tenant’s telemetry and vendor health only." },
      { t: "Orient", d: "Cadence, tool burst, scope request, leak marker, set-point drift." },
      { t: "Propose", d: "One of 15 actuators. A scope request proposes nothing." },
      { t: "Evaluate", d: "A frozen holdout. A policy that only memorizes the last incident fails." },
      { t: "Promote", d: "Write a reversible antibody only if cost rises inside the budgets." },
      { t: "Gate", d: "A human decides any new tool, data source, or objective. Approval does not lengthen the list." },
    ],
    catalogTitle: "Twenty-two products",
    catalogLede: "Fifteen sit on the operating system. Seven decide what “better” is allowed to mean, and what may never change itself.",
    colProduct: "Product",
    colAuto: "May change",
    colAsk: "Must stop and ask",
    groups: groupsEn,
    haveTitle: "What runs today",
    have: [
      "Twenty-two modules, a control plane, three synthetic signals, a sourced SWOT, and a gap list.",
      "The kill switch sits outside the evaluated loop. Promotion and the ticker stop when it is pressed.",
      "The audit exports as local JSON. It is unsigned and is not delivered to a SIEM.",
    ],
    lackTitle: "What does not exist",
    lack: [
      "Sensors, a staffed shift, SSO, tenant isolation, a price, or an SLA.",
      "Revenue, customers, an auditor, or an exchange listing.",
      "An AWS deployment. The account is still being applied for. The demo runs on local SQLite.",
    ],
    marketTitle: "Platforms that already sell",
    market:
      "Public pages from CrowdStrike, Microsoft, Palo Alto, SentinelOne, Wiz, Darktrace, Trend Micro, LAC, Ensign, CyCraft, Qi-Anxin, and AhnLab describe products already attached to endpoints, identity, cloud, or a managed SOC. Athena does not borrow their detection rates. What it can show is a control plane that can be read locally.",
    founderTitle: "Contact",
    founderBody: "Tommy Zhao · Tokyo 131-0021, Japan · +81 090 7900 7956 · vwbrothersystem@gmail.com",
    links: [
      { href: "https://github.com/Victory963/Athena", label: "GitHub" },
      { href: "https://www.linkedin.com/in/shengce-zhao-502469261/", label: "LinkedIn" },
      { href: "/", label: "Local demo" },
      { href: "/swot", label: "SWOT" },
      { href: "/roadmap", label: "Listing gaps" },
    ],
    footer: "Athena · 15 October 2026 · Demo data is fictional. This page is not an offer of securities.",
  },
  ja: {
    htmlLang: "ja",
    title: "Athena プロジェクト紹介",
    description: "有界な自己進化型AI防御システム。二十二の製品、一つのループ、一つの停止スイッチ。未上場、売上なし。",
    switch: { zh: "中文", en: "English", ja: "日本語" },
    demo: "Bot を開く",
    kicker: "プロジェクト紹介 · 2026-10-15 · 証券の募集ではありません",
    headline: "Athena",
    lede: "あなたの機械に住む防御用の Dot です。話すことは制御面であり、乗っ取りではありません。二十二の製品が一つの進化ループ、一つの監査台帳、一つのキルスイッチを共有します。選べるのは署名済みの15個の実行器だけです。",
    banner:
      "Athena は上場しておらず、有価証券届出書もなく、開示すべき売上、有料顧客、認証もありません。申請者は東京在住の個人です。製品はローカルのデモで、テナントは架空です。このページは valuation でも、証券の募集でもありません。",
    facts: [
      { k: "創業者", v: "Tommy Zhao" },
      { k: "所在地", v: "日本・東京 131-0021" },
      { k: "段階", v: "個人プロジェクト、未定価格" },
      { k: "コード", v: "github.com/Victory963/Athena" },
    ],
    problemTitle: "入口を見つけることは、もう高い部分ではない",
    problemLede:
      "モデルは言語と公開入口のコストを下げました。残る損失は目的そのものです。取り消せない身元、名前を知っている次の手紙、発見から告知までの時間、そして温度や出荷停止になる指令です。",
    problems: [
      { n: "01", t: "証明書の画像", d: "確認のあと画像を保管し続けることは、再発行できない身元の在庫です。" },
      { n: "02", t: "氏名と連絡先", d: "パスワードは要りません。名前があれば、次の文面はその人宛てに見えます。" },
      { n: "03", t: "告知の時計", d: "検知から告知までの時間そのものが損失です。草案は内部に残します。" },
      { n: "04", t: "物理的な結果", d: "入出庫の停止と冷蔵の設定値は安全の事象であり、通常のITチケットではありません。" },
    ],
    loopTitle: "進化するのは制御であり、権限ではない",
    loopLede: "適応度は、相手のコストから事業損失を引き、物理リスクの4倍を引いたものです。警報数だけでは昇格しません。",
    steps: [
      { t: "観察", d: "自テナントの計測と委託先の健全度だけを読みます。" },
      { t: "定位", d: "リズム、ツール集中、範囲要求、漏えい印、設定値の逸脱を見分けます。" },
      { t: "提案", d: "15個から一つ。範囲の拡大は自動動作を生みません。" },
      { t: "評価", d: "凍結した保留集合と照合します。前回だけを覚える政策は拒否されます。" },
      { t: "昇格", d: "コストが上がり、事業と物理の回帰が予算内のときだけ、巻き戻せる抗体にします。" },
      { t: "門", d: "新しい道具、データ、目的は人が決めます。承認しても一覧は長くなりません。" },
    ],
    catalogTitle: "二十二の製品",
    catalogLede: "十五はオペレーティングシステムの上に載ります。七つは「より良い」の意味と、決して自動では変えられないものを決めます。",
    colProduct: "製品",
    colAuto: "自動で変えてよい",
    colAsk: "止まって人に聞く",
    groups: groupsJa,
    haveTitle: "今日動くもの",
    have: [
      "二十二のモジュール、制御面、三種類のデモ計測、出典付きSWOT、上場までの欠落一覧。",
      "キルスイッチは評価されるループの外にあります。押すと昇格と拍は止まります。",
      "監査はローカルJSONで書き出せます。署名はなく、SIEMへは送りません。",
    ],
    lackTitle: "まだないもの",
    lack: [
      "センサー、当直、SSO、テナント分離、価格、SLA。",
      "売上、顧客、監査人、取引所の身分。",
      "AWS上の運用。アカウントは申請中です。デモはローカルのSQLiteで動きます。",
    ],
    marketTitle: "すでに売っている基盤",
    market:
      "CrowdStrike、Microsoft、Palo Alto、SentinelOne、Wiz、Darktrace、Trend Micro、LAC、Ensign、CyCraft、奇安信、AhnLab の公開ページは、端末、身元、クラウド、または運用SOCに接続済みの製品を説明しています。Athena はそれらの検知率を自分の数字にしません。示せるのは、ローカルで読み切れる制御面です。",
    founderTitle: "連絡",
    founderBody: "Tommy Zhao · 日本・東京 131-0021 · +81 090 7900 7956 · vwbrothersystem@gmail.com",
    links: [
      { href: "https://github.com/Victory963/Athena", label: "GitHub" },
      { href: "https://www.linkedin.com/in/shengce-zhao-502469261/", label: "LinkedIn" },
      { href: "/", label: "ローカルデモ" },
      { href: "/swot", label: "SWOT" },
      { href: "/roadmap", label: "上場までの欠落" },
    ],
    footer: "Athena · 2026-10-15 · デモのデータは架空です。このページは証券の募集ではありません。",
  },
};

export function lpCopy(lang: LpLang): LpCopy {
  return copy[lang];
}
