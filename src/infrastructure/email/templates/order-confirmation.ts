import type { OrderConfirmationEmail } from '../../../domain/ports/email-sender.port.js';

function formatCents(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

export function buildOrderConfirmationEmail(data: OrderConfirmationEmail): {
  subject: string;
  html: string;
} {
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;">${item.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:right;">${formatCents(item.priceCents, data.currency)}</td>
      </tr>`,
    )
    .join('');

  const subject = `Order confirmed — #${data.orderId.slice(0, 8).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:'Helvetica Neue',Arial,sans-serif;color:#3d2b1f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#4a2c1a;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#f5e6d3;font-size:22px;font-weight:600;letter-spacing:1px;">Morning Mist Coffee</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:18px;">Order Confirmed!</h2>
            <p style="margin:0 0 24px;color:#7a6055;font-size:14px;">
              Thank you for your order. We'll get started on it right away.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#7a6055;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Order ID</td>
                <td style="font-size:12px;color:#7a6055;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;text-align:right;">Date</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:600;">${data.orderId}</td>
                <td style="font-size:14px;font-weight:600;text-align:right;">${data.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe3;border-radius:6px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#faf7f2;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#7a6055;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#7a6055;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#7a6055;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="font-size:15px;font-weight:700;">Total</td>
                <td style="font-size:15px;font-weight:700;text-align:right;">${formatCents(data.totalCents, data.currency)}</td>
              </tr>
            </table>

            <p style="margin:0;font-size:13px;color:#7a6055;line-height:1.6;">
              Questions about your order? Reply to this email and we'll be happy to help.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#faf7f2;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#a89080;">© Morning Mist Coffee. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
