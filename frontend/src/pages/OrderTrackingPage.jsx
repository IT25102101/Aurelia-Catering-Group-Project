import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollReveal from "../components/common/ScrollReveal";
import { getOrderById, getOrderStatusHistory } from "../api/orderApi";
import { getEventByOrderId } from "../api/eventApi";
import { getCateringPackageById } from "../api/cateringPackageApi";

export default function OrderTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [orderIdInput, setOrderIdInput] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [packageData, setPackageData] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchedId, setSearchedId] = useState("");

  // Auto-search if ID is supplied in URL query string (e.g. ?id=1001)
  useEffect(() => {
    const queryId = searchParams.get("id");
    if (queryId && queryId.trim() !== "") {
      setOrderIdInput(queryId);
      performSearch(queryId.trim());
    }
  }, [searchParams]);

  async function performSearch(idToQuery) {
    if (!idToQuery || idToQuery.trim() === "") {
      setErrorMessage("Please enter an Order ID.");
      setOrderData(null);
      setEventData(null);
      setPackageData(null);
      setStatusHistory([]);
      return;
    }

    const numericId = parseInt(idToQuery.trim(), 10);
    if (isNaN(numericId) || numericId <= 0) {
      setErrorMessage("Order ID must be a valid positive number.");
      setOrderData(null);
      setEventData(null);
      setPackageData(null);
      setStatusHistory([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSearchedId(idToQuery.trim());

    try {
      // 1. Fetch Order details
      const order = await getOrderById(numericId);
      if (!order) {
        throw new Error("Order not found. Please check your Order ID and try again.");
      }
      setOrderData(order);

      // 2. Fetch Event details (ORDER 1 : 1 EVENT)
      try {
        const event = await getEventByOrderId(numericId);
        setEventData(event);
      } catch {
        setEventData(null);
      }

      // 3. Fetch Status History
      try {
        const history = await getOrderStatusHistory(numericId);
        setStatusHistory(Array.isArray(history) ? history : []);
      } catch {
        setStatusHistory([]);
      }

      // 4. Fetch Package name if packageId exists
      if (order.packageId) {
        try {
          const pkg = await getCateringPackageById(order.packageId);
          setPackageData(pkg);
        } catch {
          setPackageData(null);
        }
      } else {
        setPackageData(null);
      }
    } catch (err) {
      setOrderData(null);
      setEventData(null);
      setPackageData(null);
      setStatusHistory([]);
      setErrorMessage("Order not found. Please check your Order ID and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setSearchParams({ id: orderIdInput.trim() });
    }
    performSearch(orderIdInput.trim());
  }

  function formatDate(dateString) {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "";
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateTimeString;
    }
  }

  function getStatusStyle(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("pending") || s.includes("review")) {
      return { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" };
    }
    if (s.includes("quotation") || s.includes("confirmation")) {
      return { bg: "#E0E7FF", color: "#3730A3", border: "#C7D2FE" };
    }
    if (s.includes("confirm") || s.includes("deliver") || s.includes("ready")) {
      return { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" };
    }
    if (s.includes("prepar")) {
      return { bg: "#CCFBF1", color: "#115E59", border: "#99F6E4" };
    }
    if (s.includes("reject") || s.includes("cancel")) {
      return { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA" };
    }
    return { bg: "#F3F4F6", color: "#374151", border: "#E5E7EB" };
  }

  return (
    <div className="booking-page-wrapper">
      <Navbar />

      <main className="section" style={{ minHeight: "70vh", paddingTop: "6rem", paddingBottom: "6rem" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1rem" }}>
          
          {/* Header Banner */}
          <ScrollReveal variant="fade-up" className="text-center mb-8" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <span className="eyebrow" style={{ color: "var(--gold, #B8922A)", letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.85rem", fontWeight: "600" }}>
              Guest Order Tracking
            </span>
            <h1 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "2.5rem", margin: "0.5rem 0 1rem 0", color: "var(--forest-dark, #1B301D)" }}>
              Track Your Order
            </h1>
            <p style={{ color: "var(--text-muted, #5A655C)", fontSize: "1.05rem", maxWidth: "580px", margin: "0 auto" }}>
              Enter your Order ID to check your reservation status, event logistics, and timeline updates in real time.
            </p>
          </ScrollReveal>

          {/* Search Form Card */}
          <ScrollReveal variant="fade-up" delay={80} className="card mb-8" style={{ padding: "2rem", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", background: "#fff", marginBottom: "2rem" }}>
            <form onSubmit={handleFormSubmit} noValidate>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <label htmlFor="orderIdInput" style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", marginBottom: "6px", color: "var(--forest-dark, #1B301D)" }}>
                    Order ID
                  </label>
                  <input
                    id="orderIdInput"
                    type="text"
                    value={orderIdInput}
                    onChange={(e) => setOrderIdInput(e.target.value)}
                    placeholder="e.g. 1001, 1002"
                    className="booking-input"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      border: "1px solid #D4DDD5",
                      fontSize: "1rem",
                      boxSizing: "border-box"
                    }}
                    aria-required="true"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="btn gold"
                    disabled={loading}
                    style={{
                      padding: "12px 28px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? "Tracking..." : "Track Order"}
                  </button>
                </div>
              </div>

              {/* Input Validation Error */}
              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    marginTop: "1rem",
                    padding: "12px 16px",
                    background: "rgba(220, 38, 38, 0.08)",
                    border: "1px solid #EF4444",
                    borderRadius: "8px",
                    color: "#DC2626",
                    fontSize: "0.95rem"
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </form>
          </ScrollReveal>

          {/* Loading Indicator */}
          {loading && (
            <div className="card text-center" style={{ padding: "3rem", borderRadius: "12px", background: "#fff", textAlign: "center" }}>
              <div style={{ display: "inline-block", width: "40px", height: "40px", border: "3px solid rgba(184, 146, 42, 0.3)", borderTopColor: "var(--gold, #B8922A)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              <p style={{ marginTop: "1rem", color: "var(--text-muted, #5A655C)" }}>Retrieving order details...</p>
            </div>
          )}

          {/* Order Details Display */}
          {!loading && orderData && (
            <div className="card" style={{ padding: "2.5rem", borderRadius: "12px", background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              
              {/* Order Header & Status */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid #EBEFEA", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gold, #B8922A)", fontWeight: "600", letterSpacing: "0.05em" }}>
                    Catering Reservation
                  </span>
                  <h2 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "1.85rem", margin: "4px 0 0 0", color: "var(--forest-dark, #1B301D)" }}>
                    Order #{orderData.orderId || orderData.id}
                  </h2>
                </div>
                <div>
                  {(() => {
                    const style = getStatusStyle(orderData.status);
                    return (
                      <div style={{ textAlign: "right" }}>
                        <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted, #5A655C)", fontWeight: "600", marginBottom: "4px" }}>
                          Current Status
                        </span>
                        <span
                          style={{
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: "0.9rem",
                            fontWeight: "700",
                            letterSpacing: "0.02em",
                            background: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            display: "inline-block"
                          }}
                        >
                          {orderData.status || "Pending Verification"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Order & Event Information Grid */}
              <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--forest-dark, #1B301D)", marginBottom: "1rem" }}>
                Order &amp; Event Information
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                
                {/* Order Date */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Order Placed Date
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {formatDate(orderData.orderDate)}
                  </strong>
                </div>

                {/* Catering Package */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Package
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {packageData?.packageName || (orderData.packageId ? `Package #${orderData.packageId}` : "Custom Package")}
                  </strong>
                </div>

                {/* Event Date */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Event Date
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {eventData?.eventDate ? formatDate(eventData.eventDate) : "To be scheduled"}
                  </strong>
                </div>

                {/* Event Type */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Event Type
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {eventData?.eventType || "Catering Event"}
                  </strong>
                </div>

                {/* Location / Venue */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Event Location
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {eventData?.location || eventData?.venue || "Venue to be advised"}
                  </strong>
                </div>

                {/* Guest Count */}
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Guest Count
                  </span>
                  <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "1rem" }}>
                    {eventData?.guestCount ? `${eventData.guestCount} Guests` : "To be confirmed"}
                  </strong>
                </div>
              </div>

              {/* Special Requests */}
              {orderData.specialRequests && (
                <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5", marginBottom: "2.5rem" }}>
                  <span style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted, #5A655C)", textTransform: "uppercase", fontWeight: "600", marginBottom: "4px" }}>
                    Special Requests
                  </span>
                  <p style={{ margin: 0, color: "var(--forest-dark, #1B301D)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {orderData.specialRequests}
                  </p>
                </div>
              )}

              {/* Status History Section */}
              <div style={{ borderTop: "1px solid #EBEFEA", paddingTop: "1.75rem", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: "600", color: "var(--forest-dark, #1B301D)", marginBottom: "1rem" }}>
                  Order Status History
                </h3>

                {statusHistory.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {statusHistory.map((item, idx) => {
                      const style = getStatusStyle(item.status);
                      return (
                        <div
                          key={item.statusHistoryId || item.id || idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#F9FBF8",
                            padding: "0.85rem 1.25rem",
                            borderRadius: "8px",
                            border: "1px solid #E6ECE5",
                            flexWrap: "wrap",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ color: "var(--gold, #B8922A)", fontWeight: "bold", fontSize: "1.1rem" }}>✓</span>
                            <span style={{ fontWeight: "600", color: "var(--forest-dark, #1B301D)" }}>
                              {item.status}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #5A655C)" }}>
                            {formatDateTime(item.changedDate) || formatDate(item.changedDate)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ background: "#F9FBF8", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid #E6ECE5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "var(--gold, #B8922A)", fontWeight: "bold" }}>✓</span>
                      <div>
                        <strong style={{ color: "var(--forest-dark, #1B301D)" }}>{orderData.status || "Pending Verification"}</strong>
                        <span style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted, #5A655C)", marginTop: "2px" }}>
                          {formatDate(orderData.orderDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", flexWrap: "wrap", borderTop: "1px solid #EBEFEA", paddingTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setOrderData(null);
                    setEventData(null);
                    setPackageData(null);
                    setStatusHistory([]);
                    setOrderIdInput("");
                    setSearchParams({});
                  }}
                  className="btn outline sm"
                  style={{ padding: "8px 18px", borderRadius: "6px", cursor: "pointer" }}
                >
                  Track Another Order
                </button>
                <Link to="/packages" className="btn gold sm" style={{ padding: "8px 18px", borderRadius: "6px" }}>
                  Book Another Event
                </Link>
              </div>
            </div>
          )}

          {/* Not Found View */}
          {!loading && !orderData && searchedId && errorMessage && (
            <div className="card text-center" style={{ padding: "2.5rem", borderRadius: "12px", background: "#fff", border: "1px solid #E5E7EB", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</div>
              <h3 style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)", fontSize: "1.4rem", color: "var(--forest-dark, #1B301D)", marginBottom: "0.5rem" }}>
                Order Not Found
              </h3>
              <p style={{ color: "var(--text-muted, #5A655C)", maxWidth: "450px", margin: "0 auto 1.5rem auto", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Order not found. Please check your Order ID and try again.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setOrderIdInput("");
                  }}
                  className="btn outline sm"
                  style={{ padding: "8px 18px", borderRadius: "6px", cursor: "pointer" }}
                >
                  Clear Search
                </button>
                <Link to="/packages" className="btn gold sm" style={{ padding: "8px 18px", borderRadius: "6px" }}>
                  Book a New Event
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
