'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { PROJECTS } from '@/data/projects';
import { ProjectArtwork } from './ProjectArtwork';

/**
 * The hero.
 *
 * Full-bleed interior with a slow parallax drift, type set large and light, and
 * two clear destinations. No gradient overlays beyond what's needed to hold the
 * text legible.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // The image drifts slower than the page; the copy lifts away faster.
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '16%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, reduceMotion ? 1 : 1.1]);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '-24%']);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduceMotion ? 1 : 0]);

  const hero = PROJECTS[0];

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink">
      <motion.div style={{ y: imageY, scale: imageScale }} className="absolute inset-0">
        <ProjectArtwork project={hero} variant={1} className="h-full w-full object-cover" />
        {/* Just enough shading to keep the type readable, weighted to the foot. */}
        <div className="absolute inset-0 bg-linear-to-t from-obsidian/80 via-obsidian/25 to-obsidian/15" />
      </motion.div>

      <motion.div
        style={{ y: copyY, opacity: copyOpacity }}
        className="relative flex h-full flex-col justify-end px-6 pb-20 lg:px-12 lg:pb-24"
      >
        <div className="mx-auto w-full max-w-[1600px]">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="label text-paper/65"
          >
            Interior Architecture · Cairo
          </motion.p>

          <h1 className="mt-6 font-display text-[clamp(2.9rem,9vw,8.5rem)] leading-[0.88] font-light text-paper">
            {['Spaces designed', 'around you.'].map((line, index) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{
                    duration: 1.1,
                    delay: 0.2 + index * 0.11,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
          >
            <p className="max-w-md text-base leading-relaxed text-paper/80">
              Design, explore, and experience your space before it exists.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="label border border-paper/40 px-7 py-3.5 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink"
              >
                Explore Projects
              </Link>
              <Link
                href="/studio"
                className="label group inline-flex items-center gap-2.5 bg-brass px-7 py-3.5 text-obsidian transition-colors duration-300 hover:bg-paper"
              >
                Design Your Space
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        style={{ opacity: copyOpacity }}
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block"
      >
        <motion.span
          className="block h-10 w-px bg-paper/40"
          animate={{ scaleY: [0.3, 1, 0.3], transformOrigin: ['top', 'top', 'bottom'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </section>
  );
}
