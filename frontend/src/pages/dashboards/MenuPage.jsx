import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getMenuItems } from "../api/menuItemApi";
import { useCart } from "../context/CartContext";
import CartDrawer from "../components/CartDrawer";

// Curated fallback dishes used if backend is offline or starting up
const FALLBACK_MENU_ITEMS = [
  {
    id: 1,
    name: "Herb-Crusted Lamb Rack",
    description: "Rosemary jus, parsnip purée, and butter-glazed baby heirloom rainbow carrots.",
    category: "Main Course",
    dietaryTags: "Gluten-Free",
    price: 2850,
  },
  {
    id: 2,
    name: "Seared Salmon Fillet",
    description: "Crispy skin salmon atop sautéed baby asparagus, sea greens, and citrus beurre blanc.",
    category: "Main Course",
    dietaryTags: "Pescatarian · Gluten-Free",
    price: 2600,
  },
  {
    id: 3,
    name: "Dark Chocolate Delice",
    description: "Glossy Valrhona marquise, gold leaf flake, fresh raspberries, and vanilla bean cream.",
    category: "Dessert",
    dietaryTags: "Vegetarian",
    price: 1450,
  },
  {
    id: 4,
    name: "Artisanal Burrata & Heirloom Peach",
    description: "Aged balsamic pearls, toasted pine nuts, fresh basil, and grilled sourdough crisps.",
    category: "Appetizer",
    dietaryTags: "Vegetarian",
    price: 1650,
  },
  {
    id: 5,
    name: "Wild Truffle & Porcini Risotto",
    description: "Acquerello carnaroli rice, shaved black truffles, and 24-month Parmigiano Reggiano.",
    category: "Main Course",
    dietaryTags: "Vegetarian · Gluten-Free",
    price: 2400,
  },
  {
    id: 6,
    name: "Charred Asparagus & King Oyster Skewers",
    description: "Yuzu miso glaze, toasted sesame crumble, and micro coriander salad.",
    category: "Canapé",
    dietaryTags: "Vegan · Gluten-Free",
    price: 1450,
  },
  {
    id: 7,
    name: "Poached Sea Bass in Saffron Broth",
    description: "Fennel confit, sea asparagus, baby leeks, and saffron-infused bouillabaisse jus.",
    category: "Main Course",
    dietaryTags: "Pescatarian · Gluten-Free",
    price: 3200,
  },
  {
    id: 8,
    name: "Pan-Seared Duck Breast",
    description: "Cherry port reduction, parsnip purée, and buttered heirloom rainbow carrots.",
    category: "Main Course",
    dietaryTags: "Gluten-Free",
    price: 2850,
  },
  {
    id: 9,
    name: "Matcha & White Chocolate Tart",
    description: "Ceremonial grade Uji matcha ganache, yuzu curd, and toasted pistachio crumble.",
    category: "Dessert",
    dietaryTags: "Vegetarian",
    price: 1350,
  },
];

/**
 * Deterministically maps a menu item to a local photography asset.
 */
function getDishImage(item) {
  if (!item) return "/images/menu/lamb.jpg";
  const name = (item.name || "").toLowerCase();
  const category = (item.category || "").toLowerCase();

  if (name.includes("salmon") || name.includes("sea bass") || name.includes("fish")) {
    return "/images/menu/salmon.jpg";
  }
  if (name.includes("chocolate") || name.includes("tart") || category.includes("dessert")) {
    return "/images/menu/chocolate.jpg";
  }
  if (category.includes("canapé") || category.includes("appetizer") || name.includes("burrata") || name.includes("skewer")) {
    return "/images/menu/atelier.jpg";
  }
  return "/images/menu/lamb.jpg";
}

