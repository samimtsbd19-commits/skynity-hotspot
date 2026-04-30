import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { vouchers } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createVoucherSchema } from "@skynity/shared/zod";
import crypto from "crypto";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

function generateVoucherCode(): string {
  return crypto.randomBytes(6).toString("base64url").toUpperCase().slice(0, 10);
}

export default async function voucherRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const { page = "1", limit = "50" } = request.query as { page?: string; limit?: string };
    const offset = (Number(page) - 1) * Number(limit);
    const data = await db.select().from(vouchers).orderBy(desc(vouchers.createdAt)).limit(Number(limit)).offset(offset);
    const totalRows = await db.select({ count: count() }).from(vouchers);
    return { data, meta: { page: Number(page), limit: Number(limit), total: totalRows[0].count } };
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = createVoucherSchema.parse(request.body);
    const codes: string[] = [];
    for (let i = 0; i < body.quantity; i++) {
      codes.push(generateVoucherCode());
    }
    const values = codes.map((code) => ({
      orgId: request.user!.orgId,
      code,
      packageId: body.packageId,
      batchName: body.batchName || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      createdBy: request.user!.id,
    }));
    const result = await db.insert(vouchers).values(values).returning();
    return { data: result };
  });
}
