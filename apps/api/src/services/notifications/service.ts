import { env } from "../../config/env";

export interface NotificationPayload {
  type: "sms" | "telegram" | "email";
  to: string;
  subject?: string;
  message: string;
  template?: string;
  variables?: Record<string, string>;
}

export class NotificationService {
  static async sendTelegram(chatId: string, message: string): Promise<boolean> {
    if (!env.TELEGRAM_BOT_TOKEN) return false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async sendSMS(phone: string, message: string): Promise<boolean> {
    if (!env.SMS_API_URL || !env.SMS_API_KEY) return false;
    try {
      const res = await fetch(env.SMS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.SMS_API_KEY,
          sender_id: env.SMS_SENDER_ID || "SKYNITY",
          to: phone,
          message,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    // Placeholder for SMTP/email service integration
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return true;
  }

  static async broadcastToAdmins(message: string): Promise<void> {
    const adminIds = env.TELEGRAM_ADMIN_IDS?.split(",").map((id) => id.trim()) || [];
    for (const chatId of adminIds) {
      await this.sendTelegram(chatId, message);
    }
  }

  static formatTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  }
}
