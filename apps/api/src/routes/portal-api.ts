import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { customers, packages, orders, subscriptions, appSettings, paymentConfigs, supportTickets, supportMessages } from "@skynity/db/schema/index";
import { radacct } from "@skynity/db/schema/radius";
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
  password: z.string().min(6).optional(),
});

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(1),
});

const createMessageSchema = z.object({
  message: z.string().min(1),
});

export default async function portalApiRoutes(app: FastifyInstance) {
  // Get available packages
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
      reviewNote: body.password || null,
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

  // Get usage data from RADIUS radacct
  app.get("/usage", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const subRows = await db.select().from(subscriptions).where(eq(subscriptions.customerId, user.id)).limit(1);
    if (subRows.length === 0) {
      return { data: { sessions: [], total: { download: 0, upload: 0, time: 0 } } };
    }

    const sub = subRows[0];
    const username = sub.username;

    // Get sessions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await db.select().from(radacct)
      .where(
        and(
          eq(radacct.username, username),
          gte(radacct.acctstarttime, thirtyDaysAgo)
        )
      )
      .orderBy(desc(radacct.acctstarttime));

    // Calculate totals
    const totalDownload = sessions.reduce((sum, s) => sum + Number(s.acctoutputoctets || 0), 0);
    const totalUpload = sessions.reduce((sum, s) => sum + Number(s.acctinputoctets || 0), 0);
    const totalTime = sessions.reduce((sum, s) => sum + Number(s.acctsessiontime || 0), 0);

    // Daily usage for chart
    const dailyMap = new Map<string, { download: number; upload: number }>();
    for (const s of sessions) {
      const date = s.acctstarttime ? new Date(s.acctstarttime).toISOString().split("T")[0] : "unknown";
      const existing = dailyMap.get(date) || { download: 0, upload: 0 };
      existing.download += Number(s.acctoutputoctets || 0);
      existing.upload += Number(s.acctinputoctets || 0);
      dailyMap.set(date, existing);
    }

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, download: data.download, upload: data.upload }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      data: {
        username,
        sessions: sessions.slice(0, 50).map((s) => ({
          sessionId: s.acctsessionid,
          startTime: s.acctstarttime,
          stopTime: s.acctstoptime,
          duration: s.acctsessiontime,
          download: s.acctoutputoctets,
          upload: s.acctinputoctets,
          ipAddress: s.framedipaddress,
          nasIp: s.nasipaddress,
        })),
        dailyUsage,
        total: {
          download: totalDownload,
          upload: totalUpload,
          time: totalTime,
        },
      },
    };
  });

  // Get my support tickets
  app.get("/tickets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const rows = await db.select().from(supportTickets)
      .where(eq(supportTickets.customerId, user.id))
      .orderBy(desc(supportTickets.createdAt));
    return { data: rows };
  });

  // Create support ticket
  app.post("/tickets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const body = createTicketSchema.parse(request.body);

    const ticketResult = await db.insert(supportTickets).values({
      customerId: user.id,
      subject: body.subject,
      status: "open",
    }).returning();

    const ticket = ticketResult[0];

    await db.insert(supportMessages).values({
      ticketId: ticket.id,
      senderType: "customer",
      senderId: user.id,
      message: body.message,
    });

    return { data: { ticketId: ticket.id, message: "Ticket created successfully" } };
  });

  // Get ticket messages
  app.get("/tickets/:id/messages", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Authentication required" } });
    }

    const { id } = request.params as { id: string };

    const ticketRows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (ticketRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    const ticket = ticketRows[0];
    if (user.role === "customer" && ticket.customerId !== user.id) {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const messages = await db.select().from(supportMessages)
      .where(eq(supportMessages.ticketId, id))
      .orderBy(supportMessages.createdAt);

    return { data: { ticket, messages } };
  });

  // Reply to ticket
  app.post("/tickets/:id/messages", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user) {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Authentication required" } });
    }

    const { id } = request.params as { id: string };
    const body = createMessageSchema.parse(request.body);

    const ticketRows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (ticketRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    const ticket = ticketRows[0];
    if (user.role === "customer" && ticket.customerId !== user.id) {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Access denied" } });
    }

    const senderType = user.role === "customer" ? "customer" : "admin";

    await db.insert(supportMessages).values({
      ticketId: id,
      senderType,
      senderId: user.id,
      message: body.message,
    });

    // Update ticket status if admin replies
    if (senderType === "admin" && ticket.status === "open") {
      await db.update(supportTickets).set({ status: "in_progress", updatedAt: new Date() }).where(eq(supportTickets.id, id));
    }

    return { data: { message: "Reply sent" } };
  });

  // Get app settings
  app.get("/settings", async () => {
    const rows = await db.select().from(appSettings);
    const settings = rows.reduce((acc, s) => {
      acc[s.key] = s.type === "json" ? JSON.parse(s.value || "{}") : (s.value || "");
      return acc;
    }, {} as Record<string, unknown>);
    return { data: settings };
  });

  // Get public payment configs
  app.get("/payments", async () => {
    const rows = await db.select().from(paymentConfigs).where(eq(paymentConfigs.isActive, true));
    return {
      data: rows.map((p) => ({
        method: p.method,
        accountNumber: p.accountNumber,
        accountType: p.accountType,
      })),
    };
  });
}
