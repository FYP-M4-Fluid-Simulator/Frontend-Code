import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Optimize | CFD Airfoil Optimizer',
  description: 'Genetic algorithm-based airfoil shape optimization',
};

export default function OptimizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
