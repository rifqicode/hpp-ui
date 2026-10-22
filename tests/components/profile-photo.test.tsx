import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePhotoDialog } from '@/features/settings/components/profile-photo-dialog'
import { recipeService } from '@/features/recipes/services/recipe-service'

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  vi.spyOn(recipeService, 'uploadProductImage').mockResolvedValue('https://cdn.test/avatar.jpg')
})
function setup(currentAvatarUrl?: string, onSave = vi.fn().mockResolvedValue(undefined)) {
  const onOpenChange = vi.fn()
  render(<ProfilePhotoDialog open currentAvatarUrl={currentAvatarUrl} userName="Rina" onSave={onSave} onOpenChange={onOpenChange} />)
  const input = document.querySelector('input[type=file]')!
  return { onSave, onOpenChange, input, user: userEvent.setup(), choose: (file = new File(['img'], 'avatar.png', { type: 'image/png' })) => fireEvent.change(input, { target: { files: [file] } }) }
}
describe('profile photo dialog', () => {
  it('uploads and saves a selected photo', async () => {
    const { choose, user, onSave, onOpenChange } = setup('https://cdn.test/old.jpg')
    expect(screen.getByRole('button', { name: 'Simpan Foto' })).toBeDisabled()
    choose()
    expect(screen.getByText('avatar.png')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('https://cdn.test/avatar.jpg'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
  it('validates format and size, handles empty selection, and resets selection on close', async () => {
    const { choose, input, user, onOpenChange } = setup()
    fireEvent.change(input, { target: { files: [] } })
    choose(new File(['bad'], 'file.txt', { type: 'text/plain' }))
    expect(screen.getByText(/Format file tidak didukung/)).toBeVisible()
    choose(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))
    expect(screen.getByText(/Ukuran gambar melebihi 5MB/)).toBeVisible()
    choose()
    await user.click(screen.getByText('avatar.png').parentElement!.querySelector('button')!)
    expect(screen.queryByText('avatar.png')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
  it('accepts drag and drop and cancels without saving', async () => {
    const { user, onSave, onOpenChange } = setup()
    const zone = screen.getByText('Klik untuk memilih foto atau seret ke sini').parentElement!.parentElement!
    fireEvent.dragOver(zone); expect(zone.className).toContain('border-primary')
    fireEvent.dragLeave(zone); expect(zone.className).toContain('border-slate-200')
    fireEvent.drop(zone, { dataTransfer: { files: [] } })
    fireEvent.drop(zone, { dataTransfer: { files: [new File(['img'], 'drop.webp', { type: 'image/webp' })] } })
    expect(screen.getByText('drop.webp')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onSave).not.toHaveBeenCalled(); expect(onOpenChange).toHaveBeenCalledWith(false)
  })
  it.each([undefined, new Error('Foto tidak dapat dihapus'), 'invalid'])('removes an existing avatar and reports errors: %s', async (failure) => {
    const onSave = failure ? vi.fn().mockRejectedValue(failure) : vi.fn().mockResolvedValue(undefined)
    const { user, onOpenChange } = setup('https://cdn.test/old.jpg', onSave)
    await user.click(screen.getByRole('button', { name: 'Gunakan Avatar Standar' }))
    expect(onSave).toHaveBeenCalledWith('')
    if (failure) expect(await screen.findByText(failure instanceof Error ? failure.message : 'Gagal menghapus foto profil.')).toBeVisible()
    else await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
  it.each([new Error('Penyimpanan gagal'), 'invalid'])('retains upload on save failure: %s', async (failure) => {
    const { choose, user } = setup(undefined, vi.fn().mockRejectedValue(failure))
    choose(); await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))
    expect(await screen.findByText(failure instanceof Error ? failure.message : 'Gagal menyimpan foto profil.')).toBeVisible()
    expect(screen.getByText('avatar.png')).toBeVisible()
  })
  it.each([[800, 400, 400, 200], [400, 800, 200, 400], [100, 100, 100, 100], [200, 100, 200, 100]])('compresses %sx%s images to %sx%s when remote upload fails', async (width, height, expectedWidth, expectedHeight) => {
    vi.mocked(recipeService.uploadProductImage).mockRejectedValue(new Error('S3 unavailable'))
    class LoadedImage extends EventTarget {
      width = width; height = height; onload?: () => void
      set src(_value: string) { queueMicrotask(() => this.onload?.()) }
    }
    vi.stubGlobal('Image', LoadedImage)
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,compressed')
    const { choose, user, onSave } = setup(); choose()
    await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('data:image/jpeg;base64,compressed'))
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, expectedWidth, expectedHeight)
  })
  it('shows an image decode failure during fallback compression', async () => {
    vi.mocked(recipeService.uploadProductImage).mockRejectedValue(new Error('offline'))
    class FailedImage extends EventTarget { onerror?: () => void; set src(_value: string) { queueMicrotask(() => this.onerror?.()) } }
    vi.stubGlobal('Image', FailedImage)
    const { choose, user, onSave } = setup(); choose(); await user.click(screen.getByRole('button', { name: 'Simpan Foto' }))
    expect(await screen.findByText('Gagal membaca gambar')).toBeVisible(); expect(onSave).not.toHaveBeenCalled()
  })
})
