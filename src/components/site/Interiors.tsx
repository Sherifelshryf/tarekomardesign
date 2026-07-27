'use client';

import Link from 'next/link';
import { PROJECTS } from '@/data/projects';
import { ProjectArtwork } from './ProjectArtwork';
import { Reveal } from './Reveal';

/**
 * The Interiors section.
 *
 * Sets out the disciplines beyond kitchens, and signals which of them the
 * Studio already plans for — the catalog and room-type architecture are in
 * place for all of them, with kitchens shipped first.
 */

const DISCIPLINES = [
  {
    title: 'Kitchens',
    body: 'The heart of the practice. Fully planned, made and fitted in-house.',
    status: 'In the Studio now',
    live: true,
  },
  {
    title: 'Dressing Rooms',
    body: 'Walk-in storage treated with the same care as a reception room.',
    status: 'Studio module in development',
    live: false,
  },
  {
    title: 'Living & Bedrooms',
    body: 'Media walls, headboard joinery, and storage that disappears into the architecture.',
    status: 'Studio module in development',
    live: false,
  },
  {
    title: 'Bathrooms',
    body: 'Vanities and wet-area joinery detailed to survive real use.',
    status: 'Studio module in development',
    live: false,
  },
  {
    title: 'Offices',
    body: 'Workplaces and home studies built from the domestic vocabulary.',
    status: 'Studio module in development',
    live: false,
  },
  {
    title: 'Complete Apartments',
    body: 'Whole-home interior architecture, drawn and delivered as one scheme.',
    status: 'Studio module in development',
    live: false,
  },
];

export function InteriorsSection() {
  const feature = PROJECTS.find((project) => project.category === 'dressing') ?? PROJECTS[2];

  return (
    <section id="interiors" className="bg-paper py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="label text-brass">Interiors</p>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.96] font-light">
                Beyond the kitchen.
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-graphite">
                The same team, the same workshop and the same detailing across every room of a home.
                TOD Studio is built the same way — one planner, one product library, extending room
                by room.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <Link
                href={`/projects/${feature.slug}`}
                className="group mt-10 block overflow-hidden bg-linen"
              >
                <div className="overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
                  <ProjectArtwork
                    project={feature}
                    variant={2}
                    className="h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  />
                </div>
                <div className="flex items-baseline justify-between pt-4">
                  <span className="font-display text-xl font-light">{feature.name}</span>
                  <span className="label text-ash">{feature.type}</span>
                </div>
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ul className="border-t border-ink/10">
              {DISCIPLINES.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.05}>
                  <li className="grid gap-2 border-b border-ink/10 py-7 sm:grid-cols-12 sm:gap-6">
                    <h3 className="font-display text-2xl leading-tight font-light sm:col-span-4">
                      {item.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed text-graphite sm:col-span-5">
                      {item.body}
                    </p>
                    <span
                      className={[
                        'label sm:col-span-3 sm:text-right',
                        item.live ? 'text-brass' : 'text-ash',
                      ].join(' ')}
                    >
                      {item.status}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
