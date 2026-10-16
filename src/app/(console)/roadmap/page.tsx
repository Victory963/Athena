import { GAPS } from "@/lib/os/market";

export const dynamic = "force-dynamic";

export default function RoadmapPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">距离上市公司级防守平台</h1>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          这是缺口清单，不是招股书。Athena 没有上市，没有收入披露，没有审计客户，也没有把任何认证写进产品。
        </p>
      </div>
      <ul className="space-y-2">
        {GAPS.map((gap) => (
          <li key={gap.item} className="rounded border border-stone-300 bg-white p-3 text-sm">
            <div className="font-medium">{gap.item}</div>
            <p className="mt-1 text-stone-700">{gap.have}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm leading-6 text-stone-700">
        演示里已经能跑的，是封闭执行器、人工闸门、杀开关、本地审计、虚构租户和物理钳位。补齐上表之前，它仍然是一套可运行的研究演示。
      </p>
    </div>
  );
}
