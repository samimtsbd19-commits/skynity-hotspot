import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { appSettings, paymentConfigs } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function settingsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const settings = await db.select().from(appSettings);
    return { data: settings };
  });

  app.get("/payments", { preHandler: [app.authenticate] }, async () => {
    const payments = await db.select().from(paymentConfigs);
    return { data: payments };
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = request.body as { key: string; value: string; type?: string };
    await db
      .insert(appSettings)
      .values({ orgId: request.user!.orgId, key: body.key, value: body.value, type: body.type || "string" })
      .onConflictDoUpdate({
        target: [appSettings.orgId, appSettings.key],
        set: { value: body.value, type: body.type || "string" },
      });
    return { data: { message: "Setting saved" } };
  });

  app.post("/payments", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = request.body as { method: string; accountNumber: string; accountType?: string; isActive?: boolean };
    await db
      .insert(paymentConfigs)
      .values({
        orgId: request.user!.orgId,
        method: body.method,
        accountNumber: body.accountNumber,
        accountType: body.accountType || null,
        isActive: body.isActive ?? true,
      })
      .onConflictDoUpdate({
        target: [paymentConfigs.orgId, paymentConfigs.method],
        set: {
          accountNumber: body.accountNumber,
          accountType: body.accountType || null,
          isActive: body.isActive ?? true,
        },
      });
    return { data: { message: "Payment config saved" } };
  });

  app.delete("/payments/:id", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(paymentConfigs).where(eq(paymentConfigs.id, Number(id)));
    return { data: { message: "Payment config deleted" } };
  });
}
