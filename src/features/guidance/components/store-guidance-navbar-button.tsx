import { Link } from 'react-router-dom';
import { Compass, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGuidanceProgress } from '../hooks/use-guidance';
import { GUIDANCE_UI_ENABLED } from '../config/guidance-registry';
import { useAuthStore } from '@/store/use-auth-store';

export function StoreGuidanceNavbarButton() {
  const activeStoreId = useAuthStore((state) => state.activeStoreId);
  const { total, completed, isAllCompleted, isLoading } = useGuidanceProgress();

  if (!activeStoreId || isLoading || total === 0) {
    return null;
  }

  // Guidance navbar button is temporarily disabled on the UI per user request
  if (!GUIDANCE_UI_ENABLED) {
    return null;
  }

  const remaining = Math.max(0, total - completed);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg border border-border/60 bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground shadow-xs transition-colors shrink-0 cursor-pointer"
          aria-label="Panduan Penyiapan Toko"
          data-testid="store-guidance-navbar-btn"
        >
          <Link to="/guidance">
            <Compass className="size-4.5" />
            {isAllCompleted ? (
              <span
                data-testid="store-guidance-badge-completed"
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-xs"
              >
                <Check className="size-2.5 stroke-[3]" />
              </span>
            ) : remaining > 0 ? (
              <span
                data-testid="store-guidance-badge-remaining"
                className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-xs"
              >
                {remaining}
              </span>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6} className="text-xs">
        {isAllCompleted
          ? 'Panduan Penyiapan Toko (Selesai 🎉)'
          : `Panduan Penyiapan Toko (${remaining} langkah tersisa)`}
      </TooltipContent>
    </Tooltip>
  );
}
