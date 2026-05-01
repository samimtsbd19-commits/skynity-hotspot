import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  bigint,
  numeric,
  inet,
  macaddr,
  serial,
  smallint,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ── Enums
export const userRoleEnum = pgEnum("user_role", ["superadmin", "admin", "reseller", "viewer"]);
export const packageTypeEnum = pgEnum("package_type", ["pppoe", "hotspot", "static"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "suspended", "expired", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["bkash", "nagad", "rocket", "cash", "bank", "free"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "approved", "rejected", "refunded"]);
export const voucherStatusEnum = pgEnum("voucher_status", ["unused", "used", "expired", "revoked"]);

// ── 1. organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── 2. users
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 100 }),
    role: userRoleEnum("role").notNull().default("admin"),
    telegramId: bigint("telegram_id", { mode: "number" }).unique(),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgIdx: index("users_org_id_idx").on(t.orgId), roleIdx: index("users_role_idx").on(t.role) })
);

// ── 3. refresh_tokens
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ── 4. routers
export const routers = pgTable(
  "routers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    name: varchar("name", { length: 100 }).notNull(),
    vendor: varchar("vendor", { length: 50 }).default("mikrotik"),
    host: varchar("host", { length: 255 }).notNull().default(""),
    wireguardPeerIp: inet("wireguard_peer_ip").notNull(),
    apiPort: integer("api_port").default(8728),
    apiSslPort: integer("api_ssl_port").default(8729),
    username: varchar("username", { length: 100 }).notNull(),
    passwordEncrypted: text("password_encrypted").notNull(),
    useSsl: boolean("use_ssl").default(true),
    identity: varchar("identity", { length: 100 }),
    model: varchar("model", { length: 100 }),
    rosVersion: varchar("ros_version", { length: 50 }),
    serial: varchar("serial", { length: 100 }),
    licenseLevel: smallint("license_level"),
    uptimeSeconds: bigint("uptime_seconds", { mode: "number" }),
    cpuLoad: smallint("cpu_load"),
    freeMemoryMb: integer("free_memory_mb"),
    temperatureCelsius: numeric("temperature_celsius", { precision: 5, scale: 1 }),
    isDefault: boolean("is_default").default(false),
    isActive: boolean("is_active").default(true),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgIdx: index("routers_org_id_idx").on(t.orgId), activeIdx: index("routers_is_active_idx").on(t.isActive) })
);

// ── 5. wireguard_peers
export const wireguardPeers = pgTable("wireguard_peers", {
  id: uuid("id").primaryKey().defaultRandom(),
  routerId: uuid("router_id").references(() => routers.id).unique(),
  publicKey: varchar("public_key", { length: 44 }).notNull(),
  presharedKeyEnc: varchar("preshared_key_enc", { length: 255 }),
  allowedIps: varchar("allowed_ips", { length: 100 }).notNull(),
  lastHandshakeAt: timestamp("last_handshake_at", { withTimezone: true }),
  rxBytes: bigint("rx_bytes", { mode: "number" }).default(0),
  txBytes: bigint("tx_bytes", { mode: "number" }).default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ── 6. packages
export const packages = pgTable(
  "packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    name: varchar("name", { length: 100 }).notNull(),
    type: packageTypeEnum("type").notNull(),
    downloadMbps: integer("download_mbps").notNull(),
    uploadMbps: integer("upload_mbps").notNull(),
    burstDownloadMbps: integer("burst_download_mbps"),
    burstUploadMbps: integer("burst_upload_mbps"),
    burstThresholdMbps: integer("burst_threshold_mbps"),
    burstTimeSeconds: integer("burst_time_seconds"),
    priceBdt: numeric("price_bdt", { precision: 10, scale: 2 }).notNull(),
    validityDays: integer("validity_days").notNull(),
    radiusGroupName: varchar("radius_group_name", { length: 100 }),
    mikrotikProfileName: varchar("mikrotik_profile_name", { length: 100 }),
    description: text("description"),
    isTrial: boolean("is_trial").default(false),
    isActive: boolean("is_active").default(true),
    templateConfig: jsonb("template_config").default("{}"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgIdx: index("packages_org_id_idx").on(t.orgId), typeIdx: index("packages_type_idx").on(t.type) })
);

// ── 7. customers
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    customerCode: varchar("customer_code", { length: 20 }).unique(),
    fullName: varchar("full_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    nid: varchar("nid", { length: 50 }),
    telegramChatId: bigint("telegram_chat_id", { mode: "number" }).unique(),
    referredBy: uuid("referred_by").references((): any => customers.id),
    createdBy: uuid("created_by").references(() => users.id),
    passwordHash: varchar("password_hash", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgIdx: index("customers_org_id_idx").on(t.orgId), phoneIdx: index("customers_phone_idx").on(t.phone) })
);

