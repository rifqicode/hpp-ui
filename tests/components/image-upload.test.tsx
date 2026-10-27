import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImageUploadDropzone } from '@/features/recipes/components/image-upload-dropzone'
import { recipeService } from '@/features/recipes/services/recipe-service'

function Example({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState<string | null>(null)
  return <ImageUploadDropzone value={value} onChange={setValue} disabled={disabled} />
}
describe('product image upload', () => {
  it('opens the file picker with Enter and Space without submitting its form', async () => {
    const user = userEvent.setup()
    const submit = vi.fn(event => event.preventDefault())
    const { container } = render(<form onSubmit={submit}><Example /></form>)
    const input = container.querySelector<HTMLInputElement>('input[type=file]')!
    const pickFile = vi.spyOn(input, 'click').mockImplementation(() => {})
    await user.tab()
    expect(screen.getByRole('button', { name: 'Unggah foto produk' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(pickFile).toHaveBeenCalledTimes(2)
    expect(submit).not.toHaveBeenCalled()
  })

  it('skips the disabled upload button during keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<><Example disabled /><button type="button">Selanjutnya</button></>)
    expect(screen.getByRole('button', { name: 'Unggah foto produk' })).toBeDisabled()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Selanjutnya' })).toHaveFocus()
  })

  it('prevents another upload while a file is being uploaded', async () => {
    vi.spyOn(recipeService, 'uploadProductImage').mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    const { container } = render(<Example />)
    const file = new File(['x'], 'image.png', { type: 'image/png' })
    await user.upload(container.querySelector('input[type=file]')!, file)
    const zone = screen.getByRole('button', { name: 'Unggah foto produk' })
    expect(zone).toBeDisabled()
    expect(zone).toHaveAttribute('aria-busy', 'true')
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    expect(recipeService.uploadProductImage).toHaveBeenCalledOnce()
  })

  it('uploads a valid image and allows removing the preview', async () => {
    vi.spyOn(recipeService, 'uploadProductImage').mockResolvedValue('https://example.com/image.png')
    const user = userEvent.setup()
    const { container } = render(<Example />)
    await user.upload(container.querySelector('input[type=file]')!, new File(['x'], 'image.png', { type: 'image/png' }))
    expect(await screen.findByRole('img', { name: 'Product Preview' })).toHaveAttribute('src', 'https://example.com/image.png')
    const buttons = screen.getAllByRole('button')
    await user.click(buttons.at(-1)!)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it.each(['invalid', 'oversized', 'server'])('reports %s upload errors', async mode => {
    vi.spyOn(recipeService, 'uploadProductImage').mockRejectedValue(new Error('Server sibuk'))
    const user = userEvent.setup({ applyAccept: false })
    const { container } = render(<Example />)
    const file = new File(['x'], mode === 'invalid' ? 'file.pdf' : 'image.png', { type: mode === 'invalid' ? 'application/pdf' : 'image/png' })
    if (mode === 'oversized') Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 + 1 })
    await user.upload(container.querySelector('input[type=file]')!, file)
    expect(await screen.findByText(mode === 'invalid' ? /Format file tidak didukung/ : mode === 'oversized' ? /melebihi 5MB/ : 'Server sibuk')).toBeVisible()
  })
  it('accepts dropped images and ignores drops while disabled', async () => {
    vi.spyOn(recipeService, 'uploadProductImage').mockResolvedValue('https://example.com/image.png')
    const { container, rerender } = render(<Example />)
    const zone = container.querySelector('[class*="border-dashed"]')!
    fireEvent.dragOver(zone); fireEvent.dragLeave(zone)
    const files = [new File(['x'], 'image.webp', { type: 'image/webp' })]
    fireEvent.drop(zone, { dataTransfer: { files } })
    await waitFor(() => expect(recipeService.uploadProductImage).toHaveBeenCalledOnce())
    rerender(<Example disabled />)
    fireEvent.drop(container.querySelector('[class*="border"]')!, { dataTransfer: { files } })
    expect(recipeService.uploadProductImage).toHaveBeenCalledOnce()
  })
})
