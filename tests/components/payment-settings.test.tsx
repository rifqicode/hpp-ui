import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { PaymentSettingsTab } from '@/features/settings/components/payment-settings-tab';
import { storeKeys } from '@/features/settings/hooks/use-stores-query';
import { settingsService } from '@/features/settings/services/settings-service';
import { mockPageServices, resetSession } from '../support/page-services';
import { store } from '../support/fixtures';
import { renderPage } from '../support/render';

beforeEach(() => {
  resetSession();
  mockPageServices();
});

it('replaces the cached POS profile after payment settings are saved', async () => {
  const user = userEvent.setup();
  const updated = { ...store, payment_config: { enable_cash: false, enable_qris: true, enable_edc: false, enable_bank_transfer: false, qris_image_url: '/qris.png', qris_merchant_name: 'Toko Rina', bank_accounts: [], edc_supported_banks: [], payment_instruction: '' } };
  vi.spyOn(settingsService, 'updateStoreProfile').mockResolvedValue(updated);
  const { client } = renderPage(<PaymentSettingsTab store={store} />);
  client.setQueryDefaults(['store-profile'], { gcTime: Infinity });
  client.setQueryData(storeKeys.profile(store.id), store);
  client.setQueryData(storeKeys.profile('other-store'), { ...store, id: 'other-store' });
  await user.click(screen.getByRole('switch', { name: 'Pembayaran Tunai (Cash)' }));
  await user.click(screen.getByRole('switch', { name: 'QRIS (Quick Response Code Indonesian Standard)' }));
  await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Pembayaran' }));

  await waitFor(() => expect(client.getQueryData(storeKeys.profile(store.id))).toEqual(updated));
  expect(settingsService.updateStoreProfile).toHaveBeenCalledWith(expect.objectContaining({ payment_config: expect.objectContaining({ enable_cash: false, enable_qris: true }) }));
  expect(client.getQueryData(storeKeys.profile('other-store'))).toEqual({ ...store, id: 'other-store' });
});
