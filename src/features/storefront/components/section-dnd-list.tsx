import * as React from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { StorefrontSectionItem } from '../types';

export interface SectionMetadataMap {
  [id: string]: {
    label: string;
    description: string;
  };
}

interface SectionDndListProps {
  items: StorefrontSectionItem[];
  metadata: SectionMetadataMap;
  onChange: (nextItems: StorefrontSectionItem[]) => void;
  lockedIds?: string[];
}

export function SectionDndList({
  items,
  metadata,
  onChange,
  lockedIds = [],
}: SectionDndListProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.length ||
      toIndex >= items.length
    ) {
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  const toggleItem = (id: string, enabled: boolean) => {
    if (lockedIds.includes(id)) return;
    onChange(
      items.map((item) => (item.id === id ? { ...item, enabled } : item))
    );
  };

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    setDraggedIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    event.preventDefault();
    const fromIdx =
      draggedIndex !== null
        ? draggedIndex
        : Number(event.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(fromIdx)) {
      moveItem(fromIdx, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-2.5" role="list">
      {items.map((item, index) => {
        const meta = metadata[item.id] || {
          label: item.id,
          description: '',
        };
        const isLocked = lockedIds.includes(item.id);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index && draggedIndex !== index;

        return (
          <div
            key={item.id}
            role="listitem"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
              isDragOver
                ? 'border-primary bg-accent/50'
                : isDragging
                ? 'border-border bg-muted/60 opacity-60'
                : item.enabled
                ? 'border-border bg-card'
                : 'border-border bg-muted/30'
            }`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div
                className="mt-0.5 flex size-8 shrink-0 cursor-grab items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground active:cursor-grabbing"
                title="Geser untuk mengubah urutan"
                aria-hidden="true"
              >
                <GripVertical className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-foreground sm:text-sm">
                    {index + 1}. {meta.label}
                  </span>
                  {isLocked ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Selalu Tampil
                    </Badge>
                  ) : !item.enabled ? (
                    <Badge variant="outline" className="text-[10px]">
                      Disembunyikan
                    </Badge>
                  ) : null}
                </div>
                {meta.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {meta.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={index === 0}
                onClick={() => moveItem(index, index - 1)}
                aria-label={`Pindahkan ${meta.label} ke atas`}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, index + 1)}
                aria-label={`Pindahkan ${meta.label} ke bawah`}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <div className="ml-1 flex items-center">
                <Switch
                  checked={item.enabled}
                  disabled={isLocked}
                  onCheckedChange={(checked) => toggleItem(item.id, checked)}
                  aria-label={`Aktifkan bagian ${meta.label}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
