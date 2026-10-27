import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryHub } from '@/features/recipes/components/category-hub';
import { recipeService } from '@/features/recipes/services/recipe-service';
import type { ProductCategory } from '@/features/recipes/types';
import { renderPage } from '../support/render';
import { mockPageServices, resetSession } from '../support/page-services';

const mockCategories: ProductCategory[] = [
  { id: 'cat-1', name: 'Minuman Dingin' },
  { id: 'cat-2', name: 'Makanan Berat' },
];

beforeEach(() => {
  resetSession();
  mockPageServices();
});

describe('category hub', () => {
  it('renders category list and creates a new category', async () => {
    vi.mocked(recipeService.getCategories)
      .mockResolvedValueOnce([])
      .mockResolvedValue([mockCategories[0]]);
    vi.spyOn(recipeService, 'createCategory').mockResolvedValue(mockCategories[0]);

    const user = userEvent.setup();
    renderPage(<CategoryHub />);

    expect(await screen.findByText('Belum ada kategori')).toBeVisible();

    const input = screen.getByPlaceholderText('Contoh: Kopi, Makanan Utama, Pastry...');
    await user.type(input, 'Minuman Dingin');
    await user.click(screen.getByRole('button', { name: 'Tambah Kategori' }));

    await waitFor(() =>
      expect(recipeService.createCategory).toHaveBeenCalledWith('Minuman Dingin')
    );
  });

  it('requires confirmation before deleting a category and calls deleteCategory', async () => {
    vi.mocked(recipeService.getCategories).mockResolvedValue(mockCategories);
    vi.spyOn(recipeService, 'deleteCategory').mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage(<CategoryHub />);

    expect(await screen.findByText('Minuman Dingin')).toBeVisible();
    expect(screen.getByText('Makanan Berat')).toBeVisible();

    const deleteBtn = screen.getByRole('button', { name: 'Hapus kategori Minuman Dingin' });
    await user.click(deleteBtn);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Hapus Kategori?')).toBeVisible();
    expect(within(dialog).getByText('Minuman Dingin')).toBeVisible();

    await user.click(within(dialog).getByRole('button', { name: 'Hapus Kategori' }));

    await waitFor(() =>
      expect(recipeService.deleteCategory).toHaveBeenCalledWith('cat-1')
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});
