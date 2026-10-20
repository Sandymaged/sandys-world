# المتجر — هدايا مخصصة (أسيوط)

موقع العميل ولوحة التحكم في مشروع واحد: Next.js 16 (App Router) + TypeScript + Tailwind + Supabase.
المرجع الكامل: SRS متجر الهدايا المخصصة. أرقام المتطلبات (FR-xx) مكتوبة في الكود جنب المكان اللي بينفّذها.

## التشغيل

```bash
npm install
npm run dev        # http://localhost:3000
```

من غير ملف `.env.local` الموقع بيشتغل على البيانات التجريبية في `src/lib/seed-data.ts`.

## ربط Supabase

1. اعمل مشروع على supabase.com (باسم صاحبة المتجر).
2. انسخ `.env.example` لـ `.env.local` وحط القيم من Project Settings → API.
3. شغّل `supabase/migrations/20261015000000_init.sql` في الـ SQL Editor، وبعده `supabase/seed.sql` لو عايز البيانات التجريبية.

`supabase/seed.sql` بيتولد من `seed-data.ts` بأمر `npm run db:seed-sql` — متعدلوش بإيدك.

## أماكن مهمة

| الملف | فيه إيه |
|---|---|
| `src/lib/settings.ts` | قواعد العمل (قسم 8) كقيم افتراضية؛ جدول `settings` بيغيّرها |
| `src/lib/delivery.ts` | أقرب يوم توصيل، نفس اليوم، الفترات — بتوقيت القاهرة |
| `src/lib/pricing.ts` | التغليف والتنسيق، الكوبونات، خصم الكمية |
| `src/lib/catalog.ts` | قراءة الكتالوج وإخفاء المنتج/الباكدج اللي خلص وقفل المواسم |
| `src/lib/order-quote.ts` | التحقق من الطلب وإعادة تسعيره على السيرفر |
| `src/store/cart.ts` | السلة (كل هدية ليها مستلم وميعاد) |
