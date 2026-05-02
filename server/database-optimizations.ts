import { sql } from "drizzle-orm";

import { db } from "./db";

/**
 * Database optimization utilities to improve query performance
 */

export async function createPerformanceIndexes(): Promise<void> {
  try {
    console.log("[DB Optimization] Creating performance indexes...");

    // Index for production orders queries (commonly filtered by status and order_id)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_status_order_id
      ON production_orders (status, order_id);
    `);

    // Index for production orders date-based queries
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_created_at
      ON production_orders (created_at DESC);
    `);

    // Index for rolls stage queries (frequently used in production queues)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rolls_stage_status
      ON rolls (stage, status);
    `);

    // Index for rolls production order relationship
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rolls_production_order_id
      ON rolls (production_order_id);
    `);

    // Index for orders enhanced search (customer_id, status, created_at)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_status_date
      ON orders (customer_id, status, created_at DESC);
    `);

    // Index for orders search by number (frequently searched)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_number_gin
      ON orders USING GIN (order_number gin_trgm_ops);
    `);

    // Index for customer products queries
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_products_customer_id
      ON customer_products (customer_id);
    `);

    // Index for notifications (recipient_id and created_at for recent notifications)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_recipient_created
      ON notifications (recipient_id, created_at DESC);
    `);

    // Index for notifications status (unread notifications)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_status
      ON notifications (status);
    `);

    // Partial unique index enforcing a single default packaging unit per item.
    // Mirrors migrations/0003_packaging_units_default_unique.sql so existing
    // databases (where the SQL migration may not have been applied) still
    // get the constraint created on startup.
    try {
      await db.execute(sql`
        UPDATE "packaging_units" AS pu
        SET "is_default" = false
        WHERE pu."is_default" = true
          AND pu."id" <> (
            SELECT MIN(pu2."id")
            FROM "packaging_units" AS pu2
            WHERE pu2."item_id" = pu."item_id"
              AND pu2."is_default" = true
          );
      `);
      await db.execute(sql`
        CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "uniq_packaging_units_default_per_item"
        ON "packaging_units" ("item_id")
        WHERE "is_default" = true;
      `);
    } catch (puErr) {
      console.error(
        "[DB Optimization] Failed to ensure packaging_units default uniqueness:",
        puErr,
      );
    }

    console.log("[DB Optimization] Performance indexes created successfully");
  } catch (error) {
    console.error("[DB Optimization] Error creating indexes:", error);
    // Don't throw - indexes might already exist
  }
}

export async function createTextSearchIndexes(): Promise<void> {
  try {
    console.log("[DB Optimization] Creating text search indexes...");

    // Enable trigram extension for better text search
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Text search index for customers (name searches)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name_gin
      ON customers USING GIN ((name || ' ' || COALESCE(name_ar, '')) gin_trgm_ops);
    `);

    // Text search index for items (name searches)
    await db.execute(sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_items_name_gin
      ON items USING GIN ((name || ' ' || COALESCE(name_ar, '')) gin_trgm_ops);
    `);

    console.log("[DB Optimization] Text search indexes created successfully");
  } catch (error) {
    console.error(
      "[DB Optimization] Error creating text search indexes:",
      error,
    );
  }
}

export async function optimizeDatabase(): Promise<void> {
  try {
    console.log("[DB Optimization] Running database optimization...");

    // Update table statistics
    await db.execute(sql`ANALYZE;`);

    // Vacuum frequently updated tables
    await db.execute(sql`VACUUM ANALYZE production_orders;`);
    await db.execute(sql`VACUUM ANALYZE rolls;`);
    await db.execute(sql`VACUUM ANALYZE notifications;`);

    console.log("[DB Optimization] Database optimization completed");
  } catch (error) {
    console.error("[DB Optimization] Error optimizing database:", error);
  }
}

export async function getQueryPerformanceStats(): Promise<any> {
  try {
    // Get slow query statistics
    const slowQueries = await db.execute(sql`
      SELECT query, calls, total_time, mean_time, rows
      FROM pg_stat_statements 
      WHERE mean_time > 100 
      ORDER BY mean_time DESC 
      LIMIT 10;
    `);

    // Get table statistics
    const tableStats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        seq_scan as sequential_scans,
        idx_scan as index_scans
      FROM pg_stat_user_tables 
      ORDER BY seq_scan DESC;
    `);

    return {
      slowQueries: slowQueries.rows || [],
      tableStats: tableStats.rows || [],
    };
  } catch (error) {
    console.error("[DB Optimization] Error getting performance stats:", error);
    return { slowQueries: [], tableStats: [] };
  }
}
