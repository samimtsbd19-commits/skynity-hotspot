import { FastifyInstance } from "fastify";
import { bkashService } from "../services/payment/bkash";
import { nagadService } from "../services/payment/nagad";
import { z } from "zod";

const createPaymentSchema = z.object({
  method: z.enum(["bkash", "nagad", "rocket"]),
  amount: z.number().min(1),
  invoiceNumber: z.string().min(1),
  callbackUrl: z.string().url(),
});

export default async function paymentRoutes(app: FastifyInstance) {
  app.post("/create", { preHandler: [app.authenticate] }, async (request) => {
    const body = createPaymentSchema.parse(request.body);

    if (body.method === "bkash") {
      const result = await bkashService.createPayment({
        amount: body.amount,
        invoiceNumber: body.invoiceNumber,
        callbackUrl: body.callbackUrl,
      });
      return { data: { gateway: "bkash", ...result } };
    }

    if (body.method === "nagad") {
      const result = await nagadService.initPayment({
        amount: body.amount,
        invoiceNumber: body.invoiceNumber,
        callbackUrl: body.callbackUrl,
      });
      return { data: { gateway: "nagad", ...result } };
    }

    return { error: { code: "UNSUPPORTED_METHOD", message: "Payment method not supported" } };
  });

  app.post("/bkash/execute", async (request) => {
    const { paymentID } = request.body as { paymentID: string };
    const result = await bkashService.executePayment(paymentID);
    return { data: result };
  });

  app.post("/bkash/callback", async (request) => {
    const body = request.body as any;
    app.log.info({ msg: "bKash callback received", body });
    return { data: { status: "received", body } };
  });

  app.post("/nagad/callback", async (request) => {
    const body = request.body as any;
    app.log.info({ msg: "Nagad callback received", body });
    return { data: { status: "received", body } };
  });
}
