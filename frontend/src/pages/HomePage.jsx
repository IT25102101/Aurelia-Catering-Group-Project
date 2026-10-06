import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMenuItems } from "../api/menuItemApi";

// Curated seasonal items used as fallback if backend is offline/empty
const FALLBACK_FEATURED_ITEMS = [
  {
    id: "f1",
    name: "Herb-Crusted Lamb Rack",
    description: "Rosemary jus, parsnip purée, and butter-glazed baby heirloom rainbow carrots.",
    category: "Main Course",
    dietaryTags: "Gluten-Free",
    price: "2,850",
    image: "/images/home/featured-lamb.jpg",
  },
  {
    id: "f2",
    name: "Seared Salmon Fillet",
    description: "Crispy skin salmon atop sautéed baby asparagus, sea greens, and citrus beurre blanc.",
    category: "Main Course",
    dietaryTags: "Pescatarian · Gluten-Free",
    price: "2,600",
    image: "/images/home/featured-salmon.jpg",
  },
  {
    id: "f3",
    name: "Dark Chocolate Delice",
    description: "Glossy Valrhona marquise, gold leaf flake, fresh raspberries, and vanilla bean cream.",
    category: "Dessert",
    dietaryTags: "Vegetarian",
    price: "1,450",
    image: "/images/home/featured-chocolate.jpg",
  },
];

