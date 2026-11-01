import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DatePicker } from '@/components/ui/date-picker';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import '@/index.css';

export function DatePickerFixture() {
  const [date, setDate] = useState('');
  const [target, setTarget] = useState('2026-09-20T14:35');
  const [submitted, setSubmitted] = useState('');

  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Tanggal pembelian</DialogTitle>
        <DialogDescription>Pilih tanggal dan jam.</DialogDescription>
        <form
          className="space-y-4"
          onSubmit={event => {
            event.preventDefault();
            setSubmitted(date);
          }}
        >
          <label htmlFor="purchase-date">Tanggal wajib</label>
          <DatePicker
            id="purchase-date"
            value={date}
            onChange={setDate}
            required
            min="2026-09-10"
            max="2026-09-25"
          />
          <label htmlFor="target-date">Target selesai</label>
          <DateTimePicker id="target-date" value={target} onChange={setTarget} />
          <button type="submit">Simpan</button>
          <output data-testid="submitted">{submitted}</output>
          <output data-testid="target">{target}</output>
        </form>
      </DialogContent>
    </Dialog>
  );
}

createRoot(document.getElementById('root')!).render(<DatePickerFixture />);
