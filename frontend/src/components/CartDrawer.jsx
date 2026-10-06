import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

/**
 * Aurelia Catering & Events — Cart Drawer
 *
 * A premium slide-in side panel that displays the customer's
 * current selection from the menu.
 *
 * Props:
 *   isOpen  {boolean}  — whether the drawer is open
 *   onClose {function} — callback to close the drawer
 *
 * Cart data is read exclusively from CartContext (Step 10A).
 */
export default function CartDrawer({ isOpen, onClose }) {
  const {
    cartItems,
    totalItems,
    subtotal,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  /* ── Close on Escape key ─────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* ── Lock background scroll while open ──────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── Formatted currency ──────────────────────────────────────── */
  function formatPrice(amount) {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK")}`;
  }

  /* ── Dish image helper ───────────────────────────────────────── */
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

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────── */}
      <div
        className={`cart-backdrop${isOpen ? " cart-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer Panel ─────────────────────────────────────────── */}
      <aside
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Your selection"
        aria-hidden={!isOpen}
        id="cart-drawer"
      >

        {/* Header ─────────────────────────────────────────────── */}
        <div className="cart-drawer__header">
          <div className="cart-drawer__title-wrap">
            <h2 className="cart-drawer__title">Your Selection</h2>
            {totalItems > 0 && (
              <span className="cart-drawer__badge" aria-live="polite">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            type="button"
            className="cart-drawer__close"
            onClick={onClose}
            aria-label="Close selection drawer"
          >
            &times;
          </button>
        </div>

        {/* Gold rule ──────────────────────────────────────────── */}
        <div className="cart-drawer__rule" />

        {/* Body ───────────────────────────────────────────────── */}
        <div className="cart-drawer__body">

          {cartItems.length === 0 ? (
            /* Empty state */
            <div className="cart-empty">
              <div className="cart-empty__icon" aria-hidden="true">&#127869;</div>
              <h3 className="cart-empty__title">Your selection is waiting.</h3>
              <p className="cart-empty__desc">
                Browse our curated menu and add dishes to your catering order.
              </p>
              <Link
                to="/menu"
                className="btn gold sm cart-empty__cta"
                onClick={onClose}
              >
                Explore Menu &rarr;
              </Link>
            </div>
          ) : (
            /* Item list */
            <ul className="cart-item-list" aria-label="Selected dishes">
              {cartItems.map((item) => {
                const lineTotal = (Number(item.price) || 0) * (item.quantity || 1);
                return (
                  <li key={item.id} className="cart-item">

                    {/* Thumbnail */}
                    <div className="cart-item__media">
                      <img
                        src={getDishImage(item)}
                        alt={item.name}
                        className="cart-item__img"
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="cart-item__info">
                      <div className="cart-item__top">
                        <span className="cart-item__name">{item.name}</span>
                        <button
                          type="button"
                          className="cart-item__remove"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>

                      <span className="cart-item__unit-price">
                        {formatPrice(item.price)}
                      </span>

                      {/* Quantity stepper */}
                      <div className="cart-item__footer">
                        <div className="cart-stepper" role="group" aria-label={`Quantity of ${item.name}`}>
                          <button
                            type="button"
                            className="cart-stepper__btn"
                            onClick={() => decreaseQuantity(item.id)}
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            &minus;
                          </button>
                          <span className="cart-stepper__value" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="cart-stepper__btn"
                            onClick={() => increaseQuantity(item.id)}
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            &#43;
                          </button>
                        </div>

                        {item.quantity > 1 && (
                          <span className="cart-item__line-total">
                            {formatPrice(lineTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer / subtotal ──────────────────────────────────── */}
        {cartItems.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-subtotal">
              <span className="cart-subtotal__label">Estimated Subtotal</span>
              <span className="cart-subtotal__value">{formatPrice(subtotal)}</span>
            </div>
            <p className="cart-subtotal__note">
              Final quote includes staffing, tableware &amp; logistics.
            </p>

            <div className="cart-drawer__actions">
              {/* Navigate to the Event Booking page */}
              <Link
                to="/event-booking"
                className="btn gold cart-cta-btn cart-cta-btn--active"
                onClick={onClose}
                id="cart-continue-to-event"
              >
                Proceed to Catering Booking &rarr;
              </Link>

              <button
                type="button"
                className="btn outline sm"
                onClick={onClose}
              >
                Continue Browsing
              </button>

              <button
                type="button"
                className="cart-clear-btn"
                onClick={clearCart}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
