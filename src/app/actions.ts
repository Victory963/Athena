"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/seed";
import {
  decideGovernance,
  executeLoop,
  resolveGate,
  rollbackModule,
  setKill,
  tickSim,
} from "@/lib/os/engine";

async function refresh(slug?: string) {
  revalidatePath("/");
  revalidatePath("/os");
  revalidatePath("/audit");
  if (slug) revalidatePath(`/modules/${slug}`);
}

export async function runModuleAction(formData: FormData) {
  await ensureSeeded();
  const slug = String(formData.get("slug") ?? "");
  await executeLoop(prisma, slug, "human");
  await refresh(slug);
}

export async function tickAction() {
  await ensureSeeded();
  const result = await tickSim(prisma);
  await refresh(result.refused ? undefined : result.slug);
}

export async function killAction(formData: FormData) {
  await ensureSeeded();
  await setKill(prisma, formData.get("on") === "true");
  await refresh();
}

export async function rollbackAction(formData: FormData) {
  await ensureSeeded();
  const slug = String(formData.get("slug") ?? "");
  await rollbackModule(prisma, slug);
  await refresh(slug);
}

export async function gateAction(formData: FormData) {
  await ensureSeeded();
  const slug = String(formData.get("slug") ?? "");
  await resolveGate(prisma, slug, formData.get("approve") === "true");
  await refresh(slug);
}

export async function governanceAction(formData: FormData) {
  await ensureSeeded();
  const id = String(formData.get("id") ?? "");
  const verdict = formData.get("verdict") === "approved_by_human" ? "approved_by_human" : "rejected";
  await decideGovernance(prisma, id, verdict);
  await refresh("governance-twin");
}
