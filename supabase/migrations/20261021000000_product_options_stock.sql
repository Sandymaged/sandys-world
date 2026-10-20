-- اختيارات المنتج (لون، مقاس، ريحة) ومخزون لكل منتج ولكل اختيار.
-- options: [{ id, name, en, kind, values: [{ id, label, en, color, priceDelta, available, stock }] }]
-- stock (موجود من الأول): للمنتج اللي ملوش اختيارات؛ null = مفتوح.

alter table products add column options jsonb not null default '[]';

-- العميل محتاج يشوف الاختيارات والمخزون (عشان «خلص»)، والتكلفة فاضلة مخفية
grant select (options, stock) on products to anon, authenticated;

-- تعديل المخزون في عملية واحدة: p_delta بالسالب وقت الطلب وبالموجب لو اتلغى.
-- p_option = null يبقى على المنتج نفسه. بترجع false لو العدد مش كفاية.
create or replace function adjust_stock(p_product uuid, p_option text, p_value text, p_delta int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  opts jsonb;
  oi int;
  vi int;
  cur jsonb;
  s int;
begin
  if p_option is null then
    update products set stock = stock + p_delta
     where id = p_product and stock is not null and stock + p_delta >= 0;
    if found then
      return true;
    end if;
    -- المنتج من غير عدد (مفتوح) يبقى تمام، غير كده المخزون مش كفاية
    return exists (select 1 from products where id = p_product and stock is null);
  end if;

  select options into opts from products where id = p_product for update;
  if opts is null then
    return false;
  end if;
  for oi in 0 .. jsonb_array_length(opts) - 1 loop
    if opts -> oi ->> 'id' = p_option then
      for vi in 0 .. jsonb_array_length(opts -> oi -> 'values') - 1 loop
        if opts -> oi -> 'values' -> vi ->> 'id' = p_value then
          cur := opts -> oi -> 'values' -> vi -> 'stock';
          if cur is null or jsonb_typeof(cur) = 'null' then
            return true;
          end if;
          s := (cur #>> '{}')::int + p_delta;
          if s < 0 then
            return false;
          end if;
          update products
             set options = jsonb_set(opts, array[oi::text, 'values', vi::text, 'stock'], to_jsonb(s))
           where id = p_product;
          return true;
        end if;
      end loop;
    end if;
  end loop;
  return false;
end;
$$;

revoke all on function adjust_stock(uuid, text, text, int) from public, anon, authenticated;
