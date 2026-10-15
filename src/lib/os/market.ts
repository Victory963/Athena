export const ACCESSED = "2026-10-15";

export type VendorNote = {
  name: string;
  region: string;
  claim: string;
  url: string;
};

export const VENDORS: VendorNote[] = [
  {
    name: "CrowdStrike Charlotte AI",
    region: "United States",
    claim:
      "官方产品页把 Charlotte AI 写成 Falcon 平台上的 agentic 安全分析员，并列出角色权限、执行痕迹、审计日志、用量上限和可配置的人工批准。页内还写明 ISO/IEC 42001:2023 认证，以及相对其自有 MDR 团队的分诊准确率。这些是厂商自述，不是 Athena 的测评。",
    url: "https://www.crowdstrike.com/en-us/platform/charlotte-ai/",
  },
  {
    name: "Microsoft Security Copilot",
    region: "United States",
    claim:
      "官方页写明 Security Copilot 已普遍可用，代理嵌在 Defender、Entra、Intune、Purview 等产品里，用于检测、调查和响应。页内的 550% 与 204% 数字注明来自微软 2025 年 10 月的内部随机对照研究，不是独立审计。",
    url: "https://www.microsoft.com/en-us/security/business/ai-machine-learning/microsoft-security-copilot",
  },
  {
    name: "Palo Alto Cortex Agentic Assistant",
    region: "United States",
    claim:
      "官方页把 Cortex Agentic Assistant 描述为嵌在 Cortex XSIAM 与 Cortex Cloud 里的助手，用自然语言驱动多阶段工作流。页上的规模数字是厂商营销表述。",
    url: "https://www.paloaltonetworks.com/cortex/cortex-agentic-assistant",
  },
  {
    name: "SentinelOne Purple AI",
    region: "United States",
    claim:
      "官方页把 Purple AI 写成 Singularity 平台里的 agentic 安全分析员，可在 OCSF 归一化后的本机与第三方数据上推进调查，并写明客户数据不用于训练其模型。这是厂商承诺，不是 Athena 核验过的合同条款。",
    url: "https://www.sentinelone.com/platform/purple/",
  },
  {
    name: "Wiz",
    region: "United States / cloud",
    claim:
      "官网把产品写成连接代码、云和运行时的安全图，并列出云上的检测与阻断、代码修复，以及面向 AI 模型、代理和 MCP 服务的可见性。页上的客户排名是厂商引用的评价，不是 Athena 的市场份额数据。",
    url: "https://www.wiz.io/",
  },
  {
    name: "Darktrace Cyber AI Analyst",
    region: "United Kingdom / Europe",
    claim:
      "官方产品页把 Cyber AI Analyst 写成自主调查告警的行为分析产品，覆盖网络、邮件、云、OT、身份和 SaaS，并描述自主响应可以打断恶意动作。页上的客户数和调查自动化比例是厂商自述。",
    url: "https://www.darktrace.com/products/cyber-ai-analyst",
  },
  {
    name: "TrendAI Vision One",
    region: "Japan-origin vendor, US page",
    claim:
      "Trend Micro 的美国产品页把 TrendAI Vision One 写成企业平台，覆盖风险暴露、安全运营、终端、邮件、身份、网络、云和数据，并单列对 AI 应用与 agentic 系统的保护。页首地址写的是美国 Irving, Texas。页上的告警下降百分比是厂商营销数字。",
    url: "https://www.trendmicro.com/en_us/business/products/one-platform.html",
  },
  {
    name: "LAC（株式会社ラック）",
    region: "Japan",
    claim:
      "官网写明公司提供安全事故响应、诊断、监控运营中心 JSOC，以及 24 小时咨询。2026-10-07 的新闻写明开始提供面向 Microsoft Agent 365 的导入与统制支援。Athena 没有这些运营服务。",
    url: "https://www.lac.co.jp/",
  },
  {
    name: "Ensign InfoSecurity",
    region: "Singapore",
    claim:
      "官网把自己写成网络安全服务公司，并在 2026 年页面上宣传主权 AI、agentic SOC，以及带人工监督的机器速度防御。这是托管运营，不是一份可本地阅读的演示控制面。",
    url: "https://www.ensigninfosecurity.com/",
  },
  {
    name: "CyCraft",
    region: "Taiwan",
    claim:
      "官网把产品写成威胁暴露管理：用 AI 看攻击路径和权限边界、监视终端与 AD 特权活动、并管理外部暴露面。没有公开把 Athena 列为客户或竞品。",
    url: "https://www.cycraft.com/",
  },
  {
    name: "奇安信",
    region: "Mainland China",
    claim:
      "官网（查阅日页面含 2026 年 10 月新闻）列出天擎终端安全、天眼威胁监测、NGSOC，以及基于 QAX-GPT 的 AI 安全产品。公司同时销售实战攻防服务；Athena 不提供这类服务，也不复述其方法。",
    url: "https://www.qianxin.com/",
  },
  {
    name: "AhnLab MDS",
    region: "South Korea",
    claim:
      "英文产品页把 AhnLab MDS 写成沙箱型高级威胁防御：在隔离环境里分析文件，并与自家 EDR 配合。页上的 Common Criteria 与检测率是厂商自述。",
    url: "https://www.ahnlab.com/en/product/advanced-threat-defense-ep",
  },
];

export const GAPS = [
  {
    item: "交易所身份",
    have: "没有。Athena 没有在纳斯达克或任何交易所上市，也没有招股书。",
  },
  {
    item: "收入、客户与认证",
    have: "没有可披露的收入、付费客户、审计师报告，或 SOC 2、ISO、等保认证。厂商页上的认证不能算到 Athena 头上。",
  },
  {
    item: "多租户隔离",
    have: "演示里有七个虚构租户，但它们共用一个 SQLite 文件和一个 Node 进程。这不是生产级隔离。",
  },
  {
    item: "身份与单点登录",
    have: "没有 IdP、SSO、SCIM 或分角色的产品账号。杀开关谁都能在本机页面上按。",
  },
  {
    item: "审计导出",
    have: "本机可以下载演示账本 JSON。没有签名、保留年限、法定保全或 SIEM 投递。",
  },
  {
    item: "合规边界",
    have: "没有数据处理协议、分包清单、地域驻留承诺或监管报送流程。告知草稿只留在内部。",
  },
  {
    item: "定价与合同",
    have: "没有价目、许可、SLA 或支持时段。",
  },
  {
    item: "参考架构",
    have: "没有高可用、备份、密钥管理和传感器接入的生产架构。当前参考只是「一台机器上的 Next.js + SQLite」。",
  },
  {
    item: "传感器与编制",
    have: "没有 EDR、邮件网关或 OT 探针。二十二个模块吃的是种子遥测。没有 24 小时值班。",
  },
];
