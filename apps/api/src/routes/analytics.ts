import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql, count, sum, eq, gte } from "drizzle-orm";
import { customers, orders, subscriptions, bandwidthSnapshots } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function analyticsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const totalCustomers = await db.select({ count: count() }).from(customers);
    const totalOrders = await db.select({ count: count() }).from(orders);
    const activeSubs = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));
    return {
      data: {
        totalCustomers: totalCustomers[0].count,
        totalOrders: totalOrders[0].count,
        activeSubscriptions: activeSubs[0].count,
      },
    };
  });

  app.get("/dashboard", { preHandler: [app.authenticate] }, async () => {
    const totalCustomers = await db.select({ count: count() }).from(customers);
    const totalOrders = await db.select({ count: count() }).from(orders);
    const totalRevenue = await db.select({ sum: sum(orders.amountBdt) }).from(orders).where(eq(orders.status, "approved"));
    const activeSubs = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, "active"));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await db
      .select({ count: count(), sum: sum(orders.amountBdt) })
      .from(orders)
      .where(gte(orders.createdAt, today));

    return {
      data: {
        totalCustomers: totalCustomers[0].count,
        totalOrders: totalOrders[0].count,
        totalRevenue: totalRevenue[0].sum || "0",
        activeSubscriptions: activeSubs[0].count,
        todayOrders: todayOrders[0].count,
        todayRevenue: todayOrders[0].sum || "0",
      },
    };
  });

  app.get("/revenue", { preHandler: [app.authenticate] }, async (request, reply) => {
    const raw = Number((request.query as any).days || "30");
    if (!Number.isInteger(raw) || raw < 1 || raw > 365) {
      return reply.status(400).send({ error: { code: "INVALID_PARAM", message: "days must be an integer between 1 and 365" } });
    }
    const days = raw;
    const result = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*)::int as orders, COALESCE(SUM(amount_bdt), 0)::text as revenue
      FROM orders
      WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '1 days' * ${days}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return { data: result.rows };
  });

  app.get("/customers/growth", { preHandler: [app.authenticate] }, async (request, reply) => {
    const raw = Number((request.query as any).days || "30");
    if (!Number.isInteger(raw) || raw < 1 || raw > 365) {
      return reply.status(400).send({ error: { code: "INVALID_PARAM", message: "days must be an integer between 1 and 365" } });
    }
    const days = raw;
    const result = await db.execute(sql`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM customers
      WHERE created_at >= NOW() - INTERVAL '1 days' * ${days}
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    return { data: result.rows };
  });

  app.get("/network/usage", { preHandler: [app.authenticate] }, async () => {
    const result = await db.execute(sql`
      SELECT router_id::text, COALESCE(SUM(rx_bytes), 0)::text as total_rx, COALESCE(SUM(tx_bytes), 0)::text as total_tx
      FROM bandwidth_snapshots
      WHERE captured_at >= NOW() - INTERVAL '24 hours'
      GROUP BY router_id
    `);
    return { data: result.rows };
  });
}
