import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { useAuth } from "../AuthContext";
import { createGuestOrder } from "../api/orderApi";
import { getCateringPackages } from "../api/cateringPackageApi";
import { getPackageMenuItems } from "../api/packageMenuItemApi";

const EVENT_TYPES = [
  "Wedding",
  "Corporate",
  "Private Celebration",
  "Birthday",
  "Other",
];

function getDishImage(item) {
  if (item.image) return item.image;
  const name = (item.name || "").toLowerCase();
  const cat  = (item.category || "").toLowerCase();
  if (name.includes("salmon") || name.includes("fish") || name.includes("sea bass")) {
    return "/images/menu/salmon.jpg";
  }
  if (name.includes("chocolate") || name.includes("tart") || cat.includes("dessert")) {
    return "/images/menu/chocolate.jpg";
  }
  if (cat.includes("canapé") || cat.includes("appetizer") || name.includes("burrata")) {
    return "/images/menu/atelier.jpg";
  }
  return "/images/menu/lamb.jpg";
}

function formatPrice(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
}

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  email: "",
  packageId: "",
  eventType: "",
  eventDate: "",
  startTime: "",
  venue: "",
  guestCount: "",
  specialRequests: "",
};

export default function EventBookingPage() {
  const { user } = useAuth();
  const { cartItems, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Package passed via React Router state (e.g. from PackagesPage)
  const initialPackageId = location.state?.packageId ? String(location.state.packageId) : "";

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    packageId: initialPackageId,
  });

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageMenuItems, setPackageMenuItems] = useState([]);
  const [loadingPackageMenu, setLoadingPackageMenu] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdEvent, setCreatedEvent] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [errors, setErrors] = useState({});

  // 1. Load available catering packages from API
  useEffect(() => {
    async function loadPackages() {
      setLoadingPackages(true);
      try {
        const data = await getCateringPackages();
        if (Array.isArray(data)) {
          setPackages(data);
          // If initial package wasn't set and packages exist, default to initial if state had it
          if (initialPackageId && !form.packageId) {
            setForm((prev) => ({ ...prev, packageId: initialPackageId }));
          }
        }
      } catch (err) {
        console.error("Failed to load packages:", err);
      } finally {
        setLoadingPackages(false);
      }
    }
    loadPackages();
  }, [initialPackageId]);

  // 2. Fetch menu items for currently selected package (PACKAGE_MENU_ITEM relationship)
  useEffect(() => {
    async function loadPackageItems() {
      const pkgId = parseInt(form.packageId, 10);
      if (!pkgId || isNaN(pkgId)) {
        setPackageMenuItems([]);
        return;
      }
      setLoadingPackageMenu(true);
      try {
        const items = await getPackageMenuItems(pkgId);
        setPackageMenuItems(Array.isArray(items) ? items : []);
      } catch {
        setPackageMenuItems([]);
      } finally {
        setLoadingPackageMenu(false);
      }
    }
    loadPackageItems();
  }, [form.packageId]);

  // Populate user data if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.fullName || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Selected package object derived from state
  const selectedPackage = useMemo(() => {
    if (!form.packageId) return null;
    return packages.find(
      (p) => String(p.id || p.packageId) === String(form.packageId)
    ) || null;
  }, [packages, form.packageId]);

  // Today's date string for min-date on date input
  const today = new Date().toISOString().split("T")[0];

  /** Build a human-readable cart summary for orders.special_requests */
  function buildCartSummary() {
    if (!cartItems || cartItems.length === 0) return "";
    const lines = cartItems.map(
      (item) =>
        `${item.name} \u00d7${item.quantity || 1}` +
        ` (Rs. ${Number((item.price || 0) * (item.quantity || 1)).toLocaleString("en-LK")})`
    );
    return (
      "A la carte Menu selections:\n" +
      lines.join("\n") +
      `\nCart subtotal: Rs. ${Number(subtotal || 0).toLocaleString("en-LK")}`
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.customerName.trim() && !user?.fullName) {
      newErrors.customerName = "Please enter your name.";
    }
    if (!form.email.trim() && !user?.email) {
      newErrors.email = "Please enter your email.";
    } else if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim() && !user?.phone) {
      newErrors.phone = "Please enter your phone number.";
    }
    if (!form.eventType)            newErrors.eventType    = "Please select an event type.";
    if (!form.eventDate)            newErrors.eventDate    = "Please select an event date.";
    if (!form.venue.trim())         newErrors.venue        = "Please enter the venue / delivery location.";
    if (!form.guestCount || Number(form.guestCount) < 1) {
      newErrors.guestCount = "Guest count must be greater than 0.";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorEl = document.querySelector(".booking-field--error input, .booking-field--error select, .booking-field--error textarea");
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    // Build special_requests: guest text + cart summary + package + time
    const cartSummary  = buildCartSummary();
    const guestNote    = form.specialRequests.trim();
    const specialParts = [];
    if (guestNote)    specialParts.push(guestNote);
    if (cartSummary)  specialParts.push(cartSummary);
    if (selectedPackage) specialParts.push(`Package: ${selectedPackage.packageName || selectedPackage.name}`);
    if (form.startTime) specialParts.push(`Meal Service Time: ${form.startTime}`);
    const fullSpecialRequests = specialParts.join("\n\n") || null;

    try {
      const guestOrderPayload = {
        name: form.customerName.trim() || user?.fullName || user?.name || "Guest Customer",
        phone: form.phone.trim() || user?.phone || "N/A",
        email: form.email.trim() || user?.email || "guest@aurelia.lk",
        packageId: form.packageId ? parseInt(form.packageId, 10) : null,
        specialRequests: fullSpecialRequests,
        eventDate: form.eventDate,
        location: form.venue.trim(),
        guestCount: parseInt(form.guestCount, 10),
        eventType: form.eventType,
        startTime: form.startTime,
        // Save selected menu items to ORDER_MENU_ITEM
        menuItems: cartItems.map((item) => ({
          menuItemId: parseInt(item.id, 10),
          quantity: parseInt(item.quantity, 10) || 1,
        })),
      };

      const result = await createGuestOrder(guestOrderPayload);
      setCreatedOrder(result);
      setCreatedEvent({ id: result.eventId, customerName: guestOrderPayload.name });
      if (clearCart) clearCart();
      setSubmitted(true);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(
        "Unable to submit your order. Please check your details and try again. (" + (err.message || "Error") + ")"
      );
      setSubmitting(false);
    }
  }

  /* ── Confirmation Screen ─────────────────────────────────────── */
  if (submitted) {
    const orderId = createdOrder?.orderId || createdOrder?.id;
    return (
      <div className="booking-page-wrapper">
        <Navbar />
        <main className="booking-confirm-screen section">
          <div className="container booking-confirm-inner">
            <div className="booking-confirm-card card">
              <div className="booking-confirm-icon" aria-hidden="true">&#10003;</div>
              <span className="eyebrow">Catering Booking Received</span>
              <h1 className="booking-confirm-title">
                Your catering order has been submitted successfully!
              </h1>
              <p className="booking-confirm-desc">
                Our catering culinary team will review your selection and prepare
                your quotation. You can track preparation and status live using your Order ID.
              </p>

              {/* Customer Portal Auto-Created Account Notice */}
              <div
                className="booking-account-alert"
                style={{
                  margin: "1.5rem 0",
                  padding: "1.25rem 1.5rem",
                  background: "rgba(212, 175, 55, 0.08)",
                  border: "1px solid var(--gold, #d4af37)",
                  borderRadius: "8px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>&#128274;</span>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--gold, #d4af37)", fontWeight: 700 }}>
                    {createdOrder?.accountCreated !== false
                      ? "Customer Portal Account Created"
                      : "Customer Portal Access"}
                  </h3>
                </div>
                <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--muted, #ccc)", lineHeight: 1.5 }}>
                  {createdOrder?.accountCreated !== false
                    ? "Your customer portal account has been created. You can log in using your registered email and phone number to review quotations, accept/reject proposals, and monitor banquet orders."
                    : "Your order is linked to your existing customer account. You can log in to your portal to review quotations and manage your events."}
                </p>
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    padding: "0.75rem 1rem",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    borderLeft: "3px solid var(--gold, #d4af37)",
                  }}
                >
                  <div style={{ marginBottom: "0.35rem" }}>
                    <span style={{ color: "var(--muted, #aaa)" }}>Username: </span>
                    <strong style={{ color: "#fff" }}>
                      {createdOrder?.username || form.email || "Your registered email"}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted, #aaa)" }}>Initial password: </span>
                    <strong style={{ color: "var(--gold, #d4af37)" }}>
                      {createdOrder?.accountCreated !== false
                        ? (createdOrder?.initialPassword || form.phone || "Your registered phone number")
                        : "Your existing password"}
                    </strong>
                  </div>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <Link to="/login" className="btn gold sm" style={{ textDecoration: "none", display: "inline-block" }}>
                    Sign In to Customer Portal &rarr;
                  </Link>
                </div>
              </div>

              <div className="booking-confirm-summary">
                {orderId && (
                  <p className="booking-confirm-summary__row">
                    <span>Order Reference ID</span>
                    <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--gold, #B8922A)" }}>
                      #{orderId}
                    </span>
                  </p>
                )}
                {createdEvent?.id && (
                  <p className="booking-confirm-summary__row">
                    <span>Event Reference</span>
                    <span style={{ fontWeight: 600, color: "var(--gold, #B8922A)" }}>
                      Event #{createdEvent.id}
                    </span>
                  </p>
                )}
                <p className="booking-confirm-summary__row">
                  <span>Customer Name</span>
                  <span>{form.customerName}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Contact Email</span>
                  <span>{form.email}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Contact Phone</span>
                  <span>{form.phone}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Occasion Type</span>
                  <span>{form.eventType}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Catering Date</span>
                  <span>{form.eventDate}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Venue / Location</span>
                  <span>{form.venue}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Meal Portions (Guests)</span>
                  <span>{form.guestCount}</span>
                </p>
                <p className="booking-confirm-summary__row">
                  <span>Status</span>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>
                    {createdOrder?.status || "Pending Verification"}
                  </span>
                </p>
                {selectedPackage && (
                  <p className="booking-confirm-summary__row">
                    <span>Selected Package</span>
                    <span>{selectedPackage.packageName || selectedPackage.name}</span>
                  </p>
                )}
                {subtotal > 0 && (
                  <p className="booking-confirm-summary__row booking-confirm-summary__row--total">
                    <span>Estimated A la carte Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </p>
                )}
              </div>

              <div className="booking-confirm-actions">
                {orderId && (
                  <Link to={`/track?id=${orderId}`} className="btn gold">
                    Track Order #{orderId} &rarr;
                  </Link>
                )}
                <Link to="/menu" className="btn secondary">
                  Browse Menu
                </Link>
                <Link to="/" className="btn outline sm">
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ── Main Booking Form ───────────────────────────────────────── */
  return (
    <div className="booking-page-wrapper">
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────── */}
      <header className="booking-page-header">
        <div className="container text-center">
          <span className="eyebrow">AURELIA CATERING BOOKING</span>
          <h1 className="booking-page-header__title">Your Catering Booking</h1>
          <p className="booking-page-header__subtitle">
            Select your catering package or menu items and provide your event schedule and contact details.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </div>
      </header>

      {/* ── Two-Column Layout ────────────────────────────────── */}
      <main className="section booking-main" id="booking-form">
        <div className="container">

          {cartItems.length === 0 && !selectedPackage && (
            <div className="booking-empty-cart card text-center mb-8" style={{ padding: "1.5rem", borderRadius: "10px", background: "#fff", marginBottom: "2rem" }}>
              <p className="text-muted" style={{ margin: 0 }}>You can select a signature catering package below, or choose à la carte dishes from our menu.</p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
                <Link to="/packages" className="btn gold sm">
                  Browse Signature Packages
                </Link>
                <Link to="/menu" className="btn outline sm">
                  Browse Menu
                </Link>
              </div>
            </div>
          )}

          <div className="booking-layout">

            {/* ── Left: Order Summary ──────────────────────── */}
            <aside className="booking-summary-panel">
              <div className="card booking-summary-card">
                <h2 className="booking-summary__title">Catering Order Summary</h2>
                <div className="gold-rule mb-5"></div>

                {/* Selected Package Banner */}
                {selectedPackage ? (
                  <div
                    className="mb-4"
                    style={{
                      padding: "14px 16px",
                      background: "rgba(184, 146, 42, 0.08)",
                      border: "1px solid rgba(184, 146, 42, 0.3)",
                      borderRadius: "8px",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <span style={{ color: "var(--gold, #B8922A)", fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase" }}>
                        📦 Selected Package
                      </span>
                      {selectedPackage.price && (
                        <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "0.95rem" }}>
                          {formatPrice(selectedPackage.price)} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted, #5A655C)" }}>/ guest</span>
                        </strong>
                      )}
                    </div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--forest-dark, #1B301D)" }}>
                      {selectedPackage.packageName || selectedPackage.name}
                    </div>
                    {selectedPackage.description && (
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted, #5A655C)", lineHeight: 1.4 }}>
                        {selectedPackage.description}
                      </p>
                    )}

                    {/* Estimated Package Total based on Guest Count */}
                    {form.guestCount && Number(form.guestCount) > 0 && selectedPackage.price && (
                      <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(184, 146, 42, 0.3)", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                        <span>Package Subtotal ({form.guestCount} guests):</span>
                        <strong>{formatPrice(Number(selectedPackage.price) * Number(form.guestCount))}</strong>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#F9FBF8", border: "1px solid #E6ECE5", borderRadius: "8px", marginBottom: "1.25rem", fontSize: "0.85rem", color: "var(--text-muted, #5A655C)" }}>
                    No signature package selected (Custom / À la carte order).
                  </div>
                )}

                {/* Package Inclusions (PACKAGE_MENU_ITEM) */}
                {selectedPackage && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span style={{ display: "block", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: 700, color: "var(--forest-dark, #1B301D)", marginBottom: "6px" }}>
                      Package Menu Inclusions
                    </span>
                    {loadingPackageMenu ? (
                      <p className="text-muted text-xs">Loading package menu...</p>
                    ) : packageMenuItems.length > 0 ? (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {packageMenuItems.map((pmi, idx) => (
                          <li
                            key={pmi.menuItemId || pmi.id || idx}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.85rem",
                              padding: "4px 0",
                              borderBottom: "1px solid #F3F4F6",
                              color: "var(--forest-dark, #1B301D)",
                            }}
                          >
                            <span>✓ {pmi.menuItemName || `Dish #${pmi.menuItemId}`}</span>
                            {pmi.menuItemCategory && (
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #5A655C)" }}>
                                {pmi.menuItemCategory}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted text-xs" style={{ margin: 0 }}>Includes multi-course catering menu.</p>
                    )}
                  </div>
                )}

                {/* Selected À la carte Dishes from Cart */}
                {cartItems.length > 0 && (
                  <>
                    <h3 style={{ fontSize: "0.9rem", textTransform: "uppercase", fontWeight: 700, color: "var(--forest-dark, #1B301D)", marginBottom: "8px" }}>
                      À la Carte Additions
                    </h3>
                    <ul className="booking-summary-list">
                      {cartItems.map((item) => {
                        const lineTotal = (Number(item.price) || 0) * (item.quantity || 1);
                        return (
                          <li key={item.id} className="booking-summary-item">
                            <div className="booking-summary-item__media">
                              <img
                                src={getDishImage(item)}
                                alt={item.name}
                                className="booking-summary-item__img"
                                loading="lazy"
                              />
                            </div>
                            <div className="booking-summary-item__info">
                              <span className="booking-summary-item__name">{item.name}</span>
                              <span className="booking-summary-item__meta">
                                {formatPrice(item.price)} &times; {item.quantity}
                              </span>
                            </div>
                            <span className="booking-summary-item__total">
                              {formatPrice(lineTotal)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <div className="booking-summary-subtotal">
                      <span className="booking-summary-subtotal__label">À la Carte Subtotal</span>
                      <span className="booking-summary-subtotal__value">{formatPrice(subtotal)}</span>
                    </div>
                  </>
                )}

                <p className="booking-summary-subtotal__note" style={{ marginTop: "1rem" }}>
                  Final pricing includes culinary preparation, tableware &amp; service.
                  Our catering team will prepare and send a formal quotation.
                </p>

                <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
                  <Link to="/packages" className="booking-summary-edit-link" style={{ fontSize: "0.85rem" }}>
                    &#8592; Packages
                  </Link>
                  <Link to="/menu" className="booking-summary-edit-link" style={{ fontSize: "0.85rem" }}>
                    &#8592; Menu Items
                  </Link>
                </div>
              </div>
            </aside>

            {/* ── Right: Event Details Form ────────────────── */}
            <section className="booking-form-panel">
              <div className="card booking-form-card">
                <h2 className="booking-form__title">Guest &amp; Event Details</h2>
                <div className="gold-rule mb-6"></div>

                {/* Guest Booking Context Banner */}
                {user ? (
                  <div className="booking-auth-banner booking-auth-banner--signed-in mb-6">
                    <span className="booking-auth-icon" aria-hidden="true">&#10003;</span>
                    <div>
                      <strong className="booking-auth-name">Booking as {user.fullName || user.email}</strong>
                      <span className="booking-auth-meta">Your catering booking will be processed and assigned an Order ID for instant tracking.</span>
                    </div>
                  </div>
                ) : (
                  <div className="booking-auth-banner mb-6">
                    <span className="booking-auth-icon" aria-hidden="true">&#10003;</span>
                    <div className="booking-auth-text">
                      <strong style={{ display: "block", color: "var(--forest-dark, #1B301D)" }}>Guest Booking — No Account Required</strong>
                      <span className="booking-auth-meta">
                        You will receive an instant Order Reference ID upon submission to track your catering reservation anytime on our tracking portal.
                      </span>
                    </div>
                  </div>
                )}

                <form
                  id="event-booking-form"
                  className="booking-form"
                  onSubmit={handleSubmit}
                  noValidate
                  aria-label="Catering booking form"
                >
                  {/* Submit Error Banner */}
                  {submitError && (
                    <div
                      className="booking-error-banner card mb-6"
                      role="alert"
                      style={{
                        padding: "12px 16px",
                        background: "rgba(220, 38, 38, 0.1)",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        borderRadius: "8px",
                        fontSize: "0.95rem"
                      }}
                    >
                      <strong>Submission Error: </strong> {submitError}
                    </div>
                  )}

                  {/* Customer / Contact Name */}
                  <div className={`booking-field${errors.customerName ? " booking-field--error" : ""}`}>
                    <label className="booking-label" htmlFor="customerName">
                      Your Full Name <span className="booking-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      className="booking-input"
                      placeholder="e.g. Lady Eleanor Vance"
                      value={form.customerName}
                      onChange={handleChange}
                      aria-required="true"
                      aria-describedby={errors.customerName ? "customerName-error" : undefined}
                    />
                    {errors.customerName && (
                      <span id="customerName-error" className="booking-error" role="alert">
                        {errors.customerName}
                      </span>
                    )}
                  </div>

                  {/* Email + Phone row */}
                  <div className="booking-row">
                    <div className={`booking-field${errors.email ? " booking-field--error" : ""}`}>
                      <label className="booking-label" htmlFor="email">
                        Email Address <span className="booking-required" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="booking-input"
                        placeholder="e.g. eleanor@example.com"
                        value={form.email}
                        onChange={handleChange}
                        aria-required="true"
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                      {errors.email && (
                        <span id="email-error" className="booking-error" role="alert">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    <div className={`booking-field${errors.phone ? " booking-field--error" : ""}`}>
                      <label className="booking-label" htmlFor="phone">
                        Phone Number <span className="booking-required" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="booking-input"
                        placeholder="e.g. +94 77 123 4567"
                        value={form.phone}
                        onChange={handleChange}
                        aria-required="true"
                        aria-describedby={errors.phone ? "phone-error" : undefined}
                      />
                      {errors.phone && (
                        <span id="phone-error" className="booking-error" role="alert">
                          {errors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Catering Package Selection */}
                  <div className="booking-field">
                    <label className="booking-label" htmlFor="packageId">
                      Catering Package (Optional / Custom)
                    </label>
                    <select
                      id="packageId"
                      name="packageId"
                      className="booking-select"
                      value={form.packageId}
                      onChange={handleChange}
                    >
                      <option value="">Select a package or choose à la carte&hellip;</option>
                      {packages.map((pkg) => {
                        const pId = pkg.id || pkg.packageId;
                        const pName = pkg.packageName || pkg.name;
                        const pPrice = pkg.price ? ` — Rs. ${Number(pkg.price).toLocaleString("en-LK")} / person` : "";
                        return (
                          <option key={pId} value={pId}>
                            {pName}{pPrice}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Event Type */}
                  <div className={`booking-field${errors.eventType ? " booking-field--error" : ""}`}>
                    <label className="booking-label" htmlFor="eventType">
                      Occasion / Event Type <span className="booking-required" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="eventType"
                      name="eventType"
                      className="booking-select"
                      value={form.eventType}
                      onChange={handleChange}
                      aria-required="true"
                      aria-describedby={errors.eventType ? "eventType-error" : undefined}
                    >
                      <option value="">Select occasion type&hellip;</option>
                      {EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {errors.eventType && (
                      <span id="eventType-error" className="booking-error" role="alert">
                        {errors.eventType}
                      </span>
                    )}
                  </div>

                  {/* Date + Time row */}
                  <div className="booking-row">
                    <div className={`booking-field${errors.eventDate ? " booking-field--error" : ""}`}>
                      <label className="booking-label" htmlFor="eventDate">
                        Catering Service Date <span className="booking-required" aria-hidden="true">*</span>
                      </label>
                      <input
                        type="date"
                        id="eventDate"
                        name="eventDate"
                        className="booking-input"
                        value={form.eventDate}
                        onChange={handleChange}
                        min={today}
                        aria-required="true"
                        aria-describedby={errors.eventDate ? "eventDate-error" : undefined}
                      />
                      {errors.eventDate && (
                        <span id="eventDate-error" className="booking-error" role="alert">
                          {errors.eventDate}
                        </span>
                      )}
                    </div>

                    <div className="booking-field">
                      <label className="booking-label" htmlFor="startTime">
                        Meal Service Time (Optional)
                      </label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        className="booking-input"
                        value={form.startTime}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Venue */}
                  <div className={`booking-field${errors.venue ? " booking-field--error" : ""}`}>
                    <label className="booking-label" htmlFor="venue">
                      Venue / Delivery Location <span className="booking-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="text"
                      id="venue"
                      name="venue"
                      className="booking-input"
                      placeholder="e.g. The Grand Ballroom, Cinnamon Grand, Colombo"
                      value={form.venue}
                      onChange={handleChange}
                      aria-required="true"
                      aria-describedby={errors.venue ? "venue-error" : undefined}
                    />
                    {errors.venue && (
                      <span id="venue-error" className="booking-error" role="alert">
                        {errors.venue}
                      </span>
                    )}
                  </div>

                  {/* Guest Count */}
                  <div className={`booking-field${errors.guestCount ? " booking-field--error" : ""}`}>
                    <label className="booking-label" htmlFor="guestCount">
                      Guest Count (Meal Portions) <span className="booking-required" aria-hidden="true">*</span>
                    </label>
                    <input
                      type="number"
                      id="guestCount"
                      name="guestCount"
                      className="booking-input"
                      placeholder="e.g. 120"
                      value={form.guestCount}
                      onChange={handleChange}
                      min="1"
                      max="5000"
                      aria-required="true"
                      aria-describedby={errors.guestCount ? "guestCount-error" : undefined}
                    />
                    {errors.guestCount && (
                      <span id="guestCount-error" className="booking-error" role="alert">
                        {errors.guestCount}
                      </span>
                    )}
                  </div>

                  {/* Special Requests */}
                  <div className="booking-field">
                    <label className="booking-label" htmlFor="specialRequests">
                      Dietary Requirements &amp; Special Requests
                    </label>
                    <textarea
                      id="specialRequests"
                      name="specialRequests"
                      className="booking-textarea"
                      placeholder="Dietary requirements (Halal, Vegan, Gluten-Free), service style, or menu adjustments&hellip;"
                      value={form.specialRequests}
                      onChange={handleChange}
                      rows={4}
                    />
                  </div>

                  {/* Submit */}
                  <div className="booking-form-actions">
                    <button
                      type="submit"
                      className="btn gold booking-submit-btn"
                      id="submit-event-booking"
                      disabled={submitting}
                      style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                    >
                      {submitting ? "Submitting Catering Booking..." : "Submit Catering Booking \u2192"}
                    </button>
                    <button
                      type="button"
                      className="btn outline sm"
                      onClick={() => navigate(-1)}
                      disabled={submitting}
                    >
                      Back
                    </button>
                  </div>

                  <p className="booking-form-disclaimer">
                    Your booking request will be logged directly into our system. Our catering team will
                    review your requirements and prepare a formal quotation for your confirmation.
                  </p>
                </form>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
