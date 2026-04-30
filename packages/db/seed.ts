import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import {
  organizations,
  users,
  packages,
  paymentConfigs,
  appSettings,
} from "./schema/index";
import { sql } from "drizzle-orm";

dotenv.config({ path: "../../.env" });

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || "5432"}/${process.env.POSTGRES_DB}`,
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding SKYNITY database...");

  const orgResult = await db
    .insert(organizations)
    .values({
      name: process.env.BOOTSTRAP_ORG_NAME || "SKYNITY ISP",
      slug: "skynity",
      settings: {},
    })
    .returning();
  const org = orgResult[0];
  console.log("✅ Organization created:", org.name);

  const passwordHash = await bcrypt.hash(
    process.env.BOOTSTRAP_ADMIN_PASSWORD || "admin123",
    12
  );

  await db.insert(users).values({
    orgId: org.id,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@skynity.net",
    passwordHash,
    fullName: "System Administrator",
    role: "superadmin",
    isActive: true,
  });
  console.log("✅ Admin user created");

  await db.insert(packages).values([
    {
      orgId: org.id,
      name: "7 Day Free Trial",
      type: "pppoe",
      downloadMbps: 5,
      uploadMbps: 5,
      priceBdt: "0",
      validityDays: 7,
      isTrial: true,
      radiusGroupName: "trial-5m",
      mikrotikProfileName: "trial",
    },
    {
      orgId: org.id,
      name: "Home Basic",
      type: "pppoe",
      downloadMbps: 10,
      uploadMbps: 5,
      priceBdt: "350",
      validityDays: 30,
      radiusGroupName: "home-basic",
      mikrotikProfileName: "home-basic",
    },
    {
      orgId: org.id,
      name: "Home Plus",
      type: "pppoe",
      downloadMbps: 20,
      uploadMbps: 10,
      priceBdt: "550",
      validityDays: 30,
      radiusGroupName: "home-plus",
      mikrotikProfileName: "home-plus",
    },
    {
      orgId: org.id,
      name: "Home Premium",
      type: "pppoe",
      downloadMbps: 30,
      uploadMbps: 15,
      priceBdt: "800",
      validityDays: 30,
      radiusGroupName: "home-premium",
      mikrotikProfileName: "home-premium",
    },
    {
      orgId: org.id,
      name: "Business 50M",
      type: "pppoe",
      downloadMbps: 50,
      uploadMbps: 25,
      priceBdt: "1500",
      validityDays: 30,
      radiusGroupName: "business-50m",
      mikrotikProfileName: "business-50m",
    },
    {
      orgId: org.id,
      name: "Hotspot Daily 5M",
      type: "hotspot",
      downloadMbps: 5,
      uploadMbps: 5,
      priceBdt: "50",
      validityDays: 1,
      radiusGroupName: "hotspot-daily",
      mikrotikProfileName: "hotspot-daily",
    },
    {
      orgId: org.id,
      name: "Hotspot Weekly",
      type: "hotspot",
      downloadMbps: 5,
      uploadMbps: 5,
      priceBdt: "200",
      validityDays: 7,
      radiusGroupName: "hotspot-weekly",
      mikrotikProfileName: "hotspot-weekly",
    },
  ]);
  console.log("✅ Packages seeded");

  await db.insert(paymentConfigs).values([
    {
      orgId: org.id,
      method: "bkash",
      accountNumber: process.env.BKASH_NUMBER || "01XXXXXXXXX",
      accountType: "personal",
    },
    {
      orgId: org.id,
      method: "nagad",
      accountNumber: process.env.NAGAD_NUMBER || "01XXXXXXXXX",
      accountType: "personal",
    },
  ]);
  console.log("✅ Payment configs seeded");

  await db.insert(appSettings).values([
    { orgId: org.id, key: "ping_targets", value: JSON.stringify([{ host: "8.8.8.8", label: "Google DNS" }, { host: "1.1.1.1", label: "Cloudflare DNS" }, { host: "208.67.222.222", label: "OpenDNS" }]), type: "json" },
    { orgId: org.id, key: "timezone", value: "Asia/Dhaka", type: "string" },
    { orgId: org.id, key: "currency", value: "BDT", type: "string" },
  ]);
  console.log("✅ App settings seeded");

  console.log("🎉 Seed complete!");
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
