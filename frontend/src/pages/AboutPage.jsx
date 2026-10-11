import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/common/ScrollReveal";

const PHILOSOPHY_VALUES = [
  {
    id: "cuisine",
    icon: "\u{1F33F}",
    title: "Thoughtful Cuisine",
    description:
      "We source fresh, honest ingredients and craft balanced menus where every dish is prepared with care, restraint, and genuine passion.",
  },
  {
    id: "hospitality",
    icon: "\u{2728}",
    title: "Warm Hospitality",
    description:
      "True hospitality is quiet and attentive. Our floor staff and service teams anticipate every guest requirement with grace and discretion.",
  },
  {
    id: "presentation",
    icon: "\u{1F37D}\uFE0F",
    title: "Beautiful Presentation",
    description:
      "We believe that dining is visual. From artisanal tableware styling to delicate garnishes, our presentations create an immediate sense of occasion.",
  },
  {
    id: "seamless",
    icon: "\u{1F3AF}",
    title: "Seamless Events",
    description:
      "Every detail—from kitchen setup to synchronized service and effortless cleanup—is planned thoroughly so you can simply enjoy your guests.",
  },
];

const APPROACH_STEPS = [
  {
    step: "01",
    phase: "Discover",
    title: "Understanding Your Vision",
    description:
      "We begin by listening to your event theme, guest profile, seasonal preferences, and the ambiance you wish to create.",
  },
  {
    step: "02",
    phase: "Plan",
    title: "Custom Menu Curation",
    description:
      "Our culinary directors design tailored course selections, dietary accommodations, and beverage pairings tailored to your schedule.",
  },
  {
    step: "03",
    phase: "Create",
    title: "Artisanal Kitchen Craft",
    description:
      "Dishes are prepared fresh by our dedicated kitchen brigade using rigorous culinary techniques and pristine presentation standards.",
  },
  {
    step: "04",
    phase: "Celebrate",
    title: "Flawless Event Service",
    description:
      "On the day of your celebration, our team executes flawless table service and attentive hospitality from first toast to final farewell.",
  },
];

