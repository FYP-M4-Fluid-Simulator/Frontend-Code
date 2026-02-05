'use client';

import { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { DesignPage } from './components/DesignPageNew';

type Page = 'landing' | 'login' | 'signup' | 'app';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    setCurrentPage('landing');
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

  // Main Design Page with simulation and optimization
  return <DesignPage onLogout={handleLogout} />;
}