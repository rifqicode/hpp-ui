import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  calculateStorefrontDeliveryFee,
  createDefaultStorefrontConfig,
  normalizeStorefrontConfig,
  slugifyStoreName,
  STORE_SECTION_METADATA,
} from '@/features/storefront/lib/default-config';
import {
  buildBuyerCourierNotificationWhatsAppUrl,
  buildOrderConfirmationWhatsAppUrl,
  buildStoreInquiryWhatsAppUrl,
  normalizeWhatsAppPhone,
} from '@/features/storefront/lib/whatsapp';
import { SectionDndList } from '@/features/storefront/components/section-dnd-list';
import { StorefrontRenderer } from '@/features/storefront/components/storefront-renderer';
import { StorefrontSettingsTab } from '@/features/storefront/components/storefront-settings-tab';
import StorefrontBuilderPage from '@/pages/settings/storefront-builder-page';
import { storefrontService } from '@/features/storefront/services/storefront-service';

const settingsStore = {
  id: 'st-1', name: 'Kopi Senja', slug: 'kopi-senja',
  category: 'Cafe & Coffee Shop', location: 'Bandung',
  phone: '08123456789', status: 'online' as const, is_storefront_active: true,
};

describe('Storefront settings changes', () => {
  const renderSettings = () => render(
    <MemoryRouter><StorefrontSettingsTab store={settingsStore} /></MemoryRouter>
  );

  it('shares the saved address until the new address has been saved', async () => {
    const save = vi.spyOn(storefrontService, 'updateStorefrontSettings').mockResolvedValue({
      ...settingsStore, slug: 'kopi-baru', description: '',
      storefront_config: createDefaultStorefrontConfig(),
    });
    renderSettings();
    const check = vi.spyOn(storefrontService, 'checkSlugAvailability').mockResolvedValue({ available: true, slug: 'kopi-baru' });
    expect(screen.queryByLabelText('Alamat toko')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const submit = screen.getByRole('button', { name: 'Simpan link' });
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'kopi-baru' } });
    expect(screen.getByRole('link', { name: 'Buka toko' })).toHaveAttribute('href', expect.stringContaining('/s/kopi-senja'));
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cek ketersediaan' }));
    await screen.findByText('Link toko tersedia dan siap dipakai.');
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await screen.findByText('Link toko berhasil diperbarui.');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'kopi-baru', is_storefront_active: true }));
    expect(screen.getByRole('link', { name: 'Buka toko' })).toHaveAttribute('href', expect.stringContaining('/s/kopi-baru'));
    expect(screen.queryByRole('button', { name: 'Simpan link' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Alamat toko')).not.toBeInTheDocument();
    check.mockRestore();
    save.mockRestore();
  });

  it('blocks an unavailable address and clears its message when edited', async () => {
    const check = vi.spyOn(storefrontService, 'checkSlugAvailability').mockResolvedValue({
      available: false, slug: 'sudah-dipakai',
    });
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'sudah-dipakai' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cek ketersediaan' }));
    await screen.findByText('Link ini sudah dipakai toko lain, silakan ganti.');
    expect(screen.getByRole('button', { name: 'Simpan link' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'alamat-lain' } });
    expect(screen.queryByText('Link ini sudah dipakai toko lain, silakan ganti.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan link' })).toBeDisabled();
    check.mockRestore();
  });

  it('automatically saves the order switch and restores its value on failure', async () => {
    const save = vi.spyOn(storefrontService, 'updateStorefrontSettings').mockRejectedValue(new Error('Koneksi terputus. Coba lagi.'));
    renderSettings();
    fireEvent.click(screen.getByRole('switch', { name: 'Terima pesanan online' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Pengaturan belum tersimpan. Coba lagi.');
    await waitFor(() => expect(screen.getByRole('switch')).toBeEnabled());
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ slug: 'kopi-senja', is_storefront_active: false }));
    expect(screen.queryByRole('button', { name: 'Simpan perubahan' })).not.toBeInTheDocument();
    save.mockRestore();
  });

  it('saves the order switch without saving an unfinished address', async () => {
    const save = vi.spyOn(storefrontService, 'updateStorefrontSettings').mockResolvedValue({
      ...settingsStore, description: '', is_storefront_active: false,
      storefront_config: createDefaultStorefrontConfig(),
    });
    const check = vi.spyOn(storefrontService, 'checkSlugAvailability').mockResolvedValue({ available: true, slug: 'kopi-baru' });
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'kopi-baru' } });
    fireEvent.click(screen.getByRole('switch'));
    await screen.findByText('Pesanan online sudah dinonaktifkan.');
    expect(save).toHaveBeenNthCalledWith(1, expect.objectContaining({ slug: 'kopi-senja', is_storefront_active: false }));
    expect(screen.getByLabelText('Alamat toko')).toHaveValue('kopi-baru');
    fireEvent.click(screen.getByRole('button', { name: 'Cek ketersediaan' }));
    await screen.findByText('Link toko tersedia dan siap dipakai.');
    fireEvent.click(screen.getByRole('button', { name: 'Simpan link' }));
    await screen.findByText('Link toko berhasil diperbarui.');
    expect(save).toHaveBeenNthCalledWith(2, expect.objectContaining({ slug: 'kopi-baru', is_storefront_active: false }));
    check.mockRestore();
    save.mockRestore();
  });

  it('cancels address changes without making a save request', () => {
    const save = vi.spyOn(storefrontService, 'updateStorefrontSettings');
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'dibatalkan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(screen.getByRole('link', { name: 'Buka toko' })).toHaveAttribute('href', expect.stringContaining('/s/kopi-senja'));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Alamat toko')).toHaveValue('kopi-senja');
    save.mockRestore();
  });

  it('keeps address edits available to retry when saving fails', async () => {
    const check = vi.spyOn(storefrontService, 'checkSlugAvailability').mockResolvedValue({ available: true, slug: 'kopi-baru' });
    const save = vi.spyOn(storefrontService, 'updateStorefrontSettings').mockRejectedValue(new Error('invalid slug'));
    renderSettings();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Alamat toko'), { target: { value: 'kopi-baru' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cek ketersediaan' }));
    await screen.findByText('Link toko tersedia dan siap dipakai.');
    fireEvent.click(screen.getByRole('button', { name: 'Simpan link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Link toko belum berhasil diperbarui. Coba simpan lagi.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan link' })).toBeEnabled());
    expect(screen.getByLabelText('Alamat toko')).toHaveValue('kopi-baru');
    expect(screen.getByRole('link', { name: 'Buka toko' })).toHaveAttribute('href', expect.stringContaining('/s/kopi-senja'));
    expect(screen.queryByText('invalid slug')).not.toBeInTheDocument();
    save.mockRestore();
    check.mockRestore();
  });
});

