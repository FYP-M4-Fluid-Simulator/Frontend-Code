import type { Metadata } from 'next';
import '../styles/globals.css';

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
      <body>{children}</body>
    </html>
  );
}
