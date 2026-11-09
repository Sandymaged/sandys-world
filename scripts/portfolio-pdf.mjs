// ملفات البراندات (العرض، واتفاق الشغل، وخطة المواسم): بيملى بيانات التواصل من «الدفع والتواصل» في اللوحة، ويطلّع PDF.
// التشغيل: node scripts/portfolio-pdf.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "docs", "portfolio");

// متغيرات .env.local
for (const line of existsSync(join(root, ".env.local")) ? readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/) : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

async function loadContact() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {};
  const { data, error } = await createClient(url, key, { auth: { persistSession: false } })
    .from("settings").select("value").eq("key", "contact").maybeSingle();
  if (error) throw new Error(`مقدرتش أقرا بيانات التواصل: ${error.message}`);
  return data?.value ?? {};
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const contact = await loadContact();
const shown = {
  whatsapp: contact.whatsapp || "",
  instagram: contact.instagram ? `@${contact.instagram}` : "",
  website: (contact.website || "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
};
const missing = Object.keys(shown).filter((k) => !shown[k]);

// الخانة اللي ليها قيمة بتتكتب. في قايمة التواصل (dt/dd) الفاضية بتتشال، وفي أي مكان تاني بتفضل بالأصفر تتكتب بالإيد
function fillContact(html) {
  const filled = (k) => `<span data-contact="${k}">${escape(shown[k])}</span>`;
  return html
    .replace(
      /<dt>[^<]*<\/dt><dd><span class="fill" data-contact="(\w+)">[^<]*<\/span><\/dd>\s*/g,
      (whole, k) => (shown[k] ? whole.replace(/<span class="fill" data-contact="\w+">[^<]*<\/span>/, filled(k)) : ""),
    )
    .replace(/<dl>\s*<\/dl>/g, "")
    .replace(/<span class="fill" data-contact="(\w+)">[^<]*<\/span>/g, (whole, k) => (shown[k] ? filled(k) : whole));
}

// الملفات: ملف البراندات بالعربي والإنجليزي، واتفاق الشغل وخطة المواسم بالعربي
const docs = [
  { name: "giftful-brands", langs: ["ar", "en"] },
  { name: "giftful-agreement", langs: [null] },
  { name: "giftful-plan", langs: [null] },
];

const chrome = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!chrome) throw new Error("مش لاقي Chrome أو Edge. حط مكانه في CHROME_PATH");

const tmp = mkdtempSync(join(tmpdir(), "giftful-portfolio-"));
try {
  for (const doc of docs) {
    const page = join(tmp, `${doc.name}.html`);
    writeFileSync(page, fillContact(readFileSync(join(dir, `${doc.name}.html`), "utf8")));
    for (const lang of doc.langs) {
      const out = join(dir, lang ? `${doc.name}-${lang}.pdf` : `${doc.name}.pdf`);
      execFileSync(chrome, [
        "--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000",
        `--user-data-dir=${join(tmp, "profile")}`, `--print-to-pdf=${out}`, pathToFileURL(page).href + (lang ? `?lang=${lang}` : ""),
      ], { stdio: "ignore", timeout: 90_000 });
      console.log("اتعمل:", out);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (missing.length) console.log("لسه فاضي في اللوحة (مش ظاهر في الـ PDF):", missing.join("، "));
