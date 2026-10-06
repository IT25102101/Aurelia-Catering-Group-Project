import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import RequireRole from "../../components/RequireRole";
import {
  DashboardLayout,
  DashboardHeader,
  StatCard,
  SectionHeader,
  DashboardTable,
} from "../../components/dashboard";
import { getOrders } from "../../api/orderApi";
import { getCateringPackages } from "../../api/cateringPackageApi";
import { getEvents } from "../../api/eventApi";
import {
  getAllPayments,
  recordPayment,
  updatePayment,
  deletePayment,
} from "../../api/paymentApi";

const FinanceIcons = {
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  revenue: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  advance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  balance: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  refresh: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
};

function formatRs(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return "—";
  return "Rs. " + Number(value).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dtStr) {
  if (!dtStr) return "—";
  try {
    return new Date(dtStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dtStr;
  }
}

function FinanceOfficerDashboardContent() {
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [events, setEvents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modals state
  const [activeOrderForPayment, setActiveOrderForPayment] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentMethod: "Bank Transfer",
    referenceNo: "",
    notes: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Edit payment modal state
  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: "",
    paymentMethod: "Bank Transfer",
    referenceNo: "",
    notes: "",
    status: "COMPLETED",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState(null);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setError("");
      setActionSuccess("");
    }

    try {
      const [ordersData, packagesData, eventsData, paymentsData] = await Promise.all([
        getOrders().catch(() => []),
        getCateringPackages().catch(() => []),
        getEvents().catch(() => []),
        getAllPayments().catch(() => []),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      setError("Failed to load financial overview: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Lookup maps
  const packageMap = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => map.set(Number(pkg.id), pkg));
    return map;
  }, [packages]);

  const eventMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => map.set(Number(ev.id), ev));
    return map;
  }, [events]);

  // Group payments by orderId
  const orderPaymentsMap = useMemo(() => {
    const map = new Map();
    payments.forEach((p) => {
      const oid = Number(p.orderId);
      if (!map.has(oid)) map.set(oid, []);
      if ("COMPLETED".equalsIgnoreCase?.(p.status) || p.status === "COMPLETED") {
        map.get(oid).push(p);
      }
    });
    return map;
  }, [payments]);

  // Helper to compute order financials
  const getOrderFinancials = useCallback(
    (order) => {
      const ev = eventMap.get(Number(order.eventId));
      const pkg = packageMap.get(Number(order.packageId));

      let total = 0;
      if (order.totalAmount && Number(order.totalAmount) > 0) {
        total = Number(order.totalAmount);
      } else if (pkg && pkg.price) {
        const guests = ev && ev.guestCount ? Number(ev.guestCount) : 1;
        total = Number(pkg.price) * guests;
      }

      const orderPays = orderPaymentsMap.get(Number(order.id)) || [];
      const paid = orderPays.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const advanceReq = Math.round(total * 0.3 * 100) / 100;
      const balance = Math.max(0, Math.round((total - paid) * 100) / 100);

      let status = "UNPAID";
      if (paid <= 0) {
        status = "UNPAID";
      } else if (total > 0 && paid >= total) {
        status = "FULLY_PAID";
      } else if (paid >= advanceReq && advanceReq > 0) {
        status = "ADVANCE_PAID";
      } else {
        status = "PARTIALLY_PAID";
      }

      return { total, advanceReq, paid, balance, status, payments: orderPays };
    },
    [eventMap, packageMap, orderPaymentsMap]
  );

  // Overall statistics
  const summaryStats = useMemo(() => {
    let grandTotalRevenue = 0;
    let grandTotalPaid = 0;
    let totalAdvanceDue = 0;

    orders.forEach((o) => {
      const f = getOrderFinancials(o);
      grandTotalRevenue += f.total;
      grandTotalPaid += f.paid;
      totalAdvanceDue += f.advanceReq;
    });

    const outstandingBalance = Math.max(0, grandTotalRevenue - grandTotalPaid);

    return {
      grandTotalRevenue,
      grandTotalPaid,
      totalAdvanceDue,
      outstandingBalance,
      totalOrders: orders.length,
      totalTransactions: payments.length,
    };
  }, [orders, payments, getOrderFinancials]);

  // Handle Payment Recording
  function openRecordPaymentModal(order) {
    const fin = getOrderFinancials(order);
    setActiveOrderForPayment(order);
    // Pre-fill with remaining balance or 30% advance
    const suggestedAmount = fin.paid === 0 && fin.advanceReq > 0 ? fin.advanceReq : fin.balance;
    setPaymentFormData({
      amount: suggestedAmount > 0 ? suggestedAmount : "",
      paymentMethod: "Bank Transfer",
      referenceNo: "",
      notes: "",
    });
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!activeOrderForPayment) return;

    const amt = parseFloat(paymentFormData.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }

    setSubmittingPayment(true);
    setError("");

    try {
      const orderId = activeOrderForPayment.orderId || activeOrderForPayment.id;
      const fin = getOrderFinancials(activeOrderForPayment);
      const isBalance = (fin.paid + amt >= fin.total);
      await recordPayment({
        orderId: Number(orderId),
        amount: amt,
        paymentType: isBalance ? "Balance" : "Advance",
        paymentStatus: "Paid",
      });

      setActionSuccess(`Payment of ${formatRs(amt)} recorded successfully for Order #${orderId}.`);
      setActiveOrderForPayment(null);
      await loadAllData();
    } catch (err) {
      alert("Failed to record payment: " + err.message);
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Handle Edit Payment Modal
  function openEditPaymentModal(payment) {
    setEditingPayment(payment);
    setEditFormData({
      amount: payment.amount !== null && payment.amount !== undefined ? String(payment.amount) : "",
      paymentType: payment.paymentType || "Advance",
      paymentStatus: payment.paymentStatus || "Paid",
      referenceNo: payment.referenceNo || "",
      notes: payment.notes || "",
    });
  }

  async function handleEditPaymentSubmit(e) {
    e.preventDefault();
    if (!editingPayment) return;

    const amt = parseFloat(editFormData.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid payment amount greater than zero.");
      return;
    }

    setSubmittingEdit(true);
    setError("");

    try {
      await updatePayment(editingPayment.paymentId || editingPayment.id, {
        orderId: editingPayment.orderId,
        amount: amt,
        paymentDate: editingPayment.paymentDate,
        paymentType: editFormData.paymentType || "Advance",
        paymentStatus: editFormData.paymentStatus || "Paid",
      });

      setActionSuccess(`Payment record #REC-${editingPayment.paymentId || editingPayment.id} (Order #${editingPayment.orderId}) updated successfully.`);
      setEditingPayment(null);
      await loadAllData();
    } catch (err) {
      alert("Failed to update payment: " + (err.message || "Server error"));
    } finally {
      setSubmittingEdit(false);
    }
  }

  // Handle Void Payment
  async function handleVoidPayment(paymentId) {
    if (!window.confirm(`Are you sure you want to void payment record #${paymentId}?`)) return;
    try {
      await deletePayment(paymentId);
      setActionSuccess(`Payment #${paymentId} has been voided.`);
      await loadAllData();
    } catch (err) {
      alert("Failed to void payment: " + err.message);
    }
  }

  // Payment Status Badge component
  function renderPaymentBadge(status) {
    let bg = "#F3F4F6";
    let color = "#374151";
    let label = status;

    switch (status) {
      case "FULLY_PAID":
        bg = "#DEF7EC";
        color = "#03543F";
        label = "Fully Paid";
        break;
      case "ADVANCE_PAID":
        bg = "#E1EFFE";
        color = "#1E429F";
        label = "30% Advance Paid";
        break;
      case "PARTIALLY_PAID":
        bg = "#FEF08A";
        color = "#854D0E";
        label = "Partially Paid";
        break;
      case "UNPAID":
      default:
        bg = "#FEE2E2";
        color = "#991B1B";
        label = "Unpaid";
        break;
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 10px",
          borderRadius: "12px",
          fontSize: "0.78rem",
          fontWeight: "600",
          letterSpacing: "0.03em",
          background: bg,
          color: color,
        }}
      >
        {label}
      </span>
    );
  }

  const sortedOrders = useMemo(() => [...orders].sort((a, b) => b.id - a.id), [orders]);

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Finance &amp; Payment Management"
        subtitle="Phase 2 financial ledger: 30% advance calculation, external payment recording, invoices &amp; receipts."
        actions={
          <button
            type="button"
            className={`dashboard-refresh-btn ${refreshing ? "refreshing" : ""}`}
            onClick={() => loadAllData(true)}
            disabled={loading || refreshing}
            title="Sync financial data from live backend"
          >
            {FinanceIcons.refresh}
            <span>{refreshing ? "Refreshing..." : "Sync Financials"}</span>
          </button>
        }
      />

      <div className="dashboard-content">
        {error && <div className="alert alert-danger mb-6">{error}</div>}
        {actionSuccess && (
          <div
            style={{
              padding: "12px 18px",
              background: "#DEF7EC",
              color: "#03543F",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              fontWeight: "500",
              border: "1px solid #BCF0DA",
            }}
          >
            &#10003; {actionSuccess}
          </div>
        )}

        {/* ── 1. Financial KPI Cards ─────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Financial Performance &amp; Cash Flow"
            subtitle="Contracted order revenue, payments received, and outstanding client receivables"
          />
          <div className="dashboard-stat-grid">
            <StatCard
              icon={FinanceIcons.revenue}
              label="Contracted Revenue"
              value={formatRs(summaryStats.grandTotalRevenue)}
              tag="Total Pipeline"
              supportingText={`Across ${summaryStats.totalOrders} active & confirmed orders`}
              accentColor="var(--forest-dark, #1B301D)"
              loading={loading}
            />
            <StatCard
              icon={FinanceIcons.advance}
              label="Payments Received"
              value={formatRs(summaryStats.grandTotalPaid)}
              tag="Cash &amp; Bank"
              supportingText={`${summaryStats.totalTransactions} recorded payment transactions`}
              accentColor="#057A55"
              iconBg="rgba(5, 122, 85, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={FinanceIcons.balance}
              label="Outstanding Balance"
              value={formatRs(summaryStats.outstandingBalance)}
              tag={summaryStats.outstandingBalance > 0 ? "Receivable" : "Clear"}
              supportingText="Remaining balance to be settled prior to events"
              accentColor="#C27803"
              iconBg="rgba(194, 120, 3, 0.1)"
              loading={loading}
            />
            <StatCard
              icon={FinanceIcons.orders}
              label="30% Advance Pipeline"
              value={formatRs(summaryStats.totalAdvanceDue)}
              tag="Initial Deposits"
              supportingText="Mandatory 30% deposit target upon confirmation"
              accentColor="var(--color-gold, #B8922A)"
              iconBg="rgba(184, 146, 42, 0.1)"
              loading={loading}
            />
          </div>
        </section>

        {/* ── 2. Orders Billing & Invoicing Table ───────────────────────── */}
        <section style={{ marginTop: "2.5rem" }}>
          <SectionHeader
            title="Order Billing &amp; Payment Ledger"
            subtitle="Manage 30% advance deposits, partial payments, and generate official customer invoices"
          />

          <DashboardTable>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Client &amp; Event</th>
                <th>Package Tier</th>
                <th>Total Value</th>
                <th>30% Advance Due</th>
                <th>Amount Paid</th>
                <th>Balance Due</th>
                <th>Payment Status</th>
                <th style={{ textAlign: "right" }}>Financial Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "2rem" }}>
                    No order bookings on file.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const ev = eventMap.get(Number(order.eventId));
                  const pkg = packageMap.get(Number(order.packageId));
                  const fin = getOrderFinancials(order);

                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.id}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--forest-dark, #1B301D)" }}>
                          {ev?.customerName || "Guest Customer"}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #5A655C)" }}>
                          {ev?.eventType || "Event"} &bull; {formatDate(ev?.eventDate)}
                        </div>
                      </td>
                      <td>{pkg?.name || "Custom Selection"}</td>
                      <td style={{ fontWeight: 600 }}>{formatRs(fin.total)}</td>
                      <td style={{ color: "#B45309", fontWeight: 500 }}>{formatRs(fin.advanceReq)}</td>
                      <td style={{ color: "#057A55", fontWeight: 600 }}>{formatRs(fin.paid)}</td>
                      <td style={{ color: fin.balance > 0 ? "#DC2626" : "#057A55", fontWeight: 600 }}>
                        {formatRs(fin.balance)}
                      </td>
                      <td>{renderPaymentBadge(fin.status)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn sm gold"
                          style={{ marginRight: "6px" }}
                          onClick={() => openRecordPaymentModal(order)}
                          title="Record Cash, Bank, or Card Payment"
                        >
                          + Payment
                        </button>
                        <button
                          type="button"
                          className="btn sm secondary"
                          onClick={() => setActiveInvoiceOrder({ order, event: ev, package: pkg, fin })}
                          title="View and Print Official Invoice"
                        >
                          Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </DashboardTable>
        </section>

        {/* ── 3. Recorded Payment Transactions Ledger ──────────────────── */}
        <section style={{ marginTop: "3rem", marginBottom: "2rem" }}>
          <SectionHeader
            title="Recorded Payments Ledger"
            subtitle="Audited log of all external cash, bank transfer, and card transactions"
          />

          <DashboardTable>
            <thead>
              <tr>
                <th>Receipt / Pay #</th>
                <th>Order #</th>
                <th>Payment Date</th>
                <th>Method</th>
                <th>Reference #</th>
                <th>Amount Paid</th>
                <th>Notes</th>
                <th style={{ textAlign: "right" }}>Receipt &amp; Audit</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                    No payment transactions recorded yet. Use the "+ Payment" button above to log external receipts.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const ord = sortedOrders.find((o) => o.id === p.orderId);
                  const ev = ord ? eventMap.get(Number(ord.eventId)) : null;
                  const fin = ord ? getOrderFinancials(ord) : null;

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>REC-{p.id}</td>
                      <td>
                        <Link to={`/track?id=${p.orderId}`} style={{ color: "var(--forest-dark)", fontWeight: 600 }}>
                          Order #{p.orderId}
                        </Link>
                      </td>
                      <td>{formatDateTime(p.paymentDate)}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#F3F4F6",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                          }}
                        >
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {p.referenceNo || "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#057A55" }}>{formatRs(p.amount)}</td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.notes || "—"}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn sm outline"
                          style={{ marginRight: "6px" }}
                          onClick={() => setActiveReceiptPayment({ payment: p, order: ord, event: ev, fin })}
                          title="Generate and Print Receipt"
                        >
                          Receipt
                        </button>
                        <button
                          type="button"
                          className="btn sm secondary"
                          style={{ marginRight: "6px" }}
                          onClick={() => openEditPaymentModal(p)}
                          title="Edit Payment Details"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn sm danger"
                          onClick={() => handleVoidPayment(p.id)}
                          title="Void this payment transaction"
                        >
                          Void
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </DashboardTable>
        </section>
      </div>

      {/* ── MODAL 1: RECORD PAYMENT ────────────────────────────────────────── */}
      {activeOrderForPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "540px",
              width: "100%",
              background: "#fff",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>
                  Finance Office
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", margin: "4px 0 0 0" }}>
                  Record Payment — Order #{activeOrderForPayment.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrderForPayment(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            {/* Quick financial context */}
            {(() => {
              const fin = getOrderFinancials(activeOrderForPayment);
              return (
                <div
                  style={{
                    background: "#F9FBF8",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "1px solid #E6ECE5",
                    marginBottom: "1.25rem",
                    fontSize: "0.9rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                  }}
                >
                  <div><strong>Total Contracted:</strong> {formatRs(fin.total)}</div>
                  <div><strong>30% Advance Due:</strong> {formatRs(fin.advanceReq)}</div>
                  <div><strong>Total Paid to Date:</strong> {formatRs(fin.paid)}</div>
                  <div><strong>Remaining Balance:</strong> <span style={{ color: "#DC2626", fontWeight: 600 }}>{formatRs(fin.balance)}</span></div>
                </div>
              );
            })()}

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Payment Amount (LKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                  placeholder="e.g. 135000.00"
                  className="booking-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Payment Method *
                </label>
                <select
                  value={paymentFormData.paymentMethod}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#fff" }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="External Card Payment">External Card Payment (POS)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Reference / Transaction Slip Number
                </label>
                <input
                  type="text"
                  value={paymentFormData.referenceNo}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNo: e.target.value })}
                  placeholder="e.g. TXN-HNB-984321 / Cash Receipt #42"
                  className="booking-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Internal Finance Notes
                </label>
                <textarea
                  rows="2"
                  value={paymentFormData.notes}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  placeholder="e.g. 30% Advance received for wedding package reservation"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn outline sm"
                  onClick={() => setActiveOrderForPayment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gold sm"
                  disabled={submittingPayment}
                >
                  {submittingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INVOICE GENERATION / PRINT ─────────────────────────────── */}
      {activeInvoiceOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <div
            id="printable-invoice"
            className="card"
            style={{
              maxWidth: "680px",
              width: "100%",
              background: "#fff",
              borderRadius: "12px",
              padding: "2.5rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--forest-dark, #1B301D)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "1.3rem", fontWeight: "700", letterSpacing: "0.1em", color: "var(--forest-dark, #1B301D)" }}>
                  AURELIA
                </span>
                <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gold)", letterSpacing: "0.15em" }}>
                  Catering &amp; Bespoke Events
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280", marginTop: "4px" }}>
                  Colombo 03, Sri Lanka &bull; finance@aurelia.com
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.4rem", fontWeight: "700", color: "#111827", display: "block" }}>
                  INVOICE
                </span>
                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--gold)" }}>
                  INV-2026-00{activeInvoiceOrder.order.id}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                  Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>

            {/* Billed To & Event Details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              <div style={{ background: "#F9FBF8", padding: "1rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>Billed Client</span>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827", marginTop: "2px" }}>
                  {activeInvoiceOrder.event?.customerName || "Guest Customer"}
                </div>
                <div style={{ color: "#4B5563" }}>Event Ref: #{activeInvoiceOrder.order.id}</div>
              </div>
              <div style={{ background: "#F9FBF8", padding: "1rem", borderRadius: "6px" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#6B7280", fontWeight: 600 }}>Event Logistics</span>
                <div style={{ fontWeight: 600, color: "#111827", marginTop: "2px" }}>
                  {formatDate(activeInvoiceOrder.event?.eventDate)}
                </div>
                <div style={{ color: "#4B5563" }}>{activeInvoiceOrder.event?.venue || "Venue TBD"}</div>
                <div style={{ color: "#4B5563" }}>{activeInvoiceOrder.event?.guestCount || 0} Guests</div>
              </div>
            </div>

            {/* Itemized charges */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#F3F4F6", borderBottom: "1px solid #D1D5DB" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>Description</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Guests</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <strong>{activeInvoiceOrder.package?.name || "Bespoke Catering Package"}</strong>
                    <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                      {activeInvoiceOrder.package?.description || "Curated seasonal menu selection & service"}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {activeInvoiceOrder.event?.guestCount || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                    {formatRs(activeInvoiceOrder.fin.total)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Financial Summary Box */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
              <div style={{ width: "280px", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Total Order Value:</span>
                  <strong>{formatRs(activeInvoiceOrder.fin.total)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#B45309" }}>
                  <span>30% Advance Required:</span>
                  <strong>{formatRs(activeInvoiceOrder.fin.advanceReq)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#057A55" }}>
                  <span>Total Payments Settled:</span>
                  <strong>{formatRs(activeInvoiceOrder.fin.paid)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "2px solid #D1D5DB", fontWeight: 700, fontSize: "1.05rem" }}>
                  <span>Remaining Balance Due:</span>
                  <span style={{ color: activeInvoiceOrder.fin.balance > 0 ? "#DC2626" : "#057A55" }}>
                    {formatRs(activeInvoiceOrder.fin.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div style={{ background: "#F9FBF8", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "10px 14px", fontSize: "0.8rem", color: "#4B5563", marginBottom: "1.5rem" }}>
              <strong>Remittance Details:</strong> Bank: Commercial Bank of Ceylon &bull; Account: 1000-2948-2831 &bull; Branch: Colombo 03. Please quote invoice number on all remittances.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }} className="no-print">
              <button
                type="button"
                className="btn outline sm"
                onClick={() => setActiveInvoiceOrder(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn gold sm"
                onClick={() => window.print()}
              >
                &#128438; Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: PAYMENT RECEIPT ───────────────────────────────────────── */}
      {activeReceiptPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            id="printable-receipt"
            className="card"
            style={{
              maxWidth: "500px",
              width: "100%",
              background: "#fff",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", borderBottom: "1px dashed #D1D5DB", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: "700", letterSpacing: "0.1em", color: "var(--forest-dark)" }}>
                AURELIA CATERING &amp; EVENTS
              </span>
              <div style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>
                Official Payment Receipt
              </div>
              <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>
                Receipt No: <strong>REC-2026-00{activeReceiptPayment.payment.id}</strong>
              </div>
            </div>

            <div style={{ fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "4px 0" }}>
                <span style={{ color: "#6B7280" }}>Order Reference:</span>
                <strong>Order #{activeReceiptPayment.payment.orderId}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "4px 0" }}>
                <span style={{ color: "#6B7280" }}>Received From:</span>
                <strong>{activeReceiptPayment.event?.customerName || "Guest Customer"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "4px 0" }}>
                <span style={{ color: "#6B7280" }}>Payment Date:</span>
                <span>{formatDateTime(activeReceiptPayment.payment.paymentDate)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "4px 0" }}>
                <span style={{ color: "#6B7280" }}>Payment Method:</span>
                <strong>{activeReceiptPayment.payment.paymentMethod}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6", padding: "4px 0" }}>
                <span style={{ color: "#6B7280" }}>Reference / Slip No:</span>
                <span>{activeReceiptPayment.payment.referenceNo || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #D1D5DB", marginTop: "8px", fontSize: "1.1rem" }}>
                <span style={{ fontWeight: 700, color: "var(--forest-dark)" }}>Amount Settled:</span>
                <strong style={{ color: "#057A55" }}>{formatRs(activeReceiptPayment.payment.amount)}</strong>
              </div>
              {activeReceiptPayment.fin && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#6B7280", fontSize: "0.85rem" }}>
                  <span>Remaining Order Balance:</span>
                  <span>{formatRs(activeReceiptPayment.fin.balance)}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", fontSize: "0.75rem", color: "#9CA3AF", borderTop: "1px dashed #D1D5DB", paddingTop: "0.75rem", marginBottom: "1.5rem" }}>
              Thank you for celebrating with Aurelia. &bull; Computer Generated Receipt
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }} className="no-print">
              <button
                type="button"
                className="btn outline sm"
                onClick={() => setActiveReceiptPayment(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn gold sm"
                onClick={() => window.print()}
              >
                &#128438; Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EDIT PAYMENT ──────────────────────────────────────────── */}
      {editingPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "540px",
              width: "100%",
              background: "#fff",
              borderRadius: "12px",
              padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>
                  Finance Office &bull; Edit Mode
                </span>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", margin: "4px 0 0 0" }}>
                  Edit Payment #REC-{editingPayment.id}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingPayment(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                disabled={submittingEdit}
              >
                &times;
              </button>
            </div>

            {/* Read-only context badges */}
            <div
              style={{
                background: "#F9FBF8",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                border: "1px solid #E6ECE5",
                marginBottom: "1.25rem",
                fontSize: "0.88rem",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <div><strong>Target Order:</strong> #{editingPayment.orderId}</div>
              <div><strong>Original Date:</strong> {formatDate(editingPayment.paymentDate)}</div>
            </div>

            <form onSubmit={handleEditPaymentSubmit}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Payment Amount (LKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                  placeholder="e.g. 135000.00"
                  className="booking-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                  disabled={submittingEdit}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Payment Method *
                </label>
                <select
                  value={editFormData.paymentMethod}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#fff" }}
                  disabled={submittingEdit}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="External Card Payment">External Card Payment (POS)</option>
                </select>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Reference / Transaction Slip Number
                </label>
                <input
                  type="text"
                  value={editFormData.referenceNo}
                  onChange={(e) => setEditFormData({ ...editFormData, referenceNo: e.target.value })}
                  placeholder="e.g. TXN-HNB-984321 / Cash Receipt #42"
                  className="booking-input"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                  disabled={submittingEdit}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Payment Status *
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB", background: "#fff" }}
                  disabled={submittingEdit}
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "4px" }}>
                  Internal Finance Notes
                </label>
                <textarea
                  rows="2"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="e.g. Adjusted payment amount or remittance notes"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "6px", border: "1px solid #D1D5DB" }}
                  disabled={submittingEdit}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn outline sm"
                  onClick={() => setEditingPayment(null)}
                  disabled={submittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn gold sm"
                  disabled={submittingEdit}
                >
                  {submittingEdit ? "Updating..." : "Update Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function FinanceOfficerDashboard() {
  return (
    <RequireRole allowedRoles={["FINANCE_OFFICER", "ADMIN"]}>
      <FinanceOfficerDashboardContent />
    </RequireRole>
  );
}
