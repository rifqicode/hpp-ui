import { Bot, User, RotateCw, AlertCircle } from 'lucide-react';
import type { AIChatMessage } from '../types/ai-chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AIChatMessageItemProps {
  message: AIChatMessage;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function AIChatMessageItem({ message, onRetry, isRetrying }: AIChatMessageItemProps) {
  const isUser = message.role === 'user';
  const isError = !isUser && Boolean(message.is_error);

  // Simple Markdown renderer for bullet points, bold text, and linebreaks
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm my-0.5">
            {renderedLine.slice(1)}
          </li>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-sm my-0.5 font-medium">
            {renderedLine}
          </div>
        );
      }

      return (
        <p key={idx} className={cn("text-sm leading-relaxed", idx > 0 && "mt-1.5")}>
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <div
      data-testid={`ai-message-${message.role}`}
      className={cn(
        "flex gap-3 w-full my-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-2xs mt-0.5",
            isError
              ? "bg-amber-600 text-white"
              : "bg-gradient-to-br from-violet-600 to-indigo-600"
          )}
        >
          {isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-2xs",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-xs"
            : isError
            ? "bg-destructive/10 text-foreground border border-destructive/30 rounded-tl-xs"
            : "bg-muted/70 text-foreground border border-border/60 rounded-tl-xs"
        )}
      >
        <div className="whitespace-pre-wrap break-words overflow-x-auto">{renderFormattedContent(message.content)}</div>

        {isError && onRetry && (
          <div className="mt-2.5 pt-2 border-t border-destructive/20 flex items-center justify-between gap-3">
            <span className="text-[11px] text-destructive/80 font-medium">Kendala pemrosesan AI</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              data-testid="ai-retry-btn"
              className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <RotateCw className={cn("h-3 w-3", isRetrying && "animate-spin")} />
              <span>Coba Lagi</span>
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