// ── 8. subscriptions
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id).notNull(),
    packageId: uuid("package_id").references(() => packages.id).notNull(),
    routerId: uuid("router_id").references(() => routers.id),
    username: varchar("username", { length: 100 }).notNull().unique(),
    passwordEncrypted: text("password_encrypted").notNull(),
    ipAddress: inet("ip_address"),
    macAddress: macaddr("mac_address"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    autoRenew: boolean("auto_renew").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerIdx: index("subscriptions_customer_id_idx").on(t.customerId),
    packageIdx: index("subscriptions_package_id_idx").on(t.packageId),
    routerIdx: index("subscriptions_router_id_idx").on(t.routerId),
    statusIdx: index("subscriptions_status_idx").on(t.status),
    expiresIdx: index("subscriptions_expires_at_idx").on(t.expiresAt),
  })
);

// ── 9. orders
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id).notNull(),
    packageId: uuid("package_id").references(() => packages.id).notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    amountBdt: numeric("amount_bdt", { precision: 10, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    trxId: varchar("trx_id", { length: 100 }),
    paymentFrom: varchar("payment_from", { length: 20 }),
    screenshotUrl: text("screenshot_url"),
    status: orderStatusEnum("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    telegramMessageId: bigint("telegram_message_id", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerIdx: index("orders_customer_id_idx").on(t.customerId),
    statusIdx: index("orders_status_idx").on(t.status),
    createdIdx: index("orders_created_at_idx").on(t.createdAt),
  })
);

// ── 10. vouchers
export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id),
    code: varchar("code", { length: 32 }).notNull().unique(),
    packageId: uuid("package_id").references(() => packages.id),
    batchName: varchar("batch_name", { length: 100 }),
    status: voucherStatusEnum("status").notNull().default("unused"),
    usedBy: uuid("used_by").references(() => customers.id),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgIdx: index("vouchers_org_id_idx").on(t.orgId), statusIdx: index("vouchers_status_idx").on(t.status) })
);

// ── 11. invoices
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id).unique(),
    invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id).notNull(),
    amountBdt: numeric("amount_bdt", { precision: 10, scale: 2 }).notNull(),
    taxBdt: numeric("tax_bdt", { precision: 10, scale: 2 }).default("0"),
    totalBdt: numeric("total_bdt", { precision: 10, scale: 2 }).notNull(),
    pdfUrl: text("pdf_url"),
    issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (t) => ({ customerIdx: index("invoices_customer_id_idx").on(t.customerId) })
);

