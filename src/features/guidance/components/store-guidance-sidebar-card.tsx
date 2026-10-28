import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuidanceProgress } from '../hooks/use-guidance';
import { GUIDANCE_UI_ENABLED } from '../config/guidance-registry';

export function StoreGuidanceSidebarCard() {
  const { total, completed, percent, isAllCompleted, nextGuidance, isLoading } =
    useGuidanceProgress();

  // Hide automatically if all steps are completed or still loading
  if (isLoading || isAllCompleted || !nextGuidance) {
    return null;
  }

  // Guidance sidebar card is temporarily disabled on the UI per user request
  if (!GUIDANCE_UI_ENABLED) {
    return null;
  }

  return (
    <div className="mx-3 my-2 rounded-xl border border-primary/20 bg-linear-to-b from-primary/5 to-transparent p-3 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
          <Sparkles className="size-3.5 text-primary" />
          <span>Panduan Toko</span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {completed}/{total}
        </span>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1">
        Lanjut: {nextGuidance.config.title}
      </p>

      <Button asChild size="sm" variant="outline" className="mt-2 w-full h-7 text-xs font-medium">
        <Link to={nextGuidance.config.route}>
          <span>Lanjutkan</span>
          <ArrowRight className="size-3 ml-1" />
        </Link>
      </Button>
    </div>
  );
}
