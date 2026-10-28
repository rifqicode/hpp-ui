import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOnboardingEntry } from '../hooks/use-onboarding';
import type { OnboardingData } from '../types';

export function OnboardingEntry() {
  const query = useOnboardingEntry();
  return <OnboardingInvitation data={query.shouldRedirect ? undefined : query.data} />;
}

export function OnboardingInvitation({ data }: { data?: OnboardingData }) {
  if (!data || data.dismissed || data.state?.status === 'SKIPPED' || data.state?.status === 'COMPLETED') return null;
  return <section aria-label="Panduan mulai" className="mx-1 mb-3 mt-auto shrink-0 rounded-xl border border-sidebar-border bg-card p-3 text-card-foreground">
    <h2 className="text-sm font-semibold leading-5">Lanjutkan setup produk pertama</h2>
    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">Isi bahan baku, lalu lihat biaya per produk Anda.</p>
    <Button asChild className="mt-3 h-11 w-full whitespace-normal text-center focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"><Link to="/onboarding">Lanjutkan setup</Link></Button>
  </section>;
}
