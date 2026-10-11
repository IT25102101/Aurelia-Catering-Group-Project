import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/common/ScrollReveal";

const EVENT_CATEGORIES = [
  {
    id: "weddings",
    slug: "weddings",
    typeValue: "Wedding",
    categoryLabel: "WEDDING CATERING",
    title: "Luxury Weddings & Receptions",
    subtitle: "Timeless culinary elegance for your most unforgettable day.",
    description:
      "From grand ballroom receptions to romantic vineyard ceremonies, Aurelia creates bespoke multi-course dining experiences, champagne canapé receptions, artisanal dessert stations, and white-glove sommelier service tailored to your love story.",
    image: "/images/events/wedding-events.jpg",
    guestRange: "50 – 500 Guests",
    cateringHighlights: [
      "Bespoke 5-course silver-plated dinner",
      "Welcome champagne & caviar canapé bar",
      "Custom tiered cake cutting & dessert atelier",
      "Sommelier-guided reserve wine pairings",
      "Midnight comfort food & espresso bar",
    ],
    serviceHighlights: [
      "Dedicated bridal party hospitality captain",
      "White-glove synchronized table service",
      "Custom linen, tableware & floral styling",
      "Pre-event private tasting suite session",
    ],
  },
  {
    id: "corporate",
    slug: "corporate",
    typeValue: "Corporate",
    categoryLabel: "CORPORATE HOSPITALITY",
    title: "Conferences & Executive Galas",
    subtitle: "Precision catering designed for impactful business summits and awards.",
    description:
      "Elevate your corporate brand with executive breakfast buffets, hot-fork conference luncheons, artisanal barista bars, and evening networking cocktail receptions executed with discreet, punctual perfection.",
    image: "/images/events/corporate-events.jpg",
    guestRange: "30 – 400 Guests",
    cateringHighlights: [
      "Artisanal morning bakery & barista station",
      "Executive hot-fork carvery & seasonal buffet",
      "Interactive grazing & cocktail food stations",
      "Comprehensive dietary, vegan & halal labeling",
      "Signature corporate networking cocktail bar",
    ],
    serviceHighlights: [
      "High-speed, discreet professional service staff",
      "Seamless AV & presentation timing coordination",
      "VIP head-table service & executive lounge setup",
      "Turnkey multi-day conference logistics",
    ],
  },
  {
    id: "private",
    slug: "private-celebrations",
    typeValue: "Private Celebration",
    categoryLabel: "PRIVATE OCCASIONS",
    title: "Milestones & Intimate Soirées",
    subtitle: "Handcrafted dining experiences for birthdays, anniversaries, and family milestones.",
    description:
      "Whether an intimate botanical garden dinner or a vibrant milestone celebration, we craft farm-to-table harvest platters, artisanal cheese boards, and custom mixology menus that bring your loved ones together.",
    image: "/images/events/private-events.jpg",
    guestRange: "15 – 100 Guests",
    cateringHighlights: [
      "Artisanal charcuterie & farmhouse cheese grazing table",
      "Family-style seasonal harvest sharing platters",
      "Handcrafted botanical signature cocktails",
      "Made-to-order dessert atelier & petit fours",
      "Customized menus matching your family heritage",
    ],
    serviceHighlights: [
      "Private executive chef & master mixologist on-site",
      "Intimate tablescape styling & candlelight accents",
      "Complete kitchen restoration and spotless cleanup",
      "Personalized embossed tasting menus for guests",
    ],
  },
  {
    id: "galas",
    slug: "galas-special-events",
    typeValue: "Other",
    categoryLabel: "GRAND EXPERIENCES",
    title: "Charity Galas & Grand Banquets",
    subtitle: "Showstopping gastronomic productions for society balls and cultural galas.",
    description:
      "Our premier banqueting experience features theatrical live chef stations, fresh oyster bars, reserve vintage wine pairings, and spectacular midnight pastry showcases designed to captivate hundreds of distinguished guests.",
    image: "/images/events/gala-events.jpg",
    guestRange: "100 – 1,000+ Guests",
    cateringHighlights: [
      "Grand multi-tier oyster & seafood ice bar",
      "6-Course gastronomic tasting menu",
      "Theatrical live flambé & carving stations",
      "Sommelier-curated grand cru wine pairing",
      "Midnight French crêpe & dessert lounge",
    ],
    serviceHighlights: [
      "Full off-site mobile kitchen buildout & logistics",
      "Synchronized banquet service for 500+ attendees",
      "Dedicated senior event director & floor captains",
      "High-capacity mixology & champagne staff",
    ],
  },
];

