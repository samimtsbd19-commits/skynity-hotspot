import { env } from "../../config/env";
import { mockMikrotikService } from "./mock";

export interface RouterCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
}

export class MikroTikClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(creds: RouterCredentials) {
    const protocol = creds.useSsl ? "https" : "http";
    this.baseUrl = `${protocol}://${creds.host}:${creds.port}/rest`;
    this.authHeader = "Basic " + Buffer.from(`${creds.username}:${creds.password}`).toString("base64");
  }

  async fetch(path: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number(env.MIKROTIK_API_TIMEOUT_MS));

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`RouterOS API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  async get(path: string) {
    return this.fetch(path);
  }

  async put(path: string, body: unknown) {
    return this.fetch(path, { method: "PUT", body: JSON.stringify(body) });
  }

  async post(path: string, body: unknown) {
    return this.fetch(path, { method: "POST", body: JSON.stringify(body) });
  }

  async patch(path: string, body: unknown) {
    return this.fetch(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  async del(path: string) {
    return this.fetch(path, { method: "DELETE" });
  }
}

export function getMikrotikClient(): MikroTikClient {
  if (env.MIKROTIK_MOCK === "true") {
    throw new Error("Mock mode: use mockMikrotikService directly");
  }
  return new MikroTikClient({
    host: process.env.MIKROTIK_HOST || "10.100.0.2",
    port: Number(env.MIKROTIK_DEFAULT_API_PORT),
    username: process.env.MIKROTIK_USERNAME || "admin",
    password: process.env.MIKROTIK_PASSWORD || "",
    useSsl: env.MIKROTIK_USE_SSL !== "false",
  });
}

export { mockMikrotikService };
