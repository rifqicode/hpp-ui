import { BatchBuilder } from './batch-builder';
import type { ProductionHead } from '../services/production-batch-service';

export function ProductionBatchEditor({
  batch,
  onSaved,
}: {
  batch?: ProductionHead;
  onSaved?: (batch: ProductionHead) => void;
}) {
  return <BatchBuilder batch={batch} onHeadSaved={onSaved} />;
}
