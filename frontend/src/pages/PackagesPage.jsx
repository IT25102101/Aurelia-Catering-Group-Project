import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getCateringPackages } from "../api/cateringPackageApi";

const FALLBACK_PACKAGES = [
  {
    id: 1,
    name: "The Royal Wedding Grand Feast",
    description:
      "A grand celebratory banquet featuring bespoke multi-course plated dining, welcome champagne and artisan canapés, custom tiered cake service, and full white-glove sommelier staffing.",
    category: "Weddings",
    minGuestCount: 50,
    maxGuestCount: 500,
    price: 6500,
    image: "/images/home/package-weddings.jpg",
    features: [
      "Welcome Champagne & Caviar Canapés",
      "5-Course Silver-Plated Dining Experience",
      "Dedicated Event Captain & Sommelier Team",
      "Custom Tiered Wedding Cake Service",
      "Artisan Tableware & Floral Styling",
    ],
  },
  {
    id: 2,
    name: "The Executive Corporate Gala",
    description:
      "Engineered for high-level business summits, awards ceremonies, and executive retreats. Includes barista stations, hot fork carvery, and evening cocktail networking service.",
    category: "Corporate",
    minGuestCount: 30,
    maxGuestCount: 350,
    price: 4500,
    image: "/images/home/package-corporate.jpg",
    features: [
      "Artisan Espresso & Pastry Morning Bar",
      "Executive Hot Fork Buffet & Carvery",
      "Evening Mixology & Grazing Tables",
      "Comprehensive Dietary Customizations",
      "Discreet, Fast-Paced Professional Service",
    ],
  },
  {
    id: 3,
    name: "Private Botanical Soirée",
    description:
      "An intimate dining experience designed for anniversaries, birthdays, and garden celebrations. Highlights seasonal farm-to-table sharing platters and handcrafted botanical cocktails.",
    category: "Private Celebrations",
    minGuestCount: 15,
    maxGuestCount: 80,
    price: 3800,
    image: "/images/home/package-private.jpg",
    features: [
      "Lush Artisanal Charcuterie & Cheese Grazing Table",
      "Seasonal Farm-to-Table Sharing Platters",
      "Botanical Craft Cocktails & Infused Waters",
      "Custom Dessert Atelier & Petit Fours",
      "Dedicated Private Chef & Server",
    ],
  },
  {
    id: 4,
    name: "The Black-Tie Grand Ball",
    description:
      "Our most prestigious banquet offering. Multi-station culinary showcases, live oyster and seafood bars, vintage wine pairings, and late-night sweet treats.",
    category: "Corporate",
    minGuestCount: 100,
    maxGuestCount: 1000,
    price: 8500,
    image: "/images/home/package-galas.jpg",
    features: [
      "Live Oyster & Sustainable Seafood Ice Bar",
      "Grand 6-Course Gastronomic Tasting Menu",
      "Sommelier-Curated Reserve Wine Pairings",
      "Midnight French Crepe & Dessert Station",
      "Full Turnkey Event Logistics & Staffing",
    ],
  },
];

