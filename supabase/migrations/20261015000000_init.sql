-- نموذج البيانات (قسم 10 من الـ SRS)
-- أهم قرار: الأوردر بيتقسم لهدايا، وكل هدية ليها مستلم وعنوان وميعاد توصيل خاص بيها.

create extension if not exists pgcrypto;

-- ───────────── الأنواع ─────────────
create type staff_role as enum ('admin', 'prep', 'driver');
create type package_tier as enum ('latif', 'momayaz', 'fakher');
create type zone_kind as enum ('city', 'markaz', 'governorate');
create type delivery_period as enum ('morning', 'afternoon', 'evening');
create type gift_kind as enum ('package', 'box', 'product', 'kit');
create type payment_method as enum ('instapay', 'cod');
create type payment_status as enum ('awaiting_proof', 'awaiting_confirmation', 'confirmed', 'rejected', 'cod');
create type order_status as enum (
  'awaiting_payment',          -- مستني تأكيد الدفع
  'new',                       -- جديد
  'awaiting_design_approval',  -- مستني موافقة التصميم
  'preparing',                 -- بيتجهز
  'ready',                     -- جاهز
  'out_for_delivery',          -- خرج للتوصيل
  'delivered',                 -- اتسلم
  'cancelled'                  -- ملغي
);
create type special_kind as enum ('idea', 'wedding', 'corporate');
create type special_status as enum ('new', 'quoted', 'confirmed', 'in_progress', 'delivered', 'rejected');
create type coupon_kind as enum ('percent', 'amount');
create type quote_status as enum ('pending', 'approved', 'changes_requested', 'expired');

-- ───────────── الموظفين والصلاحيات ─────────────
create table staff (
  user_id uuid primary key references auth.users on delete cascade,
  name text not null,
  role staff_role not null,
  created_at timestamptz not null default now()
);

create or replace function staff_role_of(uid uuid) returns staff_role
language sql stable security definer set search_path = public as $$
  select role from staff where user_id = uid
$$;

create or replace function is_admin() returns boolean
language sql stable as $$ select staff_role_of(auth.uid()) = 'admin' $$;

create or replace function is_staff() returns boolean
language sql stable as $$ select staff_role_of(auth.uid()) is not null $$;

-- ───────────── الإعدادات (قواعد العمل في قسم 8) ─────────────
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ───────────── الكتالوج ─────────────
create table occasions (
  slug text primary key,
  name text not null,
  image text,
  sort int not null default 0
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  story text,
  city text,
  instagram text,
  cover text,
  is_public boolean not null default true, -- صفحة البراند ظاهرة للعملاء
  contact_phone text,
  contact_notes text,
  commission_rate numeric(4,3) not null check (commission_rate between 0 and 1),
  settlement text, -- طريقة المحاسبة
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  images text[] not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  cost numeric(10,2) not null default 0 check (cost >= 0),
  category text not null default '',
  partner_id uuid references partners on delete set null,
  brand text,
  -- التاجات من أول يوم عشان مساعد الهدايا (قسم 7)
  occasions text[] not null default '{}',
  recipients text[] not null default '{}',
  interests text[] not null default '{}',
  is_customizable boolean not null default false,
  customization_max_chars int,
  prep_days int not null default 0 check (prep_days >= 0),
  stock int,
  is_available boolean not null default true,
  is_addon boolean not null default false,
  box_eligible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products using gin (occasions);
create index on products using gin (recipients);

create table seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  occasion_slug text references occasions on delete set null,
  occasion_date date not null,
  custom_deadline timestamptz not null,
  ready_deadline timestamptz not null,
  visible_from timestamptz not null,
  visible_until timestamptz not null,
  banner_title text,
  banner_subtitle text,
  banner_image text
);

create table packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  images text[] not null default '{}',
  tier package_tier not null,
  price numeric(10,2) not null check (price >= 0),
  season_id uuid references seasons on delete set null,
  occasions text[] not null default '{}',
  recipients text[] not null default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table package_items (
  package_id uuid not null references packages on delete cascade,
  product_id uuid not null references products on delete restrict,
  quantity int not null default 1 check (quantity > 0),
  primary key (package_id, product_id)
);

