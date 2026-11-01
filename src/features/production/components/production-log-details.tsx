import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CurrencyText } from '@/components/ui/currency-text';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ProductionStatusBadge } from './production-status';
import { productionCosts } from '../services/production-batch-presentation';
import type { ProductionBatch } from '../types';

export function ProductionLogDetails({
  batch,
  variantIndex,
  totalVariants,
  headerActions,
  timezone = 'Asia/Jakarta',
}: {
  batch: ProductionBatch;
  variantIndex?: number;
  totalVariants?: number;
  headerActions?: ReactNode;
  timezone?: string;
}) {
  const completed = batch.status === 'COMPLETED';
  const cancelled = batch.status === 'CANCELLED' || batch.status === 'VOID';
  const costs = productionCosts(batch);
  const margin =
    completed && batch.hppPerUnit != null && batch.sellingPrice > 0
      ? Math.round(((batch.sellingPrice - batch.hppPerUnit) / batch.sellingPrice) * 1000) / 10
      : null;
  const stamp = (value: string) =>
    new Date(value).toLocaleString('id-ID', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="min-w-0 space-y-8">
      <header className="space-y-3">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
          <div className="min-w-0 space-y-2">
            {typeof variantIndex === 'number' && (totalVariants ?? 0) > 1 && (
              <p className="text-xs text-muted-foreground">
                Varian {variantIndex + 1} dari {totalVariants}
              </p>
            )}
            <h2 className="break-words text-xl font-semibold tracking-tight">
              {batch.productId ? (
                <Link
                  to={`/production/products/${batch.productId}`}
                  className="rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {batch.productName}
                </Link>
              ) : (
                batch.productName
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <ProductionStatusBadge status={batch.status} />
              {batch.productCategory && batch.productCategory !== 'Umum' && (
                <span>{batch.productCategory}</span>
              )}
            </div>
          </div>
          {headerActions}
        </div>
        {(batch.startedAt || batch.completedAt) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {batch.startedAt && <span>Mulai: {stamp(batch.startedAt)}</span>}
            {batch.completedAt && <span>Selesai: {stamp(batch.completedAt)}</span>}
          </p>
        )}
        {!!batch.recipeSnapshot?.modifiers?.length && (
          <ul className="space-y-1 text-sm">
            {batch.recipeSnapshot.modifiers.map(item => (
              <li key={item.id}>
                + {item.name}
                {item.stock_id && ` · ${Number(item.ingredient_quantity)} ${item.unit} per unit`}
              </li>
            ))}
          </ul>
        )}
        {batch.notes && (
          <p className="break-words text-sm leading-relaxed">
            <span className="font-medium">Catatan varian: </span>
            {batch.notes}
          </p>
        )}
      </header>
      <dl className="grid gap-5 border-y border-border py-5 sm:grid-cols-2 sm:gap-8">
        <div className="min-w-0 space-y-2">
          <dt className="text-sm text-muted-foreground">
            {completed ? 'Hasil produksi' : 'Target produksi'}
          </dt>
          <dd className="break-words text-3xl font-semibold tracking-tight tabular-nums">
            {Number(completed ? (batch.goodQuantity ?? 0) : batch.targetQuantity).toLocaleString(
              'id-ID',
            )}{' '}
            <span className="text-base font-normal text-muted-foreground">{batch.productUnit}</span>
          </dd>
          {completed && (
            <dd className="text-sm text-muted-foreground">
              Target {batch.targetQuantity.toLocaleString('id-ID')} ·{' '}
              {Number(batch.wasteQuantity || 0).toLocaleString('id-ID')} afkir
              {batch.targetQuantity > 0 &&
                ` · Hasil ${Math.round(((batch.goodQuantity || 0) / batch.targetQuantity) * 1000) / 10}% dari target`}
            </dd>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <dt className="text-sm text-muted-foreground">
            {completed ? 'HPP per unit' : cancelled ? 'Status produksi' : 'Pencatatan hasil'}
          </dt>
          {completed && batch.hppPerUnit != null ? (
            <dd className="break-words text-3xl font-semibold tracking-tight tabular-nums">
              <CurrencyText value={batch.hppPerUnit} preset="detail" />
            </dd>
          ) : (
            <dd className="text-sm leading-relaxed">
              {cancelled
                ? 'Produksi tidak dilanjutkan.'
                : 'Hasil, afkir, dan biaya aktual dicatat saat produksi selesai.'}
            </dd>
          )}
          {completed && batch.sellingPrice > 0 && (
            <dd className="text-sm text-muted-foreground">
              Harga jual <CurrencyText value={batch.sellingPrice} />
              {margin !== null && ` · Margin ${margin.toLocaleString('id-ID')}%`}
            </dd>
          )}
        </div>
      </dl>
      <section aria-label="Rincian bahan" className="min-w-0 space-y-3">
        <div>
          <h3 className="font-semibold">
            {batch.hasActualConsumptions ? 'Bahan terpakai' : 'Kebutuhan bahan'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {batch.hasActualConsumptions
              ? 'Pemakaian dan biaya bahan yang tercatat dari stok.'
              : 'Rencana berdasarkan resep dan jumlah produksi. Pemakaian aktual dicatat saat selesai.'}
          </p>
        </div>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%] px-0 pr-3">Bahan</TableHead>
              <TableHead className="w-[28%] px-1 text-right">Jumlah</TableHead>
              <TableHead className="w-[32%] px-0 pl-3 text-right">
                {batch.hasActualConsumptions ? 'Biaya' : 'Estimasi biaya'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.ingredients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="px-0 py-6 text-muted-foreground">
                  Belum ada rincian bahan untuk varian ini.
                </TableCell>
              </TableRow>
            ) : (
              batch.ingredients.map((item, index) => (
                <TableRow key={`${item.stockId}-${index}`}>
                  <TableCell className="break-words px-0 py-3 pr-3 font-medium">
                    {item.stockName}
                  </TableCell>
                  <TableCell className="break-words px-1 py-3 text-right tabular-nums">
                    {item.quantity.toLocaleString('id-ID')}{' '}
                    <span className="text-muted-foreground">{item.baseUnit}</span>
                  </TableCell>
                  <TableCell className="break-words px-0 py-3 pl-3 text-right tabular-nums">
                    <CurrencyText value={item.cost} preset="detail" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
      {completed && (
        <section aria-label="Rincian biaya" className="space-y-4 border-t border-border pt-5">
          <h3 className="font-semibold">Rincian biaya</h3>
          <dl className="space-y-3 text-sm tabular-nums">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Bahan</dt>
              <dd className="shrink-0">
                <CurrencyText value={costs.material} preset="detail" />
              </dd>
            </div>
            {(batch.overheads ?? []).map((item, index) => (
              <div key={item.id || index} className="flex justify-between gap-4">
                <dt className="min-w-0 break-words text-muted-foreground">{item.name}</dt>
                <dd className="shrink-0">
                  <CurrencyText value={item.amount} preset="detail" />
                </dd>
              </div>
            ))}
            {Boolean(batch.laborCost) && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tenaga kerja</dt>
                <dd className="shrink-0">
                  <CurrencyText value={batch.laborCost} preset="detail" />
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-border pt-3 font-semibold">
              <dt>Total biaya</dt>
              <dd className="shrink-0">
                <CurrencyText value={costs.total} preset="detail" />
              </dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
