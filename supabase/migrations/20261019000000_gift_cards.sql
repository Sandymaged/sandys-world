-- كروت الهدايا: الشراء بيبقى أوردر عادي (من غير هدايا بتتوصل)، والكود بيتعمل لما الدفع يتأكد.
-- الكارت ليه رصيد بيتصرف منه على كذا طلب، وكل صرفة متسجلة عشان ترجع لو الطلب اتلغى.

create table gift_cards (
  code text primary key check (code ~ '^GC-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  order_id uuid not null references orders on delete restrict,
  amount numeric(10,2) not null check (amount > 0),
  balance numeric(10,2) not null check (balance >= 0 and balance <= amount),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table gift_card_uses (
  ref uuid primary key,
  code text not null references gift_cards on delete restrict,
  order_id uuid references orders on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  at timestamptz not null default now(),
  reversed boolean not null default false
);
create index gift_card_uses_code_idx on gift_card_uses (code);

-- بيانات الشراء (الشكل، المبلغ، المستلم، الرسالة، الكود) على الأوردر نفسه
alter table orders
  add column gift_card jsonb,
  add column gift_card_use jsonb,
  add column gift_card_total numeric(10,2) not null default 0;

-- الكروت ورصيدها بالسيرفر بس (service role): مفيش قراءة ولا كتابة من المتصفح
alter table gift_cards enable row level security;
alter table gift_card_uses enable row level security;

-- خصم من الرصيد في عملية واحدة (عشان طلبين في نفس اللحظة ميصرفوش نفس الرصيد)
create or replace function redeem_gift_card(p_code text, p_amount numeric, p_ref uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update gift_cards
     set balance = balance - p_amount
   where code = p_code
     and p_amount > 0
     and balance >= p_amount
     and expires_at > now()
  returning true into ok;
  if ok then
    insert into gift_card_uses (ref, code, amount) values (p_ref, p_code, p_amount);
    return true;
  end if;
  return false;
end;
$$;

-- إرجاع اللي اتصرف لو الطلب اتلغى (مرة واحدة بس لكل صرفة)
create or replace function restore_gift_card(p_code text, p_ref uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  amt numeric;
begin
  update gift_card_uses set reversed = true
   where ref = p_ref and code = p_code and not reversed
  returning amount into amt;
  if amt is not null then
    update gift_cards set balance = balance + amt where code = p_code;
  end if;
end;
$$;

revoke all on function redeem_gift_card(text, numeric, uuid) from public, anon, authenticated;
revoke all on function restore_gift_card(text, uuid) from public, anon, authenticated;
