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
}
