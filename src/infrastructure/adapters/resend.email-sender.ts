import { Resend } from 'resend';
import { ExternalServiceError } from '../../lib/errors.ts';
import type {
  EmailSender,
  OrderConfirmationEmail,
  SecurityAlertEmail,
} from '../../domain/ports/email-sender.port.ts';
import { buildOrderConfirmationEmail } from '../email/templates/order-confirmation.ts';
import { buildSecurityAlertEmail } from '../email/templates/security-alert.ts';

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

  async sendSecurityAlert(data: SecurityAlertEmail): Promise<void> {
    const { subject, text } = buildSecurityAlertEmail(data);
    const { error } = await this.client.emails.send({
      from: this.from,
      to: data.to,
      subject,
      text,
    });

    if (error) {
      throw new ExternalServiceError('Resend', error.message, error);
    }
  }
}
