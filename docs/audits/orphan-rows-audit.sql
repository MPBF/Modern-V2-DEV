-- Phase 1 — Orphan rows audit (READ-ONLY)
-- Run with:  psql "$DATABASE_URL" -f docs/audits/orphan-rows-audit.sql
-- Goal: count rows whose *_id columns reference a non-existent parent row.
-- These tables currently have NO foreign key constraints, so silent orphans
-- are possible. This audit covers the 10 required Phase-1 target columns:
--   user_id, production_order_id, item_id, employee_id, machine_id,
--   location_id, customer_id, program_id, roll_id, section_id

\echo '== 1) user_id  : attendance.user_id -> users.id =='
SELECT COUNT(*) AS orphan_attendance_user
FROM attendance a
LEFT JOIN users u ON u.id = a.user_id
WHERE a.user_id IS NOT NULL AND u.id IS NULL;

\echo '== 2) production_order_id : rolls.production_order_id -> production_orders.id =='
SELECT COUNT(*) AS orphan_rolls_production_order
FROM rolls r
LEFT JOIN production_orders po ON po.id = r.production_order_id
WHERE r.production_order_id IS NOT NULL AND po.id IS NULL;

\echo '== 3) item_id : inventory.item_id -> items.id =='
SELECT COUNT(*) AS orphan_inventory_item
FROM inventory inv
LEFT JOIN items it ON it.id::text = inv.item_id::text
WHERE inv.item_id IS NOT NULL AND it.id IS NULL;

\echo '== 4) employee_id : violations.employee_id -> users.id =='
SELECT COUNT(*) AS orphan_violations_employee
FROM violations v
LEFT JOIN users u ON u.id = v.employee_id
WHERE v.employee_id IS NOT NULL AND u.id IS NULL;

\echo '== 5) machine_id : maintenance_requests.machine_id -> machines.id =='
SELECT COUNT(*) AS orphan_maintenance_machine
FROM maintenance_requests m
LEFT JOIN machines mc ON mc.id::text = m.machine_id::text
WHERE m.machine_id IS NOT NULL AND mc.id IS NULL;

\echo '== 6) location_id : inventory.location_id -> locations.id =='
SELECT COUNT(*) AS orphan_inventory_location
FROM inventory inv
LEFT JOIN locations loc ON loc.id::text = inv.location_id::text
WHERE inv.location_id IS NOT NULL AND loc.id IS NULL;

\echo '== 7) customer_id : orders.customer_id -> customers.id =='
SELECT COUNT(*) AS orphan_orders_customer
FROM orders o
LEFT JOIN customers c ON c.id::text = o.customer_id::text
WHERE o.customer_id IS NOT NULL AND c.id IS NULL;

\echo '== 8) program_id : training_enrollments.program_id -> training_programs.id =='
SELECT COUNT(*) AS orphan_training_enrollments_program
FROM training_enrollments te
LEFT JOIN training_programs tp ON tp.id = te.program_id
WHERE te.program_id IS NOT NULL AND tp.id IS NULL;

\echo '== 9) roll_id : cuts.roll_id -> rolls.id =='
SELECT COUNT(*) AS orphan_cuts_roll
FROM cuts c
LEFT JOIN rolls r ON r.id = c.roll_id
WHERE c.roll_id IS NOT NULL AND r.id IS NULL;

\echo '== 10) section_id : users.section_id -> sections.id =='
SELECT COUNT(*) AS orphan_users_section
FROM users u
LEFT JOIN sections s ON s.id::text = u.section_id::text
WHERE u.section_id IS NOT NULL AND s.id IS NULL;

\echo '== Done. Counts > 0 must be cleaned BEFORE Phase 2 adds FK constraints. =='
