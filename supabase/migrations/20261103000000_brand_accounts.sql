-- حسابات البراندات المحلية
-- الدخول نفسه بـ Supabase Auth (إيميل وكلمة سر)، والحساب مربوط بالبراند في app_metadata
-- (role = 'brand' و partner_id)، واللي بيكتبه هو السيرفر بس بالمفتاح السري.

-- حالة كل براند جوه الطلب: سلّم حاجته للمتجر إمتى، وأي منتج بلّغ إنه مش عنده
-- { "<partner_id>": { "handedAt": "...", "issues": [{ "at", "productId", "name", "note", "resolvedAt" }] } }
alter table orders add column if not exists brand_status jsonb not null default '{}'::jsonb;

-- المنتج اللي البراند ضافه بيستنى موافقة المتجر قبل ما يظهر ('pending')
alter table products add column if not exists review_status text check (review_status in ('pending'));

-- الفلوس اللي المتجر حوّلها لكل براند
create table if not exists brand_payouts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  paid_at date not null default current_date,
  method text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists brand_payouts_partner on brand_payouts (partner_id, paid_at);

-- للسيرفر بس (مفيش policies، فالمفتاح العام مش بيشوف حاجة)
alter table brand_payouts enable row level security;

-- حالة جديدة: التوصيل ماتمش (المحاولة التانية في نفس اليوم ببلاش، ويوم تاني برسوم جديدة)
alter type order_status add value if not exists 'delivery_failed' after 'out_for_delivery';

-- المخزون بيتخصم لما المتجر ينقل الطلب لـ«بيتجهز» مش وقت الطلب.
-- الطلبات القديمة كانت بتتخصم وقت ما اتعملت، فالافتراضي true، والطلب الجديد بيتعمل بـ false
alter table orders add column if not exists stock_taken boolean not null default true;
