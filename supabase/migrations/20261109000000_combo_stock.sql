-- مخزون التركيبات: المنتج اللي ليه اختيارين أو أكتر (ريحة × حجم) عدده لكل تركيبة.
-- متخزن جوه options نفسها، على أول اختيار: options[0].combos = [{ key, stock }]
-- key = "optionId=valueId|optionId=valueId" مترتبة أبجديًا؛ stock = null يبقى مفتوح.
-- من غير الـ function دي الموقع بيقرا ويكتب العمود عادي، وهي بتخلي الخصم في عملية واحدة.

create or replace function adjust_combo_stock(p_product uuid, p_key text, p_delta int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  opts jsonb;
  ci int;
  cur jsonb;
  s int;
begin
  select options into opts from products where id = p_product for update;
  if opts is null or jsonb_typeof(opts -> 0 -> 'combos') is distinct from 'array' then
    return true;
  end if;
  for ci in 0 .. jsonb_array_length(opts -> 0 -> 'combos') - 1 loop
    if opts -> 0 -> 'combos' -> ci ->> 'key' = p_key then
      cur := opts -> 0 -> 'combos' -> ci -> 'stock';
      if cur is null or jsonb_typeof(cur) = 'null' then
        return true;
      end if;
      s := (cur #>> '{}')::int + p_delta;
      if s < 0 then
        return false;
      end if;
      update products
         set options = jsonb_set(opts, array['0', 'combos', ci::text, 'stock'], to_jsonb(s))
       where id = p_product;
      return true;
    end if;
  end loop;
  -- التركيبة مش متسجلة: مفتوحة
  return true;
end;
$$;

revoke all on function adjust_combo_stock(uuid, text, int) from public, anon, authenticated;
