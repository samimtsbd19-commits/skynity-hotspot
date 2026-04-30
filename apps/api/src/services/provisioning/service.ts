import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { customers, packages, orders, subscriptions } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import { mockMikrotikService } from "../mikrotik/client";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export interface ProvisioningResult {
  success: boolean;
  subscriptionId?: string;
  username?: string;
  password?: string;
  message: string;
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
    const password = customer.phone.slice(-6) + "SKY";

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
      if (pkg.type === "pppoe") {
        mockMikrotikService.createPppoeUser({
          username,
          password,
          profile: pkg.mikrotikProfileName || "default",
          service: "pppoe",
          comment: `${customer.fullName} | ${customer.phone}`,
        });
      } else if (pkg.type === "hotspot") {
        mockMikrotikService.createHotspotUser({
          name: username,
          password,
          profile: pkg.mikrotikProfileName || "default",
          comment: `${customer.fullName} | ${customer.phone}`,
        });
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