-- سِتات ثابتة بسعر للفرد: كيتات الورش مع الصحاب، وبوكسات العروسة والإشبينات
create table kits (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'workshop' check (category in ('workshop', 'bridal')),
  role text check (role in ('bride', 'bridesmaid', 'mother', 'flower-girl')),
  slug text not null unique,
  name text not null,
  tagline text,
  description text not null default '',
  images text[] not null default '{}',
  price_per_person numeric(10,2) not null check (price_per_person >= 0),
  min_people int not null default 3,
  max_people int not null default 25,
  contents text[] not null default '{}',
  duration text,
  prep_days int not null default 2,
  is_available boolean not null default true,
  sort int not null default 0
);

create table box_sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  max_items int not null check (max_items > 0),
  sort int not null default 0
);

-- ───────────── التوصيل ─────────────
create table zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind zone_kind not null,
  fee numeric(10,2) not null,
  same_day boolean not null default false,
  extra_days int not null default 0,
  sort int not null default 0,
  is_active boolean not null default true
);

-- سعة كل فترة في يوم معين. لو مفيش صف، السعة = الافتراضي من الإعدادات
create table delivery_slots (
  date date not null,
  period delivery_period not null,
  capacity int not null check (capacity >= 0),
  booked int not null default 0 check (booked >= 0),
  is_closed boolean not null default false,
  primary key (date, period)
);

-- ───────────── العملاء والمستلمين ─────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users on delete set null,
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);
create index on customers (phone);

create table recipients (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers on delete set null,
  name text not null,
  phone text not null,
  zone_id uuid not null references zones,
  address text not null,
  landmark text,
  location_url text,
  created_at timestamptz not null default now()
);

-- ───────────── الخصومات ─────────────
create table coupons (
  code text primary key check (code = upper(code)),
  kind coupon_kind not null,
  value numeric(10,2) not null check (value > 0),
  min_order numeric(10,2) not null default 0,
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  is_active boolean not null default true
);

-- ───────────── الأوردرات ─────────────
create sequence order_number_seq start 1001;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number int not null unique default nextval('order_number_seq'),
  customer_id uuid references customers on delete set null,
  sender_name text not null,
  sender_phone text not null,
  sender_email text,
  status order_status not null default 'awaiting_payment',
  payment_method payment_method not null,
  payment_status payment_status not null,
  transfer_reference text,
  payment_proof_path text,           -- في bucket خاص (payment-proofs)
  payment_due_at timestamptz,        -- بعده الطلب بيتلغي تلقائياً (8.3)
  payment_confirmed_by uuid references staff(user_id),
  payment_confirmed_at timestamptz,
  payment_rejection_reason text,
  coupon_code text references coupons on delete set null,
  items_total numeric(10,2) not null,
  packaging_total numeric(10,2) not null default 0,
  delivery_total numeric(10,2) not null default 0,
  discount_total numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  source text,                       -- العميل عرفنا منين
  tracking_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz not null default now()
);
create index on orders (status);
create index on orders (sender_phone);

create table order_gifts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  kind gift_kind not null,
  package_id uuid references packages,
  box_size_id uuid references box_sizes,
  kit_id uuid references kits,
  people int,                        -- للكيتات: عدد الأفراد
  names text,                        -- للكيتات: الأسماء على الكروت
  recipient_id uuid not null references recipients,
  zone_id uuid not null references zones,
  delivery_date date not null,
  delivery_period delivery_period not null,
  delivery_fee numeric(10,2) not null,
  base_price numeric(10,2) not null default 0,
  packaging_fee numeric(10,2) not null default 0,
  card_message varchar(250),
  hide_price boolean not null default true,
  surprise boolean not null default false,
  wants_delivery_photo boolean not null default true,
  design_image_path text,
  ready_photo_path text,             -- صورة الهدية قبل الخروج
  delivery_photo_path text,          -- صورة التسليم
  driver_id uuid references staff(user_id),
  status order_status not null default 'new',
  delivered_at timestamptz
);
create index on order_gifts (delivery_date, delivery_period);
create index on order_gifts (order_id);

