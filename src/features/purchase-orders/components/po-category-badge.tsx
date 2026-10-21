import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PURCHASE_ORDER_CATEGORY_LABELS, type PurchaseOrderCategory } from '../types'

export function POCategoryBadge({ category }: { category: PurchaseOrderCategory }) {
  return <Badge variant="outline" className={cn('text-[10px] font-medium', category === 'DIRECT_ORDER'
    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-200'
    : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200')}>
    {PURCHASE_ORDER_CATEGORY_LABELS[category]}
  </Badge>
}
