import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().uuid(),
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^01[3-9]\d{8}$/),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  nid: z.string().optional(),
  notes: z.string().optional(),
});

export const createPackageSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["pppoe", "hotspot", "static"]),
  downloadMbps: z.number().int().min(1),
  uploadMbps: z.number().int().min(1),
  burstDownloadMbps: z.number().int().optional(),
  burstUploadMbps: z.number().int().optional(),
  burstThresholdMbps: z.number().int().optional(),
  burstTimeSeconds: z.number().int().optional(),
  priceBdt: z.number().min(0),
  validityDays: z.number().int().min(1),
  radiusGroupName: z.string().optional(),
  mikrotikProfileName: z.string().optional(),
  description: z.string().optional(),
  isTrial: z.boolean().default(false),
  isActive: z.boolean().default(true),
  templateConfig: z.string().optional().or(z.record(z.any())).optional(),
});

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  packageId: z.string().uuid(),
  amountBdt: z.number().min(0),
  paymentMethod: z.enum(["bkash", "nagad", "rocket", "cash", "bank", "free"]),
  trxId: z.string().optional(),
  paymentFrom: z.string().optional(),
});

export const createPppoeUserSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(100),
  profile: z.string().min(1),
  service: z.string().default("pppoe"),
  comment: z.string().optional(),
});

export const pingTargetSchema = z.object({
  host: z.string().min(1),
  label: z.string().optional(),
});

export const appSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  type: z.enum(["string", "json", "boolean", "number"]).default("string"),
});

export const createVoucherSchema = z.object({
  packageId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  batchName: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreatePppoeUserInput = z.infer<typeof createPppoeUserSchema>;
export type PingTargetInput = z.infer<typeof pingTargetSchema>;
export type AppSettingInput = z.infer<typeof appSettingSchema>;
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>;
