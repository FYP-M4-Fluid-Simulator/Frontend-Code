import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '../lib/contexts/AuthContext';

export const metadata: Metadata = {
  title: 'CFD Airfoil Analysis Platform',
  description: 'Computational Fluid Dynamics simulation platform for wind turbine airfoil analysis and optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
