import Link from "next/link";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-stone-500">Athena · bounded self-evolving defense OS</p>
        <h1 className="text-2xl font-semibold">给评审看的短说明</h1>
      </div>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-base font-semibold">English</h2>
        <p>
          Athena is a local, self-hosted defense demo. It watches synthetic telemetry, classifies a few
          defender-visible shapes (steady cadence, tool-use bursts, scope creep), and may apply only one action
          from a closed list of 15. A human must approve any new tool, data source, or objective. The kill switch
          sits outside the evaluated loop. Nothing here scans, exploits, or contacts another network. The tenants,
          documents, and messages are fictional. Athena is not a public company, has no disclosed revenue, and holds
          no compliance certification.
        </p>
      </section>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-base font-semibold">中文</h2>
        <p>
          Athena 是有界自演化防守系统的本地演示。它观察虚构遥测，识别节奏过稳、工具调用突发和范围扩张，并且只能从
          15 个封闭执行器里选动作。新工具、新数据源和新目标必须先问人。杀开关不在被评估的模型里。系统不扫描、不利用漏洞、不进入别人的网络。租户和证件都是虚构的。Athena
          没有上市，没有可披露收入，也没有合规认证。
        </p>
      </section>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>
          <Link className="underline" href="/architecture">
            防守架构
          </Link>
        </li>
        <li>
          <Link className="underline" href="/swot">
            与公开防守产品的 SWOT
          </Link>
        </li>
        <li>
          <Link className="underline" href="/roadmap">
            距离上市公司级平台还缺什么
          </Link>
        </li>
        <li>
          <Link className="underline" href="/modules/classifier">
            跑分类器
          </Link>
        </li>
        <li>
          <Link className="underline" href="/audit">
            审计账本
          </Link>
        </li>
      </ul>
    </div>
  );
}
