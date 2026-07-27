import { Hero } from '@/components/site/Hero';
import { Nav } from '@/components/site/Nav';
import { Portfolio } from '@/components/site/Portfolio';
import {
  AboutSection,
  ContactSection,
  Footer,
  MaterialsSection,
  StudioPromo,
} from '@/components/site/Sections';
import { InteriorsSection } from '@/components/site/Interiors';

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Portfolio limit={3} heading="Selected work" showFilters={false} />
        <StudioPromo />
        <InteriorsSection />
        <MaterialsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
