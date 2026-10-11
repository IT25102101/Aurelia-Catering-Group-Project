import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/common/ScrollReveal";

const EVENT_TYPES = [
  "Wedding",
  "Corporate",
  "Private Celebration",
  "Gala / Special Event",
  "Other",
];

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  guestCount: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Today's date string for min date
  const today = new Date().toISOString().split("T")[0];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }

  function validate() {
    const newErrors = {};
    if (!form.fullName.trim()) {
      newErrors.fullName = "Please provide your full name.";
    }
    if (!form.email.trim()) {
      newErrors.email = "Please provide your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) {
      newErrors.message = "Please write your message or enquiry details.";
    }
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrorEl = document.querySelector(".contact-field--error input, .contact-field--error textarea");
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    // Simulate swift client-side submission without backend dependency
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      window.scrollTo({ top: 200, behavior: "smooth" });
    }, 600);
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(false);
  }

  return (
    <div className="contact-page-wrapper">
      <Navbar />

      {/* ── Page Hero ────────────────────────────────────────── */}
      <header className="contact-header">
        <ScrollReveal variant="fade-up" className="container text-center">
          <span className="eyebrow">AURELIA CONTACT</span>
          <h1 className="contact-header__title">Let&rsquo;s plan something memorable.</h1>
          <p className="contact-header__subtitle">
            Tell us about your celebration and our team will help shape the perfect catering experience.
          </p>
          <div className="gold-rule mx-auto mt-4"></div>
        </ScrollReveal>
      </header>

      {/* ── Main Two-Column Section ──────────────────────────── */}
      <main className="section bg-surface contact-main-section" id="contact-content">
        <div className="container">
          <div className="contact-layout">

            {/* ── Left Column: Contact Information & Location ── */}
            <ScrollReveal as="aside" variant="fade-up" className="contact-info-panel">
              <div className="contact-info-card card">
                <span className="eyebrow">GET IN TOUCH</span>
                <h2 className="contact-info__title mt-2">Atelier &amp; Concierge</h2>
                <div className="gold-rule mb-6"></div>

                <div className="contact-details-list">
                  {/* Address */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon" aria-hidden="true">&#128205;</div>
                    <div className="contact-detail-body">
                      <strong className="contact-detail-label">Kitchen &amp; Tasting Salon</strong>
                      <p className="contact-detail-text">
                        124 Heritage Grand Boulevard<br />
                        Metropolitan Arts District, Colombo
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon" aria-hidden="true">&#9993;</div>
                    <div className="contact-detail-body">
                      <strong className="contact-detail-label">Concierge Email</strong>
                      <a href="mailto:events@aureliacatering.com" className="contact-detail-link">
                        events@aureliacatering.com
                      </a>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon" aria-hidden="true">&#128222;</div>
                    <div className="contact-detail-body">
                      <strong className="contact-detail-label">Direct Line</strong>
                      <a href="tel:+15552345678" className="contact-detail-link">
                        +1 (555) 234-5678
                      </a>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="contact-detail-item">
                    <div className="contact-detail-icon" aria-hidden="true">&#128337;</div>
                    <div className="contact-detail-body">
                      <strong className="contact-detail-label">Consultation Hours</strong>
                      <p className="contact-detail-text">
                        Monday &ndash; Saturday: 9:00 AM &ndash; 7:00 PM<br />
                        <span className="text-xs text-muted">Sunday: Private tastings by appointment</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Visual Placeholder */}
                <div className="contact-location-frame mt-8">
                  <div className="contact-location-inner">
                    <span className="contact-location-pin" aria-hidden="true">&#127963;</span>
                    <strong className="contact-location-name">Aurelia Culinary Atelier</strong>
                    <span className="contact-location-sub">Central Tasting Salon &amp; Event Kitchen</span>
                  </div>
                </div>

                {/* Quick Navigation Action Links */}
                <div className="contact-quick-actions mt-8">
                  <span className="contact-actions-label">Explore More</span>
                  <div className="contact-action-links">
                    <Link to="/menu" className="contact-action-link">
                      &rarr; Explore Our Menu
                    </Link>
                    <Link to="/packages" className="contact-action-link">
                      &rarr; View Catering Packages
                    </Link>
                    <Link to="/event-booking" className="contact-action-link">
                      &rarr; Plan Your Event
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* ── Right Column: Enquiry Form ──────────────────── */}
            <ScrollReveal as="section" variant="fade-up" delay={120} className="contact-form-panel">
              <div className="contact-form-card card">
                <span className="eyebrow">DIRECT INQUIRY</span>
                <h2 className="contact-form__title mt-2">Send an Enquiry</h2>
                <div className="gold-rule mb-6"></div>

                {submitted ? (
                  <div className="contact-success-card text-center" role="status">
                    <div className="contact-success-icon" aria-hidden="true">&#10003;</div>
                    <h3 className="contact-success-title">Thank You</h3>
                    <p className="contact-success-desc">
                      Your enquiry has been received. Our concierge and events team will be in touch within 24 hours to discuss your celebration.
                    </p>
                    <div className="contact-success-actions mt-6">
                      <button
                        type="button"
                        className="btn outline sm"
                        onClick={handleReset}
                      >
                        Send Another Enquiry
                      </button>
                      <Link to="/menu" className="btn gold sm">
                        Browse Our Menu &rarr;
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form
                    id="contact-enquiry-form"
                    className="contact-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-label="Catering inquiry form"
                  >
                    {/* Full Name & Email */}
                    <div className="contact-row">
                      <div className={`booking-field${errors.fullName ? " contact-field--error" : ""}`}>
                        <label className="booking-label" htmlFor="fullName">
                          Full Name <span className="booking-required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          className="booking-input"
                          placeholder="Your name"
                          value={form.fullName}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          aria-required="true"
                          aria-describedby={errors.fullName ? "fullName-error" : undefined}
                        />
                        {errors.fullName && (
                          <span id="fullName-error" className="booking-error" role="alert">
                            {errors.fullName}
                          </span>
                        )}
                      </div>

                      <div className={`booking-field${errors.email ? " contact-field--error" : ""}`}>
                        <label className="booking-label" htmlFor="email">
                          Email Address <span className="booking-required" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="booking-input"
                          placeholder="name@example.com"
                          value={form.email}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          aria-required="true"
                          aria-describedby={errors.email ? "email-error" : undefined}
                        />
                        {errors.email && (
                          <span id="email-error" className="booking-error" role="alert">
                            {errors.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone & Event Type */}
                    <div className="contact-row">
                      <div className="booking-field">
                        <label className="booking-label" htmlFor="phone">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className="booking-input"
                          placeholder="+1 (555) 000-0000"
                          value={form.phone}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>

                      <div className="booking-field">
                        <label className="booking-label" htmlFor="eventType">
                          Event Type
                        </label>
                        <select
                          id="eventType"
                          name="eventType"
                          className="booking-select"
                          value={form.eventType}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          <option value="">Select celebration style&hellip;</option>
                          {EVENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Preferred Date & Guest Count */}
                    <div className="contact-row">
                      <div className="booking-field">
                        <label className="booking-label" htmlFor="eventDate">
                          Preferred Event Date
                        </label>
                        <input
                          id="eventDate"
                          name="eventDate"
                          type="date"
                          className="booking-input"
                          value={form.eventDate}
                          onChange={handleChange}
                          min={today}
                          disabled={loading}
                        />
                      </div>

                      <div className="booking-field">
                        <label className="booking-label" htmlFor="guestCount">
                          Estimated Guests
                        </label>
                        <input
                          id="guestCount"
                          name="guestCount"
                          type="number"
                          className="booking-input"
                          placeholder="e.g. 80"
                          value={form.guestCount}
                          onChange={handleChange}
                          min="1"
                          max="5000"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="booking-field">
                      <label className="booking-label" htmlFor="subject">
                        Subject
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        className="booking-input"
                        placeholder="e.g. Wedding Catering Consultation"
                        value={form.subject}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>

                    {/* Message */}
                    <div className={`booking-field${errors.message ? " contact-field--error" : ""}`}>
                      <label className="booking-label" htmlFor="message">
                        Message &amp; Celebration Details <span className="booking-required" aria-hidden="true">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        className="booking-textarea"
                        rows={5}
                        placeholder="Tell us about your venue, preferred style of dining, dietary preferences, or any specific requirements&hellip;"
                        value={form.message}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        aria-required="true"
                        aria-describedby={errors.message ? "message-error" : undefined}
                      />
                      {errors.message && (
                        <span id="message-error" className="booking-error" role="alert">
                          {errors.message}
                        </span>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="contact-form-footer pt-3">
                      <button
                        type="submit"
                        className="btn gold contact-submit-btn"
                        disabled={loading}
                      >
                        {loading ? "Sending Inquiry\u2026" : "Send Inquiry \u2192"}
                      </button>
                    </div>

                    <p className="contact-disclaimer text-xs text-muted mt-4 mb-0">
                      We respect your privacy. Your information is used strictly to respond to your catering inquiry.
                    </p>
                  </form>
                )}
              </div>
            </ScrollReveal>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
