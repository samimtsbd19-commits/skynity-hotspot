import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import { customers, packages, orders, subscriptions } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import { getMikrotikClient, mockMikrotikService } from "../mikrotik/client";
import { env } from "../../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export interface ProvisioningResult {
  success: boolean;
  subscriptionId?: string;
  username?: string;
  password?: string;
  message: string;
}

function getMikrotik() {
  if (env.MIKROTIK_MOCK === "true") {
    return { type: "mock" as const, client: mockMikrotikService };
  }
  try {
    const client = getMikrotikClient();
    return { type: "real" as const, client };
  } catch {
    return { type: "mock" as const, client: mockMikrotikService };
  }
}

export async function provisionCustomer(
  customerId: string,
  packageId: string,
  opts?: { skipMikrotik?: boolean }
): Promise<ProvisioningResult> {
  try {
    const customerRows = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
    if (customerRows.length === 0) {
      return { success: false, message: "Customer not found" };
    }
    const customer = customerRows[0];

    const pkgRows = await db.select().from(packages).where(eq(packages.id, packageId)).limit(1);
    if (pkgRows.length === 0) {
      return { success: false, message: "Package not found" };
    }
    const pkg = pkgRows[0];

    const username = customer.phone.replace(/^\+?88/, "");
    // Use order-provided password if available, otherwise auto-generate
    const orderRows = await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt)).limit(1);
    const orderPassword = orderRows[0]?.reviewNote;
    const password = orderPassword || customer.phone.slice(-6) + "SKY";

    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(startedAt.getDate() + (pkg.validityDays || 30));

    const subResult = await db.insert(subscriptions).values({
      customerId: customer.id,
      packageId: pkg.id,
      username,
      passwordEncrypted: password,
      status: "active",
      startedAt,
      expiresAt,
      autoRenew: false,
    }).returning();

    const subscription = subResult[0];

    if (!opts?.skipMikrotik) {
      const mikro = getMikrotik();
      try {
        if (pkg.type === "pppoe") {
          if (mikro.type === "real") {
            await mikro.client.put("/ppp/secret", {
              name: username,
              password,
              profile: pkg.mikrotikProfileName || "default",
              service: "pppoe",
              comment: `${customer.fullName} | ${customer.phone}`,
              disabled: "false",
            });
          } else {
            mikro.client.createPppoeUser({
              username, password,
              profile: pkg.mikrotikProfileName || "default",
              service: "pppoe",
              comment: `${customer.fullName} | ${customer.phone}`,
            });
          }
        } else if (pkg.type === "hotspot") {
          if (mikro.type === "real") {
            await mikro.client.put("/ip/hotspot/user", {
              name: username,
              password,
              profile: pkg.mikrotikProfileName || "default",
              comment: `${customer.fullName} | ${customer.phone}`,
              disabled: "false",
            });
          } else {
            mikro.client.createHotspotUser({
              name: username, password,
              profile: pkg.mikrotikProfileName || "default",
              comment: `${customer.fullName} | ${customer.phone}`,
            });
          }
        }
      } catch (mtErr) {
        console.error("MikroTik provisioning warning:", mtErr);
        // Don't fail the whole operation if MikroTik push fails — the DB subscription is already created
      }
    }

    return {
      success: true,
      subscriptionId: subscription.id,
      username,
      password,
      message: `Successfully provisioned ${pkg.type} user: ${username}`,
    };
  } catch (err) {
    console.error("Provisioning error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Provisioning failed" };
  }
}

export async function provisionOrder(orderId: string): Promise<ProvisioningResult> {
  try {
    const orderRows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (orderRows.length === 0) {
      return { success: false, message: "Order not found" };
    }
    const order = orderRows[0];

    if (order.status !== "approved") {
      return { success: false, message: "Order must be approved before provisioning" };
    }

    if (order.subscriptionId) {
      return { success: false, message: "Order already provisioned" };
    }

    const result = await provisionCustomer(order.customerId, order.packageId);
    if (!result.success) return result;

    await db.update(orders).set({ subscriptionId: result.subscriptionId }).where(eq(orders.id, orderId));

    return result;
  } catch (err) {
    console.error("Provisioning error:", err);
    return { success: false, message: err instanceof Error ? err.message : "Provisioning failed" };
  }
}
