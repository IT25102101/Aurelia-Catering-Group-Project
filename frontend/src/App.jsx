import { Routes, Route } from "react-router-dom";
import RequireRole from "./components/RequireRole";
import ScrollToTop from "./components/common/ScrollToTop";

// Public pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MenuPage from "./pages/dashboards/MenuPage";
import PackagesPage from "./pages/PackagesPage";
import PublicEventsPage from "./pages/PublicEventsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import EventBookingPage from "./pages/EventBookingPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";

// Management pages — one per major function (Section 6 of the proposal)
import EventsPage from "./pages/EventsPage";
import MenuItemsPage from "./pages/dashboards/MenuItemsPage";
import CateringPackagesPage from "./pages/CateringPackagesPage";
import OrdersPage from "./pages/OrdersPage";
import InventoryItemsPage from "./pages/InventoryItemsPage";
import DeliveriesPage from "./pages/DeliveriesPage";
import StaffPage from "./pages/dashboards/StaffPage";
import RecipesPage from "./pages/RecipesPage";

// Role dashboards — where each stakeholder lands after login
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import OperationsSupervisorDashboard from "./pages/dashboards/OperationsSupervisorDashboard";
import KitchenStaffDashboard from "./pages/dashboards/KitchenStaffDashboard";
import DeliveryStaffDashboard from "./pages/DeliveryStaffDashboard";
import FinanceOfficerDashboard from "./pages/dashboards/FinanceOfficerDashboard";
import InventoryCoordinatorDashboard from "./pages/dashboards/InventoryCoordinatorDashboard";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import CustomerQuotationsPage from "./pages/CustomerQuotationsPage";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* ---------- Public pages, no login needed ---------- */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/events" element={<PublicEventsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/event-booking" element={<EventBookingPage />} />
      <Route path="/track" element={<OrderTrackingPage />} />

      {/* ---------- Protected Management Pages (Role-Guarded) ---------- */}
      <Route
        path="/manage/events"
        element={
          <RequireRole allowedRoles={["ADMIN", "OPERATIONS_SUPERVISOR"]}>
            <EventsPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/menu-items"
        element={
          <RequireRole allowedRoles={["ADMIN", "KITCHEN_STAFF"]}>
            <MenuItemsPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/catering-packages"
        element={
          <RequireRole allowedRoles={["ADMIN"]}>
            <CateringPackagesPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/orders"
        element={
          <RequireRole allowedRoles={["ADMIN", "MANAGER", "OPERATIONS_SUPERVISOR", "KITCHEN_STAFF", "FINANCE_OFFICER"]}>
            <OrdersPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/inventory"
        element={
          <RequireRole allowedRoles={["ADMIN", "MANAGER", "INVENTORY_COORDINATOR", "KITCHEN_STAFF"]}>
            <InventoryItemsPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/deliveries"
        element={
          <RequireRole allowedRoles={["ADMIN", "MANAGER", "OPERATIONS_SUPERVISOR", "DELIVERY_STAFF"]}>
            <DeliveriesPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/staff"
        element={
          <RequireRole allowedRoles={["ADMIN", "MANAGER", "OPERATIONS_SUPERVISOR"]}>
            <StaffPage />
          </RequireRole>
        }
      />
      <Route
        path="/manage/recipes"
        element={
          <RequireRole allowedRoles={["ADMIN", "MANAGER", "KITCHEN_STAFF"]}>
            <RecipesPage />
          </RequireRole>
        }
      />

      {/* ---------- One dashboard route per stakeholder role ---------- */}
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/dashboard/manager" element={<AdminDashboard />} />
      <Route path="/dashboard/operations_supervisor" element={<OperationsSupervisorDashboard />} />
      <Route path="/dashboard/kitchen_staff" element={<KitchenStaffDashboard />} />
      <Route path="/dashboard/delivery_staff" element={<DeliveryStaffDashboard />} />
      <Route path="/dashboard/finance_officer" element={<FinanceOfficerDashboard />} />
      <Route path="/dashboard/inventory_coordinator" element={<InventoryCoordinatorDashboard />} />
      <Route path="/dashboard/customer" element={<CustomerDashboard />} />

      {/* ---------- Customer Quotation Portal ---------- */}
      <Route
        path="/customer/quotations"
        element={
          <RequireRole allowedRoles={["CUSTOMER"]}>
            <CustomerQuotationsPage />
          </RequireRole>
        }
      />
    </Routes>
    </>
  );
}


