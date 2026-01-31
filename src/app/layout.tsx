import type { Metadata } from 'next';
import '../styles/globals.css';
import { AppProviders } from './providers';
import { RootLayout as LayoutContent } from '../components/RootLayout';

export const metadata: Metadata = {
  title: 'CFD Airfoil Optimizer',
  description: 'Wind turbine airfoil shape optimization with CFD simulation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <LayoutContent>{children}</LayoutContent>
        </AppProviders>
      </body>
    </html>
  );
}
