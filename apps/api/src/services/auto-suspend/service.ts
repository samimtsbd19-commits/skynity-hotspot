import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, lte } from "drizzle-orm";
import { subscriptions } from "@skynity/db/schema/index";
import { buildDatabaseUrl } from "../../config/env";
import { mikrotikService } from "../mikrotik/service";
import { blockRadiusUser } from "../radius/service";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export async function suspendExpiredSubscriptions(): Promise<{
  suspended: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];

  const expiredRows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.expiresAt, now)
      )
    );

  let suspended = 0;

  for (const sub of expiredRows) {
    try {
      await mikrotikService.blockPppoeUser(sub.username);
      await blockRadiusUser(sub.username);
      await db
        .update(subscriptions)
        .set({ status: "expired", updatedAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      suspended++;
    } catch (err: any) {
      errors.push(`Failed to suspend ${sub.username}: ${err.message}`);
    }
  }

  return { suspended, errors };
}
