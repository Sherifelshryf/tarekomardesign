'use client';

import Link from 'next/link';
import { BrandLogo } from '../BrandLogo';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MATERIALS } from '@/data/materials';
import { MaterialSwatch } from '@/components/studio/ui/MaterialSwatch';
import type { MaterialFamily } from '@/types';
import { Reveal } from './Reveal';

/**
 * The remaining marketing sections: the Studio pitch, the materials library,
 * the practice, and contact.
 */

/* --------------------------------------------------------- Studio promo */

const STUDIO_STEPS = [
  {
    number: '01',
    title: 'Draw your room',
    body: 'Enter the real dimensions of your space, or start from a preset. Everything after this is drawn to scale.',
  },
  {
    number: '02',
    title: 'Build the kitchen',
    body: 'Drag modules from the catalog. Cabinets find the walls, snap to each other, and refuse to overlap.',
  },
  {
    number: '03',
    title: 'Choose the finishes',
    body: 'Oak, walnut, lacquer, marble, quartz. Every surface updates the moment you pick it.',
  },
  {
    number: '04',
    title: 'Walk inside',
    body: 'Step into the room at eye height. Open a drawer. See the light change from morning to evening.',
  },
];

export function StudioPromo() {
  return (
    <section id="studio" className="relative overflow-hidden bg-ink py-24 text-paper lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="label text-brass">TOD Studio</p>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,5.5vw,4.6rem)] leading-[0.94] font-light">
                Design your kitchen before you commit to it.
              </h2>
              <p className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/70">
                Our planner is not a mood board. It is the same modules, dimensions and finishes we
                build with — laid out in your room, at your measurements, in three dimensions. When
                you are finished, it becomes a specification our workshop can quote from.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/studio"
                  className="label group inline-flex items-center gap-2.5 bg-brass px-7 py-3.5 text-obsidian transition-colors duration-300 hover:bg-paper"
                >
                  Open TOD Studio
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/studio"
                  className="label border border-paper/30 px-7 py-3.5 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink"
                >
                  Load the demo kitchen
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ol className="grid gap-px bg-paper/10 sm:grid-cols-2">
              {STUDIO_STEPS.map((step, index) => (
                <Reveal key={step.number} delay={index * 0.07}>
                  <li className="h-full bg-ink p-7 lg:p-8">
                    <span className="tabular font-display text-3xl font-light text-brass">
                      {step.number}
                    </span>
                    <h3 className="mt-4 text-sm font-medium text-paper">{step.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-paper/60">{step.body}</p>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={0.3}>
              <p className="mt-8 border-l border-brass/50 pl-5 text-[13px] leading-relaxed text-paper/50">
                Works in the browser — nothing to install. Designs are saved on your device and can
                be sent to us as a quote request whenever you are ready.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- materials */

const MATERIAL_TABS: Array<{ family: MaterialFamily; label: string; blurb: string }> = [
  {
    family: 'cabinet-front',
    label: 'Joinery',
    blurb:
      'Solid timber and lacquered fronts, made in our own workshop. Every door is finished on all six faces.',
  },
  {
    family: 'countertop',
    label: 'Surfaces',
    blurb:
      'Natural stone, engineered quartz and cast concrete, templated on site and fabricated to the millimetre.',
  },
  {
    family: 'floor',
    label: 'Floors',
    blurb: 'Engineered oak, stone and polished concrete, specified to suit the traffic of the room.',
  },
  {
    family: 'metal',
    label: 'Metalwork',
    blurb: 'Brushed steel, blackened iron and unlacquered brass, chosen to age rather than stay new.',
  },
];

export function MaterialsSection() {
  const [active, setActive] = useState<MaterialFamily>('cabinet-front');
  const tab = MATERIAL_TABS.find((entry) => entry.family === active) ?? MATERIAL_TABS[0];
  const materials = MATERIALS.filter((material) => material.family === active);

  return (
    <section id="materials" className="bg-paper-dim py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="label text-brass">Materials</p>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.96] font-light">
                A library, not a catalogue.
              </h2>
              <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-graphite">
                We keep a working library of every finish we specify, and we would rather you touched
                it than scrolled it. These are the same finishes available in TOD Studio.
              </p>

              <nav className="mt-10 flex flex-col">
                {MATERIAL_TABS.map((entry) => (
                  <button
                    key={entry.family}
                    type="button"
                    onClick={() => setActive(entry.family)}
                    className={[
                      'label flex items-center justify-between border-b border-ink/10 py-4 text-left transition-colors duration-300',
                      active === entry.family ? 'text-ink' : 'text-ash hover:text-graphite',
                    ].join(' ')}
                  >
                    {entry.label}
                    <span
                      className={[
                        'transition-transform duration-300',
                        active === entry.family ? 'translate-x-0 text-brass' : '-translate-x-2 opacity-0',
                      ].join(' ')}
                    >
                      →
                    </span>
                  </button>
                ))}
              </nav>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <Reveal>
              <p className="max-w-lg text-[15px] leading-relaxed text-graphite">{tab.blurb}</p>
            </Reveal>

            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {materials.map((material) => (
                <figure key={material.id} className="group">
                  {/* Reuses the Studio's swatch renderer — same texture, same colour. */}
                  <div className="pointer-events-none [&_button]:w-full [&_button]:border-ink/10 [&_button]:bg-white/40 [&_canvas]:h-14 [&_canvas]:w-14 [&_span]:text-graphite">
                    <MaterialSwatch material={material} selected={false} onSelect={() => {}} />
                  </div>
                </figure>
              ))}
            </motion.div>

            <Reveal delay={0.15}>
              <Link
                href="/studio"
                className="label group mt-10 inline-flex items-center gap-2.5 text-ink transition-colors hover:text-brass"
              >
                Try these finishes in the Studio
                <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- about */

const CAPABILITIES = [
  { title: 'Interior architecture', body: 'Spatial planning, structural alterations, and the drawings a contractor can build from.' },
  { title: 'Bespoke joinery', body: 'Kitchens, dressing rooms and storage, manufactured in our own workshop.' },
  { title: 'Materials & finishes', body: 'Specification, sourcing and sample management from concept through to handover.' },
  { title: 'Site delivery', body: 'Installation supervised by the same team that drew it, with a single point of contact.' },
];

export function AboutSection() {
  return (
    <section id="about" className="bg-paper py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="label text-brass">The Practice</p>
              <h2 className="mt-5 font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.96] font-light">
                We draw it, we make it, we fit it.
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <div className="space-y-6 text-[15px] leading-relaxed text-graphite">
                <p className="text-lg leading-relaxed text-ink">
                  Tarek Omar Design is an interior architecture practice and joinery workshop working
                  across Cairo and the North Coast.
                </p>
                <p>
                  We take a small number of projects a year, and we keep drawing and making under one
                  roof. That means the person who detailed a shadow gap is the person who cuts it, and
                  a change on site is a conversation rather than a variation order.
                </p>
                <p>
                  Our work is quiet. We are interested in proportion, in daylight, in how a room feels
                  at seven in the morning — and in joinery that still closes properly in ten years.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-px bg-ink/10 sm:grid-cols-2">
              {CAPABILITIES.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.06}>
                  <div className="h-full bg-paper py-7 sm:px-7">
                    <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-graphite">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-ink/10 pt-10">
                {[
                  { value: '2016', label: 'Established' },
                  { value: '80+', label: 'Projects delivered' },
                  { value: '1', label: 'Workshop, in-house' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="tabular font-display text-4xl font-light text-ink">{stat.value}</dt>
                    <dd className="label mt-2 text-ash">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- contact */

export function ContactSection() {
  return (
    <section id="contact" className="bg-ink py-24 text-paper lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="label text-brass">Contact</p>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,6vw,5rem)] leading-[0.92] font-light">
                Start with your room.
              </h2>
              <p className="mt-7 max-w-md text-[15px] leading-relaxed text-paper/70">
                The fastest way to begin is to design it yourself. Lay out your space in TOD Studio,
                then send it to us — we will come back with a considered proposal rather than a
                generic quotation.
              </p>
              <Link
                href="/studio"
                className="label group mt-9 inline-flex items-center gap-2.5 bg-brass px-7 py-3.5 text-obsidian transition-colors duration-300 hover:bg-paper"
              >
                Design Your Space
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal delay={0.1}>
              <dl className="space-y-8">
                {[
                  { label: 'Studio', value: ['New Cairo, Egypt', 'Visits by appointment'] },
                  { label: 'Email', value: ['hello@tarekomar.design'] },
                  { label: 'Telephone', value: ['+20 2 0000 0000'] },
                  { label: 'Hours', value: ['Sunday – Thursday', '09:00 – 18:00'] },
                ].map((item) => (
                  <div key={item.label} className="border-b border-paper/12 pb-6">
                    <dt className="label text-ash">{item.label}</dt>
                    <dd className="mt-2.5 space-y-0.5">
                      {item.value.map((line) => (
                        <span key={line} className="block text-[15px] text-paper/85">
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- footer */

export function Footer() {
  return (
    <footer className="border-t border-paper/10 bg-ink py-12 text-paper">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="w-[260px] max-w-full">
          <BrandLogo inverted />
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          {[
            { href: '/projects', label: 'Projects' },
            { href: '/studio', label: 'TOD Studio' },
            { href: '/#materials', label: 'Materials' },
            { href: '/#about', label: 'About' },
            { href: '/#contact', label: 'Contact' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="label text-paper/50 transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="text-[11px] text-paper/40">
          © {new Date().getFullYear()} Tarek Omar Design
        </p>
      </div>
    </footer>
  );
}
