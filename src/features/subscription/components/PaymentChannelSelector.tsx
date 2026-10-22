import { Building2, Check, QrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PaymentChannelConfig } from '../types/subscription';

interface PaymentChannelSelectorProps {
  channels: PaymentChannelConfig[];
  selectedChannelCode?: string;
  onSelectChannel: (code: string) => void;
  disabled?: boolean;
}

export function PaymentChannelSelector({
  channels,
  selectedChannelCode,
  onSelectChannel,
  disabled = false,
}: PaymentChannelSelectorProps) {
  const qrisChannels = channels.filter((ch) => ch.category === 'QRIS' && ch.enabled);
  const vaChannels = channels.filter((ch) => ch.category === 'VIRTUAL_ACCOUNT' && ch.enabled);

  return (
    <div className="space-y-4">
      {qrisChannels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Pembayaran Instan (QRIS)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-1">
            {qrisChannels.map((channel) => {
              const isSelected = selectedChannelCode === channel.code;
              return (
                <Card
                  key={channel.code}
                  tabIndex={disabled ? -1 : 0}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => !disabled && onSelectChannel(channel.code)}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectChannel(channel.code);
                    }
                  }}
                  className={`relative cursor-pointer p-3.5 transition-all outline-none border ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-md bg-muted/80 text-foreground shrink-0 mt-0.5">
                        <QrCode className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{channel.name}</span>
                          <Badge variant="secondary" className="text-[10px] uppercase font-mono px-1.5 py-0">
                            Semua e-Wallet & Bank
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{channel.description}</p>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {vaChannels.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Virtual Account Bank (Otomatis Terverifikasi)</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {vaChannels.map((channel) => {
              const isSelected = selectedChannelCode === channel.code;
              const bankName = channel.code.replace('_va', '').toUpperCase();
              return (
                <Card
                  key={channel.code}
                  tabIndex={disabled ? -1 : 0}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => !disabled && onSelectChannel(channel.code)}
                  onKeyDown={(e) => {
                    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onSelectChannel(channel.code);
                    }
                  }}
                  className={`relative cursor-pointer p-3.5 transition-all outline-none border ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[11px] font-bold tracking-wide">
                          {bankName}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground truncate">{channel.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{channel.description}</p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
