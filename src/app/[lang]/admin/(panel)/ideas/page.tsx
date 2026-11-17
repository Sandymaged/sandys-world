import { ActionForm, ConfirmButton } from "@/components/admin/action-form";
import { Field, Row, Section } from "@/components/admin/form";
import { Empty } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin-auth";
import { ideaStatuses, loadIdeas, type Idea } from "@/lib/ideas";
import { addIdeaAction, deleteIdeaAction, updateIdeaAction } from "@/lib/ideas-actions";

export const instant = false;

export const metadata = { title: "الأفكار" };

const groups = ["للعملاء", "للبراندات", "التسويق", "التشغيل", "عام"];

function StatusSelect({ id, value }: { id: string; value: Idea["status"] }) {
  return (
    <div>
      <label className="label" htmlFor={id}>الحالة</label>
      <select id={id} name="status" defaultValue={value} className="field">
        {ideaStatuses.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

function GroupInput({ id, value }: { id: string; value: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>المجموعة</label>
      <input id={id} name="group" list="idea-groups" defaultValue={value} className="field" placeholder="للعملاء" />
    </div>
  );
}

/** دفتر الأفكار: تسجّلي فيه أي فكرة ترجعيلها بعدين، وتغيّري حالتها لما تتعمل */
export default async function IdeasPage() {
  await requireAdmin();
  const list = await loadIdeas();
  const tone = (s: Idea["status"]) => ideaStatuses.find((x) => x.id === s) ?? ideaStatuses[0];
  // المفتوحة الأول، واللي اتعملت أو اتلغت في الآخر
  const order = (s: Idea["status"]) => ["doing", "planned", "idea", "done", "dropped"].indexOf(s);
  const sorted = [...list].sort((a, b) => order(a.status) - order(b.status));
  const counts = ideaStatuses.map((s) => ({ ...s, n: list.filter((x) => x.status === s.id).length })).filter((s) => s.n > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl text-brand">الأفكار</h1>
        <p className="mt-1 text-sm text-muted">سجّل أي فكرة لترجع لها لاحقاً، وغيّر حالتها عند تنفيذها. لا يراها أحد غيرك.</p>
        {counts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {counts.map((s) => (
              <span key={s.id} className={`chip border-transparent ${s.tone}`}>
                {s.label}: <b className="tabular ms-1">{s.n}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      <datalist id="idea-groups">
        {groups.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      <Section title="فكرة جديدة">
        <ActionForm action={addIdeaAction} submitLabel="إضافة الفكرة" doneLabel="تمت الإضافة ✓" resetOnSuccess>
          <Field label="الفكرة" name="title" required placeholder="مثلاً: خصم لأول طلب" />
          <div>
            <label className="label" htmlFor="new-details">التفاصيل (اختياري)</label>
            <textarea id="new-details" name="details" rows={3} className="field h-auto py-3" />
          </div>
          <Row>
            <GroupInput id="new-group" value="" />
            <StatusSelect id="new-status" value="idea" />
          </Row>
        </ActionForm>
      </Section>

      {sorted.length === 0 ? (
        <Empty>لا توجد أفكار بعد.</Empty>
      ) : (
        <ul className="space-y-3">
          {sorted.map((it) => (
            <li key={it.id} className={`bg-[#fffdf8] p-4 shadow-[0_12px_22px_-16px_rgb(60_20_25/0.5)] ${it.status === "done" || it.status === "dropped" ? "opacity-75" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone(it.status).tone}`}>{tone(it.status).label}</span>
                <span className="chip border-line bg-bg text-xs text-ink-2">{it.group}</span>
                <span className="min-w-0 flex-1 font-semibold">{it.title}</span>
              </div>
              {it.details && <p className="mt-2 text-sm leading-7 text-ink-2">{it.details}</p>}
              {it.progress && (
                <p className="mt-2 rounded-xl bg-bg px-3 py-2 text-sm leading-6 text-ink-2">
                  <b className="text-ink">المنفّذ حتى الآن: </b>
                  {it.progress}
                </p>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-brand underline-offset-4 hover:underline">تعديل أو تغيير الحالة</summary>
                <div className="mt-3 border-t border-dashed border-line pt-4">
                  <ActionForm action={updateIdeaAction.bind(null, it.id)} submitLabel="حفظ">
                    <Field label="الفكرة" name="title" defaultValue={it.title} required />
                    <div>
                      <label className="label" htmlFor={`d-${it.id}`}>التفاصيل</label>
                      <textarea id={`d-${it.id}`} name="details" rows={3} defaultValue={it.details} className="field h-auto py-3" />
                    </div>
                    <div>
                      <label className="label" htmlFor={`p-${it.id}`}>المنفّذ حتى الآن</label>
                      <textarea id={`p-${it.id}`} name="progress" rows={2} defaultValue={it.progress} className="field h-auto py-3" />
                    </div>
                    <Row>
                      <GroupInput id={`g-${it.id}`} value={it.group} />
                      <StatusSelect id={`s-${it.id}`} value={it.status} />
                    </Row>
                  </ActionForm>
                  <div className="mt-3">
                    <ConfirmButton action={deleteIdeaAction.bind(null, it.id)} confirm="حذف هذه الفكرة؟" label="حذف الفكرة" />
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
