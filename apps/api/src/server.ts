import "dotenv/config";
import { buildApp } from "./app";
import { env } from "./config/env";
import { startTelegramBot, stopTelegramBot } from "./services/telegram/bot";
import { startBandwidthSocketEmitter } from "./sockets/bandwidth.socket";
import { startResourceSocketEmitter } from "./sockets/resource.socket";
import { startPingSocketEmitter } from "./sockets/ping.socket";
import { startLiveStatsSocketEmitter } from "./sockets/livestats.socket";

async function start() {
  const app = await buildApp();
  const port = Number(env.PORT);
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`🚀 SKYNITY API running on port ${port}`);

  // Start Socket.IO emitters
  startBandwidthSocketEmitter(app);
  startResourceSocketEmitter(app);
  startPingSocketEmitter(app);
  startLiveStatsSocketEmitter(app);
  app.log.info("📡 Socket.IO emitters started");

  // Start Telegram bot
  const bot = startTelegramBot();
  if (bot) {
    app.log.info("🤖 Telegram bot started");
  }

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    app.log.info("SIGTERM received, shutting down gracefully...");
    await stopTelegramBot();
    await app.close();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
