import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, lte, gte } from "drizzle-orm";
import { subscriptions, customers } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import { mikrotikService } from "../mikrotik/service";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export interface Alert {
  id: string;
  type: "cpu" | "temperature" | "interface" | "expiry" | "system";
  severity: "warning" | "critical";
  message: string;
  timestamp: Date;
}

export async function checkSystemAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  try {
    // Check CPU
    const resource = await mikrotikService.getSystemResource();
    if (resource.cpuLoad > 80) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: "cpu",
        severity: resource.cpuLoad > 95 ? "critical" : "warning",
        message: `High CPU usage: ${resource.cpuLoad}%`,
        timestamp: new Date(),
      });
    }

    // Check temperature
    const health = await mikrotikService.getSystemHealth();
    if (health.temperature > 65) {
      alerts.push({
        id: `temp-${Date.now()}`,
        type: "temperature",
        severity: health.temperature > 75 ? "critical" : "warning",
        message: `High router temperature: ${health.temperature}°C`,
        timestamp: new Date(),
      });
    }

    // Check interfaces
    const interfaces = await mikrotikService.getInterfaceList();
    for (const iface of interfaces) {
      if (!iface.isUp && iface.name !== "lo") {
        alerts.push({
          id: `iface-${iface.name}-${Date.now()}`,
          type: "interface",
          severity: "warning",
          message: `Interface ${iface.name} is down`,
          timestamp: new Date(),
        });
      }
    }
  } catch (err) {
    alerts.push({
      id: `system-${Date.now()}`,
      type: "system",
      severity: "critical",
      message: "Failed to check router health",
      timestamp: new Date(),
    });
  }

  return alerts;
}

export async function checkExpiringSubscriptions(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Check subscriptions expiring in 3 days
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const now = new Date();

  const expiringRows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        gte(subscriptions.expiresAt, now),
        lte(subscriptions.expiresAt, threeDaysFromNow)
      )
    );

  for (const sub of expiringRows) {
    const daysLeft = Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: `expiry-${sub.id}`,
      type: "expiry",
      severity: daysLeft <= 1 ? "critical" : "warning",
      message: `Subscription ${sub.username} expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
      timestamp: new Date(),
    });
  }

  return alerts;
}
