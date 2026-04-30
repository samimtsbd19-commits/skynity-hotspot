import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgres://skynity_user:CHANGE_ME_STRONG_PASSWORD@localhost:5432/skynity",
  },
});
