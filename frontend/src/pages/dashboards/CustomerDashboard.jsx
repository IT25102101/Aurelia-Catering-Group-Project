import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import RequireRole from "../../components/RequireRole";
import { useAuth } from "../../AuthContext";
import { getQuotationsByCustomerId } from "../../api/quotationApi";

function CustomerDashboardContent() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      getQuotationsByCustomerId(user.id)
        .then((data) => setQuotations(data || []))
        .catch(() => setQuotations([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const pendingQuotations = quotations.filter((q) => q.status === "Sent");
  const acceptedQuotations = quotations.filter((q) => q.status === "Accepted");
  const rejectedQuotations = quotations.filter((q) => q.status === "Rejected");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background, #F4EFE6)" }}>
      <Navbar />
      <div className="page" style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ color: "var(--color-primary-dark, #1A301C)", margin: "0 0 4px" }}>Customer Portal</h1>
        <p className="subtitle" style={{ margin: "0 0 24px", color: "#666" }}>
          Welcome back, <strong>{user?.fullName || "Valued Customer"}</strong>. Manage your catering bookings and quotations.
        </p>

        {/* Quotations Alert / Action Card */}
        <div
          className="card"
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: pendingQuotations.length > 0 ? "5px solid #2C4A2E" : "5px solid #8FAF8C",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: "1.4rem" }}>📝</span>
                <h3 style={{ margin: 0, color: "var(--color-primary-dark, #1A301C)" }}>Catering Quotations</h3>
                {pendingQuotations.length > 0 && (
                  <span className="badge badge-primary" style={{ padding: "3px 8px", fontSize: "0.8rem", borderRadius: 10 }}>
                    {pendingQuotations.length} Awaiting Response
                  </span>
                )}
              </div>
              <p style={{ margin: "4px 0 0", color: "#555", fontSize: "0.95rem" }}>
                {loading
                  ? "Loading your quotation status..."
                  : pendingQuotations.length > 0
                  ? `You have ${pendingQuotations.length} quotation awaiting your review and response.`
                  : quotations.length > 0
                  ? `You have ${quotations.length} quotation(s) on file (${acceptedQuotations.length} accepted, ${rejectedQuotations.length} rejected).`
                  : "No quotations available yet. Once our staff reviews your event booking, quotations will appear here."}
              </p>
            </div>
            <Link
              to="/customer/quotations"
              className="btn btn-primary"
              style={{ padding: "10px 20px", textDecoration: "none", fontWeight: "600" }}
            >
              View My Quotations &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <h3 style={{ margin: "0 0 16px", color: "var(--color-primary-dark, #1A301C)" }}>Explore Services</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <Link
            to="/event-booking"
            className="card"
            style={{ display: "block", textDecoration: "none", color: "inherit", background: "#fff", padding: 20, borderRadius: 8 }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>📅</div>
            <h4 style={{ margin: "0 0 6px", color: "var(--color-primary-dark, #1A301C)" }}>Book a New Event</h4>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Submit an event catering request with custom guest count and date &rarr;
            </p>
          </Link>

          <Link
            to="/packages"
            className="card"
            style={{ display: "block", textDecoration: "none", color: "inherit", background: "#fff", padding: 20, borderRadius: 8 }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🍽️</div>
            <h4 style={{ margin: "0 0 6px", color: "var(--color-primary-dark, #1A301C)" }}>Catering Packages</h4>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Browse our curated packages for weddings, corporate galas, and private dining &rarr;
            </p>
          </Link>

          <Link
            to="/menu"
            className="card"
            style={{ display: "block", textDecoration: "none", color: "inherit", background: "#fff", padding: 20, borderRadius: 8 }}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>🥗</div>
            <h4 style={{ margin: "0 0 6px", color: "var(--color-primary-dark, #1A301C)" }}>A la Carte Menu</h4>
            <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
              Explore our appetizers, main courses, live stations, and dessert specialties &rarr;
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <RequireRole allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardContent />
    </RequireRole>
  );
}