const OCCASIONS = [
  {
    id: "weddings",
    title: "Weddings",
    description: "Multi-course banquets, champagne canapés, and bespoke wedding celebrations.",
    image: "/images/events/wedding-events.jpg",
    link: "/events",
  },
  {
    id: "corporate",
    title: "Corporate Events",
    description: "Executive luncheons, conference dining, breakfast buffets, and networking bars.",
    image: "/images/events/corporate-events.jpg",
    link: "/events",
  },
  {
    id: "private",
    title: "Private Celebrations",
    description: "Intimate family dinners, milestone birthdays, anniversaries, and garden parties.",
    image: "/images/events/private-events.jpg",
    link: "/events",
  },
  {
    id: "special",
    title: "Special Events",
    description: "Charity balls, gala banquets, cultural showcases, and theatrical culinary stations.",
    image: "/images/events/gala-events.jpg",
    link: "/events",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page-wrapper">
      <Navbar />

      {/* ── Page Hero ────────────────────────────────────────── */}
      <header className="about-header">
        <ScrollReveal variant="fade-up" className="container text-center">
          <span className="eyebrow">AURELIA</span>
          <h1 className="about-header__title">Catering with intention.</h1>
          <p className="about-header__subtitle">
            Thoughtfully crafted food, warm hospitality, and beautifully executed celebrations.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </ScrollReveal>
      </header>

      {/* ── 1. Our Story ──────────────────────────────────────── */}
      <section className="section bg-surface about-story-section" id="story">
        <div className="container">
          <div className="about-story-grid">
            <ScrollReveal variant="fade-up" className="about-story-content">
              <span className="eyebrow">OUR STORY</span>
              <h2 className="heading-section mt-2">
                Crafted for moments worth celebrating.
              </h2>
              <p className="about-text mt-4">
                Aurelia is a dedicated catering and events company established with a simple, enduring purpose: to elevate life&rsquo;s most meaningful gatherings through thoughtful food, artful presentation, and effortless hospitality.
              </p>
              <p className="about-text mt-3">
                We believe that every celebration has its own personality. Whether catering an intimate gathering of close family or an expansive corporate banquet, our team approaches each event as a bespoke culinary journey, ensuring that every course tells a story and every guest feels genuinely welcomed.
              </p>
              <div className="mt-6">
                <Link to="/menu" className="btn outline sm">
                  Explore Our Menu Repertoire &rarr;
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="scale-in" delay={120} className="about-story-media">
              <div className="img-placeholder aspect-4-3 about-media-frame">
                <img
                  src="/images/home/why-aurelia.jpg"
                  alt="Aurelia culinary craftsmanship"
                  className="about-story-img"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 2. Our Philosophy ─────────────────────────────────── */}
      <section className="section bg-cream about-philosophy-section" id="philosophy">
        <div className="container">
          <ScrollReveal variant="fade-up" className="section-header text-center">
            <span className="eyebrow">OUR PHILOSOPHY</span>
            <h2 className="heading-section mt-2">Guiding Principles in Everything We Serve</h2>
            <p className="section-subtitle mt-2">
              Four core values define our food, our service, and the standards we hold for every event.
            </p>
          </ScrollReveal>

          <div className="about-philosophy-grid mt-10">
            {PHILOSOPHY_VALUES.map((val, index) => (
              <ScrollReveal
                key={val.id}
                variant="fade-up"
                delay={(index % 4) * 90}
                className="about-philosophy-card card"
              >
                <div className="about-philosophy-icon" aria-hidden="true">
                  {val.icon}
                </div>
                <h3 className="about-philosophy-title">{val.title}</h3>
                <p className="about-philosophy-desc">{val.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Our Approach ───────────────────────────────────── */}
      <section className="section bg-surface about-approach-section" id="approach">
        <div className="container">
          <ScrollReveal variant="fade-up" className="section-header text-center">
            <span className="eyebrow">THE EXPERIENCE</span>
            <h2 className="heading-section mt-2">Our Seamless Approach</h2>
            <p className="section-subtitle mt-2">
              From our first conversation to the conclusion of your event, we guide you through a clear, stress-free process.
            </p>
          </ScrollReveal>

          <div className="about-approach-grid mt-10">
            {APPROACH_STEPS.map((step, index) => (
              <ScrollReveal
                key={step.step}
                variant="fade-up"
                delay={(index % 4) * 90}
                className="about-approach-card card"
              >
                <div className="about-approach-header">
                  <span className="about-step-num">{step.step}</span>
                  <span className="about-phase-tag">{step.phase}</span>
                </div>
                <h3 className="about-approach-title">{step.title}</h3>
                <p className="about-approach-desc">{step.description}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Culinary Craft ─────────────────────────────────── */}
      <section className="section bg-cream about-craft-section" id="craft">
        <div className="container">
          <div className="about-craft-grid">
            <ScrollReveal variant="scale-in" className="about-craft-media">
              <div className="img-placeholder aspect-16-9 about-media-frame">
                <img
                  src="/images/home/experience-aurelia.jpg"
                  alt="Aurelia Plated Culinary Art"
                  className="about-craft-img"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={120} className="about-craft-content">
              <span className="eyebrow">CULINARY CRAFT</span>
              <h2 className="heading-section mt-2">Rooted in Passion and Precision</h2>
              <p className="about-text mt-4">
                Our kitchen brigade brings together deep respect for fresh seasonal produce and refined cooking techniques. We design menus that harmonize textures, temperatures, and vibrant natural flavors without unnecessary complexity.
              </p>
              <p className="about-text mt-3">
                From delicate hand-passed canapés to centerpiece carvery buffets and late-night dessert ateliers, each element is prepared fresh on-site to preserve flavor and visual beauty.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 5. Events We Serve ────────────────────────────────── */}
      <section className="section bg-surface about-events-section" id="events-served">
        <div className="container">
          <ScrollReveal variant="fade-up" className="section-header text-center">
            <span className="eyebrow">OCCASIONS</span>
            <h2 className="heading-section mt-2">Celebrations We Cater</h2>
            <p className="section-subtitle mt-2">
              Explore how we tailor our culinary and hospitality services for different styles of gatherings.
            </p>
          </ScrollReveal>

          <div className="about-occasions-grid mt-10">
            {OCCASIONS.map((occ, index) => (
              <ScrollReveal
                key={occ.id}
                as="article"
                variant="fade-up"
                delay={(index % 4) * 90}
                className="about-occasion-card card"
              >
                <div className="about-occasion-media img-placeholder aspect-16-9">
                  <img
                    src={occ.image}
                    alt={occ.title}
                    className="about-occasion-img"
                    loading="lazy"
                  />
                </div>
                <div className="about-occasion-body">
                  <h3 className="about-occasion-title">{occ.title}</h3>
                  <p className="about-occasion-desc">{occ.description}</p>
                  <Link to={occ.link} className="about-occasion-link">
                    Explore Event Details &rarr;
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Call To Action ─────────────────────────────────── */}
      <section className="section bg-cream about-cta-section">
        <div className="container">
          <ScrollReveal variant="fade-up" className="about-cta-card card text-center">
            <span className="eyebrow">BEGIN YOUR PLANNING</span>
            <h2 className="heading-section mt-2">Let&rsquo;s create something memorable.</h2>
            <p className="section-subtitle mt-3 mx-auto" style={{ maxWidth: 580 }}>
              Whether you are hosting an intimate dinner party, a grand wedding, or an executive conference, our team is ready to craft a bespoke catering experience.
            </p>
            <div className="about-cta-actions mt-8">
              <Link to="/menu" className="btn outline">
                Explore Our Menu
              </Link>
              <Link to="/event-booking" className="btn gold">
                Plan Your Event &rarr;
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