describe('Storefront Default Config & Delivery Calculation', () => {
  it('normalizes empty JSONB object into full default config', () => {
    const config = normalizeStorefrontConfig({}, 'Kopi Senja', '08123456789');
    expect(config.template_style).toBe('EXPRESS_MENU');
    expect(config.theme.accent_color).toBe('default');
    expect(config.store_sections.length).toBeGreaterThanOrEqual(5);
    expect(config.checkout_sections.length).toBeGreaterThanOrEqual(5);
    expect(config.contact.whatsapp_number).toBe('08123456789');
    expect(config.copywriting.hero_title).toContain('Kopi Senja');
  });

  it('preserves custom section order and appends any missing default sections', () => {
    const config = normalizeStorefrontConfig({
      store_sections: [
        { id: 'product_catalog', enabled: true },
        { id: 'hero_banner', enabled: false },
      ],
    });
    expect(config.store_sections[0].id).toBe('product_catalog');
    expect(config.store_sections[1]).toEqual({
      id: 'hero_banner',
      enabled: false,
    });
    expect(config.store_sections.length).toBe(5);
  });

  it('calculates delivery fee for FLAT_RATE and free delivery threshold', () => {
    const delivery = {
      delivery_fee_mode: 'FLAT_RATE' as const,
      flat_delivery_fee: 12000,
      free_delivery_min_order: 100000,
      delivery_instruction: 'Kurir toko',
    };

    expect(calculateStorefrontDeliveryFee(50000, 'PICKUP', delivery)).toBe(0);
    expect(calculateStorefrontDeliveryFee(50000, 'DELIVERY', delivery)).toBe(
      12000
    );
    expect(calculateStorefrontDeliveryFee(100000, 'DELIVERY', delivery)).toBe(
      0
    );
    expect(
      calculateStorefrontDeliveryFee(50000, 'DELIVERY', {
        ...delivery,
        delivery_fee_mode: 'COURIER_CONFIRMATION',
      })
    ).toBe(0);
  });

  it('slugifies store names cleanly', () => {
    expect(slugifyStoreName('  Kopi & Roti Senja #1  ')).toBe(
      'kopi-roti-senja-1'
    );
  });
});

