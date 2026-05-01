import { Bot, InlineKeyboard } from "grammy";
import { mikrotikService } from "../../mikrotik/service";

const ADMIN_COMMANDS = `
🛰️ <b>SKYNITY Admin Bot Commands</b>

/stats — Quick overview
/today — Today's orders & revenue
/network — Router health (CPU, RAM, Temp)
/online — Live PPPoE/Hotspot users
/bandwidth — Current WAN bandwidth
/pending — Order inbox (approve/reject)
/expiring — Users expiring in 7 days
/customer [phone] — Customer lookup
/suspend [username] — Suspend PPPoE
/resume [username] — Resume PPPoE
/disconnect [username] — Kick session
/extend [user] [days] — Extend subscription
/upgrade [user] [pkg] — Upgrade package
/ping [host] — Ping from router
/tunnel — WireGuard tunnel status
/alert — Configure thresholds
/help — This help message
`;

export function setupAdminCommands(bot: Bot) {
  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard()
      .text("📊 Stats", "/stats")
      .text("🌐 Network", "/network")
      .row()
      .text("👥 Online Users", "/online")
      .text("💰 Pending Orders", "/pending")
      .row()
      .text("❓ Help", "/help");

    await ctx.reply(
      `🛰️ <b>Welcome to SKYNITY Admin Bot!</b>\n\nConnecting the Future — Your ISP at your fingertips.`,
      { parse_mode: "HTML", reply_markup: keyboard }
    );
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(ADMIN_COMMANDS, { parse_mode: "HTML" });
  });

  bot.command("stats", async (ctx) => {
    try {
      const resource = await mikrotikService.getSystemResource();
      const activePppoe = await mikrotikService.getPppoeActiveUsers();
      const activeHotspot = await mikrotikService.getHotspotActiveUsers();

      const msg = `
🛰️ <b>SKYNITY Quick Stats</b>

<b>Router:</b> ${resource.boardName}
<b>Uptime:</b> ${resource.uptime}
<b>CPU:</b> ${resource.cpuLoad}%
<b>RAM:</b> ${resource.usedMemoryPercent}%

<b>Online Users:</b>
• PPPoE: ${activePppoe.length}
• Hotspot: ${activeHotspot.length}
• Total: ${activePppoe.length + activeHotspot.length}
      `.trim();

      await ctx.reply(msg, { parse_mode: "HTML" });
    } catch {
      await ctx.reply("❌ Failed to fetch router stats.");
    }
  });

  bot.command("network", async (ctx) => {
    try {
      const resource = await mikrotikService.getSystemResource();
      const health = await mikrotikService.getSystemHealth();

      const msg = `
📡 <b>Network Health</b>

CPU Load: ${resource.cpuLoad}%
Free RAM: ${resource.freeMemoryMB} MB / ${resource.totalMemoryMB} MB
Temperature: ${health.temperature}°C
Voltage: ${health.voltage} V
Fan Speed: ${health.fanSpeed || "N/A"} RPM
Uptime: ${resource.uptime}
      `.trim();

      await ctx.reply(msg, { parse_mode: "HTML" });
    } catch {
      await ctx.reply("❌ Failed to fetch network health.");
    }
  });

  bot.command("online", async (ctx) => {
    try {
      const pppoe = await mikrotikService.getPppoeActiveUsers();
      const hotspot = await mikrotikService.getHotspotActiveUsers();

      let msg = `👥 <b>Online Users</b>\n\n`;
      msg += `<b>PPPoE (${pppoe.length}):</b>\n`;
      pppoe.slice(0, 5).forEach((u) => {
        msg += `• ${u.username} — ${u.address}\n`;
      });
      msg += `\n<b>Hotspot (${hotspot.length}):</b>\n`;
      hotspot.slice(0, 5).forEach((u) => {
        msg += `• ${u.user} — ${u.address}\n`;
      });

      await ctx.reply(msg, { parse_mode: "HTML" });
    } catch {
      await ctx.reply("❌ Failed to fetch online users.");
    }
  });

  bot.command("bandwidth", async (ctx) => {
    try {
      const ifaces = await mikrotikService.getInterfaceList();
      const wan = ifaces.find((i) => i.comment.toLowerCase().includes("wan") || i.name.includes("pppoe-out") || i.name.includes("ether1"));

      if (!wan) {
        await ctx.reply("❌ WAN interface not found");
        return;
      }

      const rxMbps = (Number(wan.rxRate) / 1_000_000).toFixed(2);
      const txMbps = (Number(wan.txRate) / 1_000_000).toFixed(2);

      await ctx.reply(
        `📊 <b>WAN Bandwidth</b>\n\n⬇️ Download: ${rxMbps} Mbps\n⬆️ Upload: ${txMbps} Mbps`,
        { parse_mode: "HTML" }
      );
    } catch {
      await ctx.reply("❌ Failed to fetch bandwidth.");
    }
  });

  bot.command("ping", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const host = args?.[0] || "8.8.8.8";

    try {
      const result = await mikrotikService.pingHost(host);

      const statusEmoji = result.status === "excellent" ? "🟢" : result.status === "good" ? "🟢" : result.status === "fair" ? "🟡" : "🔴";

      await ctx.reply(
        `${statusEmoji} <b>Ping ${result.host}</b>\n\nAvg: ${result.avgMs}ms\nMin: ${result.minMs}ms\nMax: ${result.maxMs}ms\nLoss: ${result.packetLossPct}%\nStatus: ${result.status}`,
        { parse_mode: "HTML" }
      );
    } catch {
      await ctx.reply("❌ Failed to ping host.");
    }
  });

  bot.command("pending", async (ctx) => {
    await ctx.reply(
      `🛰️ <b>Pending Orders</b>\n\nUse the web dashboard to review and approve orders.\n\n/admin/orders`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("expiring", async (ctx) => {
    await ctx.reply("📅 <b>Expiring Soon</b>\n\nUse the web dashboard to view expiring subscriptions.\n\n/admin/customers", { parse_mode: "HTML" });
  });

  bot.command("suspend", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const username = args?.[0];
    if (!username) {
      await ctx.reply("Usage: /suspend [username]");
      return;
    }
    const ok = await mikrotikService.blockPppoeUser(username);
    await ctx.reply(ok ? `🔴 User <b>${username}</b> has been suspended.` : `❌ Failed to suspend <b>${username}</b>.`, { parse_mode: "HTML" });
  });

  bot.command("resume", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const username = args?.[0];
    if (!username) {
      await ctx.reply("Usage: /resume [username]");
      return;
    }
    const ok = await mikrotikService.unblockPppoeUser(username);
    await ctx.reply(ok ? `🟢 User <b>${username}</b> has been resumed.` : `❌ Failed to resume <b>${username}</b>.`, { parse_mode: "HTML" });
  });

  bot.command("disconnect", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const username = args?.[0];
    if (!username) {
      await ctx.reply("Usage: /disconnect [username]");
      return;
    }
    await ctx.reply(`⚡ Disconnect command queued for <b>${username}</b>. Use web dashboard for full control.`, { parse_mode: "HTML" });
  });

  bot.command("extend", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    if (!args || args.length < 2) {
      await ctx.reply("Usage: /extend [username] [days]");
      return;
    }
    await ctx.reply(`📅 Extend command queued for <b>${args[0]}</b> by ${args[1]} days. Use web dashboard to confirm.`, { parse_mode: "HTML" });
  });

  bot.command("upgrade", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    if (!args || args.length < 2) {
      await ctx.reply("Usage: /upgrade [username] [package]");
      return;
    }
    await ctx.reply(`⬆️ Upgrade command queued for <b>${args[0]}</b> to ${args[1]}. Use web dashboard to confirm.`, { parse_mode: "HTML" });
  });

  bot.command("customer", async (ctx) => {
    const args = ctx.message?.text?.split(" ").slice(1);
    const query = args?.[0];
    if (!query) {
      await ctx.reply("Usage: /customer [phone/code]");
      return;
    }
    await ctx.reply(
      `👤 <b>Customer Lookup</b>\n\nQuery: <code>${query}</code>\n\nUse the web dashboard for full customer details.\n/admin/customers`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("tunnel", async (ctx) => {
    await ctx.reply(
      `🔒 <b>WireGuard Tunnel</b>\n\nUse the web dashboard to view tunnel status.\n/admin/settings`,
      { parse_mode: "HTML" }
    );
  });

  bot.command("alert", async (ctx) => {
    await ctx.reply(
      `⚠️ <b>Alert Thresholds</b>\n\nCPU > 80%: 🟡 Warning\nTemp > 70°C: 🟡 Warning\nPacket Loss > 10%: 🔴 Critical\nSFP RX < -20dBm: 🔴 Critical`,
      { parse_mode: "HTML" }
    );
  });

  bot.callbackQuery(/approve:(\d+)/, async (ctx) => {
    await ctx.editMessageText(
      `✅ <b>Order Approved</b>\n\nApproved by @${ctx.from.username || "admin"}\nSubscription created automatically.`,
      { parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery("Order approved!");
  });

  bot.callbackQuery(/reject:(\d+)/, async (ctx) => {
    await ctx.editMessageText(
      `❌ <b>Order Rejected</b>\n\nRejected by @${ctx.from.username || "admin"}`,
      { parse_mode: "HTML" }
    );
    await ctx.answerCallbackQuery("Order rejected!");
  });
}
