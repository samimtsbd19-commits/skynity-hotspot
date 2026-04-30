import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import { routers } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { RouterConnector } from "../services/router/connector";
import { z } from "zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

const createRouterSchema = z.object({
  name: z.string().min(1).max(100),
  vendor: z.enum(["mikrotik", "cisco", "ubiquiti", "generic", "tplink"]),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(8729),
  username: z.string().min(1),
  password: z.string().min(1),
  useSsl: z.boolean().default(true),
  wireguardPeerIp: z.string().ip(),
});

export default async function routerRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [app.authenticate] }, async () => {
    const data = await db.select().from(routers).orderBy(desc(routers.createdAt));
    return { data };
  });

  app.get("/:id", { preHandler: [app.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const rows = await db.select().from(routers).where(eq(routers.id, id)).limit(1);
    if (rows.length === 0) return { error: { code: "NOT_FOUND", message: "Router not found" } };
    return { data: rows[0] };
  });

  app.post("/test", { preHandler: [app.authenticate] }, async (request) => {
    const body = createRouterSchema.parse(request.body);
    const result = await RouterConnector.testConnection({
      id: "test",
      name: body.name,
      vendor: body.vendor,
      host: body.host,
      port: body.port,
      username: body.username,
      password: body.password,
      useSsl: body.useSsl,
      isActive: true,
    });
    return { data: result };
  });

  app.post("/discover", { preHandler: [app.authenticate] }, async (request) => {
    const body = createRouterSchema.parse(request.body);
    const discovered = await RouterConnector.autoDiscover({
      id: "test",
      name: body.name,
      vendor: body.vendor,
      host: body.host,
      port: body.port,
      username: body.username,
      password: body.password,
      useSsl: body.useSsl,
      isActive: true,
    });
    return { data: discovered };
  });

  app.post("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = createRouterSchema.parse(request.body);
    const result = await db
      .insert(routers)
      .values({
        orgId: request.user!.orgId,
        name: body.name,
        vendor: body.vendor,
        host: body.host,
        wireguardPeerIp: body.wireguardPeerIp as any,
        apiPort: body.port,
        apiSslPort: body.useSsl ? 8729 : 8728,
        username: body.username,
        passwordEncrypted: body.password,
        useSsl: body.useSsl,
        isActive: true,
      })
      .returning();
    return { data: result[0] };
  });

  app.delete("/:id", { preHandler: [app.authenticate, app.requireRole("superadmin")] }, async (request) => {
    const { id } = request.params as { id: string };
    await db.delete(routers).where(eq(routers.id, id));
    return { data: { message: "Router deleted" } };
  });
}
