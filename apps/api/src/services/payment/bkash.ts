import { env } from "../../config/env";

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  statusCode?: string;
  statusMessage?: string;
}

interface BkashCreatePaymentResponse {
  paymentID: string;
  paymentCreateTime: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  statusCode?: string;
  statusMessage?: string;
}

interface BkashExecutePaymentResponse {
  paymentID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  transactionId: string;
  customerMsisdn: string;
  statusCode?: string;
  statusMessage?: string;
}

export class BkashPaymentService {
  private baseUrl: string;
  private appKey: string;
  private appSecret: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl =
      env.NODE_ENV === "production"
        ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
        : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
    this.appKey = env.BKASH_APP_KEY || "";
    this.appSecret = env.BKASH_APP_SECRET || "";
    this.username = env.BKASH_USERNAME || "";
    this.password = env.BKASH_PASSWORD || "";
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const res = await fetch(`${this.baseUrl}/tokenized/checkout/token/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: this.username,
        password: this.password,
      },
      body: JSON.stringify({
        app_key: this.appKey,
        app_secret: this.appSecret,
      }),
    });

    const data = await res.json() as BkashTokenResponse;
    if (data.statusCode && data.statusCode !== "0000") {
      throw new Error(data.statusMessage || "bKash token grant failed");
    }

    this.token = data.id_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.token;
  }

  async createPayment(params: {
    amount: number;
    invoiceNumber: string;
    callbackUrl: string;
  }): Promise<BkashCreatePaymentResponse> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}/tokenized/checkout/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": this.appKey,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: params.invoiceNumber,
        callbackURL: params.callbackUrl,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: params.amount.toString(),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: params.invoiceNumber,
      }),
    });

    const data = await res.json() as BkashCreatePaymentResponse;
    if (data.statusCode && data.statusCode !== "0000") {
      throw new Error(data.statusMessage || "bKash create payment failed");
    }

    return data;
  }

  async executePayment(paymentID: string): Promise<BkashExecutePaymentResponse> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}/tokenized/checkout/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": this.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });

    const data = await res.json() as BkashExecutePaymentResponse;
    if (data.statusCode && data.statusCode !== "0000") {
      throw new Error(data.statusMessage || "bKash execute payment failed");
    }

    return data;
  }

  async queryPayment(paymentID: string): Promise<any> {
    const token = await this.getToken();

    const res = await fetch(`${this.baseUrl}/tokenized/checkout/payment/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        authorization: token,
        "x-app-key": this.appKey,
      },
      body: JSON.stringify({ paymentID }),
    });

    return res.json();
  }
}

export const bkashService = new BkashPaymentService();
