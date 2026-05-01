import { checkSystemAlerts, checkExpiringSubscriptions, Alert } from "./service";
import { NotificationService } from "../notifications/service";

// In-memory deduplication: alertKey -> lastSentTimestamp
const sentAlerts = new Map<string, number>();

// Cooldown periods in ms
const COOLDOWN_WARNING = 60 * 60 * 1000; // 1 hour
const COOLDOWN_CRITICAL = 15 * 60 * 1000; // 15 minutes

function getAlertKey(alert: Alert): string {
  // Normalize key so recurring conditions don't spam
  if (alert.type === "cpu") return "cpu";
  if (alert.type === "temperature") return "temperature";
  if (alert.type === "system") return "system";
  if (alert.type === "interface") {
    // Extract interface name from message: "Interface X is down"
    const match = alert.message.match(/Interface\s+(\S+)\s+is\s+down/);
    return match ? `iface-${match[1]}` : alert.id;
  }
  if (alert.type === "expiry") {
    // Extract subscription id from id: "expiry-<uuid>"
    return alert.id; // keep as-is, expiry alerts are daily-ish
  }
  return alert.id;
}

function getCooldown(alert: Alert): number {
  return alert.severity === "critical" ? COOLDOWN_CRITICAL : COOLDOWN_WARNING;
}

function shouldSend(alert: Alert): boolean {
  const key = getAlertKey(alert);
  const lastSent = sentAlerts.get(key);
  const cooldown = getCooldown(alert);
  const now = Date.now();

  if (!lastSent || now - lastSent >= cooldown) {
    sentAlerts.set(key, now);
    return true;
  }
  return false;
}

function formatAlertMessage(alert: Alert): string {
  const emoji = alert.severity === "critical" ? "🔴" : "🟡";
  const typeLabel = alert.type.toUpperCase();
  const time = alert.timestamp.toLocaleString("en-BD", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
  return `${emoji} <b>${typeLabel}</b>\n${alert.message}\n<i>${time}</i>`;
}

export async function runAlertNotifier(): Promise<void> {
  try {
    const [systemAlerts, expiryAlerts] = await Promise.all([
      checkSystemAlerts(),
      checkExpiringSubscriptions(),
    ]);

    const allAlerts = [...systemAlerts, ...expiryAlerts];
    const toSend = allAlerts.filter(shouldSend);

    if (toSend.length === 0) return;

    console.log(`[Alerts] Sending ${toSend.length} Telegram notification(s)`);

    for (const alert of toSend) {
      const message = formatAlertMessage(alert);
      await NotificationService.broadcastToAdmins(message);
    }
  } catch (err) {
    console.error("[Alerts] Notifier failed:", err);
  }
}

// Cleanup old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [key, timestamp] of sentAlerts.entries()) {
    if (now - timestamp > maxAge) {
      sentAlerts.delete(key);
    }
  }
}, 60 * 60 * 1000);
