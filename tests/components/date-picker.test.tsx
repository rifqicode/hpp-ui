import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from '@/components/ui/date-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { dateInputLabel, formatDateInput, parseDateInput } from '@/lib/date-input';
import { chooseCalendarDay } from '../support/date-picker';

describe('calendar date values', () => {
  it('round trips calendar days locally and rejects impossible dates', () => {
    const date = parseDateInput('2026-01-01')!;
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
    expect(formatDateInput(date)).toBe('2026-01-01');
    expect(parseDateInput('2026-02-29')).toBeUndefined();
    expect(parseDateInput('2024-02-29')).toBeDefined();
    expect(parseDateInput('2026-1-1')).toBeUndefined();
    expect(dateInputLabel('2026-08-17')).toBe('17 Agt 2026');
  });
});

describe('DatePicker', () => {
  it('selects a localized date with bounds, closes, and restores keyboard focus', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    render(
      <>
        <label htmlFor="date">Tanggal pembelian</label>
        <DatePicker
          id="date"
          value="2026-09-20"
          min="2026-09-10"
          max="2026-09-25"
          onChange={changed}
        />
      </>,
    );
    const trigger = screen.getByRole('button', { name: 'Tanggal pembelian' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: /, 9 September 2026$/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /26 September 2026/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /21 September 2026/ }));
    expect(changed).toHaveBeenCalledWith('2026-09-21');
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('clears optional dates and blocks a required form until a date is selected', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    function Form() {
      const [value, setValue] = useState('');
      return (
        <form
          onSubmit={event => {
            event.preventDefault();
            submit(new FormData(event.currentTarget).get('date'));
          }}
        >
          <DatePicker
            aria-label="Tanggal order"
            name="date"
            required
            value={value}
            onChange={setValue}
          />
          <button type="submit">Simpan</button>
        </form>
      );
    }
    render(<Form />);
    await user.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('grid')).toBeVisible();
    await chooseCalendarDay(user, '2026-09-20');
    await user.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(submit).toHaveBeenCalledWith('2026-09-20');
    await user.click(screen.getByRole('button', { name: 'Tanggal order' }));
    await user.click(screen.getByRole('button', { name: 'Hapus tanggal' }));
    expect(screen.getByRole('button', { name: 'Tanggal order' })).toHaveTextContent(
      'Pilih tanggal',
    );
  });

  it('respects disabled and native fieldset states', async () => {
    const changed = vi.fn();
    render(
      <fieldset disabled>
        <DatePicker aria-label="Tanggal" value="" onChange={changed} />
      </fieldset>,
    );
    expect(screen.getByRole('button', { name: 'Tanggal' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Tanggal' }));
    expect(changed).not.toHaveBeenCalled();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });
});

describe('DateTimePicker', () => {
  it('keeps the wall-clock time when the date changes and emits local datetime strings', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    function Form() {
      const [value, setValue] = useState('2026-09-20T14:35');
      return (
        <DateTimePicker
          aria-label="Target selesai"
          value={value}
          onChange={next => {
            changed(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Form />);
    await user.click(screen.getByRole('button', { name: 'Target selesai' }));
    await chooseCalendarDay(user, '2026-09-21');
    expect(changed).toHaveBeenLastCalledWith('2026-09-21T14:35');
    fireEvent.change(screen.getByLabelText('Jam'), { target: { value: '18:45' } });
    expect(changed).toHaveBeenLastCalledWith('2026-09-21T18:45');
    await user.click(screen.getByRole('button', { name: 'Target selesai' }));
    await user.click(screen.getByRole('button', { name: 'Hapus tanggal' }));
    expect(changed).toHaveBeenLastCalledWith('');
    expect(screen.getByLabelText('Jam')).toBeDisabled();
  });
});

describe('DateRangePicker', () => {
  it('starts a fresh range and permits selecting a single day', async () => {
    const user = userEvent.setup();
    const changed = vi.fn();
    function Form() {
      const [value, setValue] = useState({ start: '2026-09-01', end: '2026-09-10' });
      return (
        <DateRangePicker
          value={value}
          onChange={next => {
            changed(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Form />);
    await user.click(screen.getByRole('button', { name: 'Rentang tanggal' }));
    await chooseCalendarDay(user, '2026-09-20');
    expect(changed).toHaveBeenLastCalledWith({ start: '2026-09-20', end: '' });
    await chooseCalendarDay(user, '2026-09-20');
    expect(changed).toHaveBeenLastCalledWith({ start: '2026-09-20', end: '2026-09-20' });
    await user.click(screen.getByRole('button', { name: 'Selesai' }));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rentang tanggal' }));
    await chooseCalendarDay(user, '2026-09-22');
    await chooseCalendarDay(user, '2026-09-18');
    expect(changed).toHaveBeenLastCalledWith({ start: '2026-09-18', end: '2026-09-22' });
  });
});
