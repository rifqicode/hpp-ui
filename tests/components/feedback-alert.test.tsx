import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FeedbackAlert } from '@/components/ui/feedback-alert';

describe('FeedbackAlert dismissal', () => {
  it('dismisses success after four seconds and keeps a new message visible for its full duration', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { rerender } = render(<FeedbackAlert variant="success" onDismiss={onDismiss}>Link tersimpan.</FeedbackAlert>);
    act(() => vi.advanceTimersByTime(3999));
    expect(onDismiss).not.toHaveBeenCalled();
    rerender(<FeedbackAlert variant="success" onDismiss={onDismiss}>Pesanan sudah aktif.</FeedbackAlert>);
    act(() => vi.advanceTimersByTime(3999));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('keeps errors visible until closed by the user', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(<FeedbackAlert variant="error" onDismiss={onDismiss}>Belum tersimpan. Coba lagi.</FeedbackAlert>);
    act(() => vi.advanceTimersByTime(60000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Belum tersimpan. Coba lagi.');
    fireEvent.click(screen.getByRole('button', { name: 'Tutup notifikasi' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('waits for loading to finish before starting the success timeout and cancels it on unmount', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    const { rerender, unmount } = render(<FeedbackAlert variant="loading" onDismiss={onDismiss}>Menyimpan…</FeedbackAlert>);
    act(() => vi.advanceTimersByTime(10000));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Tutup notifikasi' })).not.toBeInTheDocument();
    rerender(<FeedbackAlert variant="success" onDismiss={onDismiss}>Berhasil disimpan.</FeedbackAlert>);
    act(() => vi.advanceTimersByTime(3999));
    expect(onDismiss).not.toHaveBeenCalled();
    unmount();
    act(() => vi.advanceTimersByTime(10000));
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
