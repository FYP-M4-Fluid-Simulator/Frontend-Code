'use client';

import { useState } from 'react';
import { LandingPage } from '../components/LandingPage';
import { LoginPage } from '../components/LoginPage';
import { SignupPage } from '../components/SignupPage';
import { useRouter } from 'next/navigation';

type Page = 'landing' | 'login' | 'signup';

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const router = useRouter();

  const handleNavigate = (page: Page | 'app') => {
    if (page === 'app') {
      router.push('/design');
    } else {
      setCurrentPage(page);
    }
  };

  // Render the appropriate page based on current state
  if (currentPage === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'signup') {
    return <SignupPage onNavigate={handleNavigate} />;
  }

  return null;
}
