import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { appSettings, paymentConfigs } from "@skynity/db/schema/index";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/skynity?schema=public",
});
const db = drizzle(pool);

async function seed() {
  const orgId = 1;

  // General settings
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

  // Payment configs (seed only if table empty)
  const existing = await db.select().from(paymentConfigs);
  if (existing.length === 0) {
    await db.insert(paymentConfigs).values([
      { orgId, method: "bkash", accountNumber: "01712345678", accountType: "personal", isActive: true },
      { orgId, method: "nagad", accountNumber: "01712345678", accountType: "personal", isActive: true },
      { orgId, method: "rocket", accountNumber: "0171234567890", accountType: "personal", isActive: true },
    ]);
  }

  console.log("Settings seeded successfully!");
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
