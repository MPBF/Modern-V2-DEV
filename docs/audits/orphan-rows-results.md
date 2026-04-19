# تقرير الصفوف اليتيمة (Orphan Rows) — Phase 1

تاريخ التشغيل: 2026-04-19
المصدر: `docs/audits/orphan-rows-audit.sql` (تم تشغيله مقابل قاعدة بيانات التطوير الحالية).

> هذه الجداول لا تحتوي حالياً على قيود FK، فأي صف نتيجته > 0 يجب تنظيفه قبل
> إضافة قيود المفاتيح الأجنبية في Phase 2 (مهمة #9).

| # | العلاقة المفحوصة | عدد اليتامى |
|---|-------------------|-------------|
| 1 | `rolls.production_order_id → production_orders.id` | **0** |
| 2 | `production_orders.order_id → orders.id` | **0** |
| 3 | `orders.customer_id → customers.id` | **0** |
| 4 | `maintenance_requests.machine_id → machines.id` | **0** |
| 5 | `attendance.user_id → users.id` | **0** |
| 6 | `violations.employee_id → users.id` | **0** |
| 7 | `violations.reported_by → users.id` | **0** |
| 8 | `users.role_id → roles.id` | **0** |
| 9 | `users.section_id → sections.id` | **64** ⚠️ |
| 10 | `inventory_movements.inventory_id → inventory.id` | **0** |

## نتائج تستلزم تدخّل

### ⚠️ users.section_id (64 صف يتيم)

64 مستخدماً يحملون `section_id` يشير إلى قسم غير موجود في جدول `sections`.
عيّنة:

| user.id | username | section_id |
|---------|----------|------------|
| 57 | 2397698479 | 4 |
| 3 | Oscar | 1 |
| 2 | Salesman | 7 |
| 8 | 2025179223 | 2 |
| 52 | 2579878220 | 5 |

**خيارات المعالجة قبل Phase 2 (يقترَر مع المالك)**:
1. تعيين `section_id = NULL` لكل المستخدمين الذين قسمهم غير موجود.
2. إنشاء أقسام مفقودة بالأرقام المرجعية.
3. ترحيل المستخدمين إلى قسم افتراضي (مثل "غير مصنّف").

> لا يُنفّذ أي إصلاح في Phase 1 — هذا التقرير وثيقة قرار فقط. التنظيف
> الفعلي مرتبط بإضافة قيود FK في Phase 2.

## ملاحظات تشغيلية

- جدول `inventory_movements` لا يحتوي على عمود `item_id` كما كان مفترضاً
  بل `inventory_id`، وقد تم تصحيح ملف SQL ليطابق الواقع.
- يمكن إعادة تشغيل التقرير بأمان (READ-ONLY) عبر:
  ```
  psql "$DATABASE_URL" -f docs/audits/orphan-rows-audit.sql
  ```
