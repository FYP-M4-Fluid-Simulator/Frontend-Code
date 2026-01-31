import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Turbine | CFD Airfoil Optimizer',
  description: 'Industrial wind turbine visualization with performance metrics',
};

export default function TurbineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
