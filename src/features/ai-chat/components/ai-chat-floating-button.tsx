import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIChatFloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function AIChatFloatingButton({ onClick, isOpen }: AIChatFloatingButtonProps) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onClick}
        data-testid="ai-chat-floating-btn"
        className="h-12 px-4 rounded-full shadow-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white hover:opacity-95 hover:shadow-xl transition-all duration-200 flex items-center gap-2 border border-white/20 cursor-pointer group"
      >
        <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide">Tanya Asisten AI</span>
      </Button>
    </div>
  );
}
