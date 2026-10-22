import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SofiVectorAvatar } from './sofi-vector-avatar';

interface AIChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  isLocked?: boolean;
}

export function AIChatFloatingButton({ onClick, isOpen, isLocked }: AIChatFloatingButtonProps) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={onClick}
            data-testid="ai-chat-floating-btn"
            aria-label="Tanya Asisten AI"
            title={isLocked ? "Fitur Khusus Max Growth - Tanya Sofi" : "Tanya Sofi - Asisten Bisnis AI"}
            className={cn(
              "h-9 px-2.5 sm:px-3 rounded-lg border border-primary/25 bg-primary/5 hover:bg-primary/10 text-primary font-medium flex items-center gap-2 text-xs transition-colors shrink-0 cursor-pointer shadow-xs",
              isOpen && "bg-primary/15 border-primary/40 ring-1 ring-primary/20"
            )}
          >
            <SofiVectorAvatar className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline font-semibold">Tanya AI</span>
            {isLocked ? (
              <Lock className="h-3 w-3 text-amber-500 shrink-0" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={6}
          className="block max-w-xs border border-border bg-popover text-left text-popover-foreground shadow-md p-2.5 space-y-1"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">Tanya Sofi</span>
            {isLocked && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/40 uppercase tracking-wider">
                Max Growth
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Konsultasi HPP & Stok Toko</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
