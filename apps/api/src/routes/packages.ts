import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, count } from "drizzle-orm";
import { packages } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createPackageSchema } from "@skynity/shared/zod";
import { z } from "zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

const updatePackageSchema = createPackageSchema.partial().extend({
  id: z.string().uuid().optional(),
});

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
    const templateConfig = body.templateConfig
      ? (typeof body.templateConfig === "string" ? JSON.parse(body.templateConfig) : body.templateConfig)
      : {};
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
        templateConfig,
      })
      .returning();
    return { data: result[0] };
  });

  app.put("/:id", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updatePackageSchema.parse(request.body);

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.downloadMbps !== undefined) updateData.downloadMbps = body.downloadMbps;
    if (body.uploadMbps !== undefined) updateData.uploadMbps = body.uploadMbps;
    if (body.burstDownloadMbps !== undefined) updateData.burstDownloadMbps = body.burstDownloadMbps || null;
    if (body.burstUploadMbps !== undefined) updateData.burstUploadMbps = body.burstUploadMbps || null;
    if (body.burstThresholdMbps !== undefined) updateData.burstThresholdMbps = body.burstThresholdMbps || null;
    if (body.burstTimeSeconds !== undefined) updateData.burstTimeSeconds = body.burstTimeSeconds || null;
    if (body.priceBdt !== undefined) updateData.priceBdt = String(body.priceBdt);
    if (body.validityDays !== undefined) updateData.validityDays = body.validityDays;
    if (body.radiusGroupName !== undefined) updateData.radiusGroupName = body.radiusGroupName || null;
    if (body.mikrotikProfileName !== undefined) updateData.mikrotikProfileName = body.mikrotikProfileName || null;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.isTrial !== undefined) updateData.isTrial = body.isTrial;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.templateConfig !== undefined) {
      updateData.templateConfig = typeof body.templateConfig === "string" ? JSON.parse(body.templateConfig) : body.templateConfig;
    }

    const result = await db.update(packages).set(updateData).where(eq(packages.id, id)).returning();
    if (result.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Package not found" } });
    }
    return { data: result[0] };
  });
}
