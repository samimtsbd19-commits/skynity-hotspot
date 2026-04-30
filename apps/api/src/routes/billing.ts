import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { invoices, orders } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function billingRoutes(app: FastifyInstance) {
  app.get("/invoices", { preHandler: [app.authenticate] }, async (request) => {
    const { page = "1", limit = "20" } = request.query as { page?: string; limit?: string };
    const offset = (Number(page) - 1) * Number(limit);
    const data = await db.select().from(invoices).orderBy(desc(invoices.issuedAt)).limit(Number(limit)).offset(offset);
    const totalRows = await db.select({ count: count() }).from(invoices);
    return { data, meta: { page: Number(page), limit: Number(limit), total: totalRows[0].count } };
  });

  app.get("/invoices/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    if (rows.length === 0) return { error: { code: "NOT_FOUND", message: "Invoice not found" } };
    return { data: rows[0] };
  });
}
