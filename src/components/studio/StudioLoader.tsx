'use client';

import dynamic from 'next/dynamic';

/**
 * Client boundary for the Studio.
 *
 * The planner owns a WebGL context, localStorage and pointer lock, so there is
 * nothing meaningful to server-render. Loading it dynamically also keeps Three,
 * drei and the whole 3D bundle out of the marketing pages entirely.
 */
const StudioShell = dynamic(
  () => import('./StudioShell').then((mod) => mod.StudioShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100dvh] items-center justify-center bg-[#141311]">
        <p className="label text-[#8f8a80]">Loading Weblite Design Studio</p>
      </div>
    ),
  },
);

export function StudioLoader() {
  return <StudioShell />;
}
