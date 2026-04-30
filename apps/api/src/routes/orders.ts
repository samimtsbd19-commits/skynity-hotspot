import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { orders, customers, packages } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createOrderSchema } from "@skynity/shared/zod";
import { provisionOrder } from "../services/provisioning/service";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function orderRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const { page = "1", limit = "20", status } = request.query as { page?: string; limit?: string; status?: string };
    const offset = (Number(page) - 1) * Number(limit);

    let query = db.select().from(orders).orderBy(desc(orders.createdAt));
    if (status) query = query.where(eq(orders.status, status as any)) as typeof query;

    const data = await query.limit(Number(limit)).offset(offset);
    const totalRows = await db.select({ count: count() }).from(orders);
    return { data, meta: { page: Number(page), limit: Number(limit), total: totalRows[0].count } };
  });

  app.post("/", { preHandler: [app.authenticate] }, async (request) => {
    const body = createOrderSchema.parse(request.body);
    const result = await db
      .insert(orders)
      .values({
        customerId: body.customerId,
        packageId: body.packageId,
        amountBdt: String(body.amountBdt),
        paymentMethod: body.paymentMethod,
        trxId: body.trxId || null,
        paymentFrom: body.paymentFrom || null,
      })
      .returning();
    return { data: result[0] };
  });

  app.post("/:id/approve", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const { id } = request.params as { id: string };
    await db
      .update(orders)
      .set({ status: "approved", reviewedBy: request.user!.id, reviewedAt: new Date() })
      .where(eq(orders.id, id));

    // Auto-provision the order
    const provisionResult = await provisionOrder(id);

    return {
      data: {
        message: "Order approved",
        provisioning: provisionResult,
      },
    };
  });

  app.post("/:id/reject", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const { id } = request.params as { id: string };
    const { note } = request.body as { note?: string };
    await db
      .update(orders)
      .set({ status: "rejected", reviewedBy: request.user!.id, reviewedAt: new Date(), reviewNote: note || null })
      .where(eq(orders.id, id));
    return { data: { message: "Order rejected" } };
  });
}
