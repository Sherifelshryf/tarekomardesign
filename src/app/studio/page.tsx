import type { Metadata } from 'next';
import { StudioLoader } from '@/components/studio/StudioLoader';

export const metadata: Metadata = {
  title: 'Weblite Design Studio',
  description:
    'Design your kitchen in 3D. Place real modules, choose finishes, and walk through the result at human scale.',
};

export default function StudioPage() {
  return <StudioLoader />;
}
