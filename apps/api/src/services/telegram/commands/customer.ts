import { Bot, InlineKeyboard } from "grammy";

export function setupCustomerCommands(bot: Bot) {
  bot.command("start", async (ctx) => {
    if (ctx.chat?.type === "private") {
      const keyboard = new InlineKeyboard()
        .text("📦 Browse Packages", "browse_packages")
        .row()
        .text("💳 My Status", "my_status")
        .text("📊 Usage", "my_usage")
        .row()
        .text("🔄 Renew", "renew")
        .text("🎫 Support", "support");

      await ctx.reply(
        `🛰️ <b>Welcome to SKYNITY!</b>\n\nYour internet, simplified.\n\nUse the buttons below or type:\n/buy — Browse packages\n/mystatus — View subscription\n/usage — Bandwidth usage\n/renew — Renew package\n/support — Get help\n/invoice — Download invoice`,
        { parse_mode: "HTML", reply_markup: keyboard }
      );
    }
  });

  bot.command("buy", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("Home Basic - ৳350", "order:home_basic")
      .row()
      .text("Home Plus - ৳550", "order:home_plus")
      .row()
      .text("Home Premium - ৳800", "order:home_premium")
      .row()
      .text("Business 50M - ৳1500", "order:business_50m");

    await ctx.reply(
      `📦 <b>Our Packages</b>\n\nSelect a plan to get started:`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  });

  bot.command("mystatus", async (ctx) => {
    await ctx.reply(
      `📊 <b>Your Subscription</b>\n\n📦 Plan: Home Premium (30 Mbps)\n📅 Started: 2024-05-15\n⏰ Expires: 2024-06-15 (12 days left)\n📍 IP: 192.168.88.50\n\nStatus: 🟢 Active`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("usage", async (ctx) => {
    await ctx.reply(
      `📈 <b>Bandwidth Usage (May 2024)</b>\n\n⬇️ Downloaded: 124.7 GB\n⬆️ Uploaded: 35.5 GB\n📊 Total: 160.2 GB\n\nDaily Avg: 5.4 GB`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("renew", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("💳 bKash", "pay:bkash")
      .text("💳 Nagad", "pay:nagad")
      .row()
      .text("💳 Rocket", "pay:rocket");

    await ctx.reply(
      `🔄 <b>Renew Home Premium</b>\n\nAmount: ৳800 BDT\nDuration: 30 Days\n\nSelect payment method:`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  });

  bot.command("support", async (ctx) => {
    await ctx.reply(
      `🎫 <b>Support Center</b>\n\nDescribe your issue and our team will respond shortly.\n\n📞 Hotline: 01XXXXXXXXX\n📧 Email: support@skynity.net`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("invoice", async (ctx) => {
    await ctx.reply(
      `📄 <b>Latest Invoice</b>\n\nInvoice: INV-2024-0012\nDate: 15 May 2024\nAmount: ৳800 BDT\nStatus: ✅ Paid\n\nYour invoice PDF has been sent to your registered email.`,
      { parse_mode: "HTML" }
    );
  });

  bot.callbackQuery("browse_packages", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("📦 Use /buy to browse packages");
  });

  bot.callbackQuery("my_status", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Use /mystatus to view your subscription");
  });

  bot.callbackQuery("my_usage", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Use /usage to check bandwidth");
  });

  bot.callbackQuery("renew", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Use /renew to renew your package");
  });

  bot.callbackQuery("support", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply("Use /support to contact us");
  });
}