describe('WhatsApp Deep Link Helpers', () => {
  it('normalizes Indonesian phone numbers to 62 prefix', () => {
    expect(normalizeWhatsAppPhone('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsAppPhone('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsAppPhone('8123456789')).toBe('628123456789');
  });

  it('builds store inquiry, order confirmation, and courier notification URLs', () => {
    const inquiryUrl = buildStoreInquiryWhatsAppUrl(
      '08123456789',
      'Kopi Senja'
    );
    expect(inquiryUrl).toContain('https://wa.me/628123456789?text=');
    expect(decodeURIComponent(inquiryUrl)).toContain('Kopi Senja');

    const storeConfig = createDefaultStorefrontConfig(
      'Kopi Senja',
      '08123456789'
    );
    const confirmUrl = buildOrderConfirmationWhatsAppUrl({
      storePhone: '08123456789',
      storeName: 'Kopi Senja',
      order: {
        id: 'sale-1',
        invoice_number: 'INV-2026-001',
        public_tracking_token: 'tok-123',
        status: 'PENDING_CONFIRMATION',
        order_source: 'ONLINE',
        fulfillment_type: 'DELIVERY',
        customer_name: 'Rina',
        customer_phone: '081999888777',
        customer_email: 'rina@example.com',
        table_number: '',
        delivery_address: 'Jl. Melati No. 10',
        delivery_fee: 10000,
        delivery_courier_name: '',
        delivery_tracking_info: '',
        pickup_time: '',
        custom_field_label: 'Ucapan',
        custom_field_value: 'Selamat Ulang Tahun',
        payment_method: 'QRIS',
        payment_reference: '',
        notes: 'Es sedikit',
        rejection_reason: '',
        subtotal_amount: 44000,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 54000,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        items: [
          {
            id: 'item-1',
            variant_id: 'v-1',
            product_name: 'Kopi Susu',
            variant_name: 'Large',
            unit: 'cup',
            quantity: 2,
            price_at_sale: 22000,
            subtotal: 44000,
            modifiers: [],
          },
        ],
        store: {
          id: 'st-1',
          name: 'Kopi Senja',
          slug: 'kopi-senja',
          category: 'Cafe',
          location: 'Jakarta',
          phone: '08123456789',
          description: '',
          is_storefront_active: true,
          storefront_config: storeConfig,
        },
      },
      trackingUrl: 'https://hpp.app/s/kopi-senja/orders/tok-123',
    });

    const decodedConfirm = decodeURIComponent(confirmUrl);
    expect(decodedConfirm).toContain('INV-2026-001');
    expect(decodedConfirm).toContain('Jl. Melati No. 10');
    expect(decodedConfirm).toContain('QRIS');

    const courierUrl = buildBuyerCourierNotificationWhatsAppUrl({
      buyerPhone: '081999888777',
      buyerName: 'Rina',
      storeName: 'Kopi Senja',
      invoiceNumber: 'INV-2026-001',
      courierName: 'GoSend Instant - Pak Budi',
      trackingInfo: 'https://track.gosend.id/abc',
    });
    expect(decodeURIComponent(courierUrl)).toContain(
      'GoSend Instant - Pak Budi'
    );
  });
});

describe('SectionDndList Component', () => {
  it('moves sections up and down via accessible buttons', () => {
    const onChange = vi.fn();
    const items = [
      { id: 'announcement_bar', enabled: true },
      { id: 'hero_banner', enabled: true },
    ];

    render(
      <SectionDndList
        items={items}
        metadata={STORE_SECTION_METADATA}
        onChange={onChange}
      />
    );

    const moveDownBtn = screen.getByLabelText(
      /Pindahkan Bar Pengumuman & Promo ke bawah/i
    );
    fireEvent.click(moveDownBtn);

    expect(onChange).toHaveBeenCalledWith([
      { id: 'hero_banner', enabled: true },
      { id: 'announcement_bar', enabled: true },
    ]);
  });

  it('renders Store Hero Brand Name, Tagline, Slogan, Introduction, Highlights, and Hero Image', () => {
    const config = normalizeStorefrontConfig(
      {
        theme: {
          hero_layout: 'SPLIT_SHOWCASE',
          show_hero_image: true,
          banner_url: 'https://example.com/hero-kopi.jpg',
        },
        copywriting: {
          brand_name: 'Kopi Senja Roastery',
          brand_tagline: 'Artisan Coffee Sejak 2021',
          hero_title: 'Seduhan Terbaik Setiap Pagi',
          hero_subtitle:
            'Biji kopi arabika pilihan yang disangrai segar setiap minggu.',
          hero_highlights: ['100% Arabika', 'Sangrai Segar'],
          hero_primary_cta_text: 'Pesan Sekarang',
          hero_secondary_cta_text: 'Tanya Barista',
        },
      },
      'Kopi Senja',
      '08123456789'
    );

    render(
      <StorefrontRenderer
        store={{
          id: 'st-1',
          name: 'Kopi Senja',
          slug: 'kopi-senja',
          category: 'Cafe & Coffee Shop',
          location: 'Bandung',
          phone: '08123456789',
          description: 'Kopi enak',
          is_storefront_active: true,
          storefront_config: config,
        }}
        config={config}
        products={[]}
        categories={[]}
        cart={[]}
        viewMode="catalog"
        onViewModeChange={vi.fn()}
        onSelectProduct={vi.fn()}
        onUpdateCartQuantity={vi.fn()}
        previewMode
      />
    );

    expect(screen.getByText('Kopi Senja Roastery')).toBeTruthy();
    expect(screen.getByText('Artisan Coffee Sejak 2021')).toBeTruthy();
    expect(screen.getByText('Seduhan Terbaik Setiap Pagi')).toBeTruthy();
    expect(
      screen.getByText(
        'Biji kopi arabika pilihan yang disangrai segar setiap minggu.'
      )
    ).toBeTruthy();
    expect(screen.getByText('100% Arabika')).toBeTruthy();
    expect(screen.getByText('Sangrai Segar')).toBeTruthy();
    expect(screen.getByText('Pesan Sekarang')).toBeTruthy();
    expect(screen.getByText('Tanya Barista')).toBeTruthy();
  });

  it('renders StorefrontSettingsTab with a direct link to the Storefront Builder', () => {
    render(
      <MemoryRouter>
        <StorefrontSettingsTab
          store={{
            id: 'st-1',
            name: 'Kopi Senja',
            slug: 'kopi-senja',
            category: 'Cafe & Coffee Shop',
            location: 'Bandung',
            phone: '08123456789',
            status: 'online',
            is_storefront_active: true,
          }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Terima pesanan online')
    ).toBeTruthy();
    expect(
      screen.queryByText('Tampilan & pemesanan')
    ).not.toBeInTheDocument();

    const builderLink = screen.getByRole('link', {
      name: /Atur tampilan/i,
    });
    expect(builderLink.getAttribute('href')).toBe(
      '/settings/store/storefront-builder'
    );
  });

  it('renders StorefrontBuilderPage with full-width Builder controls and Live Preview side-by-side simultaneously', () => {
    render(
      <MemoryRouter>
        <StorefrontBuilderPage
          initialStore={{
            id: 'st-1',
            name: 'Kopi Senja',
            slug: 'kopi-senja',
            category: 'Cafe & Coffee Shop',
            location: 'Bandung',
            phone: '08123456789',
            status: 'online',
            is_storefront_active: true,
          }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText('Kustomisasi Toko Online & Checkout')
    ).toBeTruthy();
    const backLink = screen.getByRole('link', {
      name: /Kembali ke Pengaturan Toko/i,
    });
    expect(backLink.getAttribute('href')).toBe(
      '/settings/store?tab=storefront'
    );

    // Builder tabs are visible on the left AND Live Preview panel is rendered side-by-side on the right
    expect(screen.getByText('1. Tampilan')).toBeTruthy();
    expect(screen.getByText('2. Urutan Bagian')).toBeTruthy();
    const previewPanel = screen.getByTestId('storefront-live-preview-panel');
    expect(previewPanel).toBeTruthy();
    expect(screen.getByText('Live Preview (Berdampingan)')).toBeTruthy();
  });
});
