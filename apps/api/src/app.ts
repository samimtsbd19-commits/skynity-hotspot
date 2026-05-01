import fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import cookie from "@fastify/cookie";
import { env } from "./config/env";
import { authPlugin } from "./plugins/auth";
import { redisPlugin } from "./plugins/redis";
import { socketPlugin } from "./plugins/socket";

import authRoutes from "./routes/auth";
import monitoringResourceRoutes from "./routes/monitoring/resource";
import monitoringBandwidthRoutes from "./routes/monitoring/bandwidth";
import monitoringPingRoutes from "./routes/monitoring/ping";
import monitoringSfpRoutes from "./routes/monitoring/sfp";
import monitoringQueuesRoutes from "./routes/monitoring/queues";
import monitoringNeighborsRoutes from "./routes/monitoring/neighbors";
import monitoringHistoryRoutes from "./routes/monitoring/history";
import pppoeRoutes from "./routes/pppoe";
import hotspotRoutes from "./routes/hotspot";
import customerRoutes from "./routes/customers";
import packageRoutes from "./routes/packages";
import orderRoutes from "./routes/orders";
import billingRoutes from "./routes/billing";
import deviceRoutes from "./routes/device";
import settingsRoutes from "./routes/settings";
import voucherRoutes from "./routes/vouchers";
import routerRoutes from "./routes/router";
import routerConfigRoutes from "./routes/router-config";
import portalAuthRoutes from "./routes/portal-auth";
import portalApiRoutes from "./routes/portal-api";
import analyticsRoutes from "./routes/analytics";
import notificationRoutes from "./routes/notifications";
import paymentRoutes from "./routes/payment";
import invoiceRoutes from "./routes/invoice";
import nmsRoutes from "./routes/nms";
import supportRoutes from "./routes/support";
import alertRoutes from "./routes/alerts";

export async function buildApp() {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
      transport: env.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
    },
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  });

  await app.register(cors, {
    origin: env.APP_URL,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.JWT_SECRET,
    parseOptions: {},
  });

  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

  await app.register(sensible);
  await app.register(redisPlugin);
  await app.register(socketPlugin);
  await app.register(authPlugin);

  // Apply stricter rate limit to auth routes
  await app.register(async (authScope) => {
    await authScope.register(rateLimit, {
      max: 10,
      timeWindow: "1 minute",
    });
    await authScope.register(authRoutes, { prefix: "/auth" });
  });

  await app.register(monitoringResourceRoutes, { prefix: "/monitoring/resource" });
  await app.register(monitoringBandwidthRoutes, { prefix: "/monitoring/bandwidth" });
  await app.register(monitoringPingRoutes, { prefix: "/monitoring/ping" });
  await app.register(monitoringSfpRoutes, { prefix: "/monitoring/sfp" });
  await app.register(monitoringQueuesRoutes, { prefix: "/monitoring/queues" });
  await app.register(monitoringNeighborsRoutes, { prefix: "/monitoring/neighbors" });
  await app.register(monitoringHistoryRoutes, { prefix: "/monitoring/history" });
  await app.register(pppoeRoutes, { prefix: "/pppoe" });
  await app.register(hotspotRoutes, { prefix: "/hotspot" });
  await app.register(customerRoutes, { prefix: "/customers" });
  await app.register(packageRoutes, { prefix: "/packages" });
  await app.register(orderRoutes, { prefix: "/orders" });
  await app.register(billingRoutes, { prefix: "/billing" });
  await app.register(deviceRoutes, { prefix: "/device" });
  await app.register(settingsRoutes, { prefix: "/settings" });
  await app.register(voucherRoutes, { prefix: "/vouchers" });
  await app.register(routerRoutes, { prefix: "/routers" });
  await app.register(routerConfigRoutes, { prefix: "/router-config" });
  await app.register(portalAuthRoutes, { prefix: "/portal-auth" });
  await app.register(portalApiRoutes, { prefix: "/portal-api" });
  await app.register(analyticsRoutes, { prefix: "/analytics" });
  await app.register(notificationRoutes, { prefix: "/notifications" });
  await app.register(paymentRoutes, { prefix: "/payment" });
  await app.register(invoiceRoutes, { prefix: "/invoices" });
  await app.register(nmsRoutes, { prefix: "/nms" });
  await app.register(supportRoutes, { prefix: "/support" });
  await app.register(alertRoutes, { prefix: "/alerts" });

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
      data: null,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: env.NODE_ENV === "production" ? "Internal Server Error" : error.message,
      },
    });
  });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  return app;
}
