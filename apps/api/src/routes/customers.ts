import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { customers, subscriptions, packages } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createCustomerSchema } from "@skynity/shared/zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function customerRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const { page = "1", limit = "20", search } = request.query as { page?: string; limit?: string; search?: string };
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(customers).orderBy(desc(customers.createdAt));
    if (search) {
      query = query.where(eq(customers.phone, search)) as typeof query;
    }

    const data = await query.limit(Number(limit)).offset(offset);
    const totalRows = await db.select({ count: count() }).from(customers);
    return {
      data,
      meta: { page: Number(page), limit: Number(limit), total: totalRows[0].count },
    };
  });

  app.get("/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    if (rows.length === 0) {
      return { error: { code: "NOT_FOUND", message: "Customer not found" } };
    }
    const subs = await db
      .select({ subscriptions, packages })
      .from(subscriptions)
      .leftJoin(packages, eq(subscriptions.packageId, packages.id))
      .where(eq(subscriptions.customerId, id));
    return { data: { ...rows[0], subscriptions: subs } };
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const body = createCustomerSchema.parse(request.body);
    const result = await db
      .insert(customers)
      .values({
        orgId: request.user!.orgId,
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        nid: body.nid || null,
        notes: body.notes || null,
        createdBy: request.user!.id,
      })
      .returning();
    return { data: (result as any)[0] };
  });
}
