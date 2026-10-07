package com.aurelia.catering.dao;

import com.aurelia.catering.util.PasswordUtil;
import com.aurelia.catering.db.DBConnection;
import com.aurelia.catering.model.GuestOrderRequest;
import com.aurelia.catering.model.InventoryCheckItem;
import com.aurelia.catering.model.InventoryCheckResult;
import com.aurelia.catering.model.Order;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Data Access Object for Order.
 * Matches table [Order] in AureliaCatering2:
 * Columns: OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate
 */
@Repository
public class OrderDao {

    // ---------- READ (all orders) ----------
    public List<Order> getAllOrders() {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate FROM [Order]";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                list.add(mapRow(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching all orders: " + e.getMessage(), e);
        }
        return list;
    }

    public List<Order> getAll() {
        return getAllOrders();
    }

    // ---------- READ (by OrderID) ----------
    public Order getOrderById(int orderId) {
        String sql = "SELECT OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate FROM [Order] WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapRow(rs);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching order with id " + orderId + ": " + e.getMessage(), e);
        }
        return null;
    }

    public Order getById(int id) {
        return getOrderById(id);
    }

    // ---------- READ (by CustomerID) ----------
    public List<Order> getOrdersByCustomerId(int customerId) {
        List<Order> list = new ArrayList<>();
        String sql = "SELECT OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate FROM [Order] WHERE CustomerID = ? ORDER BY OrderID DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, customerId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRow(rs));
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error fetching orders for customer " + customerId + ": " + e.getMessage(), e);
        }
        return list;
    }

    // ---------- CREATE ----------
    public Order createOrder(Order order) {
        int newId = 1;
        String idSql = "SELECT ISNULL(MAX(OrderID), 0) + 1 FROM [Order]";
        String insertSql = "INSERT INTO [Order] (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection()) {
            if (order.getOrderId() != null && order.getOrderId() > 0) {
                newId = order.getOrderId();
            } else {
                try (PreparedStatement idStmt = conn.prepareStatement(idSql);
                     ResultSet rs = idStmt.executeQuery()) {
                    if (rs.next()) {
                        newId = rs.getInt(1);
                    }
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                stmt.setInt(1, newId);
                stmt.setInt(2, order.getCustomerId());
                if (order.getPackageId() != null) {
                    stmt.setInt(3, order.getPackageId());
                } else {
                    stmt.setNull(3, Types.INTEGER);
                }

                LocalDate orderDate = order.getOrderDate() != null ? order.getOrderDate() : LocalDate.now();
                stmt.setDate(4, Date.valueOf(orderDate));

                String status = order.getStatus() != null && !order.getStatus().trim().isEmpty() ? order.getStatus() : "Pending Verification";
                stmt.setString(5, status);
                stmt.setString(6, order.getSpecialRequests());

                if (order.getPreparedByStaffId() != null) {
                    stmt.setInt(7, order.getPreparedByStaffId());
                } else {
                    stmt.setNull(7, Types.INTEGER);
                }

                if (order.getCustomerConfirmedDate() != null) {
                    stmt.setDate(8, Date.valueOf(order.getCustomerConfirmedDate()));
                } else {
                    stmt.setNull(8, Types.DATE);
                }

                stmt.executeUpdate();
            }

            order.setOrderId(newId);

            // Ensure Customer_Account exists for customerId
            if (order.getCustomerId() != null && order.getCustomerId() > 0) {
                try {
                    boolean accExists = false;
                    try (PreparedStatement checkStmt = conn.prepareStatement("SELECT AccountID FROM Customer_Account WHERE CustomerID = ?")) {
                        checkStmt.setInt(1, order.getCustomerId());
                        try (ResultSet rs = checkStmt.executeQuery()) {
                            if (rs.next()) accExists = true;
                        }
                    }

                    if (!accExists) {
                        String custPhone = null;
                        try (PreparedStatement cStmt = conn.prepareStatement("SELECT Phone FROM Customer WHERE CustomerID = ?")) {
                            cStmt.setInt(1, order.getCustomerId());
                            try (ResultSet rs = cStmt.executeQuery()) {
                                if (rs.next()) {
                                    custPhone = rs.getString("Phone");
                                }
                            }
                        }
                        if (custPhone != null && !custPhone.trim().isEmpty() && !"N/A".equalsIgnoreCase(custPhone.trim())) {
                            int newAccId = 1;
                            try (PreparedStatement nextIdStmt = conn.prepareStatement("SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Customer_Account");
                                 ResultSet rs = nextIdStmt.executeQuery()) {
                                if (rs.next()) newAccId = rs.getInt(1);
                            }
                            try (PreparedStatement insStmt = conn.prepareStatement(
                                    "INSERT INTO Customer_Account (AccountID, CustomerID, PasswordHash, AccountStatus, CreatedDate) VALUES (?, ?, ?, 'Active', GETDATE())")) {
                                insStmt.setInt(1, newAccId);
                                insStmt.setInt(2, order.getCustomerId());
                                insStmt.setString(3, PasswordUtil.hash(custPhone.trim()));
                                insStmt.executeUpdate();
                            }
                        }
                    }
                } catch (SQLException ex) {
                    // Non-fatal auto-account creation check
                }
            }
        } catch (SQLException e) {
            throw new RuntimeException("Error creating order: " + e.getMessage(), e);
        }
        return order;
    }

    public Order create(Order order) {
        return createOrder(order);
    }

    // ---------- ATOMIC GUEST ORDER CREATION (CUSTOMER + ORDER + EVENT + AUTO CUSTOMER_ACCOUNT) ----------
    public Map<String, Object> createGuestOrder(GuestOrderRequest req) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin Transaction

            // 1. Find or create Customer
            Integer customerId = null;
            String email = req.getEmail() != null ? req.getEmail().trim() : "";
            String phone = req.getPhone() != null ? req.getPhone().trim() : "";

            if (!email.isEmpty()) {
                try (PreparedStatement s = conn.prepareStatement("SELECT CustomerID, Phone, Email FROM Customer WHERE LOWER(Email) = LOWER(?)")) {
                    s.setString(1, email);
                    try (ResultSet rs = s.executeQuery()) {
                        if (rs.next()) {
                            customerId = rs.getInt(1);
                            if (phone.isEmpty() && rs.getString("Phone") != null) {
                                phone = rs.getString("Phone");
                            }
                        }
                    }
                }
            }

            if (customerId == null && !phone.isEmpty()) {
                try (PreparedStatement s = conn.prepareStatement("SELECT CustomerID, Phone, Email FROM Customer WHERE Phone = ?")) {
                    s.setString(1, phone);
                    try (ResultSet rs = s.executeQuery()) {
                        if (rs.next()) {
                            customerId = rs.getInt(1);
                            if (email.isEmpty() && rs.getString("Email") != null) {
                                email = rs.getString("Email");
                            }
                        }
                    }
                }
            }

            if (customerId == null) {
                // Phone number is required for new customer auto-account password generation
                if (phone.isEmpty() || "N/A".equalsIgnoreCase(phone)) {
                    throw new SQLException("Customer phone number is required to automatically create customer portal account.");
                }

                // Create new Customer
                try (PreparedStatement sId = conn.prepareStatement("SELECT ISNULL(MAX(CustomerID), 0) + 1 FROM Customer");
                     ResultSet rs = sId.executeQuery()) {
                    rs.next();
                    customerId = rs.getInt(1);
                }

                try (PreparedStatement s = conn.prepareStatement("INSERT INTO Customer (CustomerID, Name, Phone, Email) VALUES (?, ?, ?, ?)")) {
                    s.setInt(1, customerId);
                    s.setString(2, req.getName() != null && !req.getName().trim().isEmpty() ? req.getName().trim() : "Guest Customer");
                    s.setString(3, phone);
                    s.setString(4, !email.isEmpty() ? email : "guest@aurelia.lk");
                    s.executeUpdate();
                }
            }

            // 1b. Automatic Customer Account Creation (Initial Password = Customer's Registered Phone Number)
            boolean isNewAccountCreated = false;
            boolean accountExists = false;
            try (PreparedStatement sAcc = conn.prepareStatement("SELECT AccountID FROM Customer_Account WHERE CustomerID = ?")) {
                sAcc.setInt(1, customerId);
                try (ResultSet rs = sAcc.executeQuery()) {
                    if (rs.next()) {
                        accountExists = true;
                    }
                }
            }

            String activeCustomerPhone = phone;
            String activeCustomerEmail = email;
            // Fetch customer details from Customer table to ensure exact registered phone number is used
            try (PreparedStatement sCust = conn.prepareStatement("SELECT Phone, Email FROM Customer WHERE CustomerID = ?")) {
                sCust.setInt(1, customerId);
                try (ResultSet rs = sCust.executeQuery()) {
                    if (rs.next()) {
                        String p = rs.getString("Phone");
                        String em = rs.getString("Email");
                        if (p != null && !p.trim().isEmpty() && !"N/A".equalsIgnoreCase(p.trim())) {
                            activeCustomerPhone = p.trim();
                        }
                        if (em != null && !em.trim().isEmpty()) {
                            activeCustomerEmail = em.trim();
                        }
                    }
                }
            }

            if (!accountExists) {
                if (activeCustomerPhone == null || activeCustomerPhone.trim().isEmpty() || "N/A".equalsIgnoreCase(activeCustomerPhone.trim())) {
                    throw new SQLException("Cannot auto-create customer account: Customer phone number is missing or invalid.");
                }

                int newAccountId;
                try (PreparedStatement nextAccStmt = conn.prepareStatement("SELECT ISNULL(MAX(AccountID), 0) + 1 FROM Customer_Account");
                     ResultSet rs = nextAccStmt.executeQuery()) {
                    rs.next();
                    newAccountId = rs.getInt(1);
                }

                try (PreparedStatement accInsertStmt = conn.prepareStatement(
                        "INSERT INTO Customer_Account (AccountID, CustomerID, PasswordHash, AccountStatus, CreatedDate) VALUES (?, ?, ?, 'Active', GETDATE())")) {
                    accInsertStmt.setInt(1, newAccountId);
                    accInsertStmt.setInt(2, customerId);
                    accInsertStmt.setString(3, PasswordUtil.hash(activeCustomerPhone.trim())); // Business Rule: Phone number is initial password
                    accInsertStmt.executeUpdate();
                }
                isNewAccountCreated = true;
            }

            // 2. Create Order
            int newOrderId;
            try (PreparedStatement sId = conn.prepareStatement("SELECT ISNULL(MAX(OrderID), 0) + 1 FROM [Order]");
                 ResultSet rs = sId.executeQuery()) {
                rs.next();
                newOrderId = rs.getInt(1);
            }

            String insertOrderSql = "INSERT INTO [Order] (OrderID, CustomerID, PackageID, OrderDate, Status, SpecialRequests, PreparedByStaffID, CustomerConfirmedDate) VALUES (?, ?, ?, CAST(GETDATE() AS DATE), 'Pending Verification', ?, NULL, NULL)";
            try (PreparedStatement s = conn.prepareStatement(insertOrderSql)) {
                s.setInt(1, newOrderId);
                s.setInt(2, customerId);

                if (req.getPackageId() != null && req.getPackageId() > 0) {
                    s.setInt(3, req.getPackageId());
                } else {
                    s.setNull(3, Types.INTEGER);
                }

                s.setString(4, req.getSpecialRequests());
                s.executeUpdate();
            }

            // 3. Create Event
            int newEventId;
            try (PreparedStatement sId = conn.prepareStatement("SELECT ISNULL(MAX(EventID), 0) + 1 FROM [Event]");
                 ResultSet rs = sId.executeQuery()) {
                rs.next();
                newEventId = rs.getInt(1);
            }

            String insertEventSql = "INSERT INTO [Event] (EventID, OrderID, EventDate, Location, GuestCount, EventType) VALUES (?, ?, ?, ?, ?, ?)";
            try (PreparedStatement s = conn.prepareStatement(insertEventSql)) {
                s.setInt(1, newEventId);
                s.setInt(2, newOrderId);

                LocalDate eventDate = req.getEventDate() != null ? req.getEventDate() : LocalDate.now().plusDays(7);
                s.setDate(3, Date.valueOf(eventDate));

                String location = req.getLocation() != null && !req.getLocation().trim().isEmpty() 
                        ? req.getLocation().trim() 
                        : (req.getVenue() != null && !req.getVenue().trim().isEmpty() ? req.getVenue().trim() : "To be confirmed");
                s.setString(4, location);

                int guestCount = req.getGuestCount() != null && req.getGuestCount() > 0 ? req.getGuestCount() : 50;
                s.setInt(5, guestCount);

                String eventType = req.getEventType() != null && !req.getEventType().trim().isEmpty() ? req.getEventType().trim() : "Other";
                s.setString(6, eventType);

                s.executeUpdate();
            }

            // 4. Create Order Menu Items if provided
            if (req.getMenuItems() != null && !req.getMenuItems().isEmpty()) {
                String insertItemSql = "INSERT INTO Order_Menu_Item (OrderID, MenuItemID, Quantity) VALUES (?, ?, ?)";
                try (PreparedStatement sItem = conn.prepareStatement(insertItemSql)) {
                    for (GuestOrderRequest.GuestOrderItem item : req.getMenuItems()) {
                        if (item.getMenuItemId() != null && item.getMenuItemId() > 0) {
                            sItem.setInt(1, newOrderId);
                            sItem.setInt(2, item.getMenuItemId());
                            sItem.setInt(3, item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1);
                            sItem.executeUpdate();
                        }
                    }
                }
            }

            conn.commit(); // Commit transaction!

            Map<String, Object> result = new HashMap<>();
            result.put("orderId", newOrderId);
            result.put("id", newOrderId); // compatibility alias
            result.put("customerId", customerId);
            result.put("eventId", newEventId);
            result.put("status", "Pending Verification");
            result.put("message", "Your catering order has been submitted successfully.");
            result.put("accountCreated", isNewAccountCreated);
            result.put("username", activeCustomerEmail);
            result.put("phone", activeCustomerPhone);
            if (isNewAccountCreated) {
                result.put("initialPassword", activeCustomerPhone);
            }
            return result;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException rbEx) {
                    // Suppress rollback exception
                }
            }
            throw new RuntimeException("Transaction failed while creating guest order: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException closeEx) {
                    // Suppress close exception
                }
            }
        }
    }

    // ---------- UPDATE ----------
    public Order updateOrder(Order order) {
        if (order.getStatus() != null && "Preparing".equals(normalizeOrderStatus(order.getStatus()))) {
            Order current = getOrderById(order.getOrderId());
            if (current != null && !"Preparing".equals(current.getStatus())) {
                startPreparation(order.getOrderId());   // throws IllegalStateException when stock is short
            }
        }
        String sql = "UPDATE [Order] SET CustomerID = ?, PackageID = ?, OrderDate = ?, Status = ?, SpecialRequests = ?, PreparedByStaffID = ?, CustomerConfirmedDate = ? WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, order.getCustomerId());
            if (order.getPackageId() != null) {
                stmt.setInt(2, order.getPackageId());
            } else {
                stmt.setNull(2, Types.INTEGER);
            }

            LocalDate orderDate = order.getOrderDate() != null ? order.getOrderDate() : LocalDate.now();
            stmt.setDate(3, Date.valueOf(orderDate));

            String status = order.getStatus() != null && !order.getStatus().trim().isEmpty() ? order.getStatus() : "Pending Verification";
            stmt.setString(4, status);
            stmt.setString(5, order.getSpecialRequests());

            if (order.getPreparedByStaffId() != null) {
                stmt.setInt(6, order.getPreparedByStaffId());
            } else {
                stmt.setNull(6, Types.INTEGER);
            }

            if (order.getCustomerConfirmedDate() != null) {
                stmt.setDate(7, Date.valueOf(order.getCustomerConfirmedDate()));
            } else {
                stmt.setNull(7, Types.DATE);
            }

            stmt.setInt(8, order.getOrderId());
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Error updating order " + order.getOrderId() + ": " + e.getMessage(), e);
        }
        return order;
    }

    public Order update(int id, Order order) {
        order.setOrderId(id);
        return updateOrder(order);
    }

    // ---------- UPDATE STATUS ----------
    public void updateOrderStatus(int orderId, String rawStatus) {
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status cannot be empty.");
        }

        String status = normalizeOrderStatus(rawStatus);

        // Moving to Preparing needs ingredients: check stock and deduct it in the same transaction
        if ("Preparing".equals(status)) {
            startPreparation(orderId);
            return;
        }

        String sql = "UPDATE [Order] SET Status = ? WHERE OrderID = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, status);
            stmt.setInt(2, orderId);
            int rows = stmt.executeUpdate();
            if (rows == 0) {
                throw new IllegalArgumentException("Order #" + orderId + " not found.");
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error updating status for order " + orderId + ": " + e.getMessage(), e);
        }
    }

    // ---------- INVENTORY CHECK / CONFIRM (Phase 3) ----------

    /**
     * Read-only stock check: for every ingredient used by the order's menu items
     * (order quantity x recipe amount per serving), compares the need with the stock level.
     * Returns null when the order does not exist.
     */
    public InventoryCheckResult checkInventory(int orderId) {
        try (Connection conn = DBConnection.getConnection()) {
            return checkInventory(conn, orderId);
        } catch (SQLException e) {
            throw new RuntimeException("Error checking inventory for order " + orderId + ": " + e.getMessage(), e);
        }
    }

    private InventoryCheckResult checkInventory(Connection conn, int orderId) throws SQLException {
        Integer guestCount = null;
        String packageName = null;

        String headerSql = "SELECT e.GuestCount, p.PackageName " +
                "FROM [Order] o " +
                "LEFT JOIN [Event] e ON e.OrderID = o.OrderID " +
                "LEFT JOIN CateringPackage p ON p.PackageID = o.PackageID " +
                "WHERE o.OrderID = ?";
        try (PreparedStatement stmt = conn.prepareStatement(headerSql)) {
            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                int guests = rs.getInt(1);
                guestCount = rs.wasNull() ? null : guests;
                packageName = rs.getString(2);
            }
        }

        // dbo.GetInventoryNeedForOrder is the table function created in Aurelia_Database.sql
        String itemsSql = "SELECT i.InventoryItemID, i.ItemName, i.Unit, n.RequiredQty, i.Quantity " +
                "FROM dbo.GetInventoryNeedForOrder(?) n " +
                "INNER JOIN Inventory_Item i ON i.InventoryItemID = n.InventoryItemID " +
                "ORDER BY i.ItemName";

        List<InventoryCheckItem> items = new ArrayList<>();
        StringBuilder shortList = new StringBuilder();
        try (PreparedStatement stmt = conn.prepareStatement(itemsSql)) {
            stmt.setInt(1, orderId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    double required = rs.getDouble("RequiredQty");
                    double available = rs.getDouble("Quantity");
                    boolean sufficient = available >= required;
                    double shortage = sufficient ? 0.0 : required - available;
                    items.add(new InventoryCheckItem(rs.getInt("InventoryItemID"), rs.getString("ItemName"),
                            required, available, shortage, rs.getString("Unit"), sufficient, false));
                    if (!sufficient) {
                        if (shortList.length() > 0) {
                            shortList.append(", ");
                        }
                        shortList.append(rs.getString("ItemName"));
                    }
                }
            }
        }

        boolean canConfirm = shortList.length() == 0;
        String message;
        if (items.isEmpty()) {
            message = "No recipes are linked to the menu items of this order, so no stock will be deducted.";
        } else if (canConfirm) {
            message = "All ingredients are available.";
        } else {
            message = "Insufficient stock for: " + shortList + ".";
        }

        InventoryCheckResult result = new InventoryCheckResult(orderId, guestCount, packageName, canConfirm, message);
        result.setItems(items);
        return result;
    }

    /**
     * Confirms an order: deducts the ingredients from stock (stored procedure
     * dbo.DeductInventoryForOrder) and sets the status to Confirmed (if it was an earlier
     * status), in ONE transaction. Rejected, Cancelled and Delivered orders are refused.
     * If any ingredient is short, nothing is changed and the result has canConfirm = false.
     * Returns null when the order does not exist.
     */
    public InventoryCheckResult confirmOrder(int orderId) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            String status;
            boolean deducted;
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT Status, InventoryDeducted FROM [Order] WHERE OrderID = ?")) {
                stmt.setInt(1, orderId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (!rs.next()) {
                        conn.rollback();
                        return null;
                    }
                    status = rs.getString("Status");
                    deducted = rs.getBoolean("InventoryDeducted");
                }
            }

            InventoryCheckResult result = checkInventory(conn, orderId);

            if ("Rejected".equals(status) || "Cancelled".equals(status) || "Delivered".equals(status)) {
                conn.rollback();
                result.setCanConfirm(false);
                result.setMessage("Order #" + orderId + " is " + status + " and cannot be confirmed.");
                return result;
            }
            if (!result.isCanConfirm()) {
                conn.rollback();
                return result; // message already lists the missing ingredients
            }

            if (!deducted) {
                try (CallableStatement call = conn.prepareCall("{call dbo.DeductInventoryForOrder(?)}")) {
                    call.setInt(1, orderId);
                    call.execute();
                }
            }
            // never move an order backwards: only earlier statuses become Confirmed
            if (!"Confirmed".equals(status) && !"Preparing".equals(status) && !"Ready for Delivery".equals(status)) {
                try (PreparedStatement stmt = conn.prepareStatement(
                        "UPDATE [Order] SET Status = 'Confirmed' WHERE OrderID = ?")) {
                    stmt.setInt(1, orderId);
                    stmt.executeUpdate();
                }
            }

            conn.commit();
            result.setMessage(deducted
                    ? "Order #" + orderId + " was already confirmed; stock had already been deducted."
                    : "Order #" + orderId + " confirmed and stock deducted.");
            return result;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ignored) {
                    // nothing more to do
                }
            }
            // 50062 = not enough stock (raised by the stored procedure when stock changed meanwhile)
            if (e.getErrorCode() == 50062) {
                InventoryCheckResult failed = new InventoryCheckResult(orderId, null, null, false, e.getMessage());
                return failed;
            }
            throw new RuntimeException("Error confirming order " + orderId + ": " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException ignored) {
                    // nothing more to do
                }
            }
        }
    }

    /**
     * Moves an order to Preparing. In ONE transaction it checks the stock, deducts the ingredients
     * (stored procedure dbo.DeductInventoryForOrder, once per order) and sets the status.
     * Throws IllegalStateException with a readable message when an ingredient is short, and
     * IllegalArgumentException when the order does not exist. Nothing changes in either case.
     */
    public void startPreparation(int orderId) {
        Connection conn = null;
        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false);

            boolean deducted;
            String status;
            try (PreparedStatement stmt = conn.prepareStatement(
                    "SELECT Status, InventoryDeducted FROM [Order] WHERE OrderID = ?")) {
                stmt.setInt(1, orderId);
                try (ResultSet rs = stmt.executeQuery()) {
                    if (!rs.next()) {
                        conn.rollback();
                        throw new IllegalArgumentException("Order #" + orderId + " not found.");
                    }
                    status = rs.getString("Status");
                    deducted = rs.getBoolean("InventoryDeducted");
                }
            }

            if ("Rejected".equals(status) || "Cancelled".equals(status) || "Delivered".equals(status)) {
                conn.rollback();
                throw new IllegalStateException("Order #" + orderId + " is " + status + " and cannot be prepared.");
            }

            if (!deducted) {
                InventoryCheckResult check = checkInventory(conn, orderId);
                if (check != null && !check.isCanConfirm()) {
                    conn.rollback();
                    throw new IllegalStateException(check.getMessage());
                }
                try (CallableStatement call = conn.prepareCall("{call dbo.DeductInventoryForOrder(?)}")) {
                    call.setInt(1, orderId);
                    call.execute();
                }
            }

            try (PreparedStatement stmt = conn.prepareStatement(
                    "UPDATE [Order] SET Status = 'Preparing' WHERE OrderID = ?")) {
                stmt.setInt(1, orderId);
                stmt.executeUpdate();
            }
            conn.commit();

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    conn.rollback();
                } catch (SQLException ignored) {
                    // nothing more to do
                }
            }
            if (e.getErrorCode() == 50062) {   // stock changed between the check and the deduction
                throw new IllegalStateException(e.getMessage(), e);
            }
            throw new RuntimeException("Error starting preparation for order " + orderId + ": " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException ignored) {
                    // nothing more to do
                }
            }
        }
    }

    public static String normalizeOrderStatus(String raw) {
        if (raw == null) return "Pending Verification";
        String s = raw.trim().toLowerCase().replace("_", " ").replace("-", " ");
        if (s.contains("pending verification")) return "Pending Verification";
        if (s.contains("under staff") || s.contains("review")) return "Under Staff Review";
        if (s.contains("quotation ready") || s.contains("quotation")) return "Quotation Ready";
        if (s.contains("customer confirmation")) return "Customer Confirmation Pending";
        if (s.contains("payment pending") || s.contains("payment")) return "Payment Pending";
        if (s.contains("confirm")) return "Confirmed";
        if (s.contains("prepar") || s.contains("cooking")) return "Preparing";
        if (s.contains("ready") || s.contains("dispatch")) return "Ready for Delivery";
        if (s.contains("deliv")) return "Delivered";
        if (s.contains("reject")) return "Rejected";
        if (s.contains("cancel")) return "Cancelled";
        return raw.trim(); // Return as-is if already matched
    }

    // ---------- DELETE ----------
    public void deleteOrder(int orderId) {
        try (Connection conn = DBConnection.getConnection()) {
            // Remove linked history, event, reviews, requests, quotations, and order menu items first to satisfy foreign keys
            try (PreparedStatement s0 = conn.prepareStatement(
                    "DELETE FROM Quotation_Item WHERE QuotationID IN (SELECT QuotationID FROM Quotation WHERE OrderID = ?)")) {
                s0.setInt(1, orderId);
                s0.executeUpdate();
            }

            try (PreparedStatement s01 = conn.prepareStatement("DELETE FROM Quotation WHERE OrderID = ?")) {
                s01.setInt(1, orderId);
                s01.executeUpdate();
            }

            try (PreparedStatement s1 = conn.prepareStatement("DELETE FROM Order_Status_History WHERE OrderID = ?")) {
                s1.setInt(1, orderId);
                s1.executeUpdate();
            }

            try (PreparedStatement s2 = conn.prepareStatement("DELETE FROM [Event] WHERE OrderID = ?")) {
                s2.setInt(1, orderId);
                s2.executeUpdate();
            }

            try (PreparedStatement s3 = conn.prepareStatement("DELETE FROM Order_Review WHERE OrderID = ?")) {
                s3.setInt(1, orderId);
                s3.executeUpdate();
            }

            try (PreparedStatement s4 = conn.prepareStatement("DELETE FROM Order_Request WHERE OrderID = ?")) {
                s4.setInt(1, orderId);
                s4.executeUpdate();
            }

            try (PreparedStatement sP = conn.prepareStatement("DELETE FROM Payment WHERE OrderID = ?")) {
                sP.setInt(1, orderId);
                sP.executeUpdate();
            }

            try (PreparedStatement sM = conn.prepareStatement("DELETE FROM Order_Menu_Item WHERE OrderID = ?")) {
                sM.setInt(1, orderId);
                sM.executeUpdate();
            }

            try (PreparedStatement stmt = conn.prepareStatement("DELETE FROM [Order] WHERE OrderID = ?")) {
                stmt.setInt(1, orderId);
                stmt.executeUpdate();
            }

        } catch (SQLException e) {
            throw new RuntimeException("Error deleting order " + orderId + ": " + e.getMessage(), e);
        }
    }

    public void delete(int id) {
        deleteOrder(id);
    }

    /** Helper method to map ResultSet row to Order object */
    private Order mapRow(ResultSet rs) throws SQLException {
        Order order = new Order();
        order.setOrderId(rs.getInt("OrderID"));
        order.setCustomerId(rs.getInt("CustomerID"));
        order.setPackageId(rs.getObject("PackageID") != null ? rs.getInt("PackageID") : null);

        Date orderDate = rs.getDate("OrderDate");
        order.setOrderDate(orderDate != null ? orderDate.toLocalDate() : null);

        order.setStatus(rs.getString("Status"));
        order.setSpecialRequests(rs.getString("SpecialRequests"));
        order.setPreparedByStaffId(rs.getObject("PreparedByStaffID") != null ? rs.getInt("PreparedByStaffID") : null);

        Date confirmedDate = rs.getDate("CustomerConfirmedDate");
        order.setCustomerConfirmedDate(confirmedDate != null ? confirmedDate.toLocalDate() : null);

        return order;
    }
}
