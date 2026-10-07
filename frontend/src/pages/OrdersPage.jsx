import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../AuthContext";
import { DashboardLayout, DashboardHeader, StatusBadge } from "../components/dashboard";
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderStatusHistory,
  checkOrderInventory,
  confirmOrder,
} from "../api/orderApi";
import { getEvents, getEventByOrderId } from "../api/eventApi";
import { getCateringPackages, getCateringPackageById } from "../api/cateringPackageApi";
import { getCustomers, getCustomerById } from "../api/customerApi";
import { getOrderMenuItemsByOrderId } from "../api/orderMenuItemApi";
import { getOrderReviewsByOrderId, createOrderReview } from "../api/orderReviewApi";
import {
  getQuotations,
  getQuotationByOrderId,
  createQuotation,
  updateQuotationStatus,
  getQuotationItems,
} from "../api/quotationApi";

const emptyForm = {
  customerId: "",
  packageId: "",
  specialRequests: "",
  status: "Pending Verification",
  totalAmount: "",
  inventoryDeducted: false,
};

/**
 * Management Screen for Staff Order Review & Quotation Management (Step 4 & Step 5 Task 1).
 * Allows staff members to inspect pending customer orders, review catering specifications,
 * submit reviews, and generate financial Quotations with customized line items.
 */