export default function MenuPage() {
  const { addItem } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState({});

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMenuItems();
      if (Array.isArray(data) && data.length > 0) {
        setItems(data);
      } else {
        // Use fallback if API returns empty list
        setItems(FALLBACK_MENU_ITEMS);
      }
    } catch (err) {
      // Use fallback if API cannot be reached
      setError(err.message || "Failed to load live menu");
      setItems(FALLBACK_MENU_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Dynamically extract categories from available items
  const categories = useMemo(() => {
    const rawCategories = items
      .map((i) => i.category)
      .filter(Boolean)
      .map((c) => c.trim());
    return ["All", ...Array.from(new Set(rawCategories))];
  }, [items]);

  // Dynamically extract individual dietary tags from available items
  const availableDietaryTags = useMemo(() => {
    const tagSet = new Set();
    items.forEach((item) => {
      if (item.dietaryTags) {
        item.dietaryTags
          .split(/[,·•]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet);
  }, [items]);

  // Toggle dietary tag filter
  const toggleDietaryTag = (tag) => {
    setSelectedDietary((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Reset all active filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDietary([]);
  };

  // Filter items based on search, category, and dietary selections
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search matching (name, description, category, dietaryTags)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (item.name || "").toLowerCase().includes(query);
        const descMatch = (item.description || "").toLowerCase().includes(query);
        const catMatch = (item.category || "").toLowerCase().includes(query);
        const dietMatch = (item.dietaryTags || "").toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !catMatch && !dietMatch) {
          return false;
        }
      }

      // Category matching
      if (selectedCategory !== "All" && (item.category || "").trim() !== selectedCategory) {
        return false;
      }

      // Dietary matching (must match selected tags)
      if (selectedDietary.length > 0) {
        const itemTags = (item.dietaryTags || "")
          .split(/[,·•]/)
          .map((t) => t.trim().toLowerCase());
        const hasAllTags = selectedDietary.every((sel) =>
          itemTags.includes(sel.toLowerCase())
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedDietary]);

  // Add menu item to CartContext and open the cart drawer
  const handleAddToOrder = (item) => {
    // Build the cart item from existing menu item data
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      dietaryTags: item.dietaryTags,
      image: item.image || "",
    });

    // Visual feedback: brief "Added" state on the card button
    setRecentlyAdded((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const updated = { ...prev };
        delete updated[item.id];
        return updated;
      });
    }, 1500);

    // Open the cart drawer
    setIsCartOpen(true);
  };

  return (
    <div className="menu-page-wrapper">
      <Navbar />

      {/* ── Menu Hero Header ────────────────────────────────────────────── */}
      <header className="menu-header">
        <div className="container text-center">
          <span className="eyebrow">AURELIA MENU</span>
          <h1 className="menu-header__title">Our Culinary Collection</h1>
          <p className="menu-header__subtitle">
            Thoughtfully prepared dishes designed for memorable occasions.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </div>
      </header>

      {/* ── Filter & Search Controls ────────────────────────────────────── */}
      <section className="menu-controls-section" aria-label="Menu filters and search">
        <div className="container">
          <div className="menu-controls-card card">
            {/* Search Row */}
            <div className="menu-search-row">
              <div className="menu-search-input-wrapper">
                <svg
                  className="menu-search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="menu-search-input"
                  placeholder="Search our menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search our menu"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="menu-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    &times;
                  </button>
                )}
              </div>

              <div className="menu-results-count">
                Showing <strong>{filteredItems.length}</strong> {filteredItems.length === 1 ? "dish" : "dishes"}
              </div>
            </div>

            {/* Category Tabs */}
            {categories.length > 1 && (
              <div className="menu-category-tabs" role="tablist" aria-label="Filter by category">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    className={`menu-category-tab ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Dietary Filter Pills */}
            {availableDietaryTags.length > 0 && (
              <div className="menu-dietary-row">
                <span className="menu-dietary-label">Dietary:</span>
                <div className="menu-dietary-pills">
                  {availableDietaryTags.map((tag) => {
                    const isSelected = selectedDietary.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`menu-dietary-pill ${isSelected ? "active" : ""}`}
                        onClick={() => toggleDietaryTag(tag)}
                        aria-pressed={isSelected}
                      >
                        {isSelected && <span className="menu-dietary-check">&#10003; </span>}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {(selectedCategory !== "All" || selectedDietary.length > 0 || searchQuery) && (
                  <button
                    type="button"
                    className="menu-clear-filters-btn"
                    onClick={handleResetFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Culinary Catalog Grid ───────────────────────────────────────── */}
      <main className="section bg-surface menu-catalog-section" id="menu-catalog">
        <div className="container">
          {error && (
            <div className="mb-6 p-4 text-center text-xs text-muted" role="status">
              Serving our offline seasonal tasting selection ({error}).
            </div>
          )}

          {loading ? (
            <div className="menu-loading-state card text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-muted">Curating our seasonal menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="menu-empty-state card text-center">
              <div className="menu-empty-icon">&#127869;</div>
              <h3 className="menu-empty-title">No dishes match your selection</h3>
              <p className="text-muted mt-2">
                Try adjusting your search keywords or dietary filters.
              </p>
              <button
                type="button"
                className="btn gold mt-4"
                onClick={handleResetFilters}
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="menu-catalog-grid">
              {filteredItems.map((item) => {
                const isAdded = Boolean(recentlyAdded[item.id]);
                const imgSrc = getDishImage(item);
                const formattedPrice =
                  typeof item.price === "number"
                    ? `Rs. ${item.price.toLocaleString("en-LK")}`
                    : `Rs. ${item.price}`;

                return (
                  <article key={item.id} className="menu-catalog-card card">
                    {/* 4:3 Image Container */}
                    <div className="menu-catalog-card__media img-placeholder aspect-4-3">
                      <img
                        src={imgSrc}
                        alt={item.name}
                        className="menu-catalog-card__image"
                        loading="lazy"
                      />
                      {item.category && (
                        <span className="menu-catalog-card__cat-badge">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div className="menu-catalog-card__body">
                      <div className="menu-catalog-card__header">
                        <h2 className="menu-catalog-card__title">{item.name}</h2>
                        <span className="menu-catalog-card__price">
                          {formattedPrice}
                        </span>
                      </div>

                      <p className="menu-catalog-card__desc">{item.description}</p>

                      {item.dietaryTags && (
                        <div className="menu-catalog-card__tags">
                          {item.dietaryTags.split(/[,·•]/).map((t, i) => (
                            <span key={i} className="badge badge--available">
                              {t.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="menu-catalog-card__footer">
                        <button
                          type="button"
                          className={`btn menu-add-btn ${isAdded ? "btn--added" : "gold"}`}
                          onClick={() => handleAddToOrder(item)}
                          aria-label={`Add ${item.name} to order`}
                        >
                          {isAdded ? (
                            <>
                              <span className="add-check">&#10003;</span> Added to Order
                            </>
                          ) : (
                            "+ Add to Order"
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Cart Drawer — controlled locally so MenuPage stays self-contained */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
