import type {
  CheckoutSectionId,
  FulfillmentType,
  StorefrontConfig,
  StorefrontDeliveryConfig,
  StorefrontSectionItem,
  StoreSectionId,
} from '../types';

export const DEFAULT_STORE_SECTIONS: StorefrontSectionItem[] = [
  { id: 'announcement_bar', enabled: true },
  { id: 'hero_banner', enabled: true },
  { id: 'info_and_contact', enabled: true },
  { id: 'product_catalog', enabled: true },
  { id: 'payment_and_order_info', enabled: true },
];

export const DEFAULT_CHECKOUT_SECTIONS: StorefrontSectionItem[] = [
  { id: 'order_summary', enabled: true },
  { id: 'fulfillment_method', enabled: true },
  { id: 'customer_identity', enabled: true },
  { id: 'custom_field_and_notes', enabled: true },
  { id: 'payment_showcase', enabled: true },
];

export const STORE_SECTION_METADATA: Record<
  StoreSectionId,
  { label: string; description: string }
> = {
  announcement_bar: {
    label: 'Bar Pengumuman & Promo',
    description: 'Kalimat info singkat atau promo di bagian paling atas',
  },
  hero_banner: {
    label: 'Profil & Perkenalan Toko',
    description:
      'Nama toko, kalimat utama, deskripsi singkat, keunggulan, dan foto sampul',
  },
  info_and_contact: {
    label: 'Alamat, Jam Buka & WhatsApp',
    description: 'Lokasi toko, jam operasional, dan tombol chat WhatsApp',
  },
  product_catalog: {
    label: 'Daftar Menu & Produk',
    description: 'Katalog produk yang bisa dipilih dan dipesan pembeli',
  },
  payment_and_order_info: {
    label: 'Info Pembayaran & Pengiriman',
    description: 'Ringkasan cara bayar (Tunai/QRIS/Transfer) dan aturan kirim',
  },
};

export const CHECKOUT_SECTION_METADATA: Record<
  CheckoutSectionId,
  { label: string; description: string }
> = {
  order_summary: {
    label: 'Daftar Pesanan & Total Harga',
    description: 'Rincian produk yang dibeli beserta ongkos kirim',
  },
  fulfillment_method: {
    label: 'Cara Terima Pesanan',
    description: 'Pilihan Makan di Tempat, Ambil di Toko, atau Diantar Kurir',
  },
  customer_identity: {
    label: 'Data Pembeli',
    description: 'Isian Nama, Nomor WhatsApp, dan Email pembeli',
  },
  custom_field_and_notes: {
    label: 'Pertanyaan Tambahan & Catatan',
    description: 'Kolom pertanyaan khusus dari toko dan catatan pesanan',
  },
  payment_showcase: {
    label: 'Pilihan Cara Pembayaran',
    description: 'Pilihan bayar tunai, lihat kode QRIS, atau salin nomor rekening',
  },
};

