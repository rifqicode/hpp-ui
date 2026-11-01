import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function chooseCalendarDay(user: ReturnType<typeof userEvent.setup>, value: string) {
  const [year, month, day] = value.split('-').map(Number);
  await user.selectOptions(screen.getByRole('combobox', { name: 'Pilih tahun' }), String(year));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Pilih bulan' }),
    String(month - 1),
  );
  const label = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
  await user.click(screen.getByRole('button', { name: new RegExp(`, ${label}$`) }));
}
