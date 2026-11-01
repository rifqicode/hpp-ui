import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PromotionInput, PromotionItemInput } from '../types';
import { newPromotionItem } from '../lib/promotion-form';
import { CatalogSelect } from './promotion-catalog-select';
import { Field, NumberField, selectClass } from './promotion-fields';

export function PromotionConditions({
  input,
  onChange,
  names,
  onName,
  disabled,
  errors,
}: {
  input: PromotionInput;
  onChange: (input: PromotionInput) => void;
  names: Map<string, string>;
  onName: (id: string, name: string) => void;
  disabled: boolean;
  errors: Record<string, string>;
}) {
  const setItem = (index: number, patch: Partial<PromotionItemInput>) =>
    onChange({
      ...input,
      items: input.items.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    });
  const discount = input.promo_type === 'DIRECT_DISCOUNT';
  const groups = [
    {
      role: 'TRIGGER' as const,
      show:
        input.promo_type === 'BUNDLE' ||
        input.promo_type === 'BUY_X_GET_Y' ||
        (discount && input.scope === 'ITEM'),
      title: discount
        ? 'Menu yang mendapat diskon'
        : input.promo_type === 'BUNDLE'
          ? 'Isi paket'
          : 'Menu persyaratan',
      add: 'Tambah Persyaratan',
    },
    {
      role: 'REWARD' as const,
      show: input.promo_type === 'BUY_X_GET_Y' || input.promo_type === 'SPECIAL_PRICE',
      title: input.promo_type === 'SPECIAL_PRICE' ? 'Menu tebus murah' : 'Menu bonus gratis',
      add: 'Tambah Menu Bonus / Hadiah',
    },
  ];
  return (
    <>
      {groups
        .filter(group => group.show)
        .map(group => {
          const rows = input.items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.item_role === group.role);
          return (
            <section key={group.role} className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-semibold">{group.title}</h3>
              {!rows.length && (
                <p className="text-sm text-muted-foreground">
                  {group.role === 'TRIGGER'
                    ? 'Belum ada menu persyaratan.'
                    : 'Belum ada menu bonus atau tebus murah.'}
                </p>
              )}
              {rows.map(({ item, index }) => {
                const kind =
                  item.product_id !== null
                    ? 'product'
                    : item.category_id !== null
                      ? 'category'
                      : 'variant';
                return (
                  <fieldset key={index} className="min-w-0 space-y-3 rounded-lg border p-3 sm:p-4">
                    <legend className="px-1 text-xs font-medium text-muted-foreground">
                      {group.role === 'TRIGGER' ? 'Menu persyaratan' : 'Menu bonus'} {index + 1}
                    </legend>
                    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                      {group.role === 'TRIGGER' && (
                        <Field label={`Jenis pilihan ${index + 1}`}>
                          {id => (
                            <select
                              id={id}
                              className={selectClass}
                              value={kind}
                              onChange={event => {
                                const selector = event.target.value;
                                setItem(index, {
                                  variant_id: selector === 'variant' ? '' : null,
                                  product_id: selector === 'product' ? '' : null,
                                  category_id: selector === 'category' ? '' : null,
                                });
                              }}
                            >
                              <option value="variant">Varian tertentu</option>
                              <option value="product">Semua varian produk</option>
                              <option value="category">Kategori produk</option>
                            </select>
                          )}
                        </Field>
                      )}
                      <CatalogSelect
                        label={`Pilihan ${group.role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'} ${index + 1}`}
                        kind={kind}
                        value={item.variant_id || item.product_id || item.category_id || ''}
                        names={names}
                        onName={onName}
                        disabled={disabled}
                        error={errors[`item-select-${index}`]}
                        onChange={selected =>
                          setItem(index, {
                            variant_id: kind === 'variant' ? selected : null,
                            product_id: kind === 'product' ? selected : null,
                            category_id: kind === 'category' ? selected : null,
                          })
                        }
                      />
                      {!discount && (
                        <NumberField
                          label={`Jumlah ${group.role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'} ${index + 1}`}
                          value={item.required_quantity}
                          error={errors[`item-qty-${index}`]}
                          onChange={quantity => setItem(index, { required_quantity: quantity })}
                        />
                      )}
                      {group.role === 'REWARD' && input.promo_type === 'SPECIAL_PRICE' && (
                        <NumberField
                          label={`Harga tebus ${index + 1} (Rp)`}
                          value={item.reward_price}
                          error={errors[`item-price-${index}`]}
                          onChange={price => setItem(index, { reward_price: price })}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-11 text-destructive sm:min-h-10"
                      disabled={disabled}
                      onClick={() =>
                        onChange({
                          ...input,
                          items: input.items.filter((_, position) => position !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Hapus {group.role === 'TRIGGER' ? 'persyaratan' : 'menu bonus / hadiah'}{' '}
                      {index + 1}
                    </Button>
                  </fieldset>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="min-h-11 sm:min-h-10"
                disabled={disabled || input.items.length >= 100}
                onClick={() =>
                  onChange({ ...input, items: [...input.items, newPromotionItem(group.role)] })
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                {group.add}
              </Button>
            </section>
          );
        })}
      {errors.items && (
        <p role="alert" className="text-sm text-destructive">
          {errors.items}
        </p>
      )}
      {input.items.length > 0 && !discount && (
        <p className="text-xs leading-5 text-muted-foreground">
          Semua menu persyaratan harus terpenuhi. Bonus tidak dihitung sebagai minimum belanja.
          Topping tetap berbayar normal.
        </p>
      )}
      <div className="grid gap-4 border-t pt-5 sm:grid-cols-2">
        <NumberField
          label="Minimum belanja (Rp)"
          hint="Harga dasar menu berbayar, tanpa bonus, topping, pajak, atau ongkir."
          value={input.min_purchase_amount}
          error={errors.min_purchase_amount}
          onChange={value => onChange({ ...input, min_purchase_amount: value })}
        />
        {input.promo_type === 'BUNDLE' && (
          <NumberField
            label="Harga satu paket (Rp)"
            value={input.bundle_price ?? ''}
            error={errors.bundle_price}
            onChange={value => onChange({ ...input, bundle_price: value })}
          />
        )}
      </div>
    </>
  );
}
