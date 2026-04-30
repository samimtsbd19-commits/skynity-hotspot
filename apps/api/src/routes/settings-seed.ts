import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { appSettings, paymentConfigs } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function settingsSeedRoutes(app: FastifyInstance) {
  app.post("/seed-defaults", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async () => {
    const orgId = "1";

    // General
    const general = [
      { key: "company_name", value: "SKYNITY ISP", type: "string" },
      { key: "company_tagline", value: "Starlink Powered Internet Provider", type: "string" },
      { key: "support_phone", value: "01712-345-678", type: "string" },
      { key: "support_email", value: "support@skynity.net", type: "string" },
      { key: "timezone", value: "Asia/Dhaka", type: "string" },
      { key: "currency", value: "BDT", type: "string" },
    ];

    for (const s of general) {
      await db.insert(appSettings).values({ orgId, key: s.key, value: s.value, type: s.type }).onConflictDoNothing();
    }

    // Payments
    const existing = await db.select().from(paymentConfigs);
    if (existing.length === 0) {
      for (const p of [
        { orgId, method: "bkash", accountNumber: "01712345678", accountType: "personal", isActive: true },
        { orgId, method: "nagad", accountNumber: "01712345678", accountType: "personal", isActive: true },
        { orgId, method: "rocket", accountNumber: "0171234567890", accountType: "personal", isActive: true },
      ]) {
        await db.insert(paymentConfigs).values(p);
      }
    }

    return { data: { message: "Default settings seeded" } };
  });
}
