import { env } from "../../config/env";

interface NagadPaymentInitResponse {
  paymentReferenceId: string;
  acceptDate: string;
  challenge: string;
}

interface NagadPaymentResponse {
  merchantId: string;
  orderId: string;
  paymentRefId: string;
  amount: string;
  clientMobileNo: string;
  merchantMobileNo: string;
  orderCreationDate: string;
  issuerPaymentDate: string;
  issuerPaymentDateTime: string;
  additionalMerchantInfo?: string;
  status: string;
  statusCode: string;
}

export class NagadPaymentService {
  private baseUrl: string;
  private merchantId: string;
  private merchantNumber: string;

  constructor() {
    this.baseUrl =
      env.NODE_ENV === "production"
        ? "https://api.mynagad.com/api/dfs"
        : "https://sandbox.mynagad.com:10080/api/dfs";
    this.merchantId = env.NAGAD_MERCHANT_ID || "";
    this.merchantNumber = env.NAGAD_NUMBER || "";
  }

  async initPayment(params: {
    amount: number;
    invoiceNumber: string;
    callbackUrl: string;
  }): Promise<NagadPaymentInitResponse> {
    const timestamp = new Date().toISOString();
    const sensitiveData = Buffer.from(
      JSON.stringify({
        merchantId: this.merchantId,
        datetime: timestamp,
        orderId: params.invoiceNumber,
        challenge: this.generateChallenge(),
      })
    ).toString("base64");

    const res = await fetch(`${this.baseUrl}/check-out/initialize/${this.merchantId}/${params.invoiceNumber}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dateTime: timestamp,
        sensitiveData,
        signature: "placeholder-signature",
      }),
    });

    const data = await res.json() as NagadPaymentInitResponse;
    if (!data.paymentReferenceId) {
      throw new Error("Nagad payment initialization failed");
    }

    return data;
  }

  async completePayment(params: {
    paymentRefId: string;
    challenge: string;
  }): Promise<NagadPaymentResponse> {
    const res = await fetch(`${this.baseUrl}/check-out/complete/${params.paymentRefId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentRefId: params.paymentRefId,
        challenge: params.challenge,
      }),
    });

    const data = await res.json() as NagadPaymentResponse;
    if (data.statusCode !== "Success") {
      throw new Error(`Nagad payment failed: ${data.status}`);
    }

    return data;
  }

  private generateChallenge(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const nagadService = new NagadPaymentService();
