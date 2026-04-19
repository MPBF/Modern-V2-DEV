# Orphan Rows Audit — Results (Phase 1)

**Date:** 2026-04-19
**Scope:** Required Phase-1 target columns:
`user_id, production_order_id, item_id, employee_id, machine_id, location_id,
customer_id, program_id, roll_id, section_id`.
**SQL:** `docs/audits/orphan-rows-audit.sql`
**Database:** Replit PostgreSQL (current dev env)

> Tables are checked for rows whose `*_id` columns reference a non-existent
> parent. None of these columns currently have FK constraints, so silent
> orphans are possible. One representative table per required column is
> sampled below.

## Summary

| # | Column                | Child table → Parent table              | Orphan rows |
|---|-----------------------|------------------------------------------|-------------|
| 1 | `user_id`             | `attendance` → `users.id`                | **0** ✅    |
| 2 | `production_order_id` | `rolls` → `production_orders.id`         | **0** ✅    |
| 3 | `item_id`             | `inventory` → `items.id`                 | **0** ✅    |
| 4 | `employee_id`         | `violations` → `users.id`                | **0** ✅    |
| 5 | `machine_id`          | `maintenance_requests` → `machines.id`   | **0** ✅    |
| 6 | `location_id`         | `inventory` → `locations.id`             | **0** ✅    |
| 7 | `customer_id`         | `orders` → `customers.id`                | **0** ✅    |
| 8 | `program_id`          | `training_enrollments` → `training_programs.id` | **0** ✅ |
| 9 | `roll_id`             | `cuts` → `rolls.id`                      | **0** ✅    |
|10 | `section_id`          | `users` → `sections.id`                  | **64** ⚠️   |

**Result:** 9 of 10 required relationships are clean.
One blocker for Phase-2 FK rollout: `users.section_id` → `sections.id` has
**64 orphan users** that must be reassigned or null-ed before adding the FK.

## Detail — `users.section_id` (64 orphans)

Sample row IDs (confirm with):

```sql
SELECT u.id, u.username, u.section_id
FROM users u
LEFT JOIN sections s ON s.id::text = u.section_id::text
WHERE u.section_id IS NOT NULL AND s.id IS NULL
ORDER BY u.id
LIMIT 20;
```

### Remediation options (pick one before adding FK in Phase 2)

1. **Reassign** to a real section (preferred when historical context known):
   ```sql
   UPDATE users SET section_id = '<real_section_id>'
   WHERE section_id = '<orphan_section_id>';
   ```
2. **Soft-null** orphan references:
   ```sql
   UPDATE users SET section_id = NULL
   WHERE section_id IS NOT NULL
     AND section_id::text NOT IN (SELECT id::text FROM sections);
   ```
3. **Backfill** missing sections (if business identifies them as legitimate
   sections that simply weren't seeded):
   ```sql
   INSERT INTO sections (id, name, name_ar) VALUES (...);
   ```

## Other related columns (informational, not in required-10 set)

`machines.section_id` was also scanned during exploration and is clean (0
orphans). Listed here only to confirm `section_id` issues are isolated to
`users`.

## Next step

Track FK additions under task **#9 (Add FK constraints after orphan
cleanup)**. Do **not** run `ALTER TABLE … ADD FOREIGN KEY` for
`users.section_id` until the 64 orphan rows are resolved using one of the
options above.
