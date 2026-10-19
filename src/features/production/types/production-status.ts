import type { ProductionStatus } from './index';

export const PRODUCTION_STATUSES: Record<ProductionStatus, { label: string; color: string; dot: string }> = {
  DRAFT: { label: 'Draft', color: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200', dot: 'bg-slate-500' },
  QUEUED: { label: 'Antrean', color: 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-200', dot: 'bg-purple-500' },
  IN_PROGRESS: { label: 'Sedang diproduksi', color: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Selesai', color: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Dibatalkan', color: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200', dot: 'bg-amber-500' },
  VOID: { label: 'Void', color: 'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200', dot: 'bg-red-500' },
};