// ── 12. bandwidth_snapshots
export const bandwidthSnapshots = pgTable(
  "bandwidth_snapshots",
  {
    id: serial("id").primaryKey(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
    routerId: uuid("router_id").references(() => routers.id),
    rxBytes: bigint("rx_bytes", { mode: "number" }).notNull(),
    txBytes: bigint("tx_bytes", { mode: "number" }).notNull(),
    rxRateBps: bigint("rx_rate_bps", { mode: "number" }),
    txRateBps: bigint("tx_rate_bps", { mode: "number" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    routerIdx: index("bw_snap_router_id_idx").on(t.routerId),
    subIdx: index("bw_snap_sub_id_idx").on(t.subscriptionId),
    capturedIdx: index("bw_snap_captured_at_idx").on(t.capturedAt),
  })
);

// ── 13. ping_snapshots
export const pingSnapshots = pgTable(
  "ping_snapshots",
  {
    id: serial("id").primaryKey(),
    routerId: uuid("router_id").references(() => routers.id),
    targetHost: varchar("target_host", { length: 100 }).notNull(),
    avgMs: numeric("avg_ms", { precision: 8, scale: 2 }),
    minMs: numeric("min_ms", { precision: 8, scale: 2 }),
    maxMs: numeric("max_ms", { precision: 8, scale: 2 }),
    packetLossPct: numeric("packet_loss_pct", { precision: 5, scale: 2 }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    routerIdx: index("ping_router_id_idx").on(t.routerId),
    capturedIdx: index("ping_captured_at_idx").on(t.capturedAt),
  })
);

// ── 14. sfp_snapshots
export const sfpSnapshots = pgTable(
  "sfp_snapshots",
  {
    id: serial("id").primaryKey(),
    routerId: uuid("router_id").references(() => routers.id),
    interfaceName: varchar("interface_name", { length: 50 }).notNull(),
    txPowerDbm: numeric("tx_power_dbm", { precision: 6, scale: 2 }),
    rxPowerDbm: numeric("rx_power_dbm", { precision: 6, scale: 2 }),
    temperatureC: numeric("temperature_c", { precision: 6, scale: 2 }),
    voltageV: numeric("voltage_v", { precision: 6, scale: 3 }),
    currentMa: numeric("current_ma", { precision: 8, scale: 2 }),
    wavelengthNm: integer("wavelength_nm"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    routerIdx: index("sfp_router_id_idx").on(t.routerId),
    capturedIdx: index("sfp_captured_at_idx").on(t.capturedAt),
  })
);

// ── 15. resource_snapshots
export const resourceSnapshots = pgTable(
  "resource_snapshots",
  {
    id: serial("id").primaryKey(),
    routerId: uuid("router_id").references(() => routers.id),
    cpuLoadPct: smallint("cpu_load_pct"),
    freeMemoryMb: integer("free_memory_mb"),
    totalMemoryMb: integer("total_memory_mb"),
    temperatureC: numeric("temperature_c", { precision: 5, scale: 1 }),
    voltageV: numeric("voltage_v", { precision: 5, scale: 2 }),
    uptimeSeconds: bigint("uptime_seconds", { mode: "number" }),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    routerIdx: index("res_router_id_idx").on(t.routerId),
    capturedIdx: index("res_captured_at_idx").on(t.capturedAt),
  })
);

// ── 16. activity_log
export const activityLog = pgTable(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 50 }),
    entityId: uuid("entity_id"),
    changes: jsonb("changes"),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userIdx: index("activity_user_id_idx").on(t.userId),
    entityIdx: index("activity_entity_idx").on(t.entityType, t.entityId),
  })
);

// ── 17. payment_configs
export const paymentConfigs = pgTable(
  "payment_configs",
  {
    id: serial("id").primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id),
    method: varchar("method", { length: 20 }).notNull(),
    accountNumber: varchar("account_number", { length: 20 }).notNull(),
    accountType: varchar("account_type", { length: 20 }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({ orgMethodIdx: uniqueIndex("payment_configs_org_method_idx").on(t.orgId, t.method) })
);

// ── 18. app_settings
export const appSettings = pgTable(
  "app_settings",
  {
    id: serial("id").primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id),
    key: varchar("key", { length: 100 }).notNull(),
    value: text("value"),
    type: varchar("type", { length: 20 }).default("string"),
  },
  (t) => ({ orgKeyIdx: uniqueIndex("app_settings_org_key_idx").on(t.orgId, t.key) })
);

// ── 19. support_tickets
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => customers.id).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("open"),
    priority: varchar("priority", { length: 20 }).default("normal"),
    assignedTo: uuid("assigned_to").references(() => users.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    customerIdx: index("tickets_customer_id_idx").on(t.customerId),
    statusIdx: index("tickets_status_idx").on(t.status),
  })
);

// ── 20. support_messages
export const supportMessages = pgTable(
  "support_messages",
  {
    id: serial("id").primaryKey(),
    ticketId: uuid("ticket_id").references(() => supportTickets.id).notNull(),
    senderType: varchar("sender_type", { length: 20 }).notNull(), // 'customer' | 'admin'
    senderId: uuid("sender_id").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    ticketIdx: index("messages_ticket_id_idx").on(t.ticketId),
    createdIdx: index("messages_created_at_idx").on(t.createdAt),
  })
);
