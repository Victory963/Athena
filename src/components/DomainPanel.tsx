export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number | boolean)[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-stone-300 py-1.5 pr-3 text-xs font-medium text-stone-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-stone-200 py-1.5 pr-3 align-top">
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Bag = Record<string, unknown>;

export function DomainPanel({ slug, domain }: { slug: string; domain: Bag }) {
  if (slug === "id-incinerator") {
    const records = domain.records as { id: string; kind: string; status: string; handle?: string }[];
    return (
      <DataTable
        headers={["演示编号", "种类", "状态", "句柄"]}
        rows={records.map((row) => [row.id, row.kind, row.status === "burned" ? "已焚毁" : "仍保管", row.handle ?? "—"])}
      />
    );
  }
  if (slug === "field-pricer") {
    const fields = domain.fields as { name: string; resale: number; harm: number; state: string }[];
    return (
      <DataTable
        headers={["字段", "演示残值", "伤害", "状态"]}
        rows={fields.map((row) => [
          row.name,
          row.resale,
          row.harm,
          row.state === "tokenized" ? "已代币化" : row.state === "retained_legal" ? "法定保留" : "原样",
        ])}
      />
    );
  }
  if (slug === "second-harm") {
    const combos = domain.combos as { id: string; fields: string; challenge: number; isolated: boolean }[];
    return (
      <DataTable
        headers={["组合", "字段标记", "挑战", "隔离"]}
        rows={combos.map((row) => [row.id, row.fields, row.challenge, row.isolated ? "是" : "否"])}
      />
    );
  }
  if (slug === "language-moat") {
    const samples = domain.samples as { id: string; fluent: boolean; passkey: boolean; trusted: boolean }[];
    return (
      <div className="space-y-3">
        <p className="text-sm">
          流利度权重 {String(domain.fluentTrustWeight)} · 通行密钥覆盖 {String(domain.passkeyCoverage)}%
        </p>
        <DataTable
          headers={["样本", "日语流利", "通行密钥", "被信任"]}
          rows={samples.map((row) => [row.id, row.fluent ? "是" : "否", row.passkey ? "是" : "否", row.trusted ? "是" : "否"])}
        />
      </div>
    );
  }
  if (slug === "phish-antibody") {
    const messages = domain.messages as { id: string; usesLeakField: boolean; channel: string; isolated: boolean }[];
    return (
      <DataTable
        headers={["入站", "带泄漏字段标记", "渠道", "隔离"]}
        rows={messages.map((row) => [row.id, row.usesLeakField ? "是" : "否", row.channel, row.isolated ? "是" : "否"])}
      />
    );
  }
  if (slug === "passkey-factory") {
    const cohorts = domain.cohorts as {
      id: string;
      hasDevice: boolean;
      passkey: boolean;
      friction: number;
      locked: boolean;
    }[];
    return (
      <DataTable
        headers={["账户", "有设备", "通行密钥", "摩擦", "锁定"]}
        rows={cohorts.map((row) => [
          row.id,
          row.hasDevice ? "是" : "否",
          row.passkey ? "开" : "关",
          row.friction,
          row.locked ? "是" : "否",
        ])}
      />
    );
  }
  if (slug === "kyc-gate") {
    const applications = domain.applications as {
      id: string;
      usedLeakedImage: boolean;
      challenge: string;
      decision: string;
    }[];
    return (
      <DataTable
        headers={["申请", "引用泄漏影像标记", "挑战", "决定"]}
        rows={applications.map((row) => [row.id, row.usedLeakedImage ? "是" : "否", row.challenge, row.decision])}
      />
    );
  }
  if (slug === "vendor-breaker") {
    const vendors = domain.vendors as { id: string; role: string; health: number; breaker: string }[];
    return (
      <div className="space-y-2">
        <p className="text-sm">进入对方网络：{domain.enteredNetwork ? "是" : "否"}</p>
        <DataTable
          headers={["委托方", "角色", "健康度", "断路器"]}
          rows={vendors.map((row) => [row.id, row.role, row.health, row.breaker === "open" ? "拉开" : "闭合"])}
        />
      </div>
    );
  }
  if (slug === "ransom-shell") {
    const lanes = domain.lanes as { id: string; name: string; status: string; isolated: boolean }[];
    const statusText: Record<string, string> = { down: "停止", minimal: "最小可用", normal: "正常" };
    return (
      <div className="space-y-2">
        <p className="text-sm">
          顾客档案在受损服务器：{domain.customerDataOnVictim ? "是" : "否"} · 已支付：{domain.paid ? "是" : "否"} ·
          已通信：{domain.talked ? "是" : "否"}
        </p>
        <DataTable
          headers={["通道", "名称", "状态", "隔离"]}
          rows={lanes.map((row) => [row.id, row.name, statusText[row.status] ?? row.status, row.isolated ? "是" : "否"])}
        />
      </div>
    );
  }
  if (slug === "disclosure-clock") {
    return (
      <div className="space-y-2 text-sm">
        <p>
          已过 {String(domain.hours)} 小时 / 时限 {String(domain.sla)} · 严重度 {String(domain.severity)} · 仍在采集{" "}
          {domain.collecting ? "是" : "否"} · 已外发 {domain.sentExternal ? "是" : "否"}
        </p>
        <p className="rounded bg-white p-3">{String(domain.draft || "还没有内部草稿")}</p>
      </div>
    );
  }
  if (slug === "municipal-anchor") {
    const templates = domain.templates as { id: string; name: string; signed: boolean; hasLink: boolean; ttlMin: number }[];
    return (
      <div className="space-y-2">
        <p className="text-sm">防灾通知已停：{domain.noticeStopped ? "是" : "否"}</p>
        <DataTable
          headers={["模板", "名称", "签名", "可执行链接", "有效分钟"]}
          rows={templates.map((row) => [row.id, row.name, row.signed ? "有" : "无", row.hasLink ? "有" : "无", row.ttlMin])}
        />
      </div>
    );
  }
  if (slug === "moving-target") {
    const nhi = domain.nhi as { id: string; name: string; ttlMin: number; rotated: boolean; publicAdmin: boolean }[];
    return (
      <div className="space-y-2">
        <p className="text-sm">顾客下单：{domain.orderOpen ? "开" : "关"}</p>
        <DataTable
          headers={["身份", "名称", "令牌分钟", "已轮换", "管理面公网"]}
          rows={nhi.map((row) => [row.id, row.name, row.ttlMin, row.rotated ? "是" : "否", row.publicAdmin ? "是" : "否"])}
        />
      </div>
    );
  }
  if (slug === "cold-chain") {
    const units = domain.units as {
      id: string;
      setpoint: number;
      min: number;
      max: number;
      clamped: boolean;
      localSafe: boolean;
    }[];
    return (
      <DataTable
        headers={["冷柜", "设定°C", "下限", "上限", "已钳位", "本地安全态"]}
        rows={units.map((row) => [row.id, row.setpoint, row.min, row.max, row.clamped ? "是" : "否", row.localSafe ? "是" : "否"])}
      />
    );
  }
  if (slug === "physical-envelope") {
    const commands = domain.commands as { id: string; value: number; invariantOk: boolean; admitted: boolean }[];
    return (
      <div className="space-y-2">
        <p className="text-sm">已签署不变量：{String(domain.invariant)}</p>
        <DataTable
          headers={["命令", "值", "不变量成立", "放行"]}
          rows={commands.map((row) => [row.id, row.value, row.invariantOk ? "是" : "否", row.admitted ? "是" : "否"])}
        />
      </div>
    );
  }
  if (slug === "shutdown-authority") {
    const envelopes = domain.envelopes as { id: string; scope: string; signed: boolean }[];
    const request = domain.request as { scope: string; inside: boolean; minutes: number };
    return (
      <div className="space-y-2">
        <p className="text-sm">
          当前请求：{request.scope} · 在包络内：{request.inside ? "是" : "否"} · 已执行分钟 {request.minutes} · 联锁{" "}
          {domain.interlockOn ? "开" : "关"}
        </p>
        <DataTable
          headers={["包络", "范围", "已签署"]}
          rows={envelopes.map((row) => [row.id, row.scope, row.signed ? "是" : "否"])}
        />
      </div>
    );
  }
  if (slug === "antibody-plane") {
    return (
      <p className="text-sm">
        已晋升次数 {String(domain.promoted)} · 最近动作 {String(domain.lastActuator || "无")} · {String(domain.note)}
      </p>
    );
  }
  if (slug === "autoimmune") {
    return (
      <p className="text-sm">
        误拦 {String(domain.falsePositive)} / 预算 {String(domain.budget)} · 挑战档 {String(domain.challengeLevel)} ·
        物理联锁 {domain.physicalInterlock ? "开" : "关"}
      </p>
    );
  }
  if (slug === "gym") {
    return (
      <p className="text-sm">
        泛化政策已晋升：{domain.generalized ? "是" : "否"} · 过拟合政策已晋升：{domain.overfitPromoted ? "是" : "否"} ·
        留出集 {String(domain.holdoutScore)}
      </p>
    );
  }
  if (slug === "classifier") {
    const buckets = domain.buckets as { id: string; label: string; count: number; friction: string }[];
    return (
      <DataTable
        headers={["类", "标签", "计数", "摩擦"]}
        rows={buckets.map((row) => [row.id, row.label, row.count, row.friction])}
      />
    );
  }
  if (slug === "cost-meter") {
    return (
      <p className="text-sm">
        告警数 {String(domain.alertCount)} · 用告警当适应度：{domain.usedAlertAsFitness ? "是" : "否"} · 最近摩擦{" "}
        {String(domain.lastFriction)}
      </p>
    );
  }
  if (slug === "governance-twin") {
    return (
      <p className="text-sm">
        执行器清单长度 {String(domain.catalogSize)} · 已合并新工具 {String(domain.mergedTools)}
      </p>
    );
  }
  if (slug === "quarantine") {
    return (
      <p className="text-sm">
        漂移 {domain.drift ? "是" : "否"} · 签名权重 {String(domain.signedWeight)} · 当前权重 {String(domain.activeWeight)} ·
        已回滚 {domain.rolledBack ? "是" : "否"} · 微调被拒 {domain.finetuneRefused ? "是" : "否"}
      </p>
    );
  }
  return null;
}
