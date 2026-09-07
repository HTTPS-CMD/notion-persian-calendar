# تقویم شمسی Notion

این پروژه یک تقویم جلالی فارسی است که اطلاعات را از Database فعلی Notion می‌خواند و داخل صفحه Notion با Embed نمایش داده می‌شود.

## امکانات

- تقویم کاملاً شمسی و راست‌چین
- اتصال به Database فعلی Notion
- نمایش فقط آیتم‌هایی که Status آنها `ارسال شده` است
- وقتی Status از `ارسال شده` به `Completed` تغییر کند، آیتم از تقویم ناپدید می‌شود؛ خود Page در Notion حذف نمی‌شود.
- کلیک روی هر محتوا، صفحه همان محتوا در Notion را باز می‌کند.
- بروزرسانی خودکار پیش‌فرض هر ۳۰ ثانیه
- مناسب برای Deploy روی Vercel

## 1) نصب

```bash
npm install
```

## 2) تنظیم Environment Variables

فایل `.env.example` را به `.env.local` تبدیل کن و مقادیر را پر کن.

مقادیر پیش‌فرض بر اساس Database داخل اسکرین‌شات تو هستند:

- `Post`
- `Date 1`
- `Status8`
- `Type`
- `Topic`

اگر نام Propertyها متفاوت است، فقط مقدار Environment Variable را عوض کن.

## 3) Notion Integration

در Notion:
Settings & members → Integrations → New integration

Integration را بساز.

بعد داخل Database موردنظر:
سه‌نقطه Database → Connections / Add connections → Integration خودت را انتخاب کن.

بدون این دسترسی، API نمی‌تواند محتوا را بخواند.

## 4) گرفتن Database ID

URL صفحه Database را باز کن. رشته طولانی شناسه Database را بردار و در:

```env
NOTION_DATABASE_ID=...
```

قرار بده.

## 5) اجرای محلی

```bash
npm run dev
```

سپس:

http://localhost:3000

## 6) Deploy روی Vercel

پروژه را در GitHub قرار بده و در Vercel:
New Project → Import Git Repository

Environment Variables را در Vercel اضافه کن و Deploy بزن.

در پایان آدرسی مثل این می‌گیری:

```text
https://notion-persian-calendar.vercel.app
```

## 7) Embed داخل Notion

در صفحه برنامه محتوایی Notion بنویس:

```text
/embed
```

و URL پروژه Vercel را وارد کن.

### نکته مهم درباره API

کد ابتدا API جدید Notion را امتحان می‌کند و در صورت نیاز fallback قدیمی را نیز امتحان می‌کند. اگر Workspace شما فقط یک Data Source نداشته باشد، باید `NOTION_DATABASE_ID` مطابق Database اصلی تنظیم شود.

### نکته امنیتی

`NOTION_TOKEN` را هرگز داخل کد فرانت‌اند قرار نده و در GitHub commit نکن. این مقدار فقط باید در Environment Variables سرور/Vercel باشد.
