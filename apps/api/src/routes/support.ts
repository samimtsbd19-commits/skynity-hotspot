import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and } from "drizzle-orm";
import { supportTickets, supportMessages, customers } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function supportRoutes(app: FastifyInstance) {
  // Get all tickets (admin)
  app.get("/", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request) => {
    const { status } = request.query as { status?: string };

    let query = db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
    if (status) {
      query = query.where(eq(supportTickets.status, status)) as typeof query;
    }

    const rows = await query;
    return { data: rows };
  });

  // Get ticket detail with messages
  app.get("/:id", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const ticketRows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (ticketRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    const ticket = ticketRows[0];
    const messages = await db.select().from(supportMessages)
      .where(eq(supportMessages.ticketId, id))
      .orderBy(supportMessages.createdAt);

    const customerRows = await db.select().from(customers).where(eq(customers.id, ticket.customerId)).limit(1);

    return { data: { ticket, messages, customer: customerRows[0] || null } };
  });

  // Update ticket status
  app.patch("/:id", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status?: string; assignedTo?: string; priority?: string };

    const ticketRows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (ticketRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    await db.update(supportTickets)
      .set({
        status: body.status || ticketRows[0].status,
        assignedTo: body.assignedTo || ticketRows[0].assignedTo,
        priority: body.priority || ticketRows[0].priority,
        resolvedAt: body.status === "resolved" ? new Date() : ticketRows[0].resolvedAt,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id));

    return { data: { message: "Ticket updated" } };
  });

  // Reply to ticket (admin)
  app.post("/:id/messages", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin", "reseller")] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { message: string };

    if (!body.message || body.message.trim().length === 0) {
      return reply.status(400).send({ error: { code: "INVALID_INPUT", message: "Message is required" } });
    }

    const ticketRows = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (ticketRows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Ticket not found" } });
    }

    await db.insert(supportMessages).values({
      ticketId: id,
      senderType: "admin",
      senderId: request.user!.id,
      message: body.message,
    });

    await db.update(supportTickets)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(supportTickets.id, id));

    return { data: { message: "Reply sent" } };
  });
}
