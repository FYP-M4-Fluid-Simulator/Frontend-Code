import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Design | CFD Airfoil Optimizer',
  description: 'Interactive airfoil geometry editing with CFD simulation',
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
