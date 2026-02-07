import { useEffect } from 'react';
import { VanguardOnboarding } from '@/components/vanguard/VanguardOnboarding';

export default function VanguardGettingStarted() {
  useEffect(() => {
    document.title = 'Getting Started | Vanguard';
  }, []);

  return <VanguardOnboarding />;
}
