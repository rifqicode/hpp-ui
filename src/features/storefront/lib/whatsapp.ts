import type { FulfillmentType, PublicOrderTrackingResponse } from '../types';

export function normalizeWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function formatFulfillmentLabel(type: FulfillmentType | string): string {
  switch (type) {
    case 'DINE_IN':
      return 'Makan di Tempat (Dine-in)';
    case 'PICKUP':
      return 'Ambil di Toko (Pickup)';
    case 'DELIVERY':
      return 'Pengiriman Kurir (Delivery)';
    default:
      return type || 'Pesanan Online';
  }
}

export function formatIdrCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function buildStoreInquiryWhatsAppUrl(
  phone: string,
  storeName: string,
  customGreeting?: string
): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return '';
  const text =
    customGreeting && customGreeting.trim() !== ''
      ? customGreeting.trim()
      : `Halo ${storeName}, saya ingin bertanya mengenai menu di toko online.`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildOrderConfirmationWhatsAppUrl(params: {
  storePhone: string;
  storeName: string;
  order: PublicOrderTrackingResponse;
  trackingUrl?: string;
}): string {
  const normalized = normalizeWhatsAppPhone(params.storePhone);
  if (!normalized) return '';

  const { order, storeName, trackingUrl } = params;
  const itemLines = order.items
    .map((item) => {
      const modStr =
        item.modifiers && item.modifiers.length > 0
          ? ` (${item.modifiers.map((m) => m.name).join(', ')})`
          : '';
      return `- ${item.quantity}x ${item.product_name} - ${item.variant_name}${modStr}`;
    })
    .join('\n');

  const lines: string[] = [
    `Halo *${storeName}*, saya ingin mengonfirmasi pesanan online saya:`,
    '',
    `No. Invoice: *${order.invoice_number}*`,
    `Nama Pemesan: ${order.customer_name}`,
    `Metode: ${formatFulfillmentLabel(order.fulfillment_type)}`,
  ];

  if (order.fulfillment_type === 'DINE_IN' && order.table_number) {
    lines.push(`Nomor Meja: ${order.table_number}`);
  }
  if (order.fulfillment_type === 'PICKUP' && order.pickup_time) {
    lines.push(`Waktu Ambil: ${order.pickup_time}`);
  }
  if (order.fulfillment_type === 'DELIVERY' && order.delivery_address) {
    lines.push(`Alamat Kirim: ${order.delivery_address}`);
  }

  lines.push('', '*Rincian Pesanan:*', itemLines, '');
  if (order.delivery_fee > 0) {
    lines.push(`Ongkos Kirim: ${formatIdrCurrencyPlain(order.delivery_fee)}`);
  }
  lines.push(
    `*Total Tagihan: ${formatIdrCurrencyPlain(order.total_amount)}*`,
    `Metode Pembayaran: *${order.payment_method}*`
  );

  if (order.custom_field_label && order.custom_field_value) {
    lines.push(`${order.custom_field_label}: ${order.custom_field_value}`);
  }
  if (order.notes) {
    lines.push(`Catatan: ${order.notes}`);
  }
  if (trackingUrl) {
    lines.push('', `Link Status Pesanan: ${trackingUrl}`);
  }

  return `https://wa.me/${normalized}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildBuyerCourierNotificationWhatsAppUrl(params: {
  buyerPhone: string;
  buyerName: string;
  storeName: string;
  invoiceNumber: string;
  courierName?: string;
  trackingInfo?: string;
  trackingUrl?: string;
}): string {
  const normalized = normalizeWhatsAppPhone(params.buyerPhone);
  if (!normalized) return '';

  const lines: string[] = [
    `Halo Kak *${params.buyerName || 'Pelanggan'}*, pesanan Anda di *${params.storeName}* (${params.invoiceNumber}) telah siap / sedang dalam pengiriman!`,
  ];

  if (params.courierName) {
    lines.push(`Kurir Pengantar: *${params.courierName}*`);
  }
  if (params.trackingInfo) {
    lines.push(`Info Pelacakan / No. Resi: ${params.trackingInfo}`);
  }
  if (params.trackingUrl) {
    lines.push('', `Pantau pesanan Anda di sini: ${params.trackingUrl}`);
  }

  lines.push('', 'Terima kasih telah berbelanja!');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(lines.join('\n'))}`;
}
