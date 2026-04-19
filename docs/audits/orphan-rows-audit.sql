-- Phase 1 — Orphan rows audit (READ-ONLY)
-- Run with:  psql "$DATABASE_URL" -f .local/audits/orphan-rows-audit.sql
-- Goal: count rows whose *_id columns reference a non-existent parent row.
-- These tables currently have NO foreign key constraints, so silent orphans
-- are possible. Do not run this on production with heavy traffic.

\echo '== 1) rolls.production_order_id -> production_orders.id =='
SELECT COUNT(*) AS orphan_rolls_production_order
FROM rolls r
LEFT JOIN production_orders po ON po.id = r.production_order_id
WHERE r.production_order_id IS NOT NULL AND po.id IS NULL;

\echo '== 2) production_orders.order_id -> orders.id =='
SELECT COUNT(*) AS orphan_production_orders_order
FROM production_orders po
LEFT JOIN orders o ON o.id = po.order_id
WHERE po.order_id IS NOT NULL AND o.id IS NULL;

\echo '== 3) orders.customer_id -> customers.id =='
SELECT COUNT(*) AS orphan_orders_customer
FROM orders o
LEFT JOIN customers c ON c.id::text = o.customer_id::text
WHERE o.customer_id IS NOT NULL AND c.id IS NULL;

\echo '== 4) maintenance_requests.machine_id -> machines.id =='
SELECT COUNT(*) AS orphan_maintenance_machine
FROM maintenance_requests m
LEFT JOIN machines mc ON mc.id::text = m.machine_id::text
WHERE m.machine_id IS NOT NULL AND mc.id IS NULL;

\echo '== 5) attendance.user_id -> users.id =='
SELECT COUNT(*) AS orphan_attendance_user
FROM attendance a
LEFT JOIN users u ON u.id = a.user_id
WHERE a.user_id IS NOT NULL AND u.id IS NULL;

\echo '== 6) violations.employee_id -> users.id =='
SELECT COUNT(*) AS orphan_violations_employee
FROM violations v
LEFT JOIN users u ON u.id = v.employee_id
WHERE v.employee_id IS NOT NULL AND u.id IS NULL;

\echo '== 7) violations.reported_by -> users.id =='
SELECT COUNT(*) AS orphan_violations_reporter
FROM violations v
LEFT JOIN users u ON u.id = v.reported_by
WHERE v.reported_by IS NOT NULL AND u.id IS NULL;

\echo '== 8) users.role_id -> roles.id =='
SELECT COUNT(*) AS orphan_users_role
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
WHERE u.role_id IS NOT NULL AND r.id IS NULL;

\echo '== 9) users.section_id -> sections.id =='
SELECT COUNT(*) AS orphan_users_section
FROM users u
LEFT JOIN sections s ON s.id::text = u.section_id::text
WHERE u.section_id IS NOT NULL AND s.id IS NULL;

\echo '== 10) inventory_movements.inventory_id -> inventory.id =='
SELECT COUNT(*) AS orphan_inventory_movements_inventory
FROM inventory_movements im
LEFT JOIN inventory inv ON inv.id = im.inventory_id
WHERE im.inventory_id IS NOT NULL AND inv.id IS NULL;

\echo '== Done. Counts > 0 must be cleaned BEFORE Phase 2 adds FK constraints. =='