export function createDefaultStorefrontConfig(
  storeName = 'Toko Kami',
  phone = ''
): StorefrontConfig {
  return {
    template_style: 'EXPRESS_MENU',
    theme: {
      accent_color: 'default',
      surface_mode: 'light',
      border_radius: 'rounded',
      catalog_layout: 'grid',
      hero_layout: 'SPLIT_SHOWCASE',
      show_hero_image: true,
      banner_url: '',
      logo_url: '',
    },
    store_sections: DEFAULT_STORE_SECTIONS.map((s) => ({ ...s })),
    checkout_sections: DEFAULT_CHECKOUT_SECTIONS.map((s) => ({ ...s })),
    checkout: {
      allow_dine_in: true,
      allow_pickup: true,
      allow_delivery: true,
      show_email_field: true,
      require_email_field: false,
      show_notes_field: true,
      show_pickup_time: true,
      custom_field_enabled: false,
      custom_field_label: 'Ucapan Kartu / Permintaan Khusus',
      custom_field_placeholder: 'Contoh: Selamat ulang tahun, tulis di kartu...',
      custom_field_required: false,
      delivery: {
        delivery_fee_mode: 'FLAT_RATE',
        flat_delivery_fee: 10000,
        free_delivery_min_order: 0,
        delivery_instruction:
          'Pengiriman via kurir toko atau ojek online instan setelah pesanan disiapkan.',
      },
    },
    payment: {
      enable_cash_on_cashier: true,
      cash_instruction: 'Bayar langsung di kasir saat mengambil pesanan.',
      enable_qris: false,
      qris_image_url: '',
      qris_merchant_name: storeName,
      enable_bank_transfer: false,
      bank_accounts: [],
      payment_instruction:
        'Silakan selesaikan pembayaran sesuai total tagihan dan konfirmasi via WhatsApp.',
    },
    contact: {
      whatsapp_number: phone,
      show_floating_whatsapp: true,
      whatsapp_greeting: `Halo ${storeName}, saya ingin bertanya mengenai menu di toko online.`,
      instagram_handle: '',
      operational_hours: 'Setiap Hari, 08:00 - 21:00',
    },
    copywriting: {
      brand_name: storeName,
      brand_tagline: 'Kualitas Terbaik & Terpercaya',
      hero_title: `Selamat Datang di ${storeName}`,
      hero_subtitle:
        'Pesan menu favorit Anda secara praktis langsung dari halaman resmi kami.',
      hero_highlights: [
        'Bahan Pilihan Berkualitas',
        'Dibuat Segar Setiap Hari',
        'Pesan Online Praktis',
      ],
      hero_primary_cta_text: 'Lihat Menu & Pesan',
      hero_secondary_cta_text: 'Hubungi WhatsApp',
      announcement_text: 'Pesan online lebih cepat — tanpa antre, langsung diproses kasir!',
      checkout_title: 'Selesaikan Pesanan Anda',
      checkout_subtitle:
        'Lengkapi informasi pemesan dan pilih metode pembayaran di bawah ini.',
      customer_section_title: 'Informasi Pemesan',
      notes_placeholder: 'Contoh: Kurangi gula, sambal dipisah, atau patokan alamat...',
      submit_button_text: 'Kirim Pesanan Sekarang',
      order_success_title: 'Terima Kasih! Pesanan Anda Telah Diterima',
      order_success_message:
        'Pesanan Anda sedang menunggu konfirmasi kasir. Anda dapat memantau status pesanan secara langsung di halaman ini.',
    },
  };
}

function mergeSectionOrder(
  incoming: unknown,
  defaults: StorefrontSectionItem[]
): StorefrontSectionItem[] {
  const validIds = new Set(defaults.map((d) => d.id));
  const result: StorefrontSectionItem[] = [];
  const seen = new Set<string>();

  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      if (
        item &&
        typeof item === 'object' &&
        typeof (item as StorefrontSectionItem).id === 'string'
      ) {
        const id = (item as StorefrontSectionItem).id;
        if (validIds.has(id) && !seen.has(id)) {
          seen.add(id);
          result.push({
            id,
            enabled: Boolean((item as StorefrontSectionItem).enabled),
          });
        }
      }
    }
  }

  for (const def of defaults) {
    if (!seen.has(def.id)) {
      result.push({ ...def });
    }
  }

  return result;
}

