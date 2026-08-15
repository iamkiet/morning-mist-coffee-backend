import { env } from '../../../config/env.ts';
import type { OrderConfirmationEmail } from '../../../domain/ports/email-sender.port.ts';

function formatCents(cents: number): string {
  return `${cents.toLocaleString('vi-VN')} ₫`;
}

const WEIGHT_SUFFIX = /-(\d+(?:[.,]\d+)?(?:kg|g|ml|l))$/i;

function getVariantLabelFromSku(sku: string): string {
  const match = sku.match(WEIGHT_SUFFIX);
  return match?.[1] ? match[1].toLowerCase() : sku;
}

export function buildOrderConfirmationEmail(data: OrderConfirmationEmail): {
  subject: string;
  html: string;
} {
  const rows = data.items
    .map((item) => {
      const variantLabel = item.variantSku
        ? getVariantLabelFromSku(item.variantSku)
        : null;
      const properties = item.variantPropertyValues
        .map((p) => p.value)
        .join(' · ');
      const subtitle = [variantLabel, properties].filter(Boolean).join(' · ');
      return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e3ede7;">
          ${item.productName}
          ${subtitle ? `<br/><span style="font-size:12px;color:#5c7a6c;">${subtitle}</span>` : ''}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e3ede7;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e3ede7;text-align:right;">${formatCents(item.priceCents)}</td>
      </tr>`;
    })
    .join('');

  const subject = `Đơn hàng đã được xác nhận — #${data.orderId.slice(0, 8).toUpperCase()}`;

  const trackOrderUrl = `${env.STOREFRONT_URL}/track-order?code=${data.orderId}`;

  const shippingBlock = data.shippingAddress
    ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#5c7a6c;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;">Giao đến</td>
              </tr>
              <tr>
                <td style="font-size:14px;">
                  ${data.shippingFirstName ?? ''} ${data.shippingLastName ?? ''}<br/>
                  ${data.shippingAddress}, ${data.shippingCity ?? ''} ${data.shippingPostalCode ?? ''}
                </td>
              </tr>
            </table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f8f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#1f3d2f;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#556254;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;color:#e3f0e8;font-size:22px;font-weight:600;letter-spacing:1px;">Morning Mist Coffee</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 8px;font-size:18px;">Đơn hàng đã được xác nhận!</h2>
            <p style="margin:0 0 24px;color:#5c7a6c;font-size:14px;">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ bắt đầu xử lý ngay.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#5c7a6c;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;text-align:left;">Mã đơn hàng</td>
                <td style="font-size:12px;color:#5c7a6c;text-transform:uppercase;letter-spacing:0.5px;padding-bottom:4px;text-align:right;">Ngày</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:600;text-align:left;">${data.orderId}</td>
                <td style="font-size:14px;font-weight:600;text-align:right;">${data.createdAt.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:12px;">
                  <a href="${trackOrderUrl}" style="display:inline-block;background:#556254;color:#e3f0e8;font-size:13px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:6px;">Theo dõi đơn hàng</a>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e3ede7;border-radius:6px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f4f8f5;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#5c7a6c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Sản phẩm</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#5c7a6c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">SL</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#5c7a6c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Giá</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td style="font-size:15px;font-weight:700;padding-bottom:8px;">Tổng cộng</td>
                <td style="font-size:15px;font-weight:700;text-align:right;padding-bottom:8px;">${formatCents(data.totalCents)}</td>
              </tr>
              ${data.cashReceivedCents !== undefined && data.cashReceivedCents !== null ? `
              <tr>
                <td style="font-size:14px;color:#5c7a6c;padding-bottom:4px;">Tiền khách đưa</td>
                <td style="font-size:14px;color:#5c7a6c;text-align:right;padding-bottom:4px;">${formatCents(data.cashReceivedCents)}</td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#5c7a6c;">Tiền thối lại</td>
                <td style="font-size:14px;color:#5c7a6c;text-align:right;">${formatCents(data.changeCents ?? 0)}</td>
              </tr>
              ` : ''}
            </table>
            ${shippingBlock}
            <p style="margin:0;font-size:13px;color:#5c7a6c;line-height:1.6;">
              Có thắc mắc về đơn hàng? Trả lời email này, chúng tôi luôn sẵn sàng hỗ trợ.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f4f8f5;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#8aa396;">© Morning Mist Coffee. Đã đăng ký bản quyền.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, html };
}
