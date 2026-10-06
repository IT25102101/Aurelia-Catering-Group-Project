import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import RequireRole from "../components/RequireRole";
import { useAuth } from "../AuthContext";
import { getQuotationsByCustomerId, getQuotationItems, respondToQuotation } from "../api/quotationApi";
import { getOrderById } from "../api/orderApi";
import { getPaymentSummary } from "../api/paymentApi";

function CustomerQuotationsContent() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationItems, setQuotationItems] = useState([]);
  const [relatedOrder, setRelatedOrder] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Accept & Reject Dialog States
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectValidationErr, setRejectValidationErr] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadCustomerQuotations();
    }
  }, [user]);

  async function loadCustomerQuotations() {
    setLoading(true);
    setError("");
    try {
      const data = await getQuotationsByCustomerId(user.id);
      setQuotations(data || []);
    } catch (err) {
      setError(err.message || "Failed to load your quotations.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenDetails(quotation) {
    setSelectedQuotation(quotation);
    setLoadingDetails(true);
    setError("");
    setSuccessMsg("");
    setShowAcceptConfirm(false);
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectValidationErr("");

    try {
      // Fetch itemized quotation details, associated order, and payment summary with customerId ownership check
      const [items, order, pSummary] = await Promise.all([
        getQuotationItems(quotation.quotationId, user.id),
        quotation.orderId ? getOrderById(quotation.orderId) : Promise.resolve(null),
        quotation.orderId ? getPaymentSummary(quotation.orderId).catch(() => null) : Promise.resolve(null),
      ]);
      setQuotationItems(items || []);
      setRelatedOrder(order);
      setPaymentSummary(pSummary);
    } catch (err) {
      setError(err.message || "Failed to load quotation details.");
    } finally {
      setLoadingDetails(false);
    }
  }

  function handleCloseModal() {
    setSelectedQuotation(null);
    setQuotationItems([]);
    setRelatedOrder(null);
    setPaymentSummary(null);
    setShowAcceptConfirm(false);
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectValidationErr("");
  }

  async function handleConfirmAccept() {
    if (!selectedQuotation || !user?.id) return;
    setSubmittingAction(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await respondToQuotation(selectedQuotation.quotationId, {
        customerId: user.id,
        status: "Accepted",
      });
      setSelectedQuotation(updated);
      setShowAcceptConfirm(false);
      setSuccessMsg(`Quotation #${selectedQuotation.quotationId} accepted. Your order is now Payment Pending.`);
      // Refresh order details to show new Order status
      if (updated.orderId) {
        try {
          const freshOrder = await getOrderById(updated.orderId);
          setRelatedOrder(freshOrder);
        } catch (_) {}
      }
      // Refresh quotation list
      loadCustomerQuotations();
    } catch (err) {
      setError(err.message || "Failed to accept quotation.");
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleConfirmReject() {
    if (!selectedQuotation || !user?.id) return;
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectValidationErr("Please provide a reason for rejecting this quotation.");
      return;
    }
    setRejectValidationErr("");
    setSubmittingAction(true);
    setError("");
    setSuccessMsg("");

    try {
      const updated = await respondToQuotation(selectedQuotation.quotationId, {
        customerId: user.id,
        status: "Rejected",
        reason: rejectionReason.trim(),
      });
      setSelectedQuotation(updated);
      setShowRejectModal(false);
      setSuccessMsg(`Quotation #${selectedQuotation.quotationId} has been rejected.`);
      // Refresh order details to show new Order status
      if (updated.orderId) {
        try {
          const freshOrder = await getOrderById(updated.orderId);
          setRelatedOrder(freshOrder);
        } catch (_) {}
      }
      // Refresh quotation list
      loadCustomerQuotations();
    } catch (err) {
      setError(err.message || "Failed to reject quotation.");
    } finally {
      setSubmittingAction(false);
    }
  }

  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return "Rs. " + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Sent":
        return "badge-primary";
      case "Accepted":
        return "badge-success";
      case "Rejected":
        return "badge-danger";
      case "Expired":
        return "badge-secondary";
      default:
        return "badge-light";
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background, #F4EFE6)" }}>
      <Navbar />
      <div className="page" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        
        {/* Header Breadcrumbs / Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--color-sage-dark, #5E7F5B)", marginBottom: 4 }}>
              <Link to="/dashboard/customer" style={{ color: "inherit", textDecoration: "none" }}>My Account</Link> &rsaquo; <strong>My Quotations</strong>
            </div>
            <h1 style={{ margin: 0, fontSize: "2rem", color: "var(--color-primary-dark, #1A301C)" }}>Catering Quotations</h1>
            <p className="subtitle" style={{ margin: "4px 0 0", color: "#666" }}>
              Review itemized pricing and submit your response for approved orders.
            </p>
          </div>
          <button
            onClick={loadCustomerQuotations}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "0.9rem" }}
          >
            🔄 Refresh List
          </button>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="card" style={{ background: "#FDE8E8", borderColor: "#F8B4B4", color: "#9B1C1C", padding: 14, marginBottom: 20 }}>
            ⚠️ {error}
          </div>
        )}
        {successMsg && (
          <div className="card" style={{ background: "#DEF7EC", borderColor: "#31C48D", color: "#03543F", padding: 14, marginBottom: 20 }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="card" style={{ textAlign: "center", padding: 40, background: "#fff" }}>
            <p style={{ margin: 0, color: "#666" }}>Loading your quotations...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 8 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📄</div>
            <h3 style={{ margin: "0 0 8px", color: "var(--color-primary-dark, #1A301C)" }}>No Quotations Available</h3>
            <p style={{ margin: "0 0 20px", color: "#777", maxWidth: 450, marginLeft: "auto", marginRight: "auto" }}>
              Once you submit an order and our staff finishes reviewing event requirements, itemized quotations will appear here for your review and approval.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/event-booking" className="btn btn-primary">Book an Event &rarr;</Link>
              <Link to="/packages" className="btn btn-secondary">Browse Packages</Link>
            </div>
          </div>
        ) : (
          /* Quotations Grid/List */
          <div style={{ display: "grid", gap: 16 }}>
            {quotations.map((q) => (
              <div
                key={q.quotationId}
                className="card"
                style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 16,
                  borderLeft: q.status === "Sent" ? "5px solid var(--color-primary, #2C4A2E)" : "5px solid #ccc",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", color: "var(--color-primary-dark, #1A301C)" }}>
                      Quotation #{q.quotationId}
                    </h3>
                    <span className={`badge ${getStatusBadgeClass(q.status)}`} style={{ padding: "4px 10px", fontSize: "0.85rem", borderRadius: 12 }}>
                      {q.status === "Sent" ? "Awaiting Your Response" : q.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#555", display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <span><strong>Order ID:</strong> #{q.orderId}</span>
                    <span><strong>Date:</strong> {q.quotationDate ? new Date(q.quotationDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: "#888", textTransform: "uppercase" }}>Total Amount</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: "bold", color: "var(--color-primary, #2C4A2E)" }}>
                      {formatCurrency(q.totalAmount)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDetails(q)}
                    className="btn btn-primary"
                    style={{ padding: "10px 20px", fontSize: "0.95rem" }}
                  >
                    🔍 View Quotation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QUOTATION DETAILS MODAL */}
        {selectedQuotation && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: 16,
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: 10,
                width: "100%",
                maxWidth: 750,
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
                padding: "24px 28px",
                position: "relative",
              }}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #eee", paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, color: "var(--color-primary-dark, #1A301C)" }}>
                    Quotation #{selectedQuotation.quotationId}
                  </h2>
                  <div style={{ fontSize: "0.9rem", color: "#666", marginTop: 4 }}>
                    Linked to Order #{selectedQuotation.orderId} &bull; Date: {selectedQuotation.quotationDate ? new Date(selectedQuotation.quotationDate).toLocaleDateString() : "N/A"}
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#888",
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: 6,
                  marginBottom: 20,
                  backgroundColor:
                    selectedQuotation.status === "Sent"
                      ? "#EFF6FF"
                      : selectedQuotation.status === "Accepted"
                      ? "#DEF7EC"
                      : selectedQuotation.status === "Rejected"
                      ? "#FDE8E8"
                      : "#F3F4F6",
                  color:
                    selectedQuotation.status === "Sent"
                      ? "#1E40AF"
                      : selectedQuotation.status === "Accepted"
                      ? "#03543F"
                      : selectedQuotation.status === "Rejected"
                      ? "#9B1C1C"
                      : "#374151",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <strong>Quotation Status:</strong>{" "}
                    {selectedQuotation.status === "Sent" ? "Awaiting Your Response" : selectedQuotation.status}
                  </div>
                  <span className={`badge ${getStatusBadgeClass(selectedQuotation.status)}`} style={{ padding: "6px 12px", borderRadius: 12 }}>
                    {selectedQuotation.status}
                  </span>
                </div>

                {/* Awaiting response */}
                {selectedQuotation.status === "Sent" && (
                  <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
                    Please review the pricing breakdown below and accept or reject this quotation.
                  </div>
                )}

                {/* Accepted: show Payment Pending / Payment Confirmed status and Financial Breakdown */}
                {selectedQuotation.status === "Accepted" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "1.1rem" }}>✅</span>
                      <strong>Quotation Accepted</strong>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        padding: "12px 16px",
                        borderRadius: 6,
                        backgroundColor: (relatedOrder?.status === "Confirmed" || paymentSummary?.isFullyPaid) ? "#F0FDF4" : "#FFFBEB",
                        border: (relatedOrder?.status === "Confirmed" || paymentSummary?.isFullyPaid) ? "1px solid #86EFAC" : "1px solid #FCD34D",
                        color: (relatedOrder?.status === "Confirmed" || paymentSummary?.isFullyPaid) ? "#166534" : "#92400E",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontWeight: 600 }}>
                          Order Status:{" "}
                          <span style={{ fontWeight: 700, color: (relatedOrder?.status === "Confirmed" || paymentSummary?.isFullyPaid) ? "#15803D" : "#D97706" }}>
                            {relatedOrder ? relatedOrder.status : "Payment Pending"}
                          </span>
                        </div>
                        {paymentSummary && (
                          <span style={{ fontSize: "0.85rem", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: paymentSummary.isFullyPaid ? "#DCFCE7" : "#FEF3C7" }}>
                            {paymentSummary.isFullyPaid ? "Fully Paid" : (paymentSummary.hasAdvancePaid ? "Advance Paid" : "Payment Pending")}
                          </span>
                        )}
                      </div>

                      {/* Financial Figures */}
                      {paymentSummary && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8, padding: "8px 12px", background: "rgba(255,255,255,0.7)", borderRadius: 4, fontSize: "0.85rem" }}>
                          <div>
                            <span style={{ color: "#6B7280", display: "block" }}>Quotation Total:</span>
                            <strong>Rs. {Number(paymentSummary.totalAmount || selectedQuotation.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#6B7280", display: "block" }}>Amount Paid:</span>
                            <strong style={{ color: "#16A34A" }}>Rs. {Number(paymentSummary.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#6B7280", display: "block" }}>Balance Due:</span>
                            <strong style={{ color: paymentSummary.balance > 0 ? "#DC2626" : "#16A34A" }}>Rs. {Number(paymentSummary.balance !== undefined ? paymentSummary.balance : selectedQuotation.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: "0.82rem", marginTop: 8, lineHeight: 1.4 }}>
                        {relatedOrder?.status === "Confirmed" || paymentSummary?.isFullyPaid ? (
                          <span>🎉 Payment has been recorded and verified. Your booking is <strong>Confirmed</strong>!</span>
                        ) : (
                          <span>💳 <strong>Payment is required.</strong> External payments (Cash or Bank Transfer) are verified by our finance department. Once recorded, your order status automatically transitions to <strong>Confirmed</strong>.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected: show Order Rejected */}
                {selectedQuotation.status === "Rejected" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: "1.1rem" }}>❌</span>
                      <strong>Quotation Rejected</strong>
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        padding: "10px 14px",
                        borderRadius: 6,
                        backgroundColor: "#FEF2F2",
                        border: "1px solid #FCA5A5",
                        color: "#7F1D1D",
                        fontSize: "0.9rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        Order Status:{" "}
                        <span style={{ fontWeight: 700 }}>
                          {relatedOrder ? relatedOrder.status : "Rejected"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: 2 }}>
                        This quotation has been rejected. The order has been closed.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Order / Special Requests Info */}
              {relatedOrder && (
                <div style={{ background: "#F9F9F9", padding: "12px 16px", borderRadius: 6, marginBottom: 20, fontSize: "0.9rem" }}>
                  <div style={{ fontWeight: "bold", color: "#444", marginBottom: 4 }}>Order Details:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><strong>Order Date:</strong> {relatedOrder.orderDate || "N/A"}</div>
                    <div><strong>Current Status:</strong> {relatedOrder.status || "N/A"}</div>
                  </div>
                  {relatedOrder.specialRequests && (
                    <div style={{ marginTop: 6 }}>
                      <strong>Special Requests:</strong> {relatedOrder.specialRequests}
                    </div>
                  )}
                </div>
              )}

              {/* Itemized Table */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "1.1rem", color: "var(--color-primary-dark, #1A301C)" }}>
                  Itemized Quotation Breakdown
                </h3>
                {loadingDetails ? (
                  <p style={{ color: "#777", textAlign: "center", padding: 20 }}>Loading line items...</p>
                ) : quotationItems.length === 0 ? (
                  <p style={{ color: "#777", fontStyle: "italic" }}>No specific line items recorded. Refer to Grand Total.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.95rem" }}>
                      <thead>
                        <tr style={{ background: "var(--color-cream, #F9F5EC)", borderBottom: "2px solid #ddd" }}>
                          <th style={{ padding: "10px 12px" }}>Description</th>
                          <th style={{ padding: "10px 12px", textAlign: "center", width: 90 }}>Qty</th>
                          <th style={{ padding: "10px 12px", textAlign: "right", width: 130 }}>Unit Price</th>
                          <th style={{ padding: "10px 12px", textAlign: "right", width: 140 }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationItems.map((item, idx) => {
                          const qty = Number(item.quantity) || 1;
                          const unitPrice = Number(item.unitPrice) || 0;
                          const lineTotal = qty * unitPrice;
                          return (
                            <tr key={item.quotationItemId || idx} style={{ borderBottom: "1px solid #eee" }}>
                              <td style={{ padding: "10px 12px" }}>{item.description}</td>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}>{qty}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatCurrency(unitPrice)}</td>
                              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 500 }}>
                                {formatCurrency(lineTotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "2px solid #2C4A2E", background: "#FAF8F5" }}>
                          <td colSpan={3} style={{ padding: "14px 12px", textAlign: "right", fontWeight: "bold", fontSize: "1.1rem" }}>
                            Grand Total:
                          </td>
                          <td style={{ padding: "14px 12px", textAlign: "right", fontWeight: "bold", fontSize: "1.2rem", color: "var(--color-primary, #2C4A2E)" }}>
                            {formatCurrency(selectedQuotation.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #eee", paddingTop: 18, flexWrap: "wrap", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  style={{ padding: "9px 18px" }}
                >
                  Close
                </button>

                {selectedQuotation.status === "Sent" && !showAcceptConfirm && !showRejectModal && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectModal(true);
                        setShowAcceptConfirm(false);
                      }}
                      className="btn"
                      style={{
                        backgroundColor: "#DC2626",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        cursor: "pointer",
                        borderRadius: 6,
                        fontWeight: "600",
                      }}
                    >
                      ❌ Reject Quotation
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAcceptConfirm(true);
                        setShowRejectModal(false);
                      }}
                      className="btn btn-primary"
                      style={{
                        padding: "10px 22px",
                        fontWeight: "600",
                      }}
                    >
                      ✅ Accept Quotation
                    </button>
                  </div>
                )}
              </div>

              {/* ACCEPT CONFIRMATION SUB-VIEW */}
              {showAcceptConfirm && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 18,
                    background: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                    borderRadius: 8,
                  }}
                >
                  <h4 style={{ margin: "0 0 8px", color: "#166534" }}>Confirm Quotation Acceptance</h4>
                  <p style={{ margin: "0 0 16px", color: "#15803D", fontSize: "0.95rem" }}>
                    Are you sure you want to accept Quotation #{selectedQuotation.quotationId} for a total of{" "}
                    <strong>{formatCurrency(selectedQuotation.totalAmount)}</strong>?
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => setShowAcceptConfirm(false)}
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={handleConfirmAccept}
                      className="btn btn-primary"
                      style={{ padding: "8px 20px" }}
                    >
                      {submittingAction ? "Processing..." : "Confirm & Accept"}
                    </button>
                  </div>
                </div>
              )}

              {/* REJECT MODAL SUB-VIEW */}
              {showRejectModal && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 18,
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                  }}
                >
                  <h4 style={{ margin: "0 0 8px", color: "#991B1B" }}>Reject Quotation</h4>
                  <p style={{ margin: "0 0 12px", color: "#B91C1C", fontSize: "0.95rem" }}>
                    Please tell us why you are rejecting this quotation so our catering team can follow up with adjustments.
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (rejectValidationErr) setRejectValidationErr("");
                      }}
                      placeholder="Please enter your reason (e.g. Quoted price is too high, would like to adjust guest count or menu items)..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: 6,
                        border: rejectValidationErr ? "2px solid #DC2626" : "1px solid #D1D5DB",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                        fontSize: "0.95rem",
                      }}
                    />
                    {rejectValidationErr && (
                      <div style={{ color: "#DC2626", fontSize: "0.85rem", marginTop: 4 }}>
                        ⚠️ {rejectValidationErr}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => {
                        setShowRejectModal(false);
                        setRejectValidationErr("");
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "8px 16px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={handleConfirmReject}
                      className="btn"
                      style={{
                        backgroundColor: "#DC2626",
                        color: "#fff",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      {submittingAction ? "Submitting..." : "Submit Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CustomerQuotationsPage() {
  return (
    <RequireRole allowedRoles={["CUSTOMER"]}>
      <CustomerQuotationsContent />
    </RequireRole>
  );
}