export default function PublicEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && selectedEvent) {
        setSelectedEvent(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEvent]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedEvent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedEvent]);

  function handlePlanEvent() {
    setSelectedEvent(null);
    navigate(`/event-booking`);
  }

  return (
    <div className="events-page-wrapper">
      <Navbar />

      {/* ── Page Hero ────────────────────────────────────────── */}
      <header className="events-header">
        <ScrollReveal variant="fade-up" className="container text-center">
          <span className="eyebrow">AURELIA EVENTS</span>
          <h1 className="events-header__title">Celebrations, beautifully catered.</h1>
          <p className="events-header__subtitle">
            From intimate gatherings to grand celebrations, we create memorable culinary experiences for every occasion.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </ScrollReveal>
      </header>

      {/* ── Event Category Grid Section ──────────────────────── */}
      <main className="section bg-surface events-catalog-section" id="events-collection">
        <div className="container">
          <div className="events-catalog-grid">
            {EVENT_CATEGORIES.map((event, index) => (
              <ScrollReveal
                key={event.id}
                as="article"
                variant="fade-up"
                delay={(index % 3) * 90}
                className="event-catalog-card card"
              >
                {/* Image Media Container */}
                <div className="event-catalog-card__media img-placeholder aspect-16-9">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="event-catalog-card__image"
                    loading="lazy"
                  />
                  <span className="event-catalog-card__cat-badge">
                    {event.categoryLabel}
                  </span>
                </div>

                {/* Card Content */}
                <div className="event-catalog-card__body">
                  <div className="event-catalog-card__meta">
                    <span className="event-catalog-card__guest-pill">
                      {event.guestRange}
                    </span>
                  </div>

                  <h2 className="event-catalog-card__title">{event.title}</h2>
                  <p className="event-catalog-card__desc">{event.description}</p>

                  {/* Highlights Preview */}
                  <ul className="event-catalog-card__bullets">
                    {event.cateringHighlights.slice(0, 3).map((hl, i) => (
                      <li key={i} className="event-bullet-item">
                        <span className="event-bullet-icon">&#10003;</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Action Buttons */}
                  <div className="event-catalog-card__actions">
                    <button
                      type="button"
                      className="btn outline sm event-btn-explore"
                      onClick={() => setSelectedEvent(event)}
                      aria-label={`Explore details for ${event.title}`}
                    >
                      Explore Details &rarr;
                    </button>
                    <Link
                      to="/event-booking"
                      className="btn gold sm event-btn-plan"
                    >
                      Plan Your Event
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </main>

      {/* ── Our Planning Philosophy Section ──────────────────── */}
      <section className="section bg-cream events-process-section">
        <div className="container">
          <ScrollReveal variant="fade-up" className="section-header text-center">
            <span className="eyebrow">OUR APPROACH</span>
            <h2 className="heading-section mt-2">How We Craft Your Occasion</h2>
            <p className="section-subtitle mt-2">
              Every detail is considered, from initial culinary concept to immaculate table restoration.
            </p>
          </ScrollReveal>

          <div className="events-process-grid mt-10">
            <ScrollReveal variant="fade-up" delay={0} className="events-process-step card">
              <span className="process-step-number">01</span>
              <h3 className="process-step-title">Vision &amp; Menu Design</h3>
              <p className="process-step-desc">
                We meet with you to understand your celebration&rsquo;s aesthetic, timeline, and the culinary preferences of your guests.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={100} className="events-process-step card">
              <span className="process-step-number">02</span>
              <h3 className="process-step-title">Private Tasting Session</h3>
              <p className="process-step-desc">
                Sample your bespoke dishes and wine pairings in our private tasting salon to refine flavors, presentation, and service style.
              </p>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={200} className="events-process-step card">
              <span className="process-step-number">03</span>
              <h3 className="process-step-title">Flawless Day-of Execution</h3>
              <p className="process-step-desc">
                Our executive chefs, sommeliers, and floor captains coordinate every course with discreet precision and attentive hospitality.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal variant="fade-up" delay={150} className="text-center mt-12">
            <Link to="/event-booking" className="btn gold lg">
              Book an Event Consultation &rarr;
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Event Detail Modal ───────────────────────────────── */}
      {selectedEvent && (
        <>
          <div
            className="event-modal-backdrop"
            onClick={() => setSelectedEvent(null)}
            aria-hidden="true"
          />

          <div
            className="event-modal-dialog card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
          >
            <button
              type="button"
              className="event-modal-close"
              onClick={() => setSelectedEvent(null)}
              aria-label="Close event details modal"
            >
              &times;
            </button>

            <div className="event-modal-media img-placeholder aspect-16-9">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="event-modal-img"
              />
              <span className="event-catalog-card__cat-badge">
                {selectedEvent.categoryLabel}
              </span>
            </div>

            <div className="event-modal-content">
              <div className="event-modal-header">
                <span className="event-catalog-card__guest-pill">
                  {selectedEvent.guestRange}
                </span>
                <h2 id="event-modal-title" className="event-modal-title mt-2">
                  {selectedEvent.title}
                </h2>
                <p className="event-modal-subtitle">
                  {selectedEvent.subtitle}
                </p>
              </div>

              <p className="event-modal-desc">
                {selectedEvent.description}
              </p>

              <div className="event-modal-columns">
                {/* Catering Highlights */}
                <div className="event-modal-col">
                  <h4 className="event-modal-col-title">Catering Highlights</h4>
                  <ul className="event-modal-list">
                    {selectedEvent.cateringHighlights.map((hl, i) => (
                      <li key={i} className="event-modal-list-item">
                        <span className="event-bullet-icon">&#10003;</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Service Highlights */}
                <div className="event-modal-col">
                  <h4 className="event-modal-col-title">Service &amp; Hospitality</h4>
                  <ul className="event-modal-list">
                    {selectedEvent.serviceHighlights.map((hl, i) => (
                      <li key={i} className="event-modal-list-item">
                        <span className="event-bullet-icon">&#10003;</span>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="event-modal-footer">
                <button
                  type="button"
                  className="btn gold event-modal-plan-btn"
                  onClick={() => handlePlanEvent(selectedEvent.typeValue)}
                >
                  Plan This Event &rarr;
                </button>
                <button
                  type="button"
                  className="btn outline sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
