import type { ReactNode } from 'react';
import { useOnboardingEntry } from '../hooks/use-onboarding';
import type { OnboardingData } from '../types';

export function OnboardingGate({ children }: { children: (data: OnboardingData | undefined) => ReactNode }) {
  const query = useOnboardingEntry();
  if (query.isChecking || query.shouldRedirect) {
    return <main className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
      <p role="status">Menyiapkan panduan toko Anda...</p>
    </main>;
  }
  return children(query.data);
}
