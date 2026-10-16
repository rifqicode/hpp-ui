import React from 'react';
import { useSubscriptionGuards } from '../hooks/useSubscriptionGuards';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface GracePeriodBannerProps {
  onUpgradeClick: () => void;
}

export const GracePeriodBanner: React.FC<GracePeriodBannerProps> = ({ onUpgradeClick }) => {
  const { isInGracePeriod, gracePeriodUntil, tier } = useSubscriptionGuards();

  if (!isInGracePeriod || !gracePeriodUntil) {
    return null;
  }

  const expiryDate = new Date(gracePeriodUntil);
  const now = new Date();
  const diffDays = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-amber-500 text-amber-950 px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium border-b border-amber-600 shadow-sm transition-all duration-200">
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="size-4 shrink-0 text-amber-950" />
          <span className="font-bold uppercase tracking-wider text-[10px] sm:text-xs bg-amber-950 text-white px-2 py-0.5 rounded shrink-0">
            Masa Tenggang
          </span>
        </div>
        <span className="sm:truncate leading-snug">
          Paket <strong>{tier}</strong> kedaluwarsa. Sisa <strong>{diffDays} hari</strong> ({expiryDate.toLocaleDateString('id-ID')}) sebelum akses staf dan fitur lanjutan ditangguhkan.
        </span>
      </div>
      <Button
        size="sm"
        onClick={onUpgradeClick}
        className="bg-amber-950 hover:bg-black text-white font-semibold text-xs px-3 py-1 h-8 sm:h-7 w-full sm:w-auto rounded transition-colors shrink-0"
      >
        Perpanjang Paket Sekarang
      </Button>
    </div>
  );
};
