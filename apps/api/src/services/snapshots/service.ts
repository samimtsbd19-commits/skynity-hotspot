import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { desc, gte, sql } from "drizzle-orm";
import { bandwidthSnapshots, resourceSnapshots } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import { mikrotikService } from "../mikrotik/service";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export async function recordBandwidthSnapshot(): Promise<void> {
  try {
    const interfaces = await mikrotikService.getInterfaceList();
    const queues = await mikrotikService.getSimpleQueues();

    // Record interface bandwidth
    for (const iface of interfaces) {
      await db.insert(bandwidthSnapshots).values({
        rxBytes: Number(iface.rxBytes) as any,
        txBytes: Number(iface.txBytes) as any,
        rxRateBps: iface.rxRate as any,
        txRateBps: iface.txRate as any,
        capturedAt: new Date(),
      } as any);
    }

    // Record queue bandwidth
    for (const q of queues) {
      await db.insert(bandwidthSnapshots).values({
        rxBytes: Number(q.rxBytes) as any,
        txBytes: Number(q.txBytes) as any,
        rxRateBps: q.rxRate as any,
        txRateBps: q.txRate as any,
        capturedAt: new Date(),
      } as any);
    }
  } catch (err) {
    console.error("Bandwidth snapshot error:", err);
  }
}

export async function recordResourceSnapshot(): Promise<void> {
  try {
    const resource = await mikrotikService.getSystemResource();
    const health = await mikrotikService.getSystemHealth();

    await db.insert(resourceSnapshots).values({
      cpuLoadPct: resource.cpuLoad as any,
      freeMemoryMb: resource.freeMemoryMB as any,
      totalMemoryMb: resource.totalMemoryMB as any,
      temperatureC: (health.temperature || null) as any,
      voltageV: (health.voltage || null) as any,
      uptimeSeconds: resource.uptimeSeconds as any,
      capturedAt: new Date(),
    } as any);
  } catch (err) {
    console.error("Resource snapshot error:", err);
  }
}

export async function getBandwidthHistory(hours: number = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const rows = await db
    .select()
    .from(bandwidthSnapshots)
    .where(gte(bandwidthSnapshots.capturedAt, since))
    .orderBy(bandwidthSnapshots.capturedAt);

  return rows;
}

export async function getResourceHistory(hours: number = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  const rows = await db
    .select()
    .from(resourceSnapshots)
    .where(gte(resourceSnapshots.capturedAt, since))
    .orderBy(resourceSnapshots.capturedAt);

  return rows;
}