-- السعر بيتسجل وقت الطلب، عشان تغيير السعر بعدين ميغيرش أوردرات قديمة ولا حسابات الشركاء
create table gift_items (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references order_gifts on delete cascade,
  product_id uuid not null references products,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  unit_cost numeric(10,2) not null default 0,
  partner_id uuid references partners,
  commission_rate numeric(4,3),
  is_addon boolean not null default false,
  customization_text text,
  customization_image_path text      -- في bucket خاص (customizations)
);
create index on gift_items (partner_id);

-- ───────────── الطلبات الخاصة وعروض الأسعار ─────────────
create table special_requests (
  id uuid primary key default gen_random_uuid(),
  kind special_kind not null,
  contact_name text not null,
  contact_phone text not null,
  details jsonb not null default '{}',
  images text[] not null default '{}',
  due_date date,
  status special_status not null default 'new',
  final_price numeric(10,2),
  deposit numeric(10,2),
  order_id uuid references orders on delete set null,
  created_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  special_request_id uuid not null references special_requests on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  deposit numeric(10,2) not null,
  design_image_path text,
  approval_status quote_status not null default 'pending',
  customer_feedback text,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────── سجل التعديلات (NFR-12) ─────────────
create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  entity text not null,
  entity_id text not null,
  action text not null,
  changes jsonb,
  at timestamptz not null default now()
);

