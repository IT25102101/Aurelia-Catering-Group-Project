import { Link } from "react-router-dom";

/**
 * Aurelia Catering & Events — Global Footer Component
 *
 * Sections:
 * 1. Brand statement & mission
 * 2. Quick navigation links
 * 3. Catering services overview
 * 4. Curated contact & location details
 * 5. Social channels & bottom copyright bar
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__container">
        {/* Brand Column */}
        <div className="footer__col footer__col--brand">
          <Link to="/" className="brand footer__brand">
            <span className="brand-title">AURELIA</span>
            <span className="brand-subtitle">Artisanal Catering</span>
          </Link>
          <p className="footer__tagline">
            &ldquo;Crafted for moments worth savoring.&rdquo;
          </p>
          <p className="footer__desc">
            Bespoke culinary experiences, chef-crafted menus, and professional
            catering services for weddings, banquets, and private celebrations.
          </p>
          <div className="footer__socials">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="social-link"
              aria-label="Instagram"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="social-link"
              aria-label="Facebook"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="social-link"
              aria-label="Pinterest"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="social-link"
              aria-label="LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer__col">
          <h4 className="footer__heading">Quick Navigation</h4>
          <ul className="footer__links">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/packages">Catering Packages</Link>
            </li>
            <li>
              <Link to="/menu">Curated Food Menu</Link>
            </li>
            <li>
              <Link to="/events">Catering Occasions</Link>
            </li>
            <li>
              <Link to="/about">About Aurelia</Link>
            </li>
            <li>
              <Link to="/contact">Contact &amp; Inquiries</Link>
            </li>
            <li>
              <Link to="/track">Track Your Order</Link>
            </li>
          </ul>
        </div>

        {/* Catering Services Column */}
        <div className="footer__col">
          <h4 className="footer__heading">Catering Services</h4>
          <ul className="footer__links">
            <li>
              <Link to="/packages">Luxury Wedding Catering</Link>
            </li>
            <li>
              <Link to="/packages">Corporate Banquets</Link>
            </li>
            <li>
              <Link to="/packages">Private Celebrations</Link>
            </li>
            <li>
              <Link to="/packages">Galas &amp; Buffet Banquets</Link>
            </li>
            <li>
              <Link to="/menu">Custom Dietary Menus</Link>
            </li>
          </ul>
        </div>

        {/* Contact & Inquiries Column */}
        <div className="footer__col">
          <h4 className="footer__heading">Contact &amp; Inquiries</h4>
          <div className="footer__contact-info">
            <p>
              <strong>Atelier &amp; Kitchen:</strong><br />
              124 Heritage Grand Boulevard<br />
              Metropolitan Arts District
            </p>
            <p>
              <strong>Direct Inquiries:</strong><br />
              <a href="tel:+94710875268" className="footer__contact-link">
                +94 71 0875 268
              </a>
            </p>
            <p>
              <strong>Concierge Email:</strong><br />
              <a href="mailto:events@aureliacatering.com" className="footer__contact-link">
                events@aureliacatering.com
              </a>
            </p>
            <p className="footer__hours">
              Mon &ndash; Sat: 9:00 AM &ndash; 7:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Copyright Bar */}
      <div className="footer__bottom">
        <div className="footer__bottom-inner">
          <p className="footer__copyright">
            &copy; {currentYear} AURELIA Catering Services. All rights reserved.
          </p>
          <div className="footer__legal">
            <span className="legal-tag">Artisanal Catering &amp; Culinary Management</span>
            <span className="legal-dot">&bull;</span>
            <Link to="/login" className="footer__staff-link">
              Staff &amp; Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