export default function HomePage() {
  const [featuredMenu, setFeaturedMenu] = useState(FALLBACK_FEATURED_ITEMS);

  useEffect(() => {
    getMenuItems()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const imageMap = [
            "/images/home/featured-lamb.jpg",
            "/images/home/featured-salmon.jpg",
            "/images/home/featured-chocolate.jpg",
          ];
          const enriched = data.slice(0, 3).map((item, index) => ({
            ...item,
            image: item.image || imageMap[index % imageMap.length],
          }));
          setFeaturedMenu(enriched);
        }
      })
      .catch(() => {
        // Retain fallback items gracefully if API is unreached
      });
  }, []);

  return (
    <div className="home-wrapper">
      {/* Navigation */}
      <Navbar />

      {/* ===================================================================
          SECTION 1 — HERO
          =================================================================== */}
      <section className="home-hero" aria-label="Hero Introduction">
        <div className="home-hero__bg" aria-hidden="true">
          <img
            src="/images/home/hero-aurelia.jpg"
            alt="Aurelia Catering &amp; Events Luxury Dining Atmosphere"
            className="home-hero__image"
          />
          <div className="home-hero__overlay"></div>
        </div>

        <div className="home-hero__content">
          <div className="home-hero__eyebrow-box">
            <span className="home-hero__eyebrow">AURELIA ARTISANAL CATERING</span>
          </div>

          <h1 className="home-hero__heading">
            Exceptional Catering<br />
            <span className="home-hero__heading-accent">for every occasion.</span>
          </h1>

          <p className="home-hero__subtext">
            Chef-crafted menus, bespoke catering packages, and professional food
            service for weddings, corporate banquets, and private celebrations.
          </p>

          <div className="home-hero__actions">
            <Link to="/packages" className="btn btn-book lg">
              Browse Catering Packages
            </Link>
            <Link to="/menu" className="btn hero-btn-secondary lg">
              Explore Food Menu
            </Link>
          </div>

          <div className="home-hero__stats-row">
            <div className="hero-stat-item">
              <span className="hero-stat-num">500+</span>
              <span className="hero-stat-label">Catered Events</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <span className="hero-stat-num">100%</span>
              <span className="hero-stat-label">Farm-Fresh Sourcing</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat-item">
              <span className="hero-stat-num">12+</span>
              <span className="hero-stat-label">Years of Culinary Art</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 2 — INTRODUCTION / WHY AURELIA
          =================================================================== */}
      <section id="about" className="section bg-cream why-aurelia-section">
        <div className="container">
          <div className="editorial-split">
            {/* Left Narrative Column */}
            <div className="editorial-split__content">
              <span className="eyebrow">OUR CULINARY PROMISE</span>
              <h2 className="heading-section mt-2 mb-4">
                Why Aurelia Catering
              </h2>
              <div className="gold-rule"></div>

              <p className="editorial-lead">
                We believe memorable gatherings begin with extraordinary gastronomy
                and effortless catering service. From initial menu tastings to on-site
                perfection, Aurelia manages every culinary detail.
              </p>

              <p className="text-muted mb-6">
                Whether orchestrating a multi-course wedding banquet, an
                executive corporate lunch, or an intimate private gathering, our
                culinary team marries fresh local provenance with world-class catering
                standards.
              </p>

              <div className="why-features-list">
                <div className="why-feature-item">
                  <div className="why-feature-bullet">&bull;</div>
                  <div>
                    <strong>Bespoke Menu &amp; Package Customization</strong>
                    <p className="text-sm text-muted">Curated food courses tailored to your occasion, guest count, and dietary preferences.</p>
                  </div>
                </div>
                <div className="why-feature-item">
                  <div className="why-feature-bullet">&bull;</div>
                  <div>
                    <strong>Professional Kitchen &amp; Food Service</strong>
                    <p className="text-sm text-muted">Complete tableware, temperature-controlled delivery, live cooking stations, and attentive waitstaff.</p>
                  </div>
                </div>
                <div className="why-feature-item">
                  <div className="why-feature-bullet">&bull;</div>
                  <div>
                    <strong>Farm-Fresh Ingredient Sourcing</strong>
                    <p className="text-sm text-muted">Organically raised produce, artisan cheeses, and sustainably sourced ingredients.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/packages" className="btn outline">
                  Discover Catering Packages &rarr;
                </Link>
              </div>
            </div>

            {/* Right Media Container (4:3) */}
            <div className="editorial-split__media">
              <div className="img-placeholder aspect-4-3">
                <img
                  src="/images/home/why-aurelia.jpg"
                  alt="Aurelia Catering Artisanal Plating &amp; Hospitality"
                  className="editorial-split__image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 3 — FEATURED MENU
          =================================================================== */}
      <section className="section bg-surface featured-menu-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">CURATED SELECTIONS</span>
            <h2 className="heading-section mt-2">
              Featured from our kitchen
            </h2>
            <p className="section-subtitle mt-2">
              A glimpse into our seasonal tasting repertoire, crafted with fresh
              ingredients and refined presentation.
            </p>
          </div>

          <div className="menu-grid mt-8">
            {featuredMenu.map((item) => (
              <div key={item.id} className="menu-card card">
                {/* 4:3 Food Photo Area */}
                <div className="menu-card__media img-placeholder aspect-4-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-card__image"
                    />
                  ) : (
                    <div className="img-placeholder__content">
                      <span className="menu-card__cat-badge">{item.category || "Specialty"}</span>
                      <span className="img-placeholder__hint">4:3 Dish Photo</span>
                    </div>
                  )}
                  {item.category && (
                    <span className="menu-card__cat-badge-overlay">{item.category}</span>
                  )}
                </div>

                <div className="menu-card__content">
                  <div className="menu-card__header">
                    <h3 className="menu-card__title">{item.name}</h3>
                    {item.price && (
                      <span className="menu-card__price">
                        Rs {typeof item.price === "number" ? item.price.toLocaleString() : item.price}
                      </span>
                    )}
                  </div>

                  <p className="menu-card__desc">{item.description}</p>

                  {item.dietaryTags && (
                    <div className="menu-card__tags">
                      <span className="badge badge--available">{item.dietaryTags}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/menu" className="btn gold lg">
              Explore Complete Food Menu &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 4 — CATERING PACKAGES
          =================================================================== */}
      <section className="section bg-cream packages-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">TAILORED CATERING TIERS</span>
            <h2 className="heading-section mt-2">
              Catering Packages for Every Occasion
            </h2>
            <p className="section-subtitle mt-2">
              Carefully designed multi-course packages, buffet setups, and dining
              solutions tailored to your guest count.
            </p>
          </div>

          <div className="packages-grid mt-8">
            {/* Wedding Card */}
            <div className="package-card card">
              <div className="package-card__media img-placeholder aspect-4-3">
                <img
                  src="/images/home/package-weddings.jpg"
                  alt="Aurelia Luxury Wedding Catering"
                  className="package-card__image"
                />
                <span className="package-card__cat-badge-overlay">WEDDINGS</span>
              </div>
              <div className="package-card__body">
                <h3 className="card__title">Weddings &amp; Receptions</h3>
                <p className="card__body">
                  Multi-course plated dinners, champagne canapés, custom wedding
                  cakes, and complete banquet service staffing.
                </p>
                <div className="package-card__meta">
                  <span>50–500 Guests</span> &bull; <span>Full Service</span>
                </div>
                <Link to="/packages" className="btn secondary sm mt-4">
                  Explore Wedding Catering &rarr;
                </Link>
              </div>
            </div>

            {/* Corporate Card */}
            <div className="package-card card">
              <div className="package-card__media img-placeholder aspect-4-3">
                <img
                  src="/images/home/package-corporate.jpg"
                  alt="Aurelia Corporate Event Catering"
                  className="package-card__image"
                />
                <span className="package-card__cat-badge-overlay">CORPORATE</span>
              </div>
              <div className="package-card__body">
                <h3 className="card__title">Corporate Banquets</h3>
                <p className="card__body">
                  Executive boardroom breakfasts, summit lunch breakouts, and
                  grand end-of-year corporate celebration dinners.
                </p>
                <div className="package-card__meta">
                  <span>20–1,000 Guests</span> &bull; <span>Custom Logistics</span>
                </div>
                <Link to="/packages" className="btn secondary sm mt-4">
                  Explore Corporate Catering &rarr;
                </Link>
              </div>
            </div>

            {/* Private Celebrations */}
            <div className="package-card card">
              <div className="package-card__media img-placeholder aspect-4-3">
                <img
                  src="/images/home/package-private.jpg"
                  alt="Aurelia Private Celebrations"
                  className="package-card__image"
                />
                <span className="package-card__cat-badge-overlay">PRIVATE</span>
              </div>
              <div className="package-card__body">
                <h3 className="card__title">Private Celebrations</h3>
                <p className="card__body">
                  Milestone birthdays, intimate family anniversaries, garden parties,
                  and curated chef-table home dining.
                </p>
                <div className="package-card__meta">
                  <span>15–120 Guests</span> &bull; <span>Bespoke Chef</span>
                </div>
                <Link to="/packages" className="btn secondary sm mt-4">
                  Explore Private Catering &rarr;
                </Link>
              </div>
            </div>

            {/* Special Events */}
            <div className="package-card card">
              <div className="package-card__media img-placeholder aspect-4-3">
                <img
                  src="/images/home/package-galas.jpg"
                  alt="Aurelia Galas and Special Events"
                  className="package-card__image"
                />
                <span className="package-card__cat-badge-overlay">SPECIALTY</span>
              </div>
              <div className="package-card__body">
                <h3 className="card__title">Galas &amp; Buffet Banquets</h3>
                <p className="card__body">
                  Charity fundraisers, cultural banquets, cocktail receptions,
                  and large-scale experiential buffet catering.
                </p>
                <div className="package-card__meta">
                  <span>100–800 Guests</span> &bull; <span>Artisanal Bar</span>
                </div>
                <Link to="/packages" className="btn secondary sm mt-4">
                  Explore Specialty Catering &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 5 — THE AURELIA EXPERIENCE
          =================================================================== */}
      <section className="section bg-surface experience-section">
        <div className="container">
          <div className="editorial-split editorial-split--reverse">
            {/* Left Media (4:3) */}
            <div className="editorial-split__media">
              <div className="img-placeholder aspect-4-3">
                <img
                  src="/images/home/experience-aurelia.jpg"
                  alt="The Aurelia Catering Experience and Live Service"
                  className="editorial-split__image"
                />
              </div>
            </div>

            {/* Right Pillars Content */}
            <div className="editorial-split__content">
              <span className="eyebrow">CULINARY EXCELLENCE &amp; LOGISTICS</span>
              <h2 className="heading-section mt-2 mb-4">
                The Aurelia Catering Experience
              </h2>
              <div className="gold-rule"></div>

              <div className="experience-pillars">
                <div className="pillar-item">
                  <span className="pillar-num">01</span>
                  <div className="pillar-text">
                    <strong>Thoughtful Menu Planning</strong>
                    <p className="text-sm text-muted">
                      Personalized consultation and private tastings to refine
                      courses, recipe ingredients, and dietary requirements.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <span className="pillar-num">02</span>
                  <div className="pillar-text">
                    <strong>Fresh Kitchen Preparation</strong>
                    <p className="text-sm text-muted">
                      Courses prepared by our culinary team with strict inventory
                      management and farm-fresh ingredients.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <span className="pillar-num">03</span>
                  <div className="pillar-text">
                    <strong>Reliable Delivery &amp; Service</strong>
                    <p className="text-sm text-muted">
                      Temperature-controlled catering delivery, punctual arrival,
                      and professional banquet service staff.
                    </p>
                  </div>
                </div>

                <div className="pillar-item">
                  <span className="pillar-num">04</span>
                  <div className="pillar-text">
                    <strong>Tailored for Your Occasion</strong>
                    <p className="text-sm text-muted">
                      From grand ballrooms to outdoor garden receptions, we adapt
                      tableware, live stations, and food timing seamlessly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 6 — OCCASIONS TILES
          =================================================================== */}
      <section id="events" className="section bg-cream occasions-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">CATERING SERVICES</span>
            <h2 className="heading-section mt-2">
              Catering Services by Occasion
            </h2>
            <p className="section-subtitle mt-2">
              Explore our specialized catering solutions designed for distinct celebration styles.
            </p>
          </div>

          <div className="occasions-grid mt-8">
            {/* Tile 1 */}
            <div className="occasion-tile img-placeholder aspect-4-3">
              <img
                src="/images/home/occasion-weddings.jpg"
                alt="Aurelia Luxury Wedding Catering"
                className="occasion-tile__image"
              />
              <div className="occasion-tile__overlay">
                <span className="occasion-tile__eyebrow">WEDDING BANQUETS</span>
                <h3 className="occasion-tile__title">Luxury Weddings</h3>
                <p className="occasion-tile__desc">
                  Signature champagne welcomes, plated dinners, and late-night dessert ateliers.
                </p>
                <Link to="/packages" className="btn gold sm mt-4">
                  Discover Wedding Catering &rarr;
                </Link>
              </div>
            </div>

            {/* Tile 2 */}
            <div className="occasion-tile img-placeholder aspect-4-3">
              <img
                src="/images/home/occasion-corporate.jpg"
                alt="Aurelia Corporate Catering"
                className="occasion-tile__image"
              />
              <div className="occasion-tile__overlay">
                <span className="occasion-tile__eyebrow">EXECUTIVE &amp; GALA</span>
                <h3 className="occasion-tile__title">Corporate Catering</h3>
                <p className="occasion-tile__desc">
                  Flawless food timing, boardroom breakfasts, and grand end-of-year celebratory banquets.
                </p>
                <Link to="/packages" className="btn gold sm mt-4">
                  Explore Corporate Catering &rarr;
                </Link>
              </div>
            </div>

            {/* Tile 3 */}
            <div className="occasion-tile img-placeholder aspect-4-3">
              <img
                src="/images/home/occasion-private.jpg"
                alt="Aurelia Private Celebrations"
                className="occasion-tile__image"
              />
              <div className="occasion-tile__overlay">
                <span className="occasion-tile__eyebrow">MILESTONES &amp; SOIREE</span>
                <h3 className="occasion-tile__title">Private Celebrations</h3>
                <p className="occasion-tile__desc">
                  Intimate garden banquets, milestone birthdays, and custom cocktail receptions.
                </p>
                <Link to="/packages" className="btn gold sm mt-4">
                  Plan Private Catering &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 7 — TESTIMONIALS
          =================================================================== */}
      <section className="section bg-surface testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">GUEST EXPERIENCES</span>
            <h2 className="heading-section mt-2">
              What our clients say
            </h2>
            <p className="section-subtitle mt-2">
              Reflections from hosts and couples who entrusted Aurelia with their celebrations.
            </p>
          </div>

          <div className="testimonials-grid mt-8">
            {/* Review 1 */}
            <div className="testimonial-card card">
              <div className="testimonial-card__stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-card__quote">
                &ldquo;Aurelia transformed our wedding into a Michelin-level dining
                experience. From the burrata starter to the duck breast, our 180 guests
                could not stop talking about the food!&rdquo;
              </p>
              <div className="testimonial-card__author">
                <strong>Elena &amp; Marcus Vance</strong>
                <span>Vineyard Wedding &bull; 180 Guests</span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="testimonial-card card">
              <div className="testimonial-card__stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-card__quote">
                &ldquo;For our annual technology summit gala, execution had to be
                flawless. Aurelia delivered 350 hot plated dinners simultaneously with
                astonishing finesse and discretion.&rdquo;
              </p>
              <div className="testimonial-card__author">
                <strong>David Sterling</strong>
                <span>Executive Director &bull; Annual Tech Gala</span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="testimonial-card card">
              <div className="testimonial-card__stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testimonial-card__quote">
                &ldquo;The custom tasting session made planning effortless. Their
                attention to our vegan and gluten-free family members was handled with
                immense creativity and grace.&rdquo;
              </p>
              <div className="testimonial-card__author">
                <strong>Amara &amp; Rohan Kapoor</strong>
                <span>25th Anniversary Soiree &bull; 75 Guests</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          SECTION 8 — FINAL CALL-TO-ACTION
          =================================================================== */}
      <section id="contact" className="final-cta-section" aria-label="Book Your Catering">
        <div className="container text-center">
          <span className="eyebrow eyebrow--gold">RESERVE YOUR CATERING</span>
          <h2 className="final-cta__heading mt-2">
            Let&rsquo;s make your next occasion delicious and unforgettable.
          </h2>
          <p className="final-cta__subtext mt-4">
            Select a catering package or customize your menu, and let Aurelia take care
            of every culinary and service detail.
          </p>

          <div className="final-cta__buttons mt-8">
            <Link to="/packages" className="btn btn-book lg">
              Book Catering Service
            </Link>
            <Link to="/menu" className="btn final-cta-btn-outline lg">
              Browse Food Menu
            </Link>
          </div>

          <div className="final-cta__concierge mt-10">
            <span>Direct Concierge:</span>
            <a href="tel:+94710875268" className="concierge-link">+94 71 0875 268</a>
            <span className="concierge-dot">&bull;</span>
            <a href="mailto:events@aureliacatering.com" className="concierge-link">events@aureliacatering.com</a>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
