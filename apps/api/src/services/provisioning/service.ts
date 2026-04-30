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

export async function provisionOrder(orderId: string): Promise<ProvisioningResult> {
  try {
    // Get order details
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

    // Get customer
    const customerRows = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
    if (customerRows.length === 0) {
      return { success: false, message: "Customer not found" };
    }
    const customer = customerRows[0];

    // Get package
    const pkgRows = await db.select().from(packages).where(eq(packages.id, order.packageId)).limit(1);
    if (pkgRows.length === 0) {
      return { success: false, message: "Package not found" };
    }
    const pkg = pkgRows[0];

    // Generate credentials: phone = username, last 6 digits of phone = password (or random)
    const username = customer.phone.replace(/^\+?88/, ""); // Remove +88 or 88 prefix
    const password = customer.phone.slice(-6) + "SKY"; // Last 6 digits + SKY

    // Calculate expiry
    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(startedAt.getDate() + (pkg.validityDays || 30));

    // Create subscription
    const subResult = await db.insert(subscriptions).values({
      customerId: customer.id,
      packageId: pkg.id,
      username,
      passwordEncrypted: password, // In production, encrypt this
      status: "active",
      startedAt,
      expiresAt,
      autoRenew: false,
    }).returning();

    const subscription = subResult[0];

    // Push to MikroTik (mock mode)
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

    // Update order with subscription ID
    await db.update(orders).set({ subscriptionId: subscription.id }).where(eq(orders.id, orderId));

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
