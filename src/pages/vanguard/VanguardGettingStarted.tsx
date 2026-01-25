import { useEffect } from 'react';
import { VanguardOnboarding } from '@/components/vanguard/VanguardOnboarding';

export default function VanguardGettingStarted() {
  useEffect(() => {
    document.title = 'Getting Started | Ultrium Vanguard';
  }, []);

  return <VanguardOnboarding />;
}
