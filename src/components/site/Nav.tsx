'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Site navigation.
 *
 * Transparent over the hero, then resolving to solid paper once scrolled — so
 * the brand mark reads against a photograph and against the page alike.
 */

const LINKS = [
  { href: '/projects', label: 'Projects' },
  { href: '/projects?filter=kitchens', label: 'Kitchens' },
  { href: '/#interiors', label: 'Interiors' },
  { href: '/#materials', label: 'Materials' },
  { href: '/#about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
];

export function Nav({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(solid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [solid]);

  const inverted = !scrolled && !solid;

  return (
    <>
      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500',
          scrolled || solid ? 'border-b border-ink/8 bg-paper/92 backdrop-blur-md' : 'bg-transparent',
        ].join(' ')}
      >
        <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-6 lg:px-12">
          <Link
            href="/"
            className={[
              'label shrink-0 transition-colors duration-500',
              'tracking-[0.28em]',
              inverted ? 'text-paper' : 'text-ink',
            ].join(' ')}
          >
            Tarek Omar Design
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={[
                  'label transition-colors duration-300',
                  inverted ? 'text-paper/75 hover:text-paper' : 'text-graphite hover:text-ink',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className={[
                'label hidden px-5 py-2.5 transition-colors duration-300 sm:inline-block',
                inverted
                  ? 'border border-paper/40 text-paper hover:bg-paper hover:text-ink'
                  : 'bg-ink text-paper hover:bg-brass hover:text-obsidian',
              ].join(' ')}
            >
              Design Your Space
            </Link>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className={[
                'flex h-10 w-10 items-center justify-center lg:hidden',
                inverted ? 'text-paper' : 'text-ink',
              ].join(' ')}
            >
              <span className="flex flex-col gap-[5px]">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-60 bg-ink text-paper lg:hidden"
          >
            <div className="flex h-[72px] items-center justify-between px-6">
              <span className="label tracking-[0.28em]">Tarek Omar Design</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <nav className="flex flex-col px-6 pt-8">
              {LINKS.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block border-b border-paper/12 py-5 font-display text-3xl font-light"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/studio"
                onClick={() => setOpen(false)}
                className="label mt-10 bg-brass px-6 py-4 text-center text-obsidian"
              >
                Design Your Space →
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
