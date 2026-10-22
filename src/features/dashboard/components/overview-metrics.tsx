import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { SectionStatus } from '../types/overview';
import { SectionMessage } from './section-message';

interface Metric {
  title: string;
  value: string | undefined;
  caption: string;
  icon: LucideIcon;
  tone: string;
  status: SectionStatus | undefined;
}

export function OverviewMetrics({ cards }: { cards: Metric[] }) {
  return <div className="grid gap-3 min-[380px]:grid-cols-2 xl:grid-cols-4">
    {cards.map(card => <Card key={card.title} className="min-w-0 px-3 py-4 shadow-none sm:px-5">
      <CardContent className="p-0">
        <div className="flex items-center justify-between gap-1.5">
          <h2 className="text-xs font-medium text-muted-foreground sm:text-sm">{card.title}</h2>
          <span className={`shrink-0 rounded-lg p-1.5 sm:p-2 ${card.tone}`}>
            <card.icon className="size-3.5 sm:size-4" aria-hidden="true" />
          </span>
        </div>
        {card.status !== 'ok' ? <SectionMessage status={card.status ?? 'unavailable'} /> : <>
          <p className="mt-3 text-xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] lg:text-2xl">{card.value ?? 'Belum tersedia'}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{card.caption}</p>
        </>}
      </CardContent>
    </Card>)}
  </div>;
}