function getPackageImage(pkg) {
  if (pkg.image) return pkg.image;
  const name = (pkg.name || "").toLowerCase();
  const cat = (pkg.category || "").toLowerCase();

  if (cat.includes("wedding") || name.includes("wedding")) {
    return "/images/home/package-weddings.jpg";
  }
  if (cat.includes("corporate") || name.includes("executive") || name.includes("conference")) {
    return "/images/home/package-corporate.jpg";
  }
  if (cat.includes("private") || name.includes("soiree") || name.includes("garden") || name.includes("celebration")) {
    return "/images/home/package-private.jpg";
  }
  return "/images/home/package-galas.jpg";
}

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCateringPackages();
      if (Array.isArray(data) && data.length > 0) {
        setPackages(data);
      } else {
        setPackages(FALLBACK_PACKAGES);
      }
    } catch (err) {
      setError(err.message || "Failed to load live packages");
      setPackages(FALLBACK_PACKAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const defaultCats = ["All", "Weddings", "Corporate", "Private Celebrations"];
    const apiCats = packages
      .map((p) => p.category)
      .filter(Boolean)
      .map((c) => c.trim());
    return Array.from(new Set([...defaultCats, ...apiCats]));
  }, [packages]);

  // Filter packages based on active category
  const filteredPackages = useMemo(() => {
    if (selectedCategory === "All") {
      return packages;
    }
    return packages.filter((pkg) => {
      const cat = (pkg.category || "").toLowerCase().trim();
      const target = selectedCategory.toLowerCase().trim();
      return cat.includes(target) || target.includes(cat);
    });
  }, [packages, selectedCategory]);

  return (
    <div className="packages-page-wrapper">
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────── */}
      <header className="packages-header">
        <div className="container text-center">
          <span className="eyebrow">AURELIA PACKAGES</span>
          <h1 className="packages-header__title">Curated experiences for every occasion.</h1>
          <p className="packages-header__subtitle">
            Thoughtfully designed catering experiences for weddings, corporate gatherings, and private celebrations.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </div>
      </header>

      {/* ── Category Filter Section ──────────────────────────── */}
      <section className="section bg-surface packages-catalog-section" id="packages-catalog">
        <div className="container">
          {/* Category Filter Pills */}
          <div className="packages-category-nav" role="tablist" aria-label="Filter packages by occasion">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`packages-category-tab ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 text-center text-xs text-muted" role="status">
              Displaying our curated signature package collection.
            </div>
          )}

          {/* ── Packages Grid ─────────────────────────────────── */}
          {loading ? (
            <div className="packages-loading card text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-muted">Loading signature packages&hellip;</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="packages-empty card text-center">
              <div className="packages-empty-icon">&#127869;</div>
              <h3 className="packages-empty-title">No packages in this category</h3>
              <p className="text-muted mt-2">
                Try selecting &ldquo;All&rdquo; or reach out to our team for a bespoke event consultation.
              </p>
              <button
                type="button"
                className="btn gold mt-4"
                onClick={() => setSelectedCategory("All")}
              >
                View All Packages
              </button>
            </div>
          ) : (
            <div className="packages-catalog-grid mt-8">
              {filteredPackages.map((pkg) => {
                const imgSrc = getPackageImage(pkg);
                const priceFormatted = `Rs. ${Number(pkg.price || 0).toLocaleString("en-LK")}`;
                const guestRange =
                  pkg.minGuestCount && pkg.maxGuestCount
                    ? `${pkg.minGuestCount}–${pkg.maxGuestCount} Guests`
                    : pkg.minGuestCount
                    ? `From ${pkg.minGuestCount} Guests`
                    : "Flexible Guest Count";

                const features =
                  Array.isArray(pkg.features) && pkg.features.length > 0
                    ? pkg.features
                    : [
                        "Complete culinary preparation and on-site service",
                        "Premium tableware and event setup coordination",
                        "Dedicated catering team and event manager",
                        "Full dietary customization and wine pairing available",
                      ];

                return (
                  <article key={pkg.id} className="package-catalog-card card">
                    {/* Card Media */}
                    <div className="package-catalog-card__media img-placeholder aspect-16-9">
                      <img
                        src={imgSrc}
                        alt={pkg.name}
                        className="package-catalog-card__image"
                        loading="lazy"
                      />
                      {pkg.category && (
                        <span className="package-catalog-card__cat-badge">
                          {pkg.category.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="package-catalog-card__body">
                      <div className="package-catalog-card__top">
                        <span className="package-catalog-card__guests-badge">
                          {guestRange}
                        </span>
                        <div className="package-catalog-card__pricing">
                          <span className="package-catalog-card__price">{priceFormatted}</span>
                          <span className="package-catalog-card__price-sub">/ guest</span>
                        </div>
                      </div>

                      <h2 className="package-catalog-card__title">{pkg.name}</h2>
                      <p className="package-catalog-card__desc">{pkg.description}</p>

                      {/* Inclusions List */}
                      <div className="package-catalog-card__inclusions">
                        <span className="package-inclusions-label">Package Inclusions:</span>
                        <ul className="package-inclusions-list">
                          {features.map((feat, i) => (
                            <li key={i} className="package-inclusion-item">
                              <span className="package-inclusion-check">&#10003;</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Footer CTA */}
                      <div className="package-catalog-card__footer">
                        <Link
                           to="/event-booking"
                           state={{
                             packageId: pkg.id,
                             packageName: pkg.name,
                             packagePrice: pkg.price
                           }}
                           className="btn gold package-catalog-card__btn"
                         >
                           Book This Package &rarr;
                         </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Bespoke Consultation Section ─────────────────────── */}
      <section className="section bg-cream bespoke-consult-section">
        <div className="container">
          <div className="bespoke-card card text-center">
            <span className="eyebrow">CUSTOM CURATIONS</span>
            <h2 className="heading-section mt-2">Looking for a completely bespoke celebration?</h2>
            <p className="section-subtitle mt-3 mx-auto" style={{ maxWidth: 620 }}>
              Our executive culinary directors and event stylists design one-of-a-kind gastronomic journeys tailored specifically to your theme, venue, and guest palate.
            </p>
            <div className="mt-6">
              <Link to="/event-booking" className="btn gold lg">
                Plan Custom Catering &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
