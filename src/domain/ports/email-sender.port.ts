export interface OrderConfirmationEmail {
  to: string;
  orderId: string;
  totalCents: number;
  currency: string;
  cashReceivedCents?: number | null;
  changeCents?: number | null;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  createdAt: Date;
}

export interface SecurityAlertEmail {
  to: string;
  action: string;
  severity: string;
  reason: string;
  occurredAt: Date;
}

export interface EmailSender {
  sendOrderConfirmation(data: OrderConfirmationEmail): Promise<void>;
  sendSecurityAlert(data: SecurityAlertEmail): Promise<void>;
}
