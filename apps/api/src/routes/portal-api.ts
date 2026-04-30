import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import { customers, packages, orders, subscriptions, appSettings } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { z } from "zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

const createOrderSchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.enum(["bkash", "nagad", "rocket", "cash"]),
  trxId: z.string().min(4),
  paymentFrom: z.string().min(11),
  amountBdt: z.string(),
});

export default async function portalApiRoutes(app: FastifyInstance) {
  // Get available packages (includes templateConfig for hotspot portal)
  app.get("/packages", async () => {
    const rows = await db.select().from(packages).where(eq(packages.isActive, true));
    return {
      data: rows.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        downloadMbps: p.downloadMbps,
        uploadMbps: p.uploadMbps,
        burstDownloadMbps: p.burstDownloadMbps,
        burstUploadMbps: p.burstUploadMbps,
        burstThresholdMbps: p.burstThresholdMbps,
        burstTimeSeconds: p.burstTimeSeconds,
        priceBdt: p.priceBdt,
        validityDays: p.validityDays,
        isTrial: p.isTrial,
        description: p.description,
        templateConfig: p.templateConfig,
      })),
    };
  });

  // Get my orders
  app.get("/orders", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const customerRows = await db.select().from(customers).where(eq(customers.id, user.id)).limit(1);
    if (customerRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Customer not found" } });
    }

    const rows = await db.select().from(orders).where(eq(orders.customerId, user.id)).orderBy(desc(orders.createdAt));
    return { data: rows };
  });

  // Create new order
  app.post("/orders", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const body = createOrderSchema.parse(request.body);

    // Verify package exists
    const pkgRows = await db.select().from(packages).where(eq(packages.id, body.packageId)).limit(1);
    if (pkgRows.length === 0) {
      return reply.status(404).send({ error: { code: "PACKAGE_NOT_FOUND", message: "Package not found" } });
    }

    const result = await db.insert(orders).values({
      customerId: user.id,
      packageId: body.packageId,
      amountBdt: body.amountBdt,
      paymentMethod: body.paymentMethod,
      trxId: body.trxId,
      paymentFrom: body.paymentFrom,
      status: "pending",
    }).returning();

    const order = result[0];

    return {
      data: {
        orderId: order.id,
        status: order.status,
        message: "Order submitted successfully. Please wait for admin approval.",
      },
    };
  });

  // Get my subscriptions
  app.get("/subscriptions", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const rows = await db.select().from(subscriptions).where(eq(subscriptions.customerId, user.id)).orderBy(desc(subscriptions.createdAt));
    return { data: rows };
  });

  // Get app settings (timezone, currency, etc.)
  app.get("/settings", async () => {
    const rows = await db.select().from(appSettings);
    const settings = rows.reduce((acc, s) => {
      acc[s.key] = s.type === "json" ? JSON.parse(s.value || "{}") : (s.value || "");
      return acc;
    }, {} as Record<string, unknown>);
    return { data: settings };
  });
}
