"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./admin-auth";
import { ideaStatuses, loadIdeas, newIdea, saveIdeas, type IdeaStatus } from "./ideas";

type Result = { ok: true } | { ok: false; error: string };

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? "").trim().slice(0, max);
const status = (v: string): IdeaStatus => (ideaStatuses.some((s) => s.id === v) ? (v as IdeaStatus) : "idea");

async function save(mutate: (list: Awaited<ReturnType<typeof loadIdeas>>) => void): Promise<Result> {
  await requireAdmin();
  try {
    const list = await loadIdeas();
    mutate(list);
    await saveIdeas(list);
  } catch (e) {
    return { ok: false, error: `تعذّر الحفظ: ${e instanceof Error ? e.message : ""}` };
  }
  revalidatePath("/[lang]/admin/ideas", "page");
  return { ok: true };
}

export async function addIdeaAction(f: FormData): Promise<Result> {
  const title = str(f, "title", 160);
  if (!title) return { ok: false, error: "اكتب الفكرة" };
  return save((list) => {
    list.unshift(newIdea({ title, details: str(f, "details"), group: str(f, "group", 40) || "عام", status: status(str(f, "status")), progress: "" }));
  });
}

export async function updateIdeaAction(id: string, f: FormData): Promise<Result> {
  const title = str(f, "title", 160);
  if (!title) return { ok: false, error: "اكتب الفكرة" };
  return save((list) => {
    const it = list.find((x) => x.id === id);
    if (!it) throw new Error("الفكرة غير موجودة");
    Object.assign(it, { title, details: str(f, "details"), group: str(f, "group", 40) || "عام", status: status(str(f, "status")), progress: str(f, "progress", 1000) });
  });
}

export async function deleteIdeaAction(id: string): Promise<Result> {
  return save((list) => {
    const i = list.findIndex((x) => x.id === id);
    if (i >= 0) list.splice(i, 1);
  });
}
