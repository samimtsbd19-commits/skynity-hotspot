import fp from "fastify-plugin";
import Redis from "ioredis";
import { FastifyInstance } from "fastify";
import { env } from "../config/env";

export const redisPlugin = fp(async (app: FastifyInstance) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  redis.on("error", (err) => {
    app.log.error({ msg: "Redis connection error", err });
  });

  redis.on("connect", () => {
    app.log.info("Redis connected");
  });

  app.decorate("redis", redis);

  app.addHook("onClose", async () => {
    await redis.quit();
  });
});

declare module "fastify" {
  interface FastifyInstance {
    redis: Redis;
  }
}