export default function OrdersPage() {
  const { user } = useAuth();

  // Core Data
  const [orders, setOrders] = useState([]);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("NEEDS_REVIEW"); // "ALL", "NEEDS_REVIEW", "QUOTATION_READY", "CONFIRMED", "OTHER"
  const [searchTerm, setSearchTerm] = useState("");

  // Create / Edit order modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Staff Review Modal state (Step 4 Task 4)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReviewOrder, setActiveReviewOrder] = useState(null);
  const [reviewCustomer, setReviewCustomer] = useState(null);
  const [reviewEvent, setReviewEvent] = useState(null);
  const [reviewPackage, setReviewPackage] = useState(null);
  const [reviewMenuItems, setReviewMenuItems] = useState([]);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [reviewStatusHistory, setReviewStatusHistory] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [reviewActionError, setReviewActionError] = useState("");
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState("");

  // Staff Quotation Modal state (Step 5 Task 1)
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [quotationMode, setQuotationMode] = useState("CREATE"); // "CREATE" | "VIEW"
  const [quotationOrder, setQuotationOrder] = useState(null);
  const [quotationCustomer, setQuotationCustomer] = useState(null);
  const [quotationEvent, setQuotationEvent] = useState(null);
  const [quotationPackage, setQuotationPackage] = useState(null);
  const [existingQuotation, setExistingQuotation] = useState(null);
  const [quotationItemsList, setQuotationItemsList] = useState([]);
  const [quotationLoading, setQuotationLoading] = useState(false);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);
  const [quotationError, setQuotationError] = useState("");
  const [quotationSuccess, setQuotationSuccess] = useState("");

  // Phase 3 Inventory check state
  const [checkingOrderId, setCheckingOrderId] = useState(null);
  const [inventoryResult, setInventoryResult] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  /** Concurrently load all master collections */
  const loadAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true);
      setError("");
    }
    try {
      const [ordersData, eventsData, packagesData, customersData, quotationsData] = await Promise.all([
        getOrders().catch(() => []),
        getEvents().catch(() => []),
        getCateringPackages().catch(() => []),
        getCustomers().catch(() => []),
        getQuotations().catch(() => []),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setQuotations(Array.isArray(quotationsData) ? quotationsData : []);
    } catch (err) {
      setError("Failed to load order management data: " + (err.message || "Server error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  /** Fast in-memory lookup maps */
  const eventByOrderMap = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const orderId = ev.orderId || ev.id;
      if (orderId) map.set(Number(orderId), ev);
    });
    return map;
  }, [events]);

  const packageMap = useMemo(() => {
    const map = new Map();
    packages.forEach((pkg) => {
      const id = pkg.id || pkg.packageId;
      if (id) map.set(Number(id), pkg);
    });
    return map;
  }, [packages]);

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => {
      const id = c.id || c.customerId;
      if (id) map.set(Number(id), c);
    });
    return map;
  }, [customers]);

  const quotationByOrderMap = useMemo(() => {
    const map = new Map();
    quotations.forEach((q) => {
      if (q.orderId) map.set(Number(q.orderId), q);
    });
    return map;
  }, [quotations]);

  /** Format helper */
  function formatDate(dateString) {
    if (!dateString) return "—";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  }

  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return "—";
    try {
      const d = new Date(dateTimeString);
      return d.toLocaleString("en-US", {
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

  /** Counts for tab badges */
  const tabCounts = useMemo(() => {
    let all = orders.length;
    let needsReview = 0;
    let quotationReady = 0;
    let confirmed = 0;
    let other = 0;

    orders.forEach((o) => {
      const s = (o.status || "").toLowerCase();
      if (s === "pending verification" || s === "under staff review" || s === "pending") {
        needsReview++;
      } else if (s.includes("quotation")) {
        quotationReady++;
      } else if (s.includes("confirm") || s.includes("deliver") || s.includes("prepar")) {
        confirmed++;
      } else {
        other++;
      }
    });

    return { all, needsReview, quotationReady, confirmed, other };
  }, [orders]);

  /** Filtered orders based on selected tab and search term */
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = (o.status || "").toLowerCase();

      // Tab match
      let matchesTab = true;
      if (activeTab === "NEEDS_REVIEW") {
        matchesTab = s === "pending verification" || s === "under staff review" || s === "pending";
      } else if (activeTab === "QUOTATION_READY") {
        matchesTab = s.includes("quotation");
      } else if (activeTab === "CONFIRMED") {
        matchesTab = s.includes("confirm") || s.includes("deliver") || s.includes("prepar");
      } else if (activeTab === "OTHER") {
        matchesTab = s.includes("reject") || s.includes("cancel") || s.includes("payment");
      }

      if (!matchesTab) return false;

      // Search match
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const orderId = String(o.orderId || o.id || "");
      const matchedCustomer = customerMap.get(Number(o.customerId));
      const customerName = (matchedCustomer?.name || "").toLowerCase();
      const customerEmail = (matchedCustomer?.email || "").toLowerCase();
      const matchedEvent = eventByOrderMap.get(Number(o.orderId || o.id));
      const venue = (matchedEvent?.location || matchedEvent?.venue || "").toLowerCase();
      const statusText = (o.status || "").toLowerCase();

      return (
        orderId.includes(term) ||
        customerName.includes(term) ||
        customerEmail.includes(term) ||
        venue.includes(term) ||
        statusText.includes(term)
      );
    });
  }, [orders, activeTab, searchTerm, customerMap, eventByOrderMap]);

  // ==========================================
  // STAFF ORDER REVIEW WORKFLOW (Step 4 Task 4)
  // ==========================================

  async function handleOpenReview(order) {
    const orderId = order.orderId || order.id;
    setActiveReviewOrder(order);
    setReviewModalOpen(true);
    setReviewLoading(true);
    setReviewComments("");
    setReviewActionError("");
    setReviewSuccessMessage("");

    const currentStatus = order.status || "";
    if (currentStatus.toLowerCase() === "pending verification") {
      try {
        await updateOrderStatus(orderId, "Under Staff Review");
        order.status = "Under Staff Review";
        setActiveReviewOrder({ ...order, status: "Under Staff Review" });
        setOrders((prev) =>
          prev.map((o) => ((o.orderId || o.id) === orderId ? { ...o, status: "Under Staff Review" } : o))
        );
      } catch (err) {
        console.warn("Could not transition to Under Staff Review automatically:", err);
      }
    }

    try {
      const [eventRes, menuItemsRes, reviewsRes, historyRes, customerRes, packageRes] = await Promise.all([
        getEventByOrderId(orderId).catch(() => null),
        getOrderMenuItemsByOrderId(orderId).catch(() => []),
        getOrderReviewsByOrderId(orderId).catch(() => []),
        getOrderStatusHistory(orderId).catch(() => []),
        order.customerId ? getCustomerById(order.customerId).catch(() => null) : Promise.resolve(null),
        order.packageId ? getCateringPackageById(order.packageId).catch(() => null) : Promise.resolve(null),
      ]);

      setReviewEvent(eventRes);
      setReviewMenuItems(Array.isArray(menuItemsRes) ? menuItemsRes : []);
      setReviewHistory(Array.isArray(reviewsRes) ? reviewsRes : []);
      setReviewStatusHistory(Array.isArray(historyRes) ? historyRes : []);
      setReviewCustomer(customerRes || customerMap.get(Number(order.customerId)) || null);
      setReviewPackage(packageRes || packageMap.get(Number(order.packageId)) || null);
    } catch (err) {
      setReviewActionError("Error loading order review details: " + (err.message || "Server error"));
    } finally {
      setReviewLoading(false);
    }
  }

  function handleCloseReview() {
    setReviewModalOpen(false);
    setActiveReviewOrder(null);
    setReviewCustomer(null);
    setReviewEvent(null);
    setReviewPackage(null);
    setReviewMenuItems([]);
    setReviewHistory([]);
    setReviewStatusHistory([]);
    setReviewActionError("");
    setReviewSuccessMessage("");
    setReviewComments("");
  }

  async function handleSubmitReview(reviewAction) {
    if (!activeReviewOrder) return;
    const orderId = activeReviewOrder.orderId || activeReviewOrder.id;
    setReviewActionError("");
    setReviewSuccessMessage("");

    const staffId = user?.id || user?.staffId || 1;
    const trimmedComments = reviewComments.trim();
    if (reviewAction === "Rejected" && !trimmedComments) {
      setReviewActionError("Please provide review comments explaining why this order is rejected.");
      return;
    }
    if (reviewAction === "Changes Requested" && !trimmedComments) {
      setReviewActionError("Please provide review comments explaining what changes are requested from the customer.");
      return;
    }

    if (reviewAction === "Rejected") {
      if (!window.confirm(`Are you sure you want to reject Order #${orderId}?`)) {
        return;
      }
    }

    setSubmittingReview(true);
    try {
      const reviewPayload = {
        orderId: orderId,
        staffId: staffId,
        reviewStatus: reviewAction,
        comments: trimmedComments || (reviewAction === "Approved" ? "Order details, venue, and menu verified." : ""),
      };

      await createOrderReview(reviewPayload);

      let nextOrderStatus = activeReviewOrder.status;
      if (reviewAction === "Approved") {
        nextOrderStatus = "Quotation Ready";
        await updateOrderStatus(orderId, nextOrderStatus);
      } else if (reviewAction === "Rejected") {
        nextOrderStatus = "Rejected";
        await updateOrderStatus(orderId, nextOrderStatus);
      } else if (reviewAction === "Changes Requested") {
        nextOrderStatus = "Under Staff Review";
        await updateOrderStatus(orderId, nextOrderStatus);
      }

      const updatedOrder = { ...activeReviewOrder, status: nextOrderStatus };
      setActiveReviewOrder(updatedOrder);
      setOrders((prev) =>
        prev.map((o) => ((o.orderId || o.id) === orderId ? updatedOrder : o))
      );

      const [updatedReviews, updatedHistory] = await Promise.all([
        getOrderReviewsByOrderId(orderId).catch(() => []),
        getOrderStatusHistory(orderId).catch(() => []),
      ]);
      setReviewHistory(Array.isArray(updatedReviews) ? updatedReviews : []);
      setReviewStatusHistory(Array.isArray(updatedHistory) ? updatedHistory : []);

      setReviewSuccessMessage(
        `Staff review (${reviewAction}) saved successfully! Order status is now "${nextOrderStatus}".`
      );
      setReviewComments("");

      setTimeout(() => {
        loadAllData();
      }, 500);
    } catch (err) {
      setReviewActionError(err.message || "Failed to submit staff review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  // ==========================================
  // STAFF QUOTATION WORKFLOW (Step 5 Task 1)
  // ==========================================

  /** Open Quotation Generator or Viewer */
  async function handleOpenQuotation(order) {
    const orderId = order.orderId || order.id;
    setQuotationOrder(order);
    setQuotationError("");
    setQuotationSuccess("");
    setQuotationLoading(true);
    setQuotationModalOpen(true);

    // Validate Order Status is Quotation Ready
    const statusStr = (order.status || "").toLowerCase();
    if (!statusStr.includes("quotation ready") && !statusStr.includes("quotation")) {
      // If not approved yet, warn the user
      setQuotationError("Quotation can only be created after staff approval (Status: Quotation Ready).");
    }

    try {
      const [existingQuote, eventRes, customerRes, packageRes, menuItemsRes] = await Promise.all([
        getQuotationByOrderId(orderId).catch(() => null),
        getEventByOrderId(orderId).catch(() => null),
        order.customerId ? getCustomerById(order.customerId).catch(() => null) : Promise.resolve(null),
        order.packageId ? getCateringPackageById(order.packageId).catch(() => null) : Promise.resolve(null),
        getOrderMenuItemsByOrderId(orderId).catch(() => []),
      ]);

      const cust = customerRes || customerMap.get(Number(order.customerId)) || null;
      const evt = eventRes || eventByOrderMap.get(Number(orderId)) || null;
      const pkg = packageRes || packageMap.get(Number(order.packageId)) || null;

      setQuotationCustomer(cust);
      setQuotationEvent(evt);
      setQuotationPackage(pkg);

      if (existingQuote) {
        // Mode = VIEW
        setExistingQuotation(existingQuote);
        setQuotationMode("VIEW");
        const items = await getQuotationItems(existingQuote.quotationId || existingQuote.id);
        setQuotationItemsList(Array.isArray(items) ? items : []);
      } else {
        // Mode = CREATE
        setExistingQuotation(null);
        setQuotationMode("CREATE");

        // Pre-populate quotation items based on package & menu items
        const initialItems = [];
        const guestCount = evt?.guestCount && evt.guestCount > 0 ? evt.guestCount : 50;

        if (pkg) {
          initialItems.push({
            description: `${pkg.name || pkg.packageName} (${guestCount} guests)`,
            quantity: guestCount,
            unitPrice: pkg.price || 0,
          });
        }

        if (Array.isArray(menuItemsRes) && menuItemsRes.length > 0) {
          menuItemsRes.forEach((m) => {
            initialItems.push({
              description: `Menu Item: ${m.menuItemName || `Item #${m.menuItemId}`}`,
              quantity: m.quantity || guestCount,
              unitPrice: m.price || 0,
            });
          });
        }

        if (initialItems.length === 0) {
          initialItems.push({
            description: "Catering Event Services",
            quantity: guestCount,
            unitPrice: 1500,
          });
        }

        setQuotationItemsList(initialItems);
      }
    } catch (err) {
      setQuotationError("Failed to initialize quotation: " + (err.message || "Server error"));
    } finally {
      setQuotationLoading(false);
    }
  }

  function handleCloseQuotation() {
    setQuotationModalOpen(false);
    setQuotationOrder(null);
    setQuotationCustomer(null);
    setQuotationEvent(null);
    setQuotationPackage(null);
    setExistingQuotation(null);
    setQuotationItemsList([]);
    setQuotationError("");
    setQuotationSuccess("");
  }

  /** Modify quotation line items in form */
  function handleQuotationItemChange(index, field, value) {
    setQuotationItemsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function handleAddQuotationItem() {
    setQuotationItemsList((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function handleRemoveQuotationItem(index) {
    if (quotationItemsList.length <= 1) {
      setQuotationError("Quotation must contain at least one line item.");
      return;
    }
    setQuotationItemsList((prev) => prev.filter((_, i) => i !== index));
  }

  /** Compute Total Amount */
  const computedQuotationTotal = useMemo(() => {
    return quotationItemsList.reduce((sum, item) => {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unitPrice) || 0;
      return sum + q * p;
    }, 0);
  }, [quotationItemsList]);

  /** Save Quotation as Draft or Send */
  async function handleSubmitQuotation(targetStatus) {
    if (!quotationOrder) return;
    const orderId = quotationOrder.orderId || quotationOrder.id;
    setQuotationError("");
    setQuotationSuccess("");

    // Validate Items
    if (quotationItemsList.length === 0) {
      setQuotationError("Quotation must contain at least one item.");
      return;
    }

    for (let i = 0; i < quotationItemsList.length; i++) {
      const item = quotationItemsList[i];
      if (!item.description || !item.description.trim()) {
        setQuotationError(`Line item #${i + 1} must have a valid description.`);
        return;
      }
      const q = parseFloat(item.quantity);
      if (isNaN(q) || q <= 0) {
        setQuotationError(`Line item #${i + 1} quantity must be greater than 0.`);
        return;
      }
      const p = parseFloat(item.unitPrice);
      if (isNaN(p) || p < 0) {
        setQuotationError(`Line item #${i + 1} unit price must be greater than or equal to 0.`);
        return;
      }
    }

    setSubmittingQuotation(true);
    try {
      const payload = {
        orderId: orderId,
        totalAmount: computedQuotationTotal,
        status: targetStatus, // "Draft" | "Sent"
        items: quotationItemsList.map((item) => ({
          description: item.description.trim(),
          quantity: parseFloat(item.quantity) || 1,
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
      };

      const created = await createQuotation(payload);
      setExistingQuotation(created);
      setQuotationMode("VIEW");
      setQuotationSuccess(
        `Quotation #${created.quotationId || created.id} created successfully with status "${targetStatus}"! Total: Rs. ${Number(created.totalAmount || computedQuotationTotal).toLocaleString("en-LK")}`
      );

      // Refresh list
      loadAllData();
    } catch (err) {
      setQuotationError(err.message || "Failed to create quotation.");
    } finally {
      setSubmittingQuotation(false);
    }
  }

  /** Transition existing quotation from Draft to Sent */
  async function handleSendExistingQuotation() {
    if (!existingQuotation) return;
    const quoteId = existingQuotation.quotationId || existingQuotation.id;
    setQuotationError("");
    setQuotationSuccess("");
    setSubmittingQuotation(true);

    try {
      await updateQuotationStatus(quoteId, "Sent");
      setExistingQuotation({ ...existingQuotation, status: "Sent" });
      setQuotationSuccess(`Quotation #${quoteId} has been sent to the customer! Status updated to "Sent".`);
      loadAllData();
    } catch (err) {
      setQuotationError(err.message || "Failed to send quotation.");
    } finally {
      setSubmittingQuotation(false);
    }
  }

  // ==========================================
  // INVENTORY CHECK & CONFIRM (Phase 3 Compat)
  // ==========================================

  async function handleCheckInventory(orderId) {
    if (checkingOrderId === orderId) {
      closeInventoryPanel();
      return;
    }
    setCheckingOrderId(orderId);
    setInventoryResult(null);
    setInventoryError("");
    setConfirmMessage("");
    setInventoryLoading(true);

    try {
      const result = await checkOrderInventory(orderId);
      setInventoryResult(result);
    } catch (err) {
      setInventoryError(err.message || "Failed to check inventory.");
    } finally {
      setInventoryLoading(false);
    }
  }

  function closeInventoryPanel() {
    setCheckingOrderId(null);
    setInventoryResult(null);
    setInventoryError("");
    setConfirmMessage("");
  }

  async function handleConfirmOrder(orderId) {
    if (!window.confirm(`Confirm Order #${orderId}? This will deduct the required ingredients from stock.`)) {
      return;
    }
    setConfirming(true);
    setInventoryError("");
    setConfirmMessage("");

    try {
      const result = await confirmOrder(orderId);
      setConfirmMessage(`Order #${orderId} confirmed! Stock has been deducted.`);
      setInventoryResult(result);
      const updatedOrders = await getOrders();
      setOrders(Array.isArray(updatedOrders) ? updatedOrders : []);
      setTimeout(() => {
        closeInventoryPanel();
      }, 2500);
    } catch (err) {
      if (err.data) {
        setInventoryResult(err.data);
        setInventoryError(err.data.message || "Confirmation failed: inventory insufficient.");
      } else {
        setInventoryError(err.message || "Failed to confirm order.");
      }
    } finally {
      setConfirming(false);
    }
  }

  // ==========================================
  // ORDER CREATE / EDIT / DELETE (CRUD)
  // ==========================================

  function handleOpenCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setFieldErrors({});
    setShowEditModal(true);
  }

  function handleEdit(item) {
    setForm({
      customerId: item.customerId ? String(item.customerId) : "",
      packageId: item.packageId ? String(item.packageId) : "",
      specialRequests: item.specialRequests || "",
      status: item.status || "Pending Verification",
      totalAmount: item.totalAmount || "",
      inventoryDeducted: Boolean(item.inventoryDeducted),
    });
    setEditingId(item.orderId || item.id);
    setFieldErrors({});
    setShowEditModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm(`Are you sure you want to delete Order #${id}?`)) return;
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => (o.orderId || o.id) !== id));
    } catch (err) {
      setError(err.message || "Failed to delete order.");
    }
  }

  async function handleSubmitForm(e) {
    e.preventDefault();
    const errs = {};
    if (!form.customerId) {
      errs.customerId = "Please select an associated Customer.";
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload = {
        customerId: parseInt(form.customerId, 10),
        packageId: form.packageId ? parseInt(form.packageId, 10) : null,
        specialRequests: form.specialRequests.trim() || null,
        status: form.status || "Pending Verification",
      };

      if (editingId) {
        await updateOrder(editingId, payload);
      } else {
        await createOrder(payload);
      }

      setShowEditModal(false);
      setForm(emptyForm);
      setEditingId(null);
      loadAllData();
    } catch (err) {
      setError(err.message || "Failed to save order record.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Staff Order Review & Quotation Management"
        subtitle="Inspect pending guest reservations, review catering specifications, and create accurate pricing quotations."
        showGreeting={false}
      />

      <div className="dashboard-content" style={{ padding: "0 1.5rem 3rem 1.5rem" }}>
        
        {/* Global Error Banner */}
        {error && (
          <div className="error-text" style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        {/* Top Control Bar: Search, Filter Tabs & Add Order Button */}
        <div
          className="card"
          style={{
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            borderRadius: "10px",
            background: "#fff",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Search Input */}
            <div style={{ flex: "1 1 280px", maxWidth: "450px" }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order #, Customer Name, Email, or Venue..."
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #D4DDD5",
                  fontSize: "0.95rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => loadAllData(true)}
                disabled={loading}
                style={{ borderRadius: "6px" }}
              >
                ↻ Refresh Orders
              </button>
              <button
                type="button"
                className="btn gold sm"
                onClick={handleOpenCreate}
                style={{ borderRadius: "6px" }}
              >
                + New Order
              </button>
            </div>
          </div>

          {/* Workflow Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", borderTop: "1px solid #EBEFEA", paddingTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setActiveTab("NEEDS_REVIEW")}
              className={`btn sm ${activeTab === "NEEDS_REVIEW" ? "gold" : "outline"}`}
              style={{
                borderRadius: "20px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: activeTab === "NEEDS_REVIEW" ? "700" : "500",
              }}
            >
              <span>📋 Needs Staff Review</span>
              <span
                style={{
                  background: activeTab === "NEEDS_REVIEW" ? "#fff" : "var(--gold, #B8922A)",
                  color: activeTab === "NEEDS_REVIEW" ? "var(--forest-dark, #1B301D)" : "#fff",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {tabCounts.needsReview}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("QUOTATION_READY")}
              className={`btn sm ${activeTab === "QUOTATION_READY" ? "gold" : "outline"}`}
              style={{
                borderRadius: "20px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: activeTab === "QUOTATION_READY" ? "700" : "500",
              }}
            >
              <span>📝 Quotation Ready</span>
              <span
                style={{
                  background: activeTab === "QUOTATION_READY" ? "#fff" : "var(--gold, #B8922A)",
                  color: activeTab === "QUOTATION_READY" ? "var(--forest-dark, #1B301D)" : "#fff",
                  padding: "1px 7px",
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: "bold",
                }}
              >
                {tabCounts.quotationReady}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`btn sm ${activeTab === "ALL" ? "gold" : "outline"}`}
              style={{
                borderRadius: "20px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>All Orders</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>({tabCounts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CONFIRMED")}
              className={`btn sm ${activeTab === "CONFIRMED" ? "gold" : "outline"}`}
              style={{
                borderRadius: "20px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Confirmed &amp; In Production</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>({tabCounts.confirmed})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("OTHER")}
              className={`btn sm ${activeTab === "OTHER" ? "gold" : "outline"}`}
              style={{
                borderRadius: "20px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Rejected / Cancelled</span>
              <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>({tabCounts.other})</span>
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="card text-center" style={{ padding: "40px", textAlign: "center", color: "var(--muted, #888)" }}>
            <div
              style={{
                display: "inline-block",
                width: "36px",
                height: "36px",
                border: "3px solid rgba(184, 146, 42, 0.3)",
                borderTopColor: "var(--gold, #B8922A)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <p style={{ marginTop: "12px" }}>Loading catering orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card text-center" style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted, #888)", background: "#fff" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📦</div>
            <h4 style={{ margin: "0 0 6px 0", color: "var(--forest-dark, #1B301D)" }}>No orders match this view</h4>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>
              {searchTerm ? "No orders matched your search query." : "There are currently no orders under this status tab."}
            </p>
          </div>
        ) : (
          <div className="table-wrapper card" style={{ padding: 0, overflow: "hidden", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F7F9F6", borderBottom: "1px solid #E6ECE5" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Ref</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Event Details</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Package</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Review &amp; Quotation</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((item) => {
                  const orderId = item.orderId || item.id;
                  const matchedCustomer = customerMap.get(Number(item.customerId));
                  const matchedPackage = item.packageId ? packageMap.get(Number(item.packageId)) : null;
                  const matchedEvent = eventByOrderMap.get(Number(orderId));
                  const linkedQuotation = quotationByOrderMap.get(Number(orderId));

                  const statusStr = (item.status || "").toLowerCase();
                  const isPendingReview = statusStr === "pending verification" || statusStr === "under staff review" || statusStr === "pending";
                  const isQuotationReady = statusStr.includes("quotation ready") || statusStr.includes("quotation");
                  const isInventoryPanelOpen = checkingOrderId === orderId;

                  return (
                    <React.Fragment key={orderId}>
                      <tr style={{ borderBottom: "1px solid #EBEFEA" }}>
                        {/* Order Ref & Placed Date */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <strong style={{ fontSize: "1rem", color: "var(--forest-dark, #1B301D)" }}>
                            #{orderId}
                          </strong>
                          <small style={{ display: "block", color: "var(--text-muted, #5A655C)", marginTop: "3px", fontSize: "0.8rem" }}>
                            Placed: {formatDate(item.orderDate)}
                          </small>
                          {linkedQuotation && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "4px",
                                background: "#EEF2FF",
                                color: "#3730A3",
                                border: "1px solid #C7D2FE",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                              }}
                            >
                              Quote #{linkedQuotation.quotationId || linkedQuotation.id} ({linkedQuotation.status})
                            </span>
                          )}
                        </td>

                        {/* Customer */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          {matchedCustomer ? (
                            <div>
                              <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "0.95rem" }}>
                                {matchedCustomer.name}
                              </strong>
                              <small style={{ display: "block", color: "var(--text-muted, #5A655C)", marginTop: "2px", fontSize: "0.8rem" }}>
                                {matchedCustomer.phone && `📞 ${matchedCustomer.phone}`}
                              </small>
                              <small style={{ display: "block", color: "var(--text-muted, #5A655C)", fontSize: "0.8rem" }}>
                                {matchedCustomer.email}
                              </small>
                            </div>
                          ) : item.customerId ? (
                            <span>Customer #{item.customerId}</span>
                          ) : (
                            <span style={{ color: "#888", fontStyle: "italic" }}>Guest / Unlinked</span>
                          )}
                        </td>

                        {/* Event Details */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          {matchedEvent ? (
                            <div>
                              <strong style={{ color: "var(--forest-dark, #1B301D)", fontSize: "0.9rem" }}>
                                {matchedEvent.eventType || "Event"}
                              </strong>
                              <small style={{ display: "block", color: "var(--gold, #B8922A)", fontWeight: "600", marginTop: "2px" }}>
                                📅 {formatDate(matchedEvent.eventDate)}
                              </small>
                              <small style={{ display: "block", color: "var(--text-muted, #5A655C)", fontSize: "0.8rem" }}>
                                📍 {matchedEvent.location || matchedEvent.venue || "Venue TBD"} | 👥 {matchedEvent.guestCount || "—"} Guests
                              </small>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted, #5A655C)", fontSize: "0.85rem" }}>No event linked</span>
                          )}
                        </td>

                        {/* Package */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          {matchedPackage ? (
                            <div>
                              <span style={{ fontWeight: "600", color: "var(--forest-dark, #1B301D)", fontSize: "0.9rem" }}>
                                {matchedPackage.name}
                              </span>
                              <small style={{ display: "block", color: "var(--gold, #B8922A)", fontWeight: "600", marginTop: "2px" }}>
                                Rs. {Number(matchedPackage.price || 0).toLocaleString("en-LK")}
                              </small>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted, #5A655C)", fontStyle: "italic", fontSize: "0.85rem" }}>
                              Custom Menu
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                          <StatusBadge status={item.status || "Pending Verification"} />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "14px 16px", verticalAlign: "top", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                            
                            {/* Step 5 Task 1: Create or View Quotation Button for Quotation Ready Orders */}
                            {isQuotationReady && (
                              <button
                                id={`btn-quote-order-${orderId}`}
                                type="button"
                                className={`btn sm ${linkedQuotation ? "outline" : "gold"}`}
                                style={{
                                  fontWeight: "700",
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                }}
                                onClick={() => handleOpenQuotation(item)}
                              >
                                {linkedQuotation ? "📄 View Quotation" : "📝 Create Quotation"}
                              </button>
                            )}

                            {/* Step 4 Task 4: Review Button */}
                            <button
                              id={`btn-review-order-${orderId}`}
                              type="button"
                              className={`btn sm ${isPendingReview ? "gold" : "outline"}`}
                              style={{
                                fontWeight: "600",
                                padding: "6px 12px",
                                borderRadius: "6px",
                              }}
                              onClick={() => handleOpenReview(item)}
                            >
                              {isPendingReview ? "🔍 Review" : "Details"}
                            </button>

                            {/* Phase 3 Inventory check for Confirmed orders */}
                            {statusStr === "pending" && (
                              <button
                                type="button"
                                className="btn sm secondary"
                                style={{ borderRadius: "6px", padding: "6px 10px" }}
                                onClick={() => handleCheckInventory(orderId)}
                              >
                                {isInventoryPanelOpen ? "Close" : "Stock"}
                              </button>
                            )}

                            {/* Edit / Delete */}
                            <button
                              type="button"
                              className="btn sm secondary"
                              style={{ borderRadius: "6px", padding: "6px 8px" }}
                              onClick={() => handleEdit(item)}
                              title="Edit Order"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn sm danger"
                              style={{ borderRadius: "6px", padding: "6px 8px" }}
                              onClick={() => handleDelete(orderId)}
                              title="Delete Order"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Phase 3 Inventory Drawer */}
                      {isInventoryPanelOpen && (
                        <tr>
                          <td colSpan={6} style={{ padding: 0, border: "none" }}>
                            <InventoryCheckPanel
                              orderId={orderId}
                              loading={inventoryLoading}
                              result={inventoryResult}
                              error={inventoryError}
                              confirmMessage={confirmMessage}
                              confirming={confirming}
                              onConfirm={() => handleConfirmOrder(orderId)}
                              onClose={closeInventoryPanel}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STAFF QUOTATION CREATION / VIEW MODAL (Step 5 Task 1)   */}
      {/* ======================================================== */}
      {quotationModalOpen && quotationOrder && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 1060,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <div
            className="modal-content card"
            style={{
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "2rem",
              borderRadius: "12px",
              background: "#fff",
              boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
              boxSizing: "border-box",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #EBEFEA",
                paddingBottom: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "var(--gold, #B8922A)",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                  }}
                >
                  Financial Documentation Portal
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
                    fontSize: "1.75rem",
                    color: "var(--forest-dark, #1B301D)",
                    margin: "4px 0 0 0",
                  }}
                >
                  {quotationMode === "VIEW"
                    ? `Quotation #${existingQuotation?.quotationId || existingQuotation?.id} for Order #${quotationOrder.orderId || quotationOrder.id}`
                    : `Create Catering Quotation for Order #${quotationOrder.orderId || quotationOrder.id}`}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                {existingQuotation && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      borderRadius: "14px",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      background: existingQuotation.status === "Sent" ? "#D1FAE5" : "#FEF3C7",
                      color: existingQuotation.status === "Sent" ? "#065F46" : "#92400E",
                      border: `1px solid ${existingQuotation.status === "Sent" ? "#A7F3D0" : "#FCD34D"}`,
                    }}
                  >
                    Status: {existingQuotation.status}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleCloseQuotation}
                  style={{
                    display: "block",
                    marginTop: "6px",
                    background: "none",
                    border: "none",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    color: "#888",
                  }}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {quotationError && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid #EF4444",
                  borderRadius: "8px",
                  color: "#DC2626",
                  fontSize: "0.95rem",
                  marginBottom: "1.25rem",
                }}
              >
                ⚠️ {quotationError}
              </div>
            )}

            {quotationSuccess && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(39, 174, 96, 0.1)",
                  border: "1px solid #27AE60",
                  borderRadius: "8px",
                  color: "#1A8A4A",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  marginBottom: "1.25rem",
                }}
              >
                ✓ {quotationSuccess}
              </div>
            )}

            {/* Order & Event Summary Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                background: "#F9FBF8",
                padding: "1rem 1.25rem",
                borderRadius: "8px",
                border: "1px solid #E6ECE5",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <div>
                <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted, #5A655C)", fontWeight: "600" }}>
                  Customer
                </span>
                <strong style={{ color: "var(--forest-dark, #1B301D)" }}>
                  {quotationCustomer?.name || "Customer"}
                </strong>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #5A655C)" }}>
                  {quotationCustomer?.email}
                </div>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted, #5A655C)", fontWeight: "600" }}>
                  Event Logistics
                </span>
                <strong style={{ color: "var(--forest-dark, #1B301D)" }}>
                  {quotationEvent ? `${formatDate(quotationEvent.eventDate)} (${quotationEvent.guestCount} Guests)` : "To be confirmed"}
                </strong>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted, #5A655C)" }}>
                  {quotationEvent?.location || quotationEvent?.venue || "Venue TBD"}
                </div>
              </div>

              <div>
                <span style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted, #5A655C)", fontWeight: "600" }}>
                  Package
                </span>
                <strong style={{ color: "var(--forest-dark, #1B301D)" }}>
                  {quotationPackage?.name || "Custom Package"}
                </strong>
                <div style={{ fontSize: "0.8rem", color: "var(--gold, #B8922A)", fontWeight: "600" }}>
                  {quotationPackage?.price ? `Rs. ${Number(quotationPackage.price).toLocaleString("en-LK")} / person` : ""}
                </div>
              </div>
            </div>

            {/* QUOTATION ITEMIZATION SECTION */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--forest-dark, #1B301D)" }}>
                  Quotation Line Items
                </h3>
                {quotationMode === "CREATE" && (
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={handleAddQuotationItem}
                    style={{ borderRadius: "6px", fontSize: "0.85rem", padding: "4px 10px" }}
                  >
                    + Add Custom Item
                  </button>
                )}
              </div>

              {/* Table of Line Items */}
              <div style={{ overflowX: "auto", border: "1px solid #E6ECE5", borderRadius: "8px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#F7F9F6", borderBottom: "1px solid #E6ECE5" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", width: "45%" }}>Description</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", width: "18%" }}>Quantity</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", width: "20%" }}>Unit Price (Rs.)</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", width: "17%" }}>Line Total (Rs.)</th>
                      {quotationMode === "CREATE" && <th style={{ padding: "10px 8px", textAlign: "center", width: "40px" }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {quotationItemsList.map((item, idx) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const price = parseFloat(item.unitPrice) || 0;
                      const lineTotal = qty * price;

                      return (
                        <tr key={item.quotationItemId || idx} style={{ borderBottom: "1px solid #EBEFEA" }}>
                          {/* Description */}
                          <td style={{ padding: "8px 12px" }}>
                            {quotationMode === "CREATE" ? (
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleQuotationItemChange(idx, "description", e.target.value)}
                                placeholder="e.g. Buffet Service, Extra Desserts..."
                                style={{
                                  width: "100%",
                                  padding: "6px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #D4DDD5",
                                  fontSize: "0.88rem",
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : (
                              <strong style={{ color: "var(--forest-dark, #1B301D)" }}>{item.description}</strong>
                            )}
                          </td>

                          {/* Quantity */}
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            {quotationMode === "CREATE" ? (
                              <input
                                type="number"
                                min="1"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleQuotationItemChange(idx, "quantity", e.target.value)}
                                style={{
                                  width: "90px",
                                  textAlign: "right",
                                  padding: "6px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #D4DDD5",
                                  fontSize: "0.88rem",
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : (
                              <span>{item.quantity}</span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td style={{ padding: "8px 12px", textAlign: "right" }}>
                            {quotationMode === "CREATE" ? (
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unitPrice}
                                onChange={(e) => handleQuotationItemChange(idx, "unitPrice", e.target.value)}
                                style={{
                                  width: "110px",
                                  textAlign: "right",
                                  padding: "6px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #D4DDD5",
                                  fontSize: "0.88rem",
                                  boxSizing: "border-box",
                                }}
                              />
                            ) : (
                              <span>{Number(price).toLocaleString("en-LK", { minimumFractionDigits: 2 })}</span>
                            )}
                          </td>

                          {/* Line Total */}
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600", color: "var(--forest-dark, #1B301D)" }}>
                            {Number(lineTotal).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Delete Item (CREATE mode only) */}
                          {quotationMode === "CREATE" && (
                            <td style={{ padding: "8px 8px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuotationItem(idx)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#DC2626",
                                  cursor: "pointer",
                                  fontWeight: "bold",
                                  fontSize: "1rem",
                                }}
                                title="Remove line item"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#F9FBF8", borderTop: "2px solid #D4DDD5" }}>
                      <td colSpan={3} style={{ padding: "12px 14px", textAlign: "right", fontWeight: "700", fontSize: "1.05rem", color: "var(--forest-dark, #1B301D)" }}>
                        Total Quotation Amount (Rs.):
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", fontSize: "1.2rem", color: "var(--gold, #B8922A)" }}>
                        Rs. {Number(
                          quotationMode === "VIEW" && existingQuotation?.totalAmount != null
                            ? existingQuotation.totalAmount
                            : computedQuotationTotal
                        ).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                      </td>
                      {quotationMode === "CREATE" && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #EBEFEA", paddingTop: "1.25rem", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #5A655C)" }}>
                  Quotation Date: <strong>{formatDate(existingQuotation?.quotationDate || new Date())}</strong>
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn outline sm"
                  onClick={handleCloseQuotation}
                  disabled={submittingQuotation}
                  style={{ borderRadius: "6px" }}
                >
                  Close
                </button>

                {quotationMode === "CREATE" && (
                  <>
                    <button
                      id="btn-save-draft-quotation"
                      type="button"
                      className="btn secondary sm"
                      disabled={submittingQuotation}
                      onClick={() => handleSubmitQuotation("Draft")}
                      style={{ borderRadius: "6px", fontWeight: "600", padding: "8px 16px" }}
                    >
                      {submittingQuotation ? "Saving..." : "💾 Save as Draft"}
                    </button>

                    <button
                      id="btn-send-quotation"
                      type="button"
                      className="btn gold sm"
                      disabled={submittingQuotation}
                      onClick={() => handleSubmitQuotation("Sent")}
                      style={{ borderRadius: "6px", fontWeight: "700", padding: "8px 20px" }}
                    >
                      {submittingQuotation ? "Sending..." : "🚀 Send to Customer"}
                    </button>
                  </>
                )}

                {quotationMode === "VIEW" && existingQuotation?.status === "Draft" && (
                  <button
                    id="btn-send-existing-quotation"
                    type="button"
                    className="btn gold sm"
                    disabled={submittingQuotation}
                    onClick={handleSendExistingQuotation}
                    style={{ borderRadius: "6px", fontWeight: "700", padding: "8px 20px" }}
                  >
                    {submittingQuotation ? "Sending..." : "🚀 Send to Customer"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STAFF ORDER REVIEW MODAL (Step 4 Task 4)                */}
      {/* ======================================================== */}
      {reviewModalOpen && activeReviewOrder && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <div
            className="modal-content card"
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              borderRadius: "12px",
              background: "#fff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              boxSizing: "border-box",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #EBEFEA",
                paddingBottom: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    color: "var(--gold, #B8922A)",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                  }}
                >
                  Staff Order Review Portal
                </span>
                <h2
                  style={{
                    fontFamily: "var(--font-serif, 'Playfair Display', serif)",
                    fontSize: "1.75rem",
                    color: "var(--forest-dark, #1B301D)",
                    margin: "4px 0 0 0",
                  }}
                >
                  Review Order #{activeReviewOrder.orderId || activeReviewOrder.id}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <StatusBadge status={activeReviewOrder.status || "Pending Verification"} />
                <button
                  type="button"
                  onClick={handleCloseReview}
                  style={{
                    display: "block",
                    marginTop: "8px",
                    background: "none",
                    border: "none",
                    fontSize: "1.4rem",
                    cursor: "pointer",
                    color: "#888",
                  }}
                  title="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Loading Indicator */}
            {reviewLoading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted, #888)" }}>
                <div
                  style={{
                    display: "inline-block",
                    width: "36px",
                    height: "36px",
                    border: "3px solid rgba(184, 146, 42, 0.3)",
                    borderTopColor: "var(--gold, #B8922A)",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <p style={{ marginTop: "12px" }}>Loading order specifications and review logs...</p>
              </div>
            ) : (
              <div>
                {/* Alert Messages */}
                {reviewActionError && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "1px solid #EF4444",
                      borderRadius: "8px",
                      color: "#DC2626",
                      fontSize: "0.95rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    ⚠️ {reviewActionError}
                  </div>
                )}

                {reviewSuccessMessage && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(39, 174, 96, 0.1)",
                      border: "1px solid #27AE60",
                      borderRadius: "8px",
                      color: "#1A8A4A",
                      fontSize: "0.95rem",
                      fontWeight: "600",
                      marginBottom: "1.5rem",
                    }}
                  >
                    ✓ {reviewSuccessMessage}
                  </div>
                )}

                {/* Grid 1: Customer & Event Specifications */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {/* Customer Information Card */}
                  <div
                    style={{
                      background: "#F9FBF8",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px solid #E6ECE5",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--gold, #B8922A)",
                        fontWeight: "700",
                        marginBottom: "6px",
                      }}
                    >
                      Customer Information
                    </span>
                    {reviewCustomer ? (
                      <div>
                        <strong style={{ fontSize: "1.05rem", color: "var(--forest-dark, #1B301D)" }}>
                          {reviewCustomer.name}
                        </strong>
                        <div style={{ marginTop: "6px", fontSize: "0.9rem", color: "var(--forest-dark, #1B301D)" }}>
                          <div>📞 <strong>Phone:</strong> {reviewCustomer.phone || "N/A"}</div>
                          <div style={{ marginTop: "2px" }}>✉️ <strong>Email:</strong> {reviewCustomer.email}</div>
                          <div style={{ marginTop: "2px", color: "var(--text-muted, #5A655C)", fontSize: "0.8rem" }}>
                            Customer ID: #{reviewCustomer.customerId || reviewCustomer.id}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "#888" }}>Customer details unavailable</span>
                    )}
                  </div>

                  {/* Event Information Card */}
                  <div
                    style={{
                      background: "#F9FBF8",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px solid #E6ECE5",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--gold, #B8922A)",
                        fontWeight: "700",
                        marginBottom: "6px",
                      }}
                    >
                      Event Specifications
                    </span>
                    {reviewEvent ? (
                      <div style={{ fontSize: "0.9rem", color: "var(--forest-dark, #1B301D)" }}>
                        <div>📅 <strong>Event Date:</strong> {formatDate(reviewEvent.eventDate)}</div>
                        <div style={{ marginTop: "2px" }}>🎉 <strong>Event Type:</strong> {reviewEvent.eventType || "Catering Event"}</div>
                        <div style={{ marginTop: "2px" }}>📍 <strong>Venue / Location:</strong> {reviewEvent.location || reviewEvent.venue || "To be confirmed"}</div>
                        <div style={{ marginTop: "2px" }}>👥 <strong>Guest Count:</strong> {reviewEvent.guestCount} Guests</div>
                      </div>
                    ) : (
                      <span style={{ color: "#888" }}>No event schedule attached</span>
                    )}
                  </div>
                </div>

                {/* Catering Package Details */}
                <div
                  style={{
                    background: "#F9FBF8",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #E6ECE5",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--gold, #B8922A)",
                      fontWeight: "700",
                      marginBottom: "6px",
                    }}
                  >
                    Selected Catering Package
                  </span>
                  {reviewPackage ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                        <strong style={{ fontSize: "1.1rem", color: "var(--forest-dark, #1B301D)" }}>
                          {reviewPackage.name || reviewPackage.packageName}
                        </strong>
                        <span style={{ color: "var(--gold, #B8922A)", fontWeight: "700", fontSize: "1.05rem" }}>
                          Rs. {Number(reviewPackage.price || 0).toLocaleString("en-LK")}
                        </span>
                      </div>
                      {reviewPackage.description && (
                        <p style={{ margin: "6px 0 0 0", color: "var(--text-muted, #5A655C)", fontSize: "0.9rem", lineHeight: 1.4 }}>
                          {reviewPackage.description}
                        </p>
                      )}
                    </div>
                  ) : activeReviewOrder.packageId ? (
                    <span>Package #{activeReviewOrder.packageId}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted, #5A655C)", fontStyle: "italic" }}>
                      Custom Menu Selection (No Fixed Package)
                    </span>
                  )}
                </div>

                {/* Selected Menu Items */}
                <div
                  style={{
                    background: "#F9FBF8",
                    padding: "1.25rem",
                    borderRadius: "8px",
                    border: "1px solid #E6ECE5",
                    marginBottom: "1.5rem",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "var(--gold, #B8922A)",
                      fontWeight: "700",
                      marginBottom: "8px",
                    }}
                  >
                    Selected Menu Items ({reviewMenuItems.length} Items)
                  </span>

                  {reviewMenuItems.length > 0 ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #D4DDD5", color: "var(--text-muted, #5A655C)" }}>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>Menu Item</th>
                          <th style={{ textAlign: "left", padding: "6px 8px" }}>Category</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>Quantity</th>
                          <th style={{ textAlign: "right", padding: "6px 8px" }}>Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewMenuItems.map((item, idx) => (
                          <tr key={item.menuItemId || idx} style={{ borderBottom: "1px solid #EAEFE9" }}>
                            <td style={{ padding: "6px 8px", fontWeight: "600", color: "var(--forest-dark, #1B301D)" }}>
                              {item.menuItemName || `Item #${item.menuItemId}`}
                            </td>
                            <td style={{ padding: "6px 8px", color: "var(--text-muted, #5A655C)" }}>
                              {item.category || "—"}
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600" }}>
                              {item.quantity || 1}
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: "var(--gold, #B8922A)" }}>
                              {item.price ? `Rs. ${Number(item.price).toLocaleString("en-LK")}` : "Included"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <span style={{ color: "var(--text-muted, #5A655C)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      No individual menu items specified.
                    </span>
                  )}
                </div>

                {/* Special Requests */}
                {activeReviewOrder.specialRequests && (
                  <div
                    style={{
                      background: "#F9FBF8",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px solid #E6ECE5",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--gold, #B8922A)",
                        fontWeight: "700",
                        marginBottom: "4px",
                      }}
                    >
                      Customer Special Requests &amp; Dietary Notes
                    </span>
                    <p style={{ margin: 0, color: "var(--forest-dark, #1B301D)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                      {activeReviewOrder.specialRequests}
                    </p>
                  </div>
                )}

                {/* Status History & Previous Review Logs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1.25rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  {/* Status History */}
                  <div
                    style={{
                      background: "#F9FBF8",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px solid #E6ECE5",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--gold, #B8922A)",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      Order Status Timeline
                    </span>
                    {reviewStatusHistory.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {reviewStatusHistory.map((h, i) => (
                          <div
                            key={h.statusHistoryId || i}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.85rem",
                              borderBottom: "1px solid #EAEFE9",
                              paddingBottom: "4px",
                            }}
                          >
                            <span style={{ fontWeight: "600", color: "var(--forest-dark, #1B301D)" }}>
                              ✓ {h.status}
                            </span>
                            <span style={{ color: "var(--text-muted, #5A655C)", fontSize: "0.78rem" }}>
                              {formatDateTime(h.changedDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#888", fontSize: "0.85rem" }}>
                        Initial status: {activeReviewOrder.status || "Pending Verification"}
                      </span>
                    )}
                  </div>

                  {/* Past Staff Reviews */}
                  <div
                    style={{
                      background: "#F9FBF8",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px solid #E6ECE5",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--gold, #B8922A)",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      Past Staff Review Logs
                    </span>
                    {reviewHistory.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                        {reviewHistory.map((r, i) => (
                          <div
                            key={r.orderReviewId || i}
                            style={{
                              fontSize: "0.85rem",
                              borderBottom: "1px solid #EAEFE9",
                              paddingBottom: "6px",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong
                                style={{
                                  color:
                                    r.reviewStatus === "Approved"
                                      ? "#1A8A4A"
                                      : r.reviewStatus === "Rejected"
                                      ? "#C0392B"
                                      : "#B8922A",
                                }}
                              >
                                {r.reviewStatus} (Staff #{r.staffId})
                              </strong>
                              <span style={{ color: "var(--text-muted, #5A655C)", fontSize: "0.78rem" }}>
                                {formatDateTime(r.reviewDate)}
                              </span>
                            </div>
                            {r.comments && (
                              <p style={{ margin: "3px 0 0 0", color: "var(--forest-dark, #1B301D)", fontSize: "0.82rem" }}>
                                "{r.comments}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "#888", fontSize: "0.85rem" }}>No previous staff reviews recorded yet.</span>
                    )}
                  </div>
                </div>

                {/* STAFF REVIEW ACTION BOX */}
                <div
                  style={{
                    border: "2px solid var(--gold, #B8922A)",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    background: "rgba(184, 146, 42, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "8px" }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.15rem",
                        color: "var(--forest-dark, #1B301D)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>⚖️</span>
                      <span>Staff Decision &amp; Review Action</span>
                    </h3>

                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #5A655C)", background: "#fff", padding: "4px 10px", borderRadius: "20px", border: "1px solid #D4DDD5" }}>
                      Reviewing as: <strong>{user?.fullName || user?.username || "Staff Member"}</strong> (Staff #{user?.id || user?.staffId || 1})
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="review-comments" style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", marginBottom: "6px", color: "var(--forest-dark, #1B301D)" }}>
                      Review Comments &amp; Verification Notes
                    </label>
                    <textarea
                      id="review-comments"
                      rows={3}
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="e.g. Verified event date, guest count, and venue logistics. Ready for quotation preparation..."
                      disabled={submittingReview}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontFamily: "inherit",
                        fontSize: "0.95rem",
                        borderRadius: "8px",
                        border: "1px solid #D4DDD5",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                    <small style={{ display: "block", color: "var(--text-muted, #5A655C)", marginTop: "4px", fontSize: "0.78rem" }}>
                      * Comments are required for "Reject" and "Request Changes". Optional for "Approve".
                    </small>
                  </div>

                  {/* 3 Review Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button
                      id="btn-approve-order"
                      type="button"
                      className="btn gold"
                      disabled={submittingReview}
                      onClick={() => handleSubmitReview("Approved")}
                      style={{
                        padding: "10px 22px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        cursor: submittingReview ? "not-allowed" : "pointer",
                      }}
                    >
                      {submittingReview ? "Submitting..." : "✓ Approve Order"}
                    </button>

                    <button
                      id="btn-request-changes"
                      type="button"
                      className="btn secondary"
                      disabled={submittingReview}
                      onClick={() => handleSubmitReview("Changes Requested")}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: submittingReview ? "not-allowed" : "pointer",
                        border: "1px solid #D4DDD5",
                      }}
                    >
                      {submittingReview ? "Submitting..." : "✎ Request Changes"}
                    </button>

                    <button
                      id="btn-reject-order"
                      type="button"
                      className="btn danger"
                      disabled={submittingReview}
                      onClick={() => handleSubmitReview("Rejected")}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: submittingReview ? "not-allowed" : "pointer",
                      }}
                    >
                      {submittingReview ? "Submitting..." : "✕ Reject Order"}
                    </button>
                  </div>
                </div>

                {/* Footer Modal Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem", borderTop: "1px solid #EBEFEA", paddingTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn outline sm"
                    onClick={handleCloseReview}
                    style={{ borderRadius: "6px" }}
                  >
                    Close Review Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE / EDIT ORDER MODAL                                */}
      {/* ======================================================== */}
      {showEditModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            zIndex: 1050,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            boxSizing: "border-box",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "580px",
              padding: "2rem",
              borderRadius: "12px",
              background: "#fff",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, color: "var(--forest-dark, #1B301D)" }}>
              {editingId ? `Edit Order #${editingId}` : "Create New Catering Order"}
            </h3>

            <form onSubmit={handleSubmitForm} noValidate>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="customer-select" style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", marginBottom: "4px" }}>
                  Customer <span style={{ color: "var(--gold, #B8922A)" }}>*</span>
                </label>
                <select
                  id="customer-select"
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">-- Select Customer ({customers.length} available) --</option>
                  {customers.map((c) => (
                    <option key={c.customerId || c.id} value={c.customerId || c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
                {fieldErrors.customerId && (
                  <small style={{ color: "#E74C3C", display: "block", marginTop: "4px" }}>{fieldErrors.customerId}</small>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="package-select" style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", marginBottom: "4px" }}>
                  Catering Package
                </label>
                <select
                  id="package-select"
                  value={form.packageId}
                  onChange={(e) => setForm({ ...form, packageId: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="">Custom Package / Menu Items Only</option>
                  {packages.map((pkg) => (
                    <option key={pkg.packageId || pkg.id} value={pkg.packageId || pkg.id}>
                      {pkg.name || pkg.packageName} - Rs. {Number(pkg.price || 0).toLocaleString("en-LK")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label htmlFor="order-status-select" style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", marginBottom: "4px" }}>
                  Order Status
                </label>
                <select
                  id="order-status-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Under Staff Review">Under Staff Review</option>
                  <option value="Quotation Ready">Quotation Ready</option>
                  <option value="Customer Confirmation Pending">Customer Confirmation Pending</option>
                  <option value="Payment Pending">Payment Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "1.25rem" }}>
                <label htmlFor="order-special-requests" style={{ display: "block", fontSize: "0.88rem", fontWeight: "600", marginBottom: "4px" }}>
                  Special Requests
                </label>
                <textarea
                  id="order-special-requests"
                  rows={3}
                  value={form.specialRequests}
                  onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  placeholder="Special requests or dietary instructions..."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn gold sm" disabled={submitting}>
                  {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/**
 * Phase 3 - Inventory Check Panel Component
 */
function InventoryCheckPanel({ orderId, loading, result, error, confirmMessage, confirming, onConfirm, onClose }) {
  return (
    <div
      style={{
        margin: "0 0 8px 0",
        padding: "20px 24px",
        backgroundColor: "var(--surface, #fff)",
        border: "2px solid var(--border, #e0e0e0)",
        borderTop: "none",
        borderRadius: "0 0 8px 8px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <strong style={{ fontSize: "1rem" }}>Inventory Check - Order #{orderId}</strong>
          {result && (
            <small style={{ display: "block", color: "var(--muted, #888)", marginTop: 2 }}>
              Package: {result.packageName} | Guests: {result.guestCount}
            </small>
          )}
        </div>
        <button type="button" className="btn secondary sm" onClick={onClose} disabled={confirming}>
          Close
        </button>
      </div>

      {loading && (
        <div style={{ padding: "16px 0", color: "var(--muted, #888)", textAlign: "center" }}>
          Checking inventory requirements...
        </div>
      )}

      {!loading && error && !confirmMessage && (
        <div style={{ padding: "12px 16px", backgroundColor: "rgba(231, 76, 60, 0.08)", border: "1px solid rgba(231, 76, 60, 0.25)", borderRadius: "6px", color: "#c0392b", marginBottom: "12px" }}>
          {error}
        </div>
      )}

      {confirmMessage && (
        <div style={{ padding: "12px 16px", backgroundColor: "rgba(39, 174, 96, 0.1)", border: "1px solid rgba(39, 174, 96, 0.3)", borderRadius: "6px", color: "#1a8a4a", fontWeight: 600, marginBottom: "12px" }}>
          {confirmMessage}
        </div>
      )}

      {!loading && result && result.items && result.items.length > 0 && (
        <div>
          <div style={{ padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", backgroundColor: result.canConfirm ? "rgba(39, 174, 96, 0.1)" : "rgba(231, 76, 60, 0.08)", border: `1px solid ${result.canConfirm ? "rgba(39, 174, 96, 0.3)" : "rgba(231, 76, 60, 0.25)"}`, color: result.canConfirm ? "#1a8a4a" : "#c0392b", fontWeight: 600 }}>
            {result.message}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border, #e0e0e0)" }}>
                  <th style={{ textAlign: "left", padding: "8px 10px" }}>Ingredient</th>
                  <th style={{ textAlign: "right", padding: "8px 10px" }}>Required</th>
                  <th style={{ textAlign: "right", padding: "8px 10px" }}>Available</th>
                  <th style={{ textAlign: "right", padding: "8px 10px" }}>Shortage</th>
                  <th style={{ textAlign: "center", padding: "8px 10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((ing) => (
                  <tr key={ing.inventoryItemId} style={{ borderBottom: "1px solid var(--border, #e8e8e8)", backgroundColor: ing.sufficient ? "transparent" : "rgba(231, 76, 60, 0.04)" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 500 }}>{ing.ingredientName}</td>
                    <td style={{ textAlign: "right", padding: "8px 10px" }}>{ing.requiredQuantity} {ing.unit}</td>
                    <td style={{ textAlign: "right", padding: "8px 10px" }}>{ing.availableQuantity != null ? ing.availableQuantity : "-"} {ing.unit}</td>
                    <td style={{ textAlign: "right", padding: "8px 10px", color: ing.shortage > 0 ? "#c0392b" : "#888" }}>{ing.shortage > 0 ? `${ing.shortage} ${ing.unit}` : "-"}</td>
                    <td style={{ textAlign: "center", padding: "8px 10px" }}>
                      {ing.sufficient ? (
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", backgroundColor: "rgba(39, 174, 96, 0.12)", color: "#1a8a4a", fontWeight: 600, fontSize: "0.8rem" }}>OK</span>
                      ) : (
                        <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", backgroundColor: "rgba(231, 76, 60, 0.12)", color: "#c0392b", fontWeight: 600, fontSize: "0.8rem" }}>Shortage</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.canConfirm && !confirmMessage && (
            <div style={{ marginTop: 16 }}>
              <button id={`btn-confirm-order-${orderId}`} type="button" className="btn" onClick={onConfirm} disabled={confirming}>
                {confirming ? "Confirming..." : "Confirm Order and Deduct Stock"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
