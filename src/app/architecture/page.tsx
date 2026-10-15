import { SignalLab } from "@/components/SignalLab";

export const dynamic = "force-dynamic";

const LESSONS = [
  {
    title: "产品类别要分开",
    body: "公开资料里的 PentAGI 是自托管的自主渗透测试代理。Athena 不是这类产品。这里只检测、遏制、核验、在内部起草告知，并把物理设定值钳在安全包络内。没有进攻执行器。",
  },
  {
    title: "数据留在租户这边",
    body: "那类系统把运行放在操作者自己的机器上，结果不默认交给厂商云。Athena 的演示遥测写在本机 SQLite，页面和导出接口都不向外发送。",
  },
  {
    title: "范围先由人划定",
    body: "自主代理如果能自己加工具、加数据或改目标，防守方会把它看成范围扩张。Athena 把这三件事挡在人工闸门后。人即使点了批准，执行器清单长度仍是 15，提案的 merged 仍是否。",
  },
  {
    title: "停机权不在模型里",
    body: "对方的监督机制里，工具调用上限不交给模型自己放宽，人也可以中途介入。Athena 的对应物是页头的杀开关：按下后，节拍、晋升、回滚和闸门执行都停止。被评估的提案改不了这个开关。",
  },
  {
    title: "动作要进账",
    body: "对方会把执行过程记下来供人看。Athena 把观察、推断、提案、评估、晋升、闸门、回滚和杀开关写进同一本账，并提供仅限本机的 JSON 导出。",
  },
  {
    title: "代理型对手在遥测里的样子",
    body: "不描述对方怎么做。只记录防守方能看见的形状：节奏过分整齐、短时间工具调用升高、以及超出已批范围的请求。前两种可以映射到封闭清单里的己方动作。范围扩张只进人审，不执行。",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">防守架构</h1>
        <p className="mt-2 text-sm leading-6 text-stone-700">
          下面是从公开仓库
          <a className="underline" href="https://github.com/vxcontrol/pentagi">
            {" "}
            vxcontrol/pentagi
          </a>{" "}
          的产品说明（查阅于 2026-10-15）转成的防守控制。没有安装那个系统，也没有抄它的提示词、工具序列或报告模板。
        </p>
      </div>
      <ol className="space-y-3">
        {LESSONS.map((lesson, index) => (
          <li key={lesson.title} className="rounded border border-stone-300 bg-white p-3 text-sm leading-6">
            <div className="font-medium">
              {index + 1}. {lesson.title}
            </div>
            <p className="mt-1 text-stone-700">{lesson.body}</p>
          </li>
        ))}
      </ol>
      <SignalLab />
    </div>
  );
}
