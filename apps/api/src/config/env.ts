import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.string().default("5432"),
  POSTGRES_DB: z.string().default("skynity"),
  POSTGRES_USER: z.string().default("skynity_user"),
  POSTGRES_PASSWORD: z.string().default("skynity_pass"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(32).default("skynity-jwt-secret-change-me-in-production-32b"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),
  ENCRYPTION_KEY: z.string().min(32).default("skynity-encryption-key-change-me-32b"),
  MIKROTIK_MOCK: z.string().default("false"),
  MIKROTIK_DEFAULT_API_PORT: z.string().default("8729"),
  MIKROTIK_API_TIMEOUT_MS: z.string().default("5000"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CUSTOMER_BOT_TOKEN: z.string().optional(),
  TELEGRAM_ADMIN_IDS: z.string().optional(),
  RADIUS_HOST: z.string().default("freeradius"),
  RADIUS_SECRET: z.string().default("radiussecret"),
  RADIUS_AUTH_PORT: z.string().default("1812"),
  RADIUS_ACCT_PORT: z.string().default("1813"),
  WG_SERVER_IP: z.string().default("10.100.0.1/24"),
  WG_LISTEN_PORT: z.string().default("51820"),
  BKASH_NUMBER: z.string().optional(),
  NAGAD_NUMBER: z.string().optional(),
  ROCKET_NUMBER: z.string().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  NAGAD_MERCHANT_ID: z.string().optional(),
  SMS_API_URL: z.string().optional(),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAIL: z.string().default("admin@skynity.net"),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().default("admin123"),
  BOOTSTRAP_ORG_NAME: z.string().default("SKYNITY ISP"),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export const buildDatabaseUrl = (): string => {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  return `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`;
};
