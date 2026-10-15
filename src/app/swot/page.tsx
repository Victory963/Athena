import { ACCESSED, VENDORS } from "@/lib/os/market";

export const dynamic = "force-dynamic";

export default function SwotPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">SWOT</h1>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          比较对象是下面这些公司自己的公开页面，查阅日期 {ACCESSED}。没有编造市场规模、份额或客户数。厂商页上的百分比和认证只代表他们的说法。
        </p>
      </div>
      <div className="overflow-x-auto rounded border border-stone-300 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th className="border-b border-stone-300 px-3 py-2">产品</th>
              <th className="border-b border-stone-300 px-3 py-2">地区</th>
              <th className="border-b border-stone-300 px-3 py-2">公开页面实际写了什么</th>
            </tr>
          </thead>
          <tbody>
            {VENDORS.map((vendor) => (
              <tr key={vendor.name}>
                <td className="border-b border-stone-200 px-3 py-2 align-top font-medium">{vendor.name}</td>
                <td className="border-b border-stone-200 px-3 py-2 align-top">{vendor.region}</td>
                <td className="border-b border-stone-200 px-3 py-2 align-top">
                  <p>{vendor.claim}</p>
                  <a className="mt-1 inline-block underline" href={vendor.url}>
                    {vendor.url}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-lg font-semibold">优势</h2>
        <p>
          Athena 把执行器清单、人工闸门、杀开关和审计账放在同一份可读的本地演示里。物理设定值钳位和已签署的停机包络是明确的边界。评审可以自己跑一轮演化，看到提案被拒绝或停在闸门，而不必相信一份营销数字。
        </p>
      </section>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-lg font-semibold">劣势</h2>
        <p>
          上表里的产品已经接在终端、身份、邮件、云或托管 SOC 上，并配有值班与合同。Athena 没有这些。它也没有他们声称的认证、客户部署或传感器。七个演示租户共用一个数据库文件。
        </p>
      </section>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-lg font-semibold">机会</h2>
        <p>
          这些厂商的公开页面都在讲代理型安全运营或 AI 应用保护。仍可能存在这样的买方：要先看到一份自托管、执行器封闭、账本可导出的控制面，再决定是否接入大平台。Athena
          现在只能充当那份控制面的演示，不能替代上表中的平台。
        </p>
      </section>
      <section className="space-y-2 text-sm leading-6">
        <h2 className="text-lg font-semibold">威胁</h2>
        <p>
          平台厂商可以把代理放进已有合同。微软的页面写明 Security Copilot 会进入 Microsoft 365 E5。买方若要求认证、值班和效果数字，Athena 提供不了。若有人把它说成渗透测试产品，那是错误描述：清单里没有对外扫描或进入他人网络的动作。
        </p>
      </section>
    </div>
  );
}
