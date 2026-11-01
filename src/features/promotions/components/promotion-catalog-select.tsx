import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePromotionCatalog } from '../hooks/use-promotion-catalog';
import { promotionError } from '../lib/promotion-form';
import { Field } from './promotion-fields';

export function CatalogSelect({
  label,
  value,
  kind = 'variant',
  onChange,
  names,
  onName,
  error,
  disabled = false,
}: {
  label: string;
  value: string;
  kind?: 'variant' | 'product' | 'category';
  onChange: (value: string) => void;
  names: Map<string, string>;
  onName: (id: string, name: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{ id: string; name: string }>();
  const catalog = usePromotionCatalog(open && !disabled);
  const rows = catalog.query.data?.data || [];
  const choices =
    kind === 'variant'
      ? rows
      : [
          ...new Map(
            rows
              .filter(
                row =>
                  row[`${kind}_id`] && row[`${kind}_id`] !== '00000000-0000-0000-0000-000000000000',
              )
              .map(row => [
                row[`${kind}_id`],
                { id: row[`${kind}_id`], name: row[`${kind}_name`] || 'Tanpa kategori' },
              ]),
          ).values(),
        ];
  const name =
    names.get(value) ||
    (selected?.id === value ? selected.name : undefined) ||
    choices.find(choice => choice.id === value)?.name;
  const loading = catalog.settling || catalog.query.isPending || catalog.query.isFetching;
  const totalPages = Math.max(1, Math.ceil((catalog.query.data?.total || 0) / 50));

  return (
    <Field label={label} error={error}>
      {(id, hintId) => (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-describedby={hintId}
              aria-invalid={Boolean(error)}
              className="h-auto min-h-11 w-full min-w-0 justify-between whitespace-normal text-left font-normal sm:min-h-10"
            >
              <span className="min-w-0 break-words">
                {value ? name || 'Pilihan tersimpan' : 'Pilih menu'}
              </span>
              <ChevronsUpDown
                className="ml-2 size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label={`Pilih ${label.toLowerCase()}`}
            className="w-[min(26rem,calc(100vw-1rem))] p-2"
          >
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                aria-label={`Cari ${label.toLowerCase()}`}
                placeholder="Cari produk, varian, atau kategori…"
                value={catalog.search}
                disabled={disabled}
                onChange={event => catalog.setSearch(event.target.value)}
                className="h-11 pl-9"
              />
            </div>
            {loading ? (
              <p role="status" className="p-3 text-sm text-muted-foreground">
                Memuat pilihan menu…
              </p>
            ) : catalog.query.isError ? (
              <div role="alert" className="space-y-2 p-3 text-sm">
                <p>{promotionError(catalog.query.error)}</p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => void catalog.query.refetch()}
                >
                  Muat ulang pilihan
                </Button>
              </div>
            ) : !choices.length ? (
              <p className="p-3 text-sm text-muted-foreground">
                Tidak ada menu yang sesuai. Ubah pencarian atau periksa katalog produk.
              </p>
            ) : (
              <ul aria-label="Hasil pencarian menu" className="max-h-64 overflow-y-auto py-1">
                {choices.map(choice => (
                  <li key={choice.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
                      onClick={() => {
                        setSelected(choice);
                        onName(choice.id, choice.name);
                        onChange(choice.id);
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 break-words">{choice.name}</span>
                      {value === choice.id && (
                        <Check className="size-4 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 border-t pt-2 text-xs text-muted-foreground">
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || loading || catalog.page <= 1}
                  onClick={() => catalog.setPage(catalog.page - 1)}
                >
                  Sebelumnya
                </Button>
                <span>
                  {catalog.page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || loading || catalog.page >= totalPages}
                  onClick={() => catalog.setPage(catalog.page + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}
