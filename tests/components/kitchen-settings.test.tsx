import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KitchenSettingsTab } from '@/features/settings/components/kitchen-settings-tab';
import { settingsService } from '@/features/settings/services/settings-service';
import type { StoreInfo } from '@/features/settings/types';

const store: StoreInfo = { id: 'outlet-a', name: 'Outlet A', category: 'Cafe', location: 'Jakarta', status: 'online' };
const config = {
  enable_kds_timer_alert: true,
  default_prep_time_minutes: 20,
  warning_time_minutes: 10,
  late_time_minutes: 18,
  enable_manual_timer_alert: false,
  manual_warning_lead_minutes: 15,
};

describe('KitchenSettingsTab', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('defaults to disabled with 15/12/15 and 15 minutes for an unconfigured outlet', () => {
    render(<KitchenSettingsTab store={store} onUpdated={vi.fn()} />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
    switches.forEach(sw => expect(sw).not.toBeChecked());
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.map(input => (input as HTMLInputElement).value)).toEqual(['15', '12', '15', '15']);
    inputs.forEach(input => expect(input).toBeDisabled());
  });

  it('saves configured times and can disable alerts while keeping them', async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(settingsService, 'updateKitchenSettings')
      .mockResolvedValueOnce(config)
      .mockResolvedValueOnce({ ...config, enable_kds_timer_alert: false });
    const onUpdated = vi.fn();
    const { rerender } = render(<KitchenSettingsTab store={store} onUpdated={onUpdated} />);
    await user.click(screen.getAllByRole('switch')[0]);
    for (const [index, value] of ['20', '10', '18'].entries()) {
      fireEvent.change(screen.getAllByRole('spinbutton')[index], { target: { value } });
    }
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(config));
    expect(onUpdated).toHaveBeenCalledWith({ ...store, kitchen_settings: config });
    rerender(<KitchenSettingsTab store={{ ...store, kitchen_settings: config }} onUpdated={onUpdated} />);
    expect(await screen.findByText('Pengaturan dapur berhasil disimpan.')).toBeVisible();
    await user.click(screen.getAllByRole('switch')[0]);
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    await waitFor(() => expect(update).toHaveBeenLastCalledWith({ ...config, enable_kds_timer_alert: false }));
    await waitFor(() => expect(screen.getAllByRole('switch')[0]).not.toBeChecked());
  });

  it('configures and validates manual production timer alert lead minutes', async () => {
    const user = userEvent.setup();
    const manualConfig = {
      ...config,
      enable_kds_timer_alert: false,
      enable_manual_timer_alert: true,
      manual_warning_lead_minutes: 30,
    };
    const update = vi.spyOn(settingsService, 'updateKitchenSettings').mockResolvedValue(manualConfig);
    render(<KitchenSettingsTab store={store} onUpdated={vi.fn()} />);

    const manualSwitch = screen.getByLabelText('Aktifkan Peringatan Target Selesai Produksi Manual');
    await user.click(manualSwitch);

    const manualInput = screen.getByLabelText('Peringatan Sebelum Target Selesai (Produksi Manual)');
    expect(manualInput).toBeEnabled();

    fireEvent.change(manualInput, { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    expect(screen.getByText(/bilangan bulat lebih dari 0/)).toBeVisible();
    expect(update).not.toHaveBeenCalled();

    fireEvent.change(manualInput, { target: { value: '30' } });
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          enable_manual_timer_alert: true,
          manual_warning_lead_minutes: 30,
        }),
      ),
    );
  });

  it.each(['0', '-1', '1.5', ''])('rejects invalid active time %s', async value => {
    const user = userEvent.setup();
    const update = vi.spyOn(settingsService, 'updateKitchenSettings');
    render(<KitchenSettingsTab store={{ ...store, kitchen_settings: config }} onUpdated={vi.fn()} />);
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value } });
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    expect(screen.getByText(/bilangan bulat lebih dari 0/)).toBeVisible();
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects warning above late and permits equal thresholds', async () => {
    const user = userEvent.setup();
    const update = vi.spyOn(settingsService, 'updateKitchenSettings').mockResolvedValue(config);
    render(<KitchenSettingsTab store={{ ...store, kitchen_settings: config }} onUpdated={vi.fn()} />);
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '19' } });
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    expect(screen.getByText('Warning Time tidak boleh melebihi Late Time.')).toBeVisible();
    expect(update).not.toHaveBeenCalled();
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '18' } });
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
  });

  it('shows save errors and restores controls for retry', async () => {
    const user = userEvent.setup();
    vi.spyOn(settingsService, 'updateKitchenSettings').mockRejectedValue(new Error('Koneksi terputus'));
    render(<KitchenSettingsTab store={store} onUpdated={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' }));
    expect(await screen.findByText('Koneksi terputus')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Simpan Pengaturan Dapur' })).toBeEnabled();
  });
});
