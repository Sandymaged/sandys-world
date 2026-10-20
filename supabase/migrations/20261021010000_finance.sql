-- الحسابات: المصاريف، وتكاليف المتجر الفعلية (توصيل، تغليف، عمولة إنستاباي)، والمرتجعات والتعويضات على الأوردر.
-- (المكسب الحقيقي = اللي دخل ناقص فلوس البراندات والتكاليف دي كلها)
-- كل ده للسيرفر بس (RLS من غير أي policy): العملاء مش بيشوفوا تكاليف المتجر.

-- مصاريف المتجر: إعلانات، إيجار، رواتب، تصوير، خامات تغليف…
create table expenses (
  id uuid primary key default gen_random_uuid(),
  spent_on date not null,
  category text not null,
  amount numeric(10,2) not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);
create index expenses_spent_on_idx on expenses (spent_on);
alter table expenses enable row level security;

-- إعدادات الحسابات: تكلفة التوصيل لكل منطقة، وتكلفة التغليف للهدية، وعمولة إنستاباي
create table finance_settings (
  key text primary key,
  value jsonb not null
);
alter table finance_settings enable row level security;

-- مرتجعات وتعويضات وفلوس رجعت للعميل: [{ at, kind, amount, reason }]
alter table orders add column refunds jsonb not null default '[]';

-- مقاسات البوكسات: صورة لشكل البوكس ووصف قصير (بيتضافوا من اللوحة)
alter table box_sizes add column image text, add column description text;
alter table box_sizes add column is_active boolean not null default true;

-- الشات بين المتجر والعميل جوه كل طلب: [{ id, at, from: "store" | "customer", body }]
-- ومعاه آخر مرة كل طرف قرا فيها، عشان «رسالة جديدة» تظهر
alter table orders
  add column messages jsonb not null default '[]',
  add column store_read_at timestamptz,
  add column customer_read_at timestamptz;
