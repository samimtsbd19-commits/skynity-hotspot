import { FastifyInstance } from "fastify";
import { NotificationService } from "../services/notifications/service";
import { z } from "zod";

const sendSchema = z.object({
  type: z.enum(["sms", "telegram", "email"]),
  to: z.string().min(1),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export default async function notificationRoutes(app: FastifyInstance) {
  app.post("/send", { preHandler: [app.authenticate, app.requireRole("superadmin", "admin")] }, async (request) => {
    const body = sendSchema.parse(request.body);

    let success = false;
    if (body.type === "telegram") {
      success = await NotificationService.sendTelegram(body.to, body.message);
    } else if (body.type === "sms") {
      success = await NotificationService.sendSMS(body.to, body.message);
    } else if (body.type === "email") {
      success = await NotificationService.sendEmail(body.to, body.subject || "SKYNITY Notification", body.message);
    }

    return { data: { success, type: body.type } };
  });

  app.post("/broadcast", { preHandler: [app.authenticate, app.requireRole("superadmin")] }, async (request) => {
    const { message } = request.body as { message: string };
    await NotificationService.broadcastToAdmins(message);
    return { data: { success: true } };
  });

  app.get("/templates", { preHandler: [app.authenticate] }, async () => {
    return {
      data: [
        { id: "order_approved", name: "Order Approved", type: "sms", content: "Dear {{name}}, your order #{{orderId}} is approved. Username: {{username}} Password: {{password}}" },
        { id: "payment_received", name: "Payment Received", type: "sms", content: "Dear {{name}}, we received {{amount}} BDT. Thank you! - SKYNITY" },
        { id: "expiry_warning", name: "Expiry Warning", type: "sms", content: "Dear {{name}}, your internet expires on {{date}}. Please renew to avoid disconnection." },
        { id: "welcome", name: "Welcome", type: "email", subject: "Welcome to SKYNITY", content: "<h1>Welcome {{name}}!</h1><p>Your SKYNITY connection is active.</p>" },
      ],
    };
  });
}