export function normalizeStorefrontConfig(
  raw: unknown,
  storeName = 'Toko Kami',
  phone = ''
): StorefrontConfig {
  const defaults = createDefaultStorefrontConfig(storeName, phone);
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }

  const obj = raw as Record<string, any>;
  const rawTheme = obj.theme && typeof obj.theme === 'object' ? obj.theme : {};
  const rawCheckout =
    obj.checkout && typeof obj.checkout === 'object' ? obj.checkout : {};
  const rawDelivery =
    rawCheckout.delivery && typeof rawCheckout.delivery === 'object'
      ? rawCheckout.delivery
      : {};
  const rawPayment =
    obj.payment && typeof obj.payment === 'object' ? obj.payment : {};
  const rawContact =
    obj.contact && typeof obj.contact === 'object' ? obj.contact : {};
  const rawCopy =
    obj.copywriting && typeof obj.copywriting === 'object' ? obj.copywriting : {};

  return {
    template_style:
      obj.template_style === 'VISUAL_CATALOG' ||
      obj.template_style === 'PRE_ORDER_STORY' ||
      obj.template_style === 'EXPRESS_MENU'
        ? obj.template_style
        : defaults.template_style,
    theme: {
      accent_color:
        rawTheme.accent_color === 'emerald' ||
        rawTheme.accent_color === 'teal' ||
        rawTheme.accent_color === 'amber' ||
        rawTheme.accent_color === 'rose' ||
        rawTheme.accent_color === 'slate' ||
        rawTheme.accent_color === 'default'
          ? rawTheme.accent_color
          : defaults.theme.accent_color,
      surface_mode:
        rawTheme.surface_mode === 'warm' ||
        rawTheme.surface_mode === 'dark' ||
        rawTheme.surface_mode === 'light'
          ? rawTheme.surface_mode
          : defaults.theme.surface_mode,
      border_radius:
        rawTheme.border_radius === 'sharp' ||
        rawTheme.border_radius === 'pill' ||
        rawTheme.border_radius === 'rounded'
          ? rawTheme.border_radius
          : defaults.theme.border_radius,
      catalog_layout:
        rawTheme.catalog_layout === 'list' || rawTheme.catalog_layout === 'grid'
          ? rawTheme.catalog_layout
          : defaults.theme.catalog_layout,
      hero_layout:
        rawTheme.hero_layout === 'COVER_BANNER' ||
        rawTheme.hero_layout === 'CENTERED_STORY' ||
        rawTheme.hero_layout === 'SPLIT_SHOWCASE'
          ? rawTheme.hero_layout
          : defaults.theme.hero_layout,
      show_hero_image:
        typeof rawTheme.show_hero_image === 'boolean'
          ? rawTheme.show_hero_image
          : defaults.theme.show_hero_image,
      banner_url:
        typeof rawTheme.banner_url === 'string'
          ? rawTheme.banner_url
          : defaults.theme.banner_url,
      logo_url:
        typeof rawTheme.logo_url === 'string'
          ? rawTheme.logo_url
          : defaults.theme.logo_url,
    },
    store_sections: mergeSectionOrder(obj.store_sections, DEFAULT_STORE_SECTIONS),
    checkout_sections: mergeSectionOrder(
      obj.checkout_sections,
      DEFAULT_CHECKOUT_SECTIONS
    ),
    checkout: {
      allow_dine_in:
        typeof rawCheckout.allow_dine_in === 'boolean'
          ? rawCheckout.allow_dine_in
          : defaults.checkout.allow_dine_in,
      allow_pickup:
        typeof rawCheckout.allow_pickup === 'boolean'
          ? rawCheckout.allow_pickup
          : defaults.checkout.allow_pickup,
      allow_delivery:
        typeof rawCheckout.allow_delivery === 'boolean'
          ? rawCheckout.allow_delivery
          : defaults.checkout.allow_delivery,
      show_email_field:
        typeof rawCheckout.show_email_field === 'boolean'
          ? rawCheckout.show_email_field
          : defaults.checkout.show_email_field,
      require_email_field:
        typeof rawCheckout.require_email_field === 'boolean'
          ? rawCheckout.require_email_field
          : defaults.checkout.require_email_field,
      show_notes_field:
        typeof rawCheckout.show_notes_field === 'boolean'
          ? rawCheckout.show_notes_field
          : defaults.checkout.show_notes_field,
      show_pickup_time:
        typeof rawCheckout.show_pickup_time === 'boolean'
          ? rawCheckout.show_pickup_time
          : defaults.checkout.show_pickup_time,
      custom_field_enabled:
        typeof rawCheckout.custom_field_enabled === 'boolean'
          ? rawCheckout.custom_field_enabled
          : defaults.checkout.custom_field_enabled,
      custom_field_label:
        typeof rawCheckout.custom_field_label === 'string' &&
        rawCheckout.custom_field_label.trim() !== ''
          ? rawCheckout.custom_field_label
          : defaults.checkout.custom_field_label,
      custom_field_placeholder:
        typeof rawCheckout.custom_field_placeholder === 'string'
          ? rawCheckout.custom_field_placeholder
          : defaults.checkout.custom_field_placeholder,
      custom_field_required:
        typeof rawCheckout.custom_field_required === 'boolean'
          ? rawCheckout.custom_field_required
          : defaults.checkout.custom_field_required,
      delivery: {
        delivery_fee_mode:
          rawDelivery.delivery_fee_mode === 'COURIER_CONFIRMATION' ||
          rawDelivery.delivery_fee_mode === 'FLAT_RATE'
            ? rawDelivery.delivery_fee_mode
            : defaults.checkout.delivery.delivery_fee_mode,
        flat_delivery_fee:
          rawDelivery.flat_delivery_fee != null
            ? Number(rawDelivery.flat_delivery_fee) || 0
            : defaults.checkout.delivery.flat_delivery_fee,
        free_delivery_min_order:
          rawDelivery.free_delivery_min_order != null
            ? Number(rawDelivery.free_delivery_min_order) || 0
            : defaults.checkout.delivery.free_delivery_min_order,
        delivery_instruction:
          typeof rawDelivery.delivery_instruction === 'string'
            ? rawDelivery.delivery_instruction
            : defaults.checkout.delivery.delivery_instruction,
      },
    },
    payment: {
      enable_cash_on_cashier:
        typeof rawPayment.enable_cash_on_cashier === 'boolean'
          ? rawPayment.enable_cash_on_cashier
          : defaults.payment.enable_cash_on_cashier,
      cash_instruction:
        typeof rawPayment.cash_instruction === 'string'
          ? rawPayment.cash_instruction
          : defaults.payment.cash_instruction,
      enable_qris:
        typeof rawPayment.enable_qris === 'boolean'
          ? rawPayment.enable_qris
          : defaults.payment.enable_qris,
      qris_image_url:
        typeof rawPayment.qris_image_url === 'string'
          ? rawPayment.qris_image_url
          : defaults.payment.qris_image_url,
      qris_merchant_name:
        typeof rawPayment.qris_merchant_name === 'string'
          ? rawPayment.qris_merchant_name
          : defaults.payment.qris_merchant_name,
      enable_bank_transfer:
        typeof rawPayment.enable_bank_transfer === 'boolean'
          ? rawPayment.enable_bank_transfer
          : defaults.payment.enable_bank_transfer,
      bank_accounts: Array.isArray(rawPayment.bank_accounts)
        ? rawPayment.bank_accounts.map((acc: any, idx: number) => ({
            id: String(acc?.id || `bank-${idx + 1}`),
            bank_name: String(acc?.bank_name || ''),
            account_number: String(acc?.account_number || ''),
            account_holder_name: String(acc?.account_holder_name || ''),
          }))
        : [],
      payment_instruction:
        typeof rawPayment.payment_instruction === 'string'
          ? rawPayment.payment_instruction
          : defaults.payment.payment_instruction,
    },
    contact: {
      whatsapp_number:
        typeof rawContact.whatsapp_number === 'string' &&
        rawContact.whatsapp_number.trim() !== ''
          ? rawContact.whatsapp_number
          : defaults.contact.whatsapp_number,
      show_floating_whatsapp:
        typeof rawContact.show_floating_whatsapp === 'boolean'
          ? rawContact.show_floating_whatsapp
          : defaults.contact.show_floating_whatsapp,
      whatsapp_greeting:
        typeof rawContact.whatsapp_greeting === 'string'
          ? rawContact.whatsapp_greeting
          : defaults.contact.whatsapp_greeting,
      instagram_handle:
        typeof rawContact.instagram_handle === 'string'
          ? rawContact.instagram_handle
          : defaults.contact.instagram_handle,
      operational_hours:
        typeof rawContact.operational_hours === 'string'
          ? rawContact.operational_hours
          : defaults.contact.operational_hours,
    },
    copywriting: {
      brand_name:
        typeof rawCopy.brand_name === 'string' && rawCopy.brand_name.trim() !== ''
          ? rawCopy.brand_name
          : defaults.copywriting.brand_name,
      brand_tagline:
        typeof rawCopy.brand_tagline === 'string'
          ? rawCopy.brand_tagline
          : defaults.copywriting.brand_tagline,
      hero_title:
        typeof rawCopy.hero_title === 'string' && rawCopy.hero_title.trim() !== ''
          ? rawCopy.hero_title
          : defaults.copywriting.hero_title,
      hero_subtitle:
        typeof rawCopy.hero_subtitle === 'string'
          ? rawCopy.hero_subtitle
          : defaults.copywriting.hero_subtitle,
      hero_highlights: Array.isArray(rawCopy.hero_highlights)
        ? rawCopy.hero_highlights.map((h: unknown) => String(h ?? ''))
        : defaults.copywriting.hero_highlights,
      hero_primary_cta_text:
        typeof rawCopy.hero_primary_cta_text === 'string' &&
        rawCopy.hero_primary_cta_text.trim() !== ''
          ? rawCopy.hero_primary_cta_text
          : defaults.copywriting.hero_primary_cta_text,
      hero_secondary_cta_text:
        typeof rawCopy.hero_secondary_cta_text === 'string' &&
        rawCopy.hero_secondary_cta_text.trim() !== ''
          ? rawCopy.hero_secondary_cta_text
          : defaults.copywriting.hero_secondary_cta_text,
      announcement_text:
        typeof rawCopy.announcement_text === 'string'
          ? rawCopy.announcement_text
          : defaults.copywriting.announcement_text,
      checkout_title:
        typeof rawCopy.checkout_title === 'string' &&
        rawCopy.checkout_title.trim() !== ''
          ? rawCopy.checkout_title
          : defaults.copywriting.checkout_title,
      checkout_subtitle:
        typeof rawCopy.checkout_subtitle === 'string'
          ? rawCopy.checkout_subtitle
          : defaults.copywriting.checkout_subtitle,
      customer_section_title:
        typeof rawCopy.customer_section_title === 'string' &&
        rawCopy.customer_section_title.trim() !== ''
          ? rawCopy.customer_section_title
          : defaults.copywriting.customer_section_title,
      notes_placeholder:
        typeof rawCopy.notes_placeholder === 'string'
          ? rawCopy.notes_placeholder
          : defaults.copywriting.notes_placeholder,
      submit_button_text:
        typeof rawCopy.submit_button_text === 'string' &&
        rawCopy.submit_button_text.trim() !== ''
          ? rawCopy.submit_button_text
          : defaults.copywriting.submit_button_text,
      order_success_title:
        typeof rawCopy.order_success_title === 'string' &&
        rawCopy.order_success_title.trim() !== ''
          ? rawCopy.order_success_title
          : defaults.copywriting.order_success_title,
      order_success_message:
        typeof rawCopy.order_success_message === 'string'
          ? rawCopy.order_success_message
          : defaults.copywriting.order_success_message,
    },
  };
}

export function calculateStorefrontDeliveryFee(
  subtotal: number,
  fulfillmentType: FulfillmentType,
  delivery: StorefrontDeliveryConfig
): number {
  if (fulfillmentType !== 'DELIVERY') {
    return 0;
  }
  if (delivery.delivery_fee_mode !== 'FLAT_RATE') {
    return 0;
  }
  if (
    delivery.free_delivery_min_order > 0 &&
    subtotal >= delivery.free_delivery_min_order
  ) {
    return 0;
  }
  return Math.max(0, Number(delivery.flat_delivery_fee) || 0);
}

export function slugifyStoreName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
