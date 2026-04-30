import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { customers } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createAccessToken, hashPassword, comparePassword } from "../plugins/auth";
import { z } from "zod";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

const registerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^01[3-9]\d{8}$/),
  password: z.string().min(6),
  address: z.string().optional(),
  email: z.string().email().optional(),
});

const loginSchema = z.object({
  phone: z.string(),
  password: z.string().min(6),
});

export default async function portalAuthRoutes(app: FastifyInstance) {
  // Customer Registration
  app.post("/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await db.select().from(customers).where(eq(customers.phone, body.phone)).limit(1);
    if (existing.length > 0) {
      return reply.status(409).send({ error: { code: "PHONE_EXISTS", message: "This phone number is already registered" } });
    }

    const passwordHash = await hashPassword(body.password);
    const customerCode = `SKY${Date.now().toString(36).toUpperCase()}`;

    const result = await db.insert(customers).values({
      fullName: body.fullName,
      phone: body.phone,
      passwordHash,
      address: body.address || null,
      email: body.email || null,
      customerCode,
    }).returning();

    const customer = result[0];
    const token = await createAccessToken({
      id: customer.id,
      email: customer.email || customer.phone,
      role: "customer",
      orgId: customer.orgId || "",
    });

    return {
      data: {
        accessToken: token,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          customerCode: customer.customerCode,
        },
      },
    };
  });

  // Customer Login
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const rows = await db.select().from(customers).where(eq(customers.phone, body.phone)).limit(1);
    if (rows.length === 0) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid phone or password" } });
    }

    const customer = rows[0];
    if (!customer.passwordHash) {
      return reply.status(401).send({ error: { code: "NO_PASSWORD", message: "Please set a password first" } });
    }

    const valid = await comparePassword(body.password, customer.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: { code: "INVALID_CREDENTIALS", message: "Invalid phone or password" } });
    }

    const token = await createAccessToken({
      id: customer.id,
      email: customer.email || customer.phone,
      role: "customer",
      orgId: customer.orgId || "",
    });

    return {
      data: {
        accessToken: token,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          customerCode: customer.customerCode,
        },
      },
    };
  });

  // Get current customer profile
  app.get("/me", { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user;
    if (!user || user.role !== "customer") {
      return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Customer access only" } });
    }

    const rows = await db.select().from(customers).where(eq(customers.id, user.id)).limit(1);
    if (rows.length === 0) {
      return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Customer not found" } });
    }

    const customer = rows[0];
    return {
      data: {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        customerCode: customer.customerCode,
        createdAt: customer.createdAt,
      },
    };
  });
}