create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (actor, entity, entity_id, action, changes)
  values (
    auth.uid(),
    tg_table_name,
    coalesce(new.id, old.id)::text,
    lower(tg_op),
    case when tg_op = 'UPDATE' then jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
         when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger audit_orders after update or delete on orders for each row execute function log_change();
create trigger audit_order_gifts after update or delete on order_gifts for each row execute function log_change();
create trigger audit_products after insert or update or delete on products for each row execute function log_change();
create trigger audit_packages after insert or update or delete on packages for each row execute function log_change();

-- ───────────── حجز فترة التوصيل (FR-52) ─────────────
-- بتزوّد المحجوز لو فيه مكان، في عملية واحدة عشان طلبين ميخدوش آخر مكان مع بعض
create or replace function reserve_delivery_slot(p_date date, p_period delivery_period)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  default_capacity int := coalesce((select (value)::int from settings where key = 'defaultSlotCapacity'), 8);
  ok boolean;
begin
  insert into delivery_slots (date, period, capacity)
  values (p_date, p_period, default_capacity)
  on conflict do nothing;

  update delivery_slots
     set booked = booked + 1
   where date = p_date and period = p_period
     and not is_closed and booked < capacity
  returning true into ok;

  return coalesce(ok, false);
end $$;

create or replace function release_delivery_slot(p_date date, p_period delivery_period)
returns void
language sql security definer set search_path = public as $$
  update delivery_slots set booked = greatest(0, booked - 1)
   where date = p_date and period = p_period
$$;

revoke execute on function reserve_delivery_slot, release_delivery_slot from public, anon, authenticated;

-- ───────────── الترجمة الإنجليزي ─────────────
-- كل جدول بيتعرض للعميل ليه عمود en فيه الحقول الإنجليزي (name, description, ...)
alter table occasions add column en jsonb;
alter table partners add column en jsonb;
alter table products add column en jsonb;
alter table packages add column en jsonb;
alter table kits add column en jsonb;
alter table seasons add column en jsonb;
alter table box_sizes add column en jsonb;
alter table zones add column en jsonb;

-- ───────────── RLS ─────────────
alter table staff enable row level security;
alter table settings enable row level security;
alter table occasions enable row level security;
alter table partners enable row level security;
alter table products enable row level security;
alter table seasons enable row level security;
alter table packages enable row level security;
alter table package_items enable row level security;
alter table box_sizes enable row level security;
alter table kits enable row level security;
alter table zones enable row level security;
alter table delivery_slots enable row level security;
alter table customers enable row level security;
alter table recipients enable row level security;
alter table coupons enable row level security;
alter table orders enable row level security;
alter table order_gifts enable row level security;
alter table gift_items enable row level security;
alter table special_requests enable row level security;
alter table quotes enable row level security;
alter table audit_log enable row level security;

-- الكتالوج: قراءة عامة، والتعديل للأدمن بس
create policy "public read" on occasions for select using (true);
create policy "public read" on seasons for select using (true);
create policy "public read" on packages for select using (true);
create policy "public read" on package_items for select using (true);
create policy "public read" on box_sizes for select using (true);
create policy "public read" on kits for select using (true);
create policy "public read" on zones for select using (true);
create policy "public read" on delivery_slots for select using (true);
create policy "public read" on settings for select using (true);
-- البراندات: الصفحة العامة بس، من غير العمولة وبيانات التواصل
create policy "public read" on partners for select using (is_public);
revoke select on partners from anon, authenticated;
grant select (id, slug, name, tagline, story, city, instagram, cover, is_public, en) on partners to anon, authenticated;
-- المنتجات: كل الأعمدة ماعدا التكلفة (الصلاحية على مستوى العمود تحت)
create policy "public read" on products for select using (true);
revoke select on products from anon, authenticated;
grant select (id, slug, name, description, images, price, category, partner_id, brand, occasions, recipients,
  interests, is_customizable, customization_max_chars, prep_days, is_available, is_addon, box_eligible,
  created_at, updated_at, en) on products to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['occasions','seasons','packages','package_items','box_sizes','kits','zones','delivery_slots',
                           'settings','products','partners','coupons','staff']
  loop
    execute format('create policy "admin all" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- الأدمن بيشوف التكلفة (عن طريق السيرفر بـ service role أو view خاص بعدين)
create policy "staff read self" on staff for select using (user_id = auth.uid());

-- بيانات العملاء والأوردرات: الموظفين بس (NFR-06). العميل بيطلب ويتابع عن طريق السيرفر.
create policy "staff read" on customers for select using (is_staff());
create policy "staff read" on recipients for select using (is_staff());
create policy "staff read" on orders for select using (is_staff());
create policy "staff read" on order_gifts for select using (
  staff_role_of(auth.uid()) in ('admin', 'prep') or driver_id = auth.uid()
);
create policy "staff read" on gift_items for select using (is_staff());
create policy "admin all" on customers for all using (is_admin()) with check (is_admin());
create policy "admin all" on recipients for all using (is_admin()) with check (is_admin());
create policy "admin all" on orders for all using (is_admin()) with check (is_admin());
create policy "admin all" on order_gifts for all using (is_admin()) with check (is_admin());
create policy "admin all" on gift_items for all using (is_admin()) with check (is_admin());
create policy "prep update status" on order_gifts for update
  using (staff_role_of(auth.uid()) = 'prep') with check (staff_role_of(auth.uid()) = 'prep');
create policy "driver update own" on order_gifts for update
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy "admin all" on special_requests for all using (is_admin()) with check (is_admin());
create policy "admin all" on quotes for all using (is_admin()) with check (is_admin());
create policy "admin read" on audit_log for select using (is_admin());

-- ───────────── تخزين الصور ─────────────
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('customizations', 'customizations', false),
  ('payment-proofs', 'payment-proofs', false),
  ('order-photos', 'order-photos', false)
on conflict (id) do nothing;

create policy "public read product images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "admin write product images" on storage.objects for all
  using (bucket_id = 'product-images' and is_admin()) with check (bucket_id = 'product-images' and is_admin());
-- إثباتات التحويل: صاحبة المتجر بس (NFR-05)
create policy "admin read payment proofs" on storage.objects for select
  using (bucket_id = 'payment-proofs' and is_admin());
create policy "staff read customizations" on storage.objects for select
  using (bucket_id = 'customizations' and is_staff());
create policy "staff order photos" on storage.objects for all
  using (bucket_id = 'order-photos' and is_staff()) with check (bucket_id = 'order-photos' and is_staff());
