import { Resend } from 'resend';
import { ExternalServiceError } from '../../lib/errors.js';
import type {
  EmailSender,
  OrderConfirmationEmail,
} from '../../domain/ports/email-sender.port.js';
import { buildOrderConfirmationEmail } from '../email/templates/order-confirmation.js';

export class ResendEmailSender implements EmailSender {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async sendOrderConfirmation(data: OrderConfirmationEmail): Promise<void> {
    const { subject, html } = buildOrderConfirmationEmail(data);
    const { error } = await this.client.emails.send({
      from: this.from,
      to: data.to,
      subject,
      html,
    });

    if (error) {
      throw new ExternalServiceError('Resend', error.message, error);
    }
  }
}
