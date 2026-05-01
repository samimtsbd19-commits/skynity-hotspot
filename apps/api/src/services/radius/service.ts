import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and } from "drizzle-orm";
import { radcheck, radreply, radusergroup, radgroupreply } from "@skynity/db/schema/radius";
import { buildDatabaseUrl } from "../../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export interface RadiusUserConfig {
  username: string;
  password: string;
  rateLimit?: string; // e.g. "5M/5M"
  groupName?: string;
  ipAddress?: string;
}

/**
 * Add or update a user in RADIUS radcheck table
 */
export async function upsertRadcheckUser(config: RadiusUserConfig): Promise<void> {
  // Remove existing entries for this user
  await db.delete(radcheck).where(eq(radcheck.username, config.username));

  // Insert Cleartext-Password
  await db.insert(radcheck).values({
    username: config.username,
    attribute: "Cleartext-Password",
    op: ":=",
    value: config.password,
  });

  // Insert NAS-Port-Type if needed (for PPPoE)
  await db.insert(radcheck).values({
    username: config.username,
    attribute: "NAS-Port-Type",
    op: "==",
    value: "Ethernet",
  });
}

/**
 * Add or update RADIUS reply attributes for a user
 */
export async function upsertRadreplyUser(config: RadiusUserConfig): Promise<void> {
  await db.delete(radreply).where(eq(radreply.username, config.username));

  if (config.rateLimit) {
    await db.insert(radreply).values({
      username: config.username,
      attribute: "MikroTik-Rate-Limit",
      op: ":=",
      value: config.rateLimit,
    });
  }

  if (config.ipAddress) {
    await db.insert(radreply).values({
      username: config.username,
      attribute: "Framed-IP-Address",
      op: ":=",
      value: config.ipAddress,
    });
  }
}

/**
 * Assign user to a RADIUS group
 */
export async function assignUserGroup(username: string, groupName: string): Promise<void> {
  await db.delete(radusergroup).where(eq(radusergroup.username, username));
  await db.insert(radusergroup).values({
    username,
    groupName,
    priority: 1,
  });
}

/**
 * Remove user from all RADIUS tables (disable/suspend)
 */
export async function removeRadiusUser(username: string): Promise<void> {
  await db.delete(radcheck).where(eq(radcheck.username, username));
  await db.delete(radreply).where(eq(radreply.username, username));
  await db.delete(radusergroup).where(eq(radusergroup.username, username));
}

/**
 * Block user in RADIUS (add Auth-Type := Reject)
 */
export async function blockRadiusUser(username: string): Promise<void> {
  // Remove any existing auth entries
  await db
    .delete(radcheck)
    .where(and(eq(radcheck.username, username), eq(radcheck.attribute, "Cleartext-Password")));

  // Add reject entry
  await db.insert(radcheck).values({
    username,
    attribute: "Auth-Type",
    op: ":=",
    value: "Reject",
  });
}

/**
 * Unblock user in RADIUS (restore password)
 */
export async function unblockRadiusUser(username: string, password: string): Promise<void> {
  await db
    .delete(radcheck)
    .where(and(eq(radcheck.username, username), eq(radcheck.attribute, "Auth-Type")));

  await db.insert(radcheck).values({
    username,
    attribute: "Cleartext-Password",
    op: ":=",
    value: password,
  });
}

/**
 * Create or update a RADIUS group profile with bandwidth limits
 */
export async function upsertRadiusGroup(
  groupName: string,
  rateLimit: string
): Promise<void> {
  // Remove existing group replies
  await db.delete(radgroupreply).where(eq(radgroupreply.groupName, groupName));

  // Add rate limit
  await db.insert(radgroupreply).values({
    groupName,
    attribute: "MikroTik-Rate-Limit",
    op: ":=",
    value: rateLimit,
  });

  // Add session timeout (24 hours default)
  await db.insert(radgroupreply).values({
    groupName,
    attribute: "Session-Timeout",
    op: ":=",
    value: "86400",
  });
}

/**
 * Initialize default RADIUS group profiles for SKYNITY
 */
export async function initializeRadiusGroups(): Promise<void> {
  const groups = [
    { name: "skynity-5m", rateLimit: "5M/5M" },
    { name: "skynity-10m", rateLimit: "10M/10M" },
    { name: "skynity-20m", rateLimit: "20M/20M" },
    { name: "skynity-50m", rateLimit: "50M/50M" },
    { name: "skynity-100m", rateLimit: "100M/100M" },
    { name: "skynity-hotspot", rateLimit: "5M/5M" },
  ];

  for (const group of groups) {
    await upsertRadiusGroup(group.name, group.rateLimit);
  }
}

/**
 * Get user's RADIUS config
 */
export async function getRadiusUserConfig(username: string) {
  const checks = await db.select().from(radcheck).where(eq(radcheck.username, username));
  const replies = await db.select().from(radreply).where(eq(radreply.username, username));
  const groups = await db.select().from(radusergroup).where(eq(radusergroup.username, username));

  return { checks, replies, groups };
}
