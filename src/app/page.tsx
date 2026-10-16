import { AthenaDot } from "@/components/bot/AthenaDot";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ shell?: string }> }) {
  const params = await searchParams;
  return <AthenaDot shell={params.shell === "app"} />;
}
