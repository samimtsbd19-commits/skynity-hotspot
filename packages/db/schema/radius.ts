import {
  pgTable,
  serial,
  bigint,
  varchar,
  integer,
  text,
  timestamp,
  numeric,
  inet,
} from "drizzle-orm/pg-core";

export const radcheck = pgTable("radcheck", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().default(""),
  attribute: varchar("attribute", { length: 64 }).notNull().default(""),
  op: varchar("op", { length: 2 }).notNull().default("=="),
  value: varchar("value", { length: 253 }).notNull().default(""),
});

export const radreply = pgTable("radreply", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().default(""),
  attribute: varchar("attribute", { length: 64 }).notNull().default(""),
  op: varchar("op", { length: 2 }).notNull().default("="),
  value: varchar("value", { length: 253 }).notNull().default(""),
});

export const radgroupcheck = pgTable("radgroupcheck", {
  id: serial("id").primaryKey(),
  groupName: varchar("groupname", { length: 64 }).notNull().default(""),
  attribute: varchar("attribute", { length: 64 }).notNull().default(""),
  op: varchar("op", { length: 2 }).notNull().default("=="),
  value: varchar("value", { length: 253 }).notNull().default(""),
});

export const radgroupreply = pgTable("radgroupreply", {
  id: serial("id").primaryKey(),
  groupName: varchar("groupname", { length: 64 }).notNull().default(""),
  attribute: varchar("attribute", { length: 64 }).notNull().default(""),
  op: varchar("op", { length: 2 }).notNull().default("="),
  value: varchar("value", { length: 253 }).notNull().default(""),
});

export const radusergroup = pgTable("radusergroup", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 64 }).notNull().default(""),
  groupName: varchar("groupname", { length: 64 }).notNull().default(""),
  priority: integer("priority").notNull().default(1),
});

export const radacct = pgTable("radacct", {
  radacctid: serial("radacctid").primaryKey(),
  acctsessionid: varchar("acctsessionid", { length: 64 }).notNull().default(""),
  acctuniqueid: varchar("acctuniqueid", { length: 32 }).notNull().default(""),
  username: varchar("username", { length: 64 }).notNull().default(""),
  realm: varchar("realm", { length: 64 }).default(""),
  nasipaddress: inet("nasipaddress").notNull(),
  nasportid: varchar("nasportid", { length: 15 }).default(""),
  nasporttype: varchar("nasporttype", { length: 32 }).default(""),
  acctstarttime: timestamp("acctstarttime", { withTimezone: true }),
  acctupdatetime: timestamp("acctupdatetime", { withTimezone: true }),
  acctstoptime: timestamp("acctstoptime", { withTimezone: true }),
  acctinterval: integer("acctinterval"),
  acctsessiontime: bigint("acctsessiontime", { mode: "number" }),
  acctauthentic: varchar("acctauthentic", { length: 32 }).default(""),
  connectinfoStart: varchar("connectinfo_start", { length: 128 }).default(""),
  connectinfoStop: varchar("connectinfo_stop", { length: 128 }).default(""),
  acctinputoctets: bigint("acctinputoctets", { mode: "number" }),
  acctoutputoctets: bigint("acctoutputoctets", { mode: "number" }),
  calledstationid: varchar("calledstationid", { length: 50 }).notNull().default(""),
  callingstationid: varchar("callingstationid", { length: 50 }).notNull().default(""),
  acctterminatecause: varchar("acctterminatecause", { length: 32 }).notNull().default(""),
  servicetype: varchar("servicetype", { length: 32 }).default(""),
  framedprotocol: varchar("framedprotocol", { length: 32 }).default(""),
  framedipaddress: inet("framedipaddress").default("0.0.0.0"),
});
