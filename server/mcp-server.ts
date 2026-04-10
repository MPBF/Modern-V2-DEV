import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "./db";
import { sql, eq, and, desc, gte, lte, type SQL } from "drizzle-orm";
import {
  orders,
  production_orders,
  rolls,
  customers,
  machines,
  maintenance_requests,
  attendance,
  inventory,
  items,
  quality_issues,
} from "@shared/schema";

function buildWhere(conditions: SQL[]): SQL | undefined {
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function createMcpServer() {
  const server = new McpServer(
    {
      name: "MPBF Factory Management",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.tool(
    "get_dashboard_stats",
    "Get factory dashboard statistics including order counts, production stats, machine status, and inventory overview",
    {},
    async () => {
      const orderRows = await db.select({ count: sql<number>`count(*)`, status: orders.status }).from(orders).groupBy(orders.status);
      const prodRows = await db.select({ count: sql<number>`count(*)`, status: production_orders.status }).from(production_orders).groupBy(production_orders.status);
      const machineRows = await db.select({ count: sql<number>`count(*)`, status: machines.status }).from(machines).groupBy(machines.status);
      const rollCount = await db.select({ count: sql<number>`count(*)` }).from(rolls);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              orders_by_status: orderRows,
              production_orders_by_status: prodRows,
              machines_by_status: machineRows,
              total_rolls: rollCount[0]?.count ?? 0,
            }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_orders",
    "Search and list customer orders with optional filters for status, customer, and date range",
    {
      status: z.string().optional().describe("Filter by order status: waiting, in_production, completed, cancelled, paused, delivered"),
      customer_id: z.string().optional().describe("Filter by customer ID"),
      limit: z.number().optional().default(50).describe("Maximum number of orders to return (default 50)"),
      offset: z.number().optional().default(0).describe("Offset for pagination"),
    },
    async ({ status, customer_id, limit, offset }) => {
      const conditions: SQL[] = [];
      if (status) conditions.push(eq(orders.status, status));
      if (customer_id) conditions.push(eq(orders.customer_id, customer_id));

      const where = buildWhere(conditions);

      const results = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.created_at))
        .limit(limit ?? 50)
        .offset(offset ?? 0);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(where);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ orders: results, total: total[0]?.count ?? 0 }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_production_status",
    "Get production orders status with completion percentages and stage details",
    {
      status: z.string().optional().describe("Filter by status: pending, active, completed, cancelled"),
      order_id: z.number().optional().describe("Filter by parent order ID"),
      limit: z.number().optional().default(50).describe("Maximum results"),
    },
    async ({ status, order_id, limit }) => {
      const conditions: SQL[] = [];
      if (status) conditions.push(eq(production_orders.status, status));
      if (order_id) conditions.push(eq(production_orders.order_id, order_id));

      const results = await db
        .select()
        .from(production_orders)
        .where(buildWhere(conditions))
        .orderBy(desc(production_orders.created_at))
        .limit(limit ?? 50);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ production_orders: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_inventory",
    "Get current inventory levels for raw materials and finished goods",
    {
      item_id: z.string().optional().describe("Filter by specific item ID"),
      low_stock: z.boolean().optional().describe("If true, only show items with stock below minimum level"),
      limit: z.number().optional().default(100).describe("Maximum results"),
    },
    async ({ item_id, low_stock, limit }) => {
      const conditions: SQL[] = [];
      if (item_id) conditions.push(eq(inventory.item_id, item_id));
      if (low_stock) conditions.push(sql`${inventory.current_stock} < ${inventory.min_stock}`);

      const where = buildWhere(conditions);

      const query = db
        .select({
          inventory_id: inventory.id,
          item_id: inventory.item_id,
          item_name: items.name,
          item_name_ar: items.name_ar,
          current_stock: inventory.current_stock,
          min_stock: inventory.min_stock,
          max_stock: inventory.max_stock,
          location_id: inventory.location_id,
        })
        .from(inventory)
        .leftJoin(items, eq(inventory.item_id, items.id));

      const results = await (where ? query.where(where) : query).limit(limit ?? 100);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ inventory: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_machines_status",
    "Get all machines with their current status (active, maintenance, down)",
    {
      type: z.string().optional().describe("Filter by machine type: extruder, printer, cutter, quality_check"),
      status: z.string().optional().describe("Filter by status: active, maintenance, down"),
    },
    async ({ type, status }) => {
      const conditions: SQL[] = [];
      if (type) conditions.push(eq(machines.type, type));
      if (status) conditions.push(eq(machines.status, status));

      const results = await db.select().from(machines).where(buildWhere(conditions));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ machines: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_maintenance_requests",
    "Get maintenance requests for machines, optionally filtered by status or machine",
    {
      status: z.string().optional().describe("Filter by status: pending, in_progress, completed, cancelled"),
      machine_id: z.string().optional().describe("Filter by machine ID"),
      limit: z.number().optional().default(50).describe("Maximum results"),
    },
    async ({ status, machine_id, limit }) => {
      const conditions: SQL[] = [];
      if (status) conditions.push(eq(maintenance_requests.status, status));
      if (machine_id) conditions.push(eq(maintenance_requests.machine_id, machine_id));

      const results = await db
        .select()
        .from(maintenance_requests)
        .where(buildWhere(conditions))
        .orderBy(desc(maintenance_requests.date_reported))
        .limit(limit ?? 50);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ maintenance_requests: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_attendance_summary",
    "Get attendance summary for employees with optional date range",
    {
      user_id: z.number().optional().describe("Filter by specific user ID"),
      date_from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
      date_to: z.string().optional().describe("End date (YYYY-MM-DD)"),
      limit: z.number().optional().default(100).describe("Maximum results"),
    },
    async ({ user_id, date_from, date_to, limit }) => {
      const conditions: SQL[] = [];
      if (user_id) conditions.push(eq(attendance.user_id, user_id));
      if (date_from) conditions.push(gte(attendance.date, date_from));
      if (date_to) conditions.push(lte(attendance.date, date_to));

      const results = await db
        .select({
          id: attendance.id,
          user_id: attendance.user_id,
          status: attendance.status,
          check_in_time: attendance.check_in_time,
          check_out_time: attendance.check_out_time,
          work_hours: attendance.work_hours,
          overtime_hours: attendance.overtime_hours,
          shift_type: attendance.shift_type,
          late_minutes: attendance.late_minutes,
          date: attendance.date,
        })
        .from(attendance)
        .where(buildWhere(conditions))
        .orderBy(desc(attendance.date))
        .limit(limit ?? 100);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ attendance: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_customers",
    "Get customer list with contact information",
    {
      search: z.string().optional().describe("Search by customer name"),
      is_active: z.boolean().optional().describe("Filter by active status"),
      limit: z.number().optional().default(50).describe("Maximum results"),
    },
    async ({ search, is_active, limit }) => {
      const conditions: SQL[] = [];
      if (search) {
        conditions.push(
          sql`(${customers.name} ILIKE ${"%" + search + "%"} OR ${customers.name_ar} ILIKE ${"%" + search + "%"})`
        );
      }
      if (is_active !== undefined) conditions.push(eq(customers.is_active, is_active));

      const results = await db
        .select()
        .from(customers)
        .where(buildWhere(conditions))
        .limit(limit ?? 50);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ customers: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "get_quality_issues",
    "Get quality issues and problems tracked in production",
    {
      status: z.string().optional().describe("Filter by status: open, in_progress, resolved, closed"),
      severity: z.string().optional().describe("Filter by severity: low, medium, high, critical"),
      limit: z.number().optional().default(50).describe("Maximum results"),
    },
    async ({ status, severity, limit }) => {
      const conditions: SQL[] = [];
      if (status) conditions.push(eq(quality_issues.status, status));
      if (severity) conditions.push(eq(quality_issues.severity, severity));

      const results = await db
        .select()
        .from(quality_issues)
        .where(buildWhere(conditions))
        .orderBy(desc(quality_issues.created_at))
        .limit(limit ?? 50);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ quality_issues: results }, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "search_rolls",
    "Search for production rolls by roll number, QR code, or production order",
    {
      roll_number: z.string().optional().describe("Search by roll number"),
      production_order_id: z.number().optional().describe("Filter by production order ID"),
      stage: z.string().optional().describe("Filter by current stage: film, printing, cutting, done"),
      limit: z.number().optional().default(50).describe("Maximum results"),
    },
    async ({ roll_number, production_order_id, stage, limit }) => {
      const conditions: SQL[] = [];
      if (roll_number) {
        conditions.push(
          sql`${rolls.roll_number} ILIKE ${"%" + roll_number + "%"}`
        );
      }
      if (production_order_id) conditions.push(eq(rolls.production_order_id, production_order_id));
      if (stage) conditions.push(eq(rolls.stage, stage));

      const results = await db
        .select()
        .from(rolls)
        .where(buildWhere(conditions))
        .orderBy(desc(rolls.created_at))
        .limit(limit ?? 50);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ rolls: results }, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
