import { suspendExpiredSubscriptions } from "../auto-suspend/service";
import { recordBandwidthSnapshot, recordResourceSnapshot } from "../snapshots/service";

let intervals: NodeJS.Timeout[] = [];

export function startCronJobs(): void {
  // Auto-suspend expired subscriptions every hour
  const suspendInterval = setInterval(async () => {
    try {
      const result = await suspendExpiredSubscriptions();
      if (result.suspended > 0) {
        console.log(`[CRON] Suspended ${result.suspended} expired subscriptions`);
      }
      if (result.errors.length > 0) {
        console.error("[CRON] Suspend errors:", result.errors);
      }
    } catch (err) {
      console.error("[CRON] Auto-suspend failed:", err);
    }
  }, 60 * 60 * 1000); // 1 hour

  // Record bandwidth snapshots every 5 minutes
  const bandwidthInterval = setInterval(async () => {
    try {
      await recordBandwidthSnapshot();
    } catch (err) {
      console.error("[CRON] Bandwidth snapshot failed:", err);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Record resource snapshots every 5 minutes
  const resourceInterval = setInterval(async () => {
    try {
      await recordResourceSnapshot();
    } catch (err) {
      console.error("[CRON] Resource snapshot failed:", err);
    }
  }, 5 * 60 * 1000); // 5 minutes

  intervals = [suspendInterval, bandwidthInterval, resourceInterval];

  console.log("[CRON] Background jobs started: auto-suspend (1h), snapshots (5m)");
}

export function stopCronJobs(): void {
  for (const interval of intervals) {
    clearInterval(interval);
  }
  intervals = [];
  console.log("[CRON] Background jobs stopped");
}
