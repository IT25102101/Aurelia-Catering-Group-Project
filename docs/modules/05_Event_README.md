# 05 - Event management

Part of the **Aurelia Catering System** (Spring Boot + React + SQL Server).

| | |
|---|---|
| Module | Event management |
| Member | ______________________ |
| Student ID | ______________________ |
| Files in this package | 8 |

## Files in this package

**Database (SQL)**
- `SQL_Modules/05_Event_Management.sql`

**Backend - controller**
- `backend/src/main/java/com/aurelia/catering/controller/EventController.java`

**Backend - dao**
- `backend/src/main/java/com/aurelia/catering/dao/EventDao.java`

**Backend - model**
- `backend/src/main/java/com/aurelia/catering/model/Event.java`

**Frontend - api**
- `frontend/src/api/eventApi.js`

**Frontend - pages**
- `frontend/src/pages/EventBookingPage.jsx`
- `frontend/src/pages/EventsPage.jsx`
- `frontend/src/pages/PublicEventsPage.jsx`

## API endpoints of this module

| Method | Path |
|---|---|
| GET | `/api/events` |
| GET | `/api/events/{id}` |
| GET | `/api/events/order/{orderId}` |
| POST | `/api/events` |
| PUT | `/api/events/{id}` |
| DELETE | `/api/events/{id}` |

## Database

Run `SQL_Modules/05_Event_Management.sql` in SQL Server Management Studio. It is standalone and has the six assignment parts (design, tables, sample data, five queries, one stored procedure, one trigger).

## Works together with

Some of your files use files that belong to these other packages:

- 03 Package management
- 04 Order management

## How to upload to GitHub

1. Extract this zip. You get a folder `aurelia-catering-system` that holds only your files, in their final folders.
2. Open the shared repository on GitHub, choose **Add file > Upload files**, and drag in the folders inside `aurelia-catering-system` (for example `backend`, `frontend`, `SQL_Modules`, `docs`).
3. Write the commit message `Add Event management module` and press **Commit changes**.

With Git instead:

```
git clone <repository-url>
cd <repository-folder>
# copy the folders from aurelia-catering-system into this folder
git add .
git commit -m "Add Event management module"
git push
```

**Rules:** upload only the files in this package, do not edit files that belong to another member, and never commit a real database password (use the `AURELIA_DB_PASSWORD` environment variable).
