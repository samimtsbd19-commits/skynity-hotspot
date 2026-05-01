import { FastifyInstance } from "fastify";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { invoices, customers, orders, packages, appSettings } from "@skynity/db/schema/index";
import { generateInvoicePDF } from "../services/billing/invoice-pdf";
import { buildDatabaseUrl } from "../config/env";

const pool = new Pool({ connectionString: buildDatabaseUrl() });
const db = drizzle(pool);

export default async function invoiceRoutes(app: FastifyInstance) {
  app.get("/:id/pdf", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
      if (!inv) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Invoice not found" } });
      }

      const [customer] = await db.select().from(customers).where(eq(customers.id, inv.customerId));
      const [order] = inv.orderId ? await db.select().from(orders).where(eq(orders.id, inv.orderId)) : [null];
      const [pkg] = order ? await db.select().from(packages).where(eq(packages.id, order.packageId)) : [null];
      const settings = await db.select().from(appSettings);
      const companyName = settings.find((s) => s.key === "company_name")?.value || "SKYNITY ISP";
      const companyAddress = settings.find((s) => s.key === "company_address")?.value || "";
      const companyPhone = settings.find((s) => s.key === "company_phone")?.value || "";

      const pdfBuffer = await generateInvoicePDF({
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: new Date(inv.issuedAt || Date.now()).toLocaleDateString("en-BD"),
        dueDate: inv.dueAt ? new Date(inv.dueAt).toLocaleDateString("en-BD") : "—",
        customerName: customer?.fullName || "—",
        customerPhone: customer?.phone || "—",
        customerAddress: customer?.address || "—",
        packageName: pkg?.name || "—",
        packageSpeed: pkg ? `${pkg.downloadMbps} Mbps` : "—",
        amount: Number(inv.amountBdt),
        tax: Number(inv.taxBdt || 0),
        total: Number(inv.totalBdt),
        paymentMethod: order?.paymentMethod?.toUpperCase() || "—",
        trxId: order?.trxId || "—",
        companyName,
        companyAddress,
        companyPhone,
      });

      reply.header("Content-Type", "application/pdf");
      reply.header("Content-Disposition", `inline; filename="invoice-${id}.pdf"`);
      reply.send(pdfBuffer);
    } catch (err) {
      console.error("Invoice PDF error:", err);
      reply.status(500).send({ error: { code: "PDF_GENERATION_FAILED", message: "Could not generate invoice PDF" } });
    }
  });
}
