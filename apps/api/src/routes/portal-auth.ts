import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { customers, packages, subscriptions } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../config/env";
import { createAccessToken, hashPassword, comparePassword } from "../plugins/auth";
import { provisionCustomer } from "../services/provisioning/service";
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

const freeTrialSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().regex(/^01[3-9]\d{8}$/),
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

  // Free Trial Signup (Hotspot Portal)
  app.post("/free-trial", async (request, reply) => {
    const body = freeTrialSchema.parse(request.body);

    // Find trial package
    const trialPackages = await db.select().from(packages).where(eq(packages.isTrial, true)).limit(1);
    if (trialPackages.length === 0) {
      return reply.status(404).send({ error: { code: "NO_TRIAL_PACKAGE", message: "No trial package available" } });
    }
    const trialPkg = trialPackages[0];

    // Check if customer already exists
    const existingRows = await db.select().from(customers).where(eq(customers.phone, body.phone)).limit(1);
    let customer;

    if (existingRows.length > 0) {
      customer = existingRows[0];
      // Check if already has an active trial subscription
      const existingTrials = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.customerId, customer.id),
            eq(subscriptions.packageId, trialPkg.id)
          )
        )
        .limit(1);

      if (existingTrials.length > 0) {
        return reply.status(409).send({
          error: { code: "TRIAL_USED", message: "You have already used your free trial" },
        });
      }

      // Update password if provided (for returning customers)
      if (body.password) {
        const passwordHash = await hashPassword(body.password);
        await db.update(customers).set({ passwordHash }).where(eq(customers.id, customer.id));
      }
    } else {
      // Register new customer
      const passwordHash = await hashPassword(body.password);
      const customerCode = `SKY${Date.now().toString(36).toUpperCase()}`;
      const result = await db.insert(customers).values({
        fullName: body.fullName,
        phone: body.phone,
        passwordHash,
        customerCode,
      }).returning();
      customer = result[0];
    }

    // Provision trial subscription
    const provResult = await provisionCustomer(customer.id, trialPkg.id);
    if (!provResult.success) {
      return reply.status(500).send({
        error: { code: "PROVISIONING_FAILED", message: provResult.message },
      });
    }

    // Generate JWT
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
        subscription: {
          subscriptionId: provResult.subscriptionId,
          username: provResult.username,
          password: provResult.password,
          packageName: trialPkg.name,
          validityDays: trialPkg.validityDays,
        },
        message: `Your free trial is active! Username: ${provResult.username}`,
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
