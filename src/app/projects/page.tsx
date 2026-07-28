import type { Metadata } from 'next';
import { Nav } from '@/components/site/Nav';
import { Portfolio } from '@/components/site/Portfolio';
import { ContactSection, Footer } from '@/components/site/Sections';
import type { ProjectCategory } from '@/data/projects';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Kitchens, dressing rooms and complete interiors by Weblite Design, across Cairo and the North Coast.',
};

const VALID_FILTERS = new Set(['kitchens', 'residential', 'dressing', 'commercial']);

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  // The nav deep-links to a category; anything unrecognised falls back to all.
  const initialFilter =
    filter && VALID_FILTERS.has(filter) ? (filter as ProjectCategory) : 'all';

  return (
    <>
      <Nav solid />
      <main className="pt-[72px]">
        <Portfolio initialFilter={initialFilter} heading="Projects" />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
