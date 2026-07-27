'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PROJECTS, PROJECT_FILTERS, type ProjectCategory } from '@/data/projects';
import { ProjectArtwork } from './ProjectArtwork';
import { Reveal } from './Reveal';

/**
 * The portfolio.
 *
 * Editorial rather than gridded: projects alternate across the page at
 * different scales, so browsing feels like turning pages rather than scanning
 * a catalog of identical cards.
 */
export function Portfolio({
  initialFilter = 'all',
  showFilters = true,
  limit,
  heading = 'Selected work',
}: {
  initialFilter?: 'all' | ProjectCategory;
  showFilters?: boolean;
  limit?: number;
  heading?: string;
}) {
  const [filter, setFilter] = useState<'all' | ProjectCategory>(initialFilter);

  const projects = useMemo(() => {
    const filtered =
      filter === 'all' ? PROJECTS : PROJECTS.filter((project) => project.category === filter);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [filter, limit]);

  return (
    <section id="projects" className="bg-paper py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <Reveal>
          <div className="flex flex-col gap-8 border-b border-ink/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="label text-brass">Portfolio</p>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] leading-[0.95] font-light">
                {heading}
              </h2>
            </div>

            {showFilters && (
              <nav className="flex flex-wrap gap-x-7 gap-y-3">
                {PROJECT_FILTERS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFilter(option.id)}
                    className={[
                      'label relative pb-1 transition-colors duration-300',
                      filter === option.id ? 'text-ink' : 'text-ash hover:text-graphite',
                    ].join(' ')}
                  >
                    {option.label}
                    {filter === option.id && (
                      <motion.span
                        layoutId="filter-underline"
                        className="absolute inset-x-0 -bottom-px h-px bg-brass"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-16 flex flex-col gap-24 lg:gap-32"
          >
            {projects.map((project, index) => (
              <ProjectEntry key={project.slug} project={project} index={index} />
            ))}

            {projects.length === 0 && (
              <p className="py-24 text-center text-ash">No projects in this category yet.</p>
            )}
          </motion.div>
        </AnimatePresence>

        {limit && (
          <Reveal>
            <div className="mt-20 border-t border-ink/10 pt-10">
              <Link
                href="/projects"
                className="label group inline-flex items-center gap-2.5 text-ink transition-colors hover:text-brass"
              >
                View all projects
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- entry */

function ProjectEntry({
  project,
  index,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  // Alternate the emphasis so the page has rhythm rather than a repeating grid.
  const flipped = index % 2 === 1;
  const wide = index % 3 === 0;

  return (
    <Reveal>
      <article
        className={[
          'group grid items-center gap-8 lg:gap-16',
          wide ? 'lg:grid-cols-1' : 'lg:grid-cols-12',
        ].join(' ')}
      >
        <Link
          href={`/projects/${project.slug}`}
          className={[
            'relative block overflow-hidden bg-linen',
            wide ? '' : flipped ? 'lg:col-span-7 lg:col-start-6' : 'lg:col-span-7',
          ].join(' ')}
        >
          <div
            className="overflow-hidden"
            style={{ aspectRatio: wide ? '21 / 9' : '4 / 3' }}
          >
            <ProjectArtwork
              project={project}
              variant={index}
              className="h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
            />
          </div>
        </Link>

        <div
          className={[
            wide
              ? 'grid gap-6 lg:grid-cols-12 lg:items-end'
              : flipped
                ? 'lg:col-span-4 lg:col-start-1 lg:row-start-1'
                : 'lg:col-span-4 lg:col-start-9',
          ].join(' ')}
        >
          <div className={wide ? 'lg:col-span-6' : ''}>
            <p className="label text-brass">
              {project.location} · {project.year}
            </p>
            <h3 className="mt-3 font-display text-[clamp(1.9rem,3.4vw,3rem)] leading-[1] font-light">
              <Link href={`/projects/${project.slug}`} className="transition-colors hover:text-brass">
                {project.name}
              </Link>
            </h3>
          </div>

          <div className={wide ? 'lg:col-span-5 lg:col-start-8' : 'mt-5'}>
            <p className="max-w-sm text-[15px] leading-relaxed text-graphite">{project.summary}</p>
            <div className="mt-6 flex items-center gap-5">
              <span className="label text-ash">{project.type}</span>
              <span className="h-px flex-1 bg-ink/12" />
              <Link
                href={`/projects/${project.slug}`}
                className="label text-ink transition-colors hover:text-brass"
              >
                View →
              </Link>
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}
