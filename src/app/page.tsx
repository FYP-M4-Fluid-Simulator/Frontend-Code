'use client';

import { LandingPage } from '../components/LandingPage';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleNavigate = (page: 'login' | 'signup' | 'app') => {
    if (page === 'app') {
      router.push('/airfoil_deck');
    } else if (page === 'login') {
      router.push('/login');
    } else if (page === 'signup') {
      router.push('/signup');
    }
  };

  return <LandingPage onNavigate={handleNavigate} />;
}
