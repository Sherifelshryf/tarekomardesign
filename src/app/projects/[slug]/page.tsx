import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/site/Nav';
import { ProjectArtwork } from '@/components/site/ProjectArtwork';
import { Reveal } from '@/components/site/Reveal';
import { ContactSection, Footer } from '@/components/site/Sections';
import { PROJECTS, getProject } from '@/data/projects';

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: 'Project not found' };

  return {
    title: project.name,
    description: `${project.type} in ${project.location}, ${project.year}. ${project.summary}`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const index = PROJECTS.findIndex((entry) => entry.slug === slug);
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  return (
    <>
      <Nav solid />

      <main className="pt-[72px]">
        {/* ------------------------------------------------------------ hero */}
        <section className="bg-paper">
          <div className="mx-auto max-w-[1600px] px-6 pt-16 pb-10 lg:px-12 lg:pt-24">
            <Reveal>
              <Link
                href="/projects"
                className="label text-ash transition-colors hover:text-ink"
              >
                ← All projects
              </Link>
              <h1 className="mt-7 font-display text-[clamp(2.8rem,8vw,7rem)] leading-[0.9] font-light">
                {project.name}
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-ink/10 pt-8 sm:grid-cols-4">
                {[
                  { label: 'Location', value: project.location },
                  { label: 'Type', value: project.type },
                  { label: 'Year', value: String(project.year) },
                  { label: 'Category', value: project.category },
                ].map((item) => (
                  <div key={item.label}>
                    <dt className="label text-ash">{item.label}</dt>
                    <dd className="mt-2 text-[15px] text-ink capitalize">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="overflow-hidden bg-linen" style={{ aspectRatio: '21 / 9' }}>
              <ProjectArtwork project={project} variant={1} className="h-full w-full" />
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------- text */}
        <section className="bg-paper py-20 lg:py-28">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
              <div className="lg:col-span-5">
                <Reveal>
                  <p className="font-display text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.25] font-light text-ink">
                    {project.summary}
                  </p>
                </Reveal>
              </div>

              <div className="lg:col-span-6 lg:col-start-7">
                <Reveal>
                  <p className="text-[15px] leading-[1.85] text-graphite">{project.description}</p>
                </Reveal>

                <Reveal delay={0.1}>
                  <dl className="mt-12 grid gap-px bg-ink/10 sm:grid-cols-2">
                    {project.facts.map((fact) => (
                      <div key={fact.label} className="bg-paper py-5 sm:px-6">
                        <dt className="label text-ash">{fact.label}</dt>
                        <dd className="mt-1.5 text-[15px] text-ink">{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- gallery */}
        <section className="bg-paper-dim py-20 lg:py-28">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
            <Reveal>
              <h2 className="label text-brass">Gallery</h2>
            </Reveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
              {project.gallery.map((frame, frameIndex) => (
                <Reveal
                  key={frame.caption}
                  delay={frameIndex * 0.06}
                  className={
                    frame.tone === 'wide'
                      ? 'sm:col-span-2 lg:col-span-4'
                      : frame.tone === 'tall'
                        ? 'lg:col-span-2 lg:row-span-2'
                        : 'lg:col-span-2'
                  }
                >
                  <figure className="group h-full">
                    <div
                      className="overflow-hidden bg-linen"
                      style={{
                        aspectRatio:
                          frame.tone === 'wide' ? '16 / 9' : frame.tone === 'tall' ? '3 / 4' : '1 / 1',
                      }}
                    >
                      <ProjectArtwork
                        project={project}
                        variant={frameIndex}
                        className="h-full w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      />
                    </div>
                    <figcaption className="mt-3 text-[12px] text-ash">{frame.caption}</figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- studio handoff */}
        {project.studioRoomType === 'kitchen' && (
          <section className="bg-paper py-20 lg:py-28">
            <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
              <Reveal>
                <div className="flex flex-col gap-8 border-y border-ink/10 py-14 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1] font-light">
                      Design something like this, in your own room.
                    </h2>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-graphite">
                      Open Weblite Design Studio, enter your dimensions, and build it in three dimensions.
                    </p>
                  </div>
                  <Link
                    href="/studio"
                    className="label group inline-flex shrink-0 items-center gap-2.5 bg-ink px-7 py-3.5 text-paper transition-colors duration-300 hover:bg-brass hover:text-obsidian"
                  >
                    Open Weblite Design Studio
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </Reveal>
            </div>
          </section>
        )}

        {/* ------------------------------------------------------------ next */}
        <section className="bg-paper pb-20 lg:pb-28">
          <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
            <Reveal>
              <Link href={`/projects/${next.slug}`} className="group block">
                <p className="label text-ash">Next project</p>
                <div className="mt-4 flex items-baseline justify-between gap-6">
                  <h2 className="font-display text-[clamp(2rem,5vw,4rem)] leading-[1] font-light transition-colors group-hover:text-brass">
                    {next.name}
                  </h2>
                  <span className="label shrink-0 text-ash">
                    {next.location} · {next.year}
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </section>

        <ContactSection />
      </main>

      <Footer />
    </>
  );
}
