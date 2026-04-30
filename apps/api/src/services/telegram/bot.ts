import { Bot } from "grammy";
import { env } from "../../config/env";
import { setupAdminCommands } from "./commands/admin";
import { setupCustomerCommands } from "./commands/customer";

let bot: Bot | null = null;

export function getBot(): Bot | null {
  return bot;
}

export function startTelegramBot() {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.log("[Telegram] No bot token configured, skipping bot startup");
    return null;
  }

  bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  // Error handler
  bot.catch((err) => {
    console.error("[Telegram Bot Error]", err);
  });

  setupAdminCommands(bot);
  setupCustomerCommands(bot);

  bot.start({
    drop_pending_updates: true,
    onStart: (info) => {
      console.log(`[Telegram] Bot @${info.username} started successfully`);
    },
  });

  return bot;
}

export async function stopTelegramBot() {
  if (bot) {
    await bot.stop();
    bot = null;
  }
}
