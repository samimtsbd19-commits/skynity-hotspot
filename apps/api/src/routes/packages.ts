import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { packages } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createPackageSchema } from "@skynity/shared/zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function packageRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async (request) => {
    const { page = "1", limit = "50" } = request.query as { page?: string; limit?: string };
    const offset = (Number(page) - 1) * Number(limit);
    const data = await db.select().from(packages).orderBy(desc(packages.createdAt)).limit(Number(limit)).offset(offset);
    const totalRows = await db.select({ count: count() }).from(packages);
    return { data, meta: { page: Number(page), limit: Number(limit), total: totalRows[0].count } };
  });

  app.get("/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
    if (rows.length === 0) return { error: { code: "NOT_FOUND", message: "Package not found" } };
    return { data: rows[0] };
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = createPackageSchema.parse(request.body);
    const result = await db
      .insert(packages)
      .values({
        orgId: request.user!.orgId,
        name: body.name,
        type: body.type,
        downloadMbps: body.downloadMbps,
        uploadMbps: body.uploadMbps,
        burstDownloadMbps: body.burstDownloadMbps || null,
        burstUploadMbps: body.burstUploadMbps || null,
        burstThresholdMbps: body.burstThresholdMbps || null,
        burstTimeSeconds: body.burstTimeSeconds || null,
        priceBdt: String(body.priceBdt),
        validityDays: body.validityDays,
        radiusGroupName: body.radiusGroupName || null,
        mikrotikProfileName: body.mikrotikProfileName || null,
        description: body.description || null,
        isTrial: body.isTrial,
      })
      .returning();
    return { data: result[0] };
  });
}
