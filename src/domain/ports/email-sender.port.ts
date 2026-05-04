export interface OrderConfirmationEmail {
  to: string;
  orderId: string;
  totalCents: number;
  currency: string;
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  createdAt: Date;
}

export interface EmailSender {
  sendOrderConfirmation(data: OrderConfirmationEmail): Promise<void>;
}
