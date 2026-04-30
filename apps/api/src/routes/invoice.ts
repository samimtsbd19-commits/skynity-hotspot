import { FastifyInstance } from "fastify";
import { generateInvoicePDF } from "../services/billing/invoice-pdf";

export default async function invoiceRoutes(app: FastifyInstance) {
  app.get("/:id/pdf", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: `INV-2024-${id.padStart(4, "0")}`,
        invoiceDate: new Date().toLocaleDateString("en-BD"),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-BD"),
        customerName: "Rahim Uddin",
        customerPhone: "01712345678",
        customerAddress: "Dhaka, Bangladesh",
        packageName: "Home Premium",
        packageSpeed: "30 Mbps",
        amount: 800,
        tax: 0,
        total: 800,
        paymentMethod: "bKash",
        trxId: "TXN123456",
        companyName: "SKYNITY ISP",
        companyAddress: "123 Network Tower, Dhaka",
        companyPhone: "01XXXXXXXXX",
      });

      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `inline; filename="invoice-${id}.pdf"`);
      reply.send(pdfBuffer);
    } catch (err) {
      reply.status(500).send({ error: { code: "PDF_GENERATION_FAILED", message: "Could not generate invoice PDF" } });
    }
  });
}
