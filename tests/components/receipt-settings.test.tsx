import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReceiptSettingsTab } from '@/features/settings/components/receipt-settings-tab';
import { settingsService } from '@/features/settings/services/settings-service';
import type { StoreInfo } from '@/features/settings/types';

const mockStore: StoreInfo = {
  id: 'store-123',
  name: 'Bakery Lezat',
  category: 'Bakery & Pastry',
  location: 'Jakarta',
  phone: '08123456789',
  status: 'online',
  receipt_config: {
    paper_size: '58mm',
    header_text: 'Roti Hangat Tiap Hari',
    footer_text: 'Terima kasih atas kunjungan Anda!',
    show_logo: false,
    show_cashier_name: true,
    show_customer_phone: true,
    show_notes: true,
  },
};

describe('ReceiptSettingsTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders initial receipt settings and preview correctly', () => {
    render(<ReceiptSettingsTab store={mockStore} />);

    expect(screen.getByText('Pengaturan Format Struk & Printer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Roti Hangat Tiap Hari')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Terima kasih atas kunjungan Anda!')).toBeInTheDocument();

    // Check preview renders store name and header text
    expect(screen.getByText('Bakery Lezat')).toBeInTheDocument();
    expect(screen.getAllByText('Roti Hangat Tiap Hari').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('INV-PREVIEW-001')).toBeInTheDocument();
  });

  it('switches paper size between 58mm and 80mm', async () => {
    const user = userEvent.setup();
    const { container } = render(<ReceiptSettingsTab store={mockStore} />);

    const receiptContainer = container.querySelector('.print-receipt-container');
    expect(receiptContainer).toHaveAttribute('data-paper-size', '58mm');

    // Click 80mm button
    const btn80mm = screen.getByRole('button', { name: /80mm \(Desktop \/ POS\)/i });
    await user.click(btn80mm);

    expect(receiptContainer).toHaveAttribute('data-paper-size', '80mm');
  });

  it('saves updated receipt configuration via settingsService', async () => {
    const updateSpy = vi.spyOn(settingsService, 'updateStoreProfile').mockResolvedValue({
      ...mockStore,
      receipt_config: {
        paper_size: '80mm',
        header_text: 'Header Baru',
        footer_text: 'Footer Baru',
        show_logo: false,
        show_cashier_name: false,
        show_customer_phone: true,
        show_notes: true,
      },
    });

    const onUpdated = vi.fn();
    const user = userEvent.setup();
    render(<ReceiptSettingsTab store={mockStore} onUpdated={onUpdated} />);

    // Switch to 80mm
    await user.click(screen.getByRole('button', { name: /80mm \(Desktop \/ POS\)/i }));

    // Change header and footer
    const headerInput = screen.getByLabelText(/Teks Header Tambahan/i);
    fireEvent.change(headerInput, { target: { value: 'Header Baru' } });

    const footerInput = screen.getByLabelText(/Teks Footer/i);
    fireEvent.change(footerInput, { target: { value: 'Footer Baru' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /Simpan Pengaturan Struk/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          receipt_config: expect.objectContaining({
            paper_size: '80mm',
            header_text: 'Header Baru',
            footer_text: 'Footer Baru',
          }),
        })
      );
    });

    expect(await screen.findByText('Pengaturan struk berhasil disimpan.')).toBeInTheDocument();
    expect(onUpdated).toHaveBeenCalled();
  });

  it('invokes window.print when Test Print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ReceiptSettingsTab store={mockStore} />);

    const testPrintBtn = screen.getByRole('button', { name: /Test Print/i });
    await user.click(testPrintBtn);

    expect(printSpy).toHaveBeenCalledOnce();
  });
});
