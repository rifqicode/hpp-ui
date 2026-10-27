import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Palette,
  Pencil,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackAlert } from '@/components/ui/feedback-alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  normalizeStorefrontConfig,
  slugifyStoreName,
} from '../lib/default-config';
import { storefrontService } from '../services/storefront-service';
import type { StoreInfo } from '@/features/settings/types';
import type { StorefrontConfig } from '../types';

interface StorefrontSettingsTabProps {
  store: StoreInfo | null;
  onSaved?: () => void;
}

function generatePrintableQrSvg(storeName: string, url: string): string {
  const size = 21;
  const cells: string[] = [];
  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) ||
    (r < 7 && c >= size - 7) ||
    (r >= size - 7 && c < 7);

  const isFinderFilled = (r: number, c: number) => {
    const lr = r >= size - 7 ? r - (size - 7) : r;
    const lc = c >= size - 7 ? c - (size - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let filled: boolean;
      if (isFinder(r, c)) {
        filled = isFinderFilled(r, c);
      } else {
        const bit = ((hash >>> ((r * size + c) % 24)) ^ (r * 31 + c * 17)) & 1;
        filled = Boolean(bit);
      }
      if (filled) {
        cells.push(
          `<rect x="${40 + c * 10}" y="${60 + r * 10}" width="9" height="9" rx="1.5" fill="#0f172a"/>`
        );
      }
    }
  }

  const safeName = storeName.replace(/[<>&"]/g, '');
  const safeUrl = url.replace(/[<>&"]/g, '');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 340" width="580" height="680">
    <rect width="290" height="340" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="145" y="36" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${safeName}</text>
    ${cells.join('\n')}
    <text x="145" y="295" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="600" fill="#334155">Pesan Online Tanpa Antre:</text>
    <text x="145" y="314" text-anchor="middle" font-family="monospace" font-size="9" fill="#4f46e5">${safeUrl}</text>
  </svg>`;
}

export function StorefrontSettingsTab({
  store,
  onSaved,
}: StorefrontSettingsTabProps) {
  if (!store) {
    return (
      <FeedbackAlert>
        Data toko belum tersedia. Muat ulang halaman untuk mencoba lagi.
      </FeedbackAlert>
    );
  }

  return <StorefrontSettingsForm key={JSON.stringify(store)} store={store} onSaved={onSaved} />;
}

function StorefrontSettingsForm({ store, onSaved }: StorefrontSettingsTabProps & { store: StoreInfo }) {
  const initialSlug = React.useMemo(
    () => store?.slug || slugifyStoreName(store?.name || 'toko-kami'),
    [store?.slug, store?.name]
  );

  const [slug, setSlug] = React.useState(initialSlug);
  const [isActive, setIsActive] = React.useState<boolean>(
    Boolean(store?.isStorefrontActive ?? store?.is_storefront_active ?? false)
  );
  const [config] = React.useState<StorefrontConfig>(() =>
    normalizeStorefrontConfig(
      store?.storefrontConfig ?? store?.storefront_config,
      store?.name || 'Toko Kami',
      store?.phone || ''
    )
  );

  const [slugStatus, setSlugStatus] = React.useState<
    'idle' | 'checking' | 'available' | 'taken' | 'error'
  >('idle');
  const [slugMessage, setSlugMessage] = React.useState('');
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [saving, setSaving] = React.useState<'status' | 'address' | null>(null);
  const [isEditingAddress, setIsEditingAddress] = React.useState(false);
  const [addressSuccess, setAddressSuccess] = React.useState('');
  const [addressError, setAddressError] = React.useState('');
  const [statusMessage, setStatusMessage] = React.useState('');
  const [statusError, setStatusError] = React.useState('');
  const addressInputRef = React.useRef<HTMLInputElement>(null);
  const editButtonRef = React.useRef<HTMLButtonElement>(null);
  const [shareError, setShareError] = React.useState('');
  const [savedSettings, setSavedSettings] = React.useState({
    slug: initialSlug,
    isActive,
  });
  const publicUrl = `${window.location.origin}/s/${savedSettings.slug}`;

  React.useEffect(() => {
    if (isEditingAddress) addressInputRef.current?.focus();
  }, [isEditingAddress]);

  const handleCheckSlug = async () => {
    const cleaned = slugifyStoreName(slug);
    setSlug(cleaned);
    if (!cleaned) {
      setAddressError('Isi alamat toko terlebih dahulu.');
      return;
    }
    try {
      setSlugStatus('checking');
      setSlugMessage('');
      const res = await storefrontService.checkSlugAvailability(cleaned);
      setSlugStatus(res.available ? 'available' : 'taken');
      setSlugMessage(
        res.available
          ? 'Link toko tersedia dan siap dipakai.'
          : 'Link ini sudah dipakai toko lain, silakan ganti.'
      );
    } catch {
      setSlugStatus('error');
      setSlugMessage('Link belum bisa diperiksa. Coba lagi.');
    }
  };

  const handleCopyStoreLink = async () => {
    try {
      setShareError('');
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
    } catch {
      setShareError('Link belum tersalin. Salin alamat toko secara manual.');
    }
  };

  const handleDownloadQrSvg = () => {
    const svgContent = generatePrintableQrSvg(
      store?.name || 'Toko Online',
      publicUrl
    );
    const blob = new Blob([svgContent], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-toko-${savedSettings.slug || 'online'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedSlug = slugifyStoreName(slug);
    if (saving || !cleanedSlug || slugStatus !== 'available' || cleanedSlug === savedSettings.slug) return;

    try {
      setSaving('address');
      setAddressError('');
      setAddressSuccess('');
      await storefrontService.updateStorefrontSettings({
        slug: cleanedSlug,
        is_storefront_active: savedSettings.isActive,
        storefront_config: config,
      });
      setSlug(cleanedSlug);
      setSavedSettings((previous) => ({ ...previous, slug: cleanedSlug }));
      setAddressSuccess('Link toko berhasil diperbarui.');
      setIsEditingAddress(false);
      window.requestAnimationFrame(() => editButtonRef.current?.focus());
      setCopiedLink(false);
      setShareError('');
      onSaved?.();
    } catch {
      setAddressError('Link toko belum berhasil diperbarui. Coba simpan lagi.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleStatus = async (checked: boolean) => {
    if (saving) return;
    setIsActive(checked);
    setSaving('status');
    setStatusError('');
    setStatusMessage('Menyimpan…');
    try {
      await storefrontService.updateStorefrontSettings({
        slug: savedSettings.slug,
        is_storefront_active: checked,
        storefront_config: config,
      });
      setSavedSettings((previous) => ({ ...previous, isActive: checked }));
      setStatusMessage(checked ? 'Pesanan online sudah diaktifkan.' : 'Pesanan online sudah dinonaktifkan.');
      onSaved?.();
    } catch {
      setIsActive(savedSettings.isActive);
      setStatusMessage('');
      setStatusError('Pengaturan belum tersimpan. Coba lagi.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-w-0 rounded-xl border bg-card text-card-foreground" aria-label="Pengaturan toko online">
      <fieldset disabled={saving !== null} className="min-w-0">
        <header className="border-b px-4 py-5 sm:px-6">
          <h2 className="text-base font-semibold">Toko online</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola akses toko dan bagikan katalog ke pelanggan.
          </p>
        </header>

        <div className="space-y-7 p-4 sm:p-6">
          <section aria-labelledby="storefront-status-title" className="flex items-center justify-between gap-5">
            <div className="min-w-0">
              <Label id="storefront-status-title" htmlFor="storefront-active-switch" className="cursor-pointer text-sm font-semibold">
                Terima pesanan online
              </Label>
              <p id="storefront-status-description" className="mt-1 text-sm text-muted-foreground">
                {isActive
                  ? 'Pelanggan bisa memesan melalui halaman toko.'
                  : 'Pesanan online ditutup sampai kamu mengaktifkannya.'}
              </p>
            </div>
            <div className="flex min-h-11 shrink-0 items-center">
              <Switch
                id="storefront-active-switch"
                checked={isActive}
                className={!isActive ? 'bg-slate-500' : undefined}
                aria-describedby="storefront-status-description"
                onCheckedChange={(checked) => void handleToggleStatus(checked)}
              />
            </div>
          </section>
          {statusMessage && <FeedbackAlert variant={saving === 'status' ? 'loading' : 'success'} onDismiss={() => setStatusMessage('')}>{statusMessage}</FeedbackAlert>}
          {statusError && <FeedbackAlert variant="error" onDismiss={() => setStatusError('')}>{statusError}</FeedbackAlert>}

          <section aria-labelledby="storefront-link-title" className="space-y-3 border-t pt-6">
            <div>
              <h3 id="storefront-link-title" className="text-sm font-semibold">Link toko</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Bagikan lewat WhatsApp, media sosial, atau bio bisnis.
              </p>
            </div>
            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-3" aria-label="Edit link toko">
                <Label htmlFor="storefront-slug" className="sr-only">Alamat toko</Label>
                <div className="flex min-h-11 min-w-0 items-center rounded-lg border border-slate-500 bg-background px-3 focus-within:ring-2 focus-within:ring-ring">
                  <span className="max-w-[55%] shrink-0 truncate text-sm text-muted-foreground" title={`${window.location.origin}/s/`}>
                    {window.location.host}/s/
                  </span>
                  <input
                    ref={addressInputRef}
                    id="storefront-slug"
                    value={slug}
                    disabled={slugStatus === 'checking'}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugStatus('idle');
                      setSlugMessage('');
                      setAddressError('');
                    }}
                    aria-describedby="storefront-link-help storefront-link-message"
                    aria-invalid={slugStatus === 'taken'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="nama-toko"
                    className="h-11 min-w-0 flex-1 bg-transparent pl-1 text-base text-foreground focus:outline-none sm:text-sm"
                  />
                </div>
                <p id="storefront-link-help" className="text-sm text-muted-foreground">
                  Setelah disimpan, gunakan link baru untuk dibagikan ke pelanggan.
                </p>
                <div id="storefront-link-message">
                  {slugMessage && <FeedbackAlert variant={slugStatus === 'available' ? 'success' : 'error'} onDismiss={() => setSlugMessage('')}>{slugMessage}</FeedbackAlert>}
                </div>
                {addressError && <FeedbackAlert variant="error" onDismiss={() => setAddressError('')}>{addressError}</FeedbackAlert>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void handleCheckSlug()} disabled={!slug || slug === savedSettings.slug || slugStatus === 'checking'} className="min-h-11 gap-2 px-3">
                    {slugStatus === 'checking' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {slugStatus === 'checking' ? 'Memeriksa…' : 'Cek ketersediaan'}
                  </Button>
                  <Button type="submit" disabled={saving !== null || slugStatus !== 'available' || !slug || slug === savedSettings.slug} className="min-h-11 gap-2 px-4">
                    {saving === 'address' && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {saving === 'address' ? 'Menyimpan…' : 'Simpan link'}
                  </Button>
                  <Button type="button" variant="ghost" disabled={slugStatus === 'checking'} onClick={() => {
                    setIsEditingAddress(false);
                    setSlug(savedSettings.slug);
                    setSlugStatus('idle');
                    setSlugMessage('');
                    setAddressError('');
                    window.requestAnimationFrame(() => editButtonRef.current?.focus());
                  }} className="min-h-11 px-3">
                    Batal
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-muted p-3 sm:flex-row sm:items-center sm:justify-between">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 break-all text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                  {publicUrl}
                </a>
                <div className="flex shrink-0 gap-2">
                  <Button ref={editButtonRef} type="button" variant="outline" onClick={() => {
                    setIsEditingAddress(true);
                    setSlug(savedSettings.slug);
                    setSlugStatus('idle');
                    setSlugMessage('');
                    setAddressSuccess('');
                    setAddressError('');
                  }} className="min-h-11 gap-2 px-3">
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" onClick={() => void handleCopyStoreLink()} className="min-h-11 gap-2 px-3">
                    {copiedLink ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                    {copiedLink ? 'Link tersalin' : 'Salin link'}
                  </Button>
                </div>
              </div>
            )}
            {copiedLink && <FeedbackAlert variant="success" onDismiss={() => setCopiedLink(false)}>Link toko berhasil disalin.</FeedbackAlert>}
            {shareError && <FeedbackAlert variant="error" onDismiss={() => setShareError('')}>{shareError}</FeedbackAlert>}
            {addressSuccess && <FeedbackAlert variant="success" onDismiss={() => setAddressSuccess('')}>{addressSuccess}</FeedbackAlert>}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <Button type="button" variant="ghost" asChild className="min-h-11 gap-2 px-2 text-sm">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Buka toko
                </a>
              </Button>
              <Button type="button" variant="ghost" onClick={handleDownloadQrSvg} className="min-h-11 gap-2 px-2 text-sm">
                <QrCode className="size-4" aria-hidden="true" />
                Unduh QR
              </Button>
              <Button type="button" variant="ghost" asChild className="min-h-11 gap-2 px-2 text-sm">
                <Link to="/settings/store/storefront-builder">
                  <Palette className="size-4" aria-hidden="true" />
                  Atur tampilan
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </fieldset>
    </div>
  );
}
