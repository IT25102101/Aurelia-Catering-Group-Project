# 04 - Order management

Part of the **Aurelia Catering System** (Spring Boot + React + SQL Server).

| | |
|---|---|
| Module | Order management |
| Member | ______________________ |
| Student ID | ______________________ |
| Files in this package | 26 |

## Files in this package

**Database (SQL)**
- `SQL_Modules/04_Order_Management.sql`

**Backend - controller**
- `backend/src/main/java/com/aurelia/catering/controller/OrderController.java`
- `backend/src/main/java/com/aurelia/catering/controller/OrderMenuItemController.java`
- `backend/src/main/java/com/aurelia/catering/controller/OrderRequestController.java`
- `backend/src/main/java/com/aurelia/catering/controller/OrderReviewController.java`
- `backend/src/main/java/com/aurelia/catering/controller/OrderStatusHistoryController.java`

**Backend - dao**
- `backend/src/main/java/com/aurelia/catering/dao/OrderDao.java`
- `backend/src/main/java/com/aurelia/catering/dao/OrderMenuItemDao.java`
- `backend/src/main/java/com/aurelia/catering/dao/OrderRequestDao.java`
- `backend/src/main/java/com/aurelia/catering/dao/OrderReviewDao.java`
- `backend/src/main/java/com/aurelia/catering/dao/OrderStatusHistoryDao.java`

**Backend - model**
- `backend/src/main/java/com/aurelia/catering/model/GuestOrderRequest.java`
- `backend/src/main/java/com/aurelia/catering/model/Order.java`
- `backend/src/main/java/com/aurelia/catering/model/OrderMenuItem.java`
- `backend/src/main/java/com/aurelia/catering/model/OrderRequest.java`
- `backend/src/main/java/com/aurelia/catering/model/OrderReview.java`
- `backend/src/main/java/com/aurelia/catering/model/OrderStatusHistory.java`
- `backend/src/main/java/com/aurelia/catering/model/OrderTracking.java`

**Frontend - api**
- `frontend/src/api/orderApi.js`
- `frontend/src/api/orderMenuItemApi.js`
- `frontend/src/api/orderReviewApi.js`

**Frontend - components**
- `frontend/src/components/CartDrawer.jsx`

**Frontend - context**
- `frontend/src/context/CartContext.jsx`

**Frontend - pages**
- `frontend/src/pages/OrderTrackingPage.jsx`
- `frontend/src/pages/OrdersPage.jsx`

**Frontend - pages/dashboards**
- `frontend/src/pages/dashboards/OperationsSupervisorDashboard.jsx`

## API endpoints of this module

| Method | Path |
|---|---|
| GET | `/api/orders` |
| GET | `/api/orders/{id}` |
| GET | `/api/orders/customer/{customerId}` |
| POST | `/api/orders` |
| POST | `/api/orders/guest` |
| PUT | `/api/orders/{id}` |
| PUT | `/api/orders/{id}/status` |
| GET | `/api/orders/{id}/inventory-check` |
| POST | `/api/orders/{id}/confirm` |
| DELETE | `/api/orders/{id}` |
| GET | `/api/order-menu-items/order/{orderId}` |
| POST | `/api/order-menu-items` |
| DELETE | `/api/order-menu-items/{orderId}/{menuItemId}` |
| GET | `/api/order-requests` |
| GET | `/api/order-requests/{id}` |
| GET | `/api/order-requests/order/{orderId}` |
| POST | `/api/order-requests` |
| PUT | `/api/order-requests/{id}` |
| DELETE | `/api/order-requests/{id}` |
| GET | `/api/order-reviews` |
| GET | `/api/order-reviews/{id}` |
| GET | `/api/order-reviews/order/{orderId}` |
| POST | `/api/order-reviews` |
| PUT | `/api/order-reviews/{id}` |
| DELETE | `/api/order-reviews/{id}` |
| GET | `/api/order-status-history` |
| GET | `/api/order-status-history/{id}` |
| GET | `/api/order-status-history/order/{orderId}` |
| POST | `/api/order-status-history` |
| DELETE | `/api/order-status-history/{id}` |

## Database

Run `SQL_Modules/04_Order_Management.sql` in SQL Server Management Studio. It is standalone and has the six assignment parts (design, tables, sample data, five queries, one stored procedure, one trigger).

## Works together with

Some of your files use files that belong to these other packages:

- 01 Staff management
- 02 Menu management
- 03 Package management
- 05 Event management
- 06 Delivery management
- 07 Inventory and recipes

## How to upload to GitHub

1. Extract this zip. You get a folder `aurelia-catering-system` that holds only your files, in their final folders.
2. Open the shared repository on GitHub, choose **Add file > Upload files**, and drag in the folders inside `aurelia-catering-system` (for example `backend`, `frontend`, `SQL_Modules`, `docs`).
3. Write the commit message `Add Order management module` and press **Commit changes**.

With Git instead:

```
git clone <repository-url>
cd <repository-folder>
# copy the folders from aurelia-catering-system into this folder
git add .
git commit -m "Add Order management module"
git push
```

**Rules:** upload only the files in this package, do not edit files that belong to another member, and never commit a real database password (use the `AURELIA_DB_PASSWORD` environment variable).
