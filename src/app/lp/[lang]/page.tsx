import { lpCopy, isLpLang, LP_LANGS, type LpLang } from "@/lib/lp";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return LP_LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLpLang(lang)) return { title: "Athena" };
  const copy = lpCopy(lang);
  return { title: copy.title, description: copy.description };
}

export default async function LpPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLpLang(raw)) notFound();
  const lang: LpLang = raw;
  const copy = lpCopy(lang);

  return (
    <div lang={copy.htmlLang} className="min-h-screen bg-[#f6f3ec] text-stone-900">
      <header className="border-b border-stone-300 bg-[#f6f3ec]/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-4">
          <Link href={`/lp/${lang}`} className="font-serif text-lg">
            Athena
          </Link>
          <nav className="flex gap-2 text-sm">
            {LP_LANGS.map((item) => (
              <Link
                key={item}
                href={`/lp/${item}`}
                className={`rounded px-2 py-1 ${item === lang ? "bg-stone-900 text-white" : "hover:bg-stone-200"}`}
                hrefLang={item === "zh" ? "zh-CN" : item}
              >
                {copy.switch[item]}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm underline">
            {copy.demo}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-800">{copy.kicker}</p>
        <h1 className="mt-3 font-serif text-5xl font-medium tracking-tight">{copy.headline}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8">{copy.lede}</p>
        <p className="mt-6 border border-orange-300 bg-orange-50 px-4 py-3 text-sm leading-6">{copy.banner}</p>
        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {copy.facts.map((fact) => (
            <div key={fact.k} className="border border-stone-300 bg-white px-3 py-3">
              <dt className="text-xs text-stone-500">{fact.k}</dt>
              <dd className="mt-1 text-sm">{fact.v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium">{copy.problemTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7">{copy.problemLede}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {copy.problems.map((item) => (
              <article key={item.n} className="border border-stone-300 bg-white p-4">
                <div className="font-serif text-2xl text-orange-800">{item.n}</div>
                <h3 className="mt-1 font-medium">{item.t}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{item.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium">{copy.loopTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7">{copy.loopLede}</p>
          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <li key={step.t} className="border border-stone-300 bg-white p-4">
                <div className="text-xs text-stone-500">{index + 1}</div>
                <h3 className="font-medium">{step.t}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{step.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium">{copy.catalogTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7">{copy.catalogLede}</p>
          {copy.groups.map((group) => (
            <div key={group.title} className="mt-8">
              <h3 className="text-lg font-medium">{group.title}</h3>
              <div className="mt-2 overflow-x-auto border border-stone-300 bg-white">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th className="border-b border-stone-300 px-3 py-2 font-medium">{copy.colProduct}</th>
                      <th className="border-b border-stone-300 px-3 py-2 font-medium">{copy.colAuto}</th>
                      <th className="border-b border-stone-300 px-3 py-2 font-medium">{copy.colAsk}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.name}>
                        <td className="border-b border-stone-200 px-3 py-2 align-top font-medium">{row.name}</td>
                        <td className="border-b border-stone-200 px-3 py-2 align-top">{row.auto}</td>
                        <td className="border-b border-stone-200 px-3 py-2 align-top">{row.ask}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="border border-stone-300 bg-white p-4">
            <h2 className="font-serif text-2xl font-medium">{copy.haveTitle}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {copy.have.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-stone-300 bg-white p-4">
            <h2 className="font-serif text-2xl font-medium">{copy.lackTitle}</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
              {copy.lack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-serif text-3xl font-medium">{copy.marketTitle}</h2>
          <p className="mt-3 max-w-3xl leading-7">{copy.market}</p>
        </section>

        <section className="mt-14 border border-stone-300 bg-white p-5">
          <h2 className="font-serif text-3xl font-medium">{copy.founderTitle}</h2>
          <p className="mt-3">{copy.founderBody}</p>
          <ul className="mt-4 flex flex-wrap gap-4 text-sm">
            {copy.links.map((link) => (
              <li key={link.href}>
                <Link className="underline" href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="border-t border-stone-300 px-5 py-6 text-center text-xs text-stone-500">{copy.footer}</footer>
    </div>
  );
}
