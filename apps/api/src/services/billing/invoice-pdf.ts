import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageName: string;
  packageSpeed: string;
  amount: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  trxId?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(5, 11, 21);
  doc.rect(0, 0, pageWidth, 40, "F");

  // Logo text
  doc.setTextColor(0, 234, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.companyName.toUpperCase(), 15, 20);

  doc.setTextColor(0, 255, 136);
  doc.setFontSize(10);
  doc.text("Connecting the Future", 15, 28);

  // Invoice title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("INVOICE", pageWidth - 40, 20);
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(`#${data.invoiceNumber}`, pageWidth - 40, 26);

  // Company info
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text(data.companyAddress, 15, 48);
  doc.text(`Phone: ${data.companyPhone}`, 15, 53);

  // Bill To
  doc.setTextColor(0, 234, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 15, 65);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.customerName, 15, 72);
  doc.text(data.customerPhone, 15, 77);
  doc.text(data.customerAddress, 15, 82);

  // Dates
  doc.setTextColor(0, 234, 255);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE DATE", pageWidth - 60, 65);
  doc.text("DUE DATE", pageWidth - 60, 75);

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceDate, pageWidth - 60, 70);
  doc.text(data.dueDate, pageWidth - 60, 80);

  // Table
  autoTable(doc, {
    startY: 95,
    head: [["Description", "Package", "Speed", "Amount (BDT)"]],
    body: [
      [
        `Internet Subscription - ${data.packageName}`,
        data.packageName,
        data.packageSpeed,
        data.amount.toLocaleString("en-BD"),
      ],
    ],
    theme: "grid",
    headStyles: {
      fillColor: [0, 234, 255],
      textColor: [5, 11, 21],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 5,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(10);
  doc.text("Subtotal:", pageWidth - 70, finalY);
  doc.text(`৳${data.amount.toLocaleString("en-BD")}`, pageWidth - 25, finalY, { align: "right" });

  doc.text("Tax:", pageWidth - 70, finalY + 7);
  doc.text(`৳${data.tax.toLocaleString("en-BD")}`, pageWidth - 25, finalY + 7, { align: "right" });

  doc.setTextColor(0, 234, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", pageWidth - 70, finalY + 18);
  doc.text(`৳${data.total.toLocaleString("en-BD")}`, pageWidth - 25, finalY + 18, { align: "right" });

  // Payment info
  if (data.paymentMethod) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, 15, finalY + 30);
    if (data.trxId) doc.text(`Transaction ID: ${data.trxId}`, 15, finalY + 36);
  }

  // Footer
  doc.setFillColor(5, 11, 21);
  doc.rect(0, 285, pageWidth, 12, "F");
  doc.setTextColor(0, 234, 255);
  doc.setFontSize(8);
  doc.text("Thank you for choosing SKYNITY! | support@skynity.net", pageWidth / 2, 292, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
