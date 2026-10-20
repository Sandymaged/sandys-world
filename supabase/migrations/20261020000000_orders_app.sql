-- اللي الموقع محتاجه عشان يحفظ الأوردر كامل زي ما بيتعرض:
-- لغة العميل، والهدايا بكل تفاصيلها (المستلم والميعاد والكارت والمنتجات بأسعار وقت الطلب)، وسجل الحالات.
-- الجداول المفصلة (order_gifts / gift_items) فاضلة للتقارير وحسابات الشركاء بعدين.

alter table orders
  add column locale text not null default 'ar' check (locale in ('ar', 'en')),
  add column gifts jsonb not null default '[]',
  add column history jsonb not null default '[]';

create index orders_tracking_token_idx on orders (tracking_token);

-- استخدام كوبون: بيزوّد العداد في عملية واحدة
create or replace function use_coupon(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update coupons set used_count = used_count + 1 where code = p_code
$$;

revoke all on function use_coupon(text) from public, anon, authenticated;
