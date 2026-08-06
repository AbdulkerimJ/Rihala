# Architecture

## Overview

The backend follows a modular Express application structure. Requests enter the Express app, pass through shared middleware, and are handled by a module-specific controller/service/model flow.

The web frontend follows a matching feature-slice structure. Each domain module owns its API wrapper, pages, and supporting components, while shared layout, auth state, and UI primitives live in top-level frontend folders.

```text
Express
  ↓
Routes
  ↓
Middleware
  ├── Authentication
  ├── Authorization
  └── Validation
  ↓
Controllers
  ↓
Services
  ↓
Mongoose Models
  ↓
MongoDB
```

---

## Main Architecture Layers

### Routes

Routes are mounted in [backend/src/app.js](../backend/src/app.js) under versioned API prefixes.

**Current implemented route prefixes:**

```text
/api/v1/auth
/api/v1/users
/api/v1/roles
/api/v1/permissions
/api/v1/expenses
/api/v1/customers
/api/v1/orders
/api/v1/employees
/api/v1/employee-rates
/api/v1/attendances
/api/v1/overtimes
/api/v1/weekly-payrolls
/api/v1/employee-payments
/api/v1/suppliers
/api/v1/materials
/api/v1/purchases
/api/v1/supplier-payments
/api/v1/customer-payments
```

On the frontend, routes are declared in [web/src/app/router.jsx](../web/src/app/router.jsx) and split into auth routes and protected application routes under [web/src/layouts/AuthLayout.jsx](../web/src/layouts/AuthLayout.jsx) and [web/src/layouts/DashboardLayout.jsx](../web/src/layouts/DashboardLayout.jsx).

---

### Middleware

Shared middleware is implemented in:

- [backend/src/core/middleware/authenticate.js](../backend/src/core/middleware/authenticate.js) for JWT authentication
- [backend/src/core/middleware/authorize.js](../backend/src/core/middleware/authorize.js) for permission-based authorization
- [backend/src/core/middleware/validate.js](../backend/src/core/middleware/validate.js) for request validation

---

### Controllers and Services

Each module follows a controller-service pattern. Controllers receive validated requests and return responses. Services contain the business logic and interact with the persistence layer.

---

### Models and Persistence

The backend uses Mongoose models for persistence. Database connectivity is handled by [backend/src/core/database/mongodb.js](../backend/src/core/database/mongodb.js).

---

## Shared Infrastructure

### Error Handling

Centralized error handling is implemented in [backend/src/core/middleware/errorHandler.js](../backend/src/core/middleware/errorHandler.js) and [backend/src/core/middleware/notFoundHandler.js](../backend/src/core/middleware/notFoundHandler.js).

### Async Handling

The shared wrapper in [backend/src/core/utils/catchAsync.js](../backend/src/core/utils/catchAsync.js) ensures async controller errors are passed to the error middleware.

### Validation

Request validation is implemented with Zod schemas and the shared validation middleware.

### Authentication

Authentication uses JWT access tokens and persisted refresh tokens. The current implementation also supports password reset and invitation-based onboarding through verification tokens.

The frontend keeps the access token in memory only. Web refresh tokens stay in HttpOnly cookies, and the Axios client in [web/src/api/axios.js](../web/src/api/axios.js) automatically attaches the bearer access token when present. A refresh attempt is made on 401 responses and during app bootstrap in [web/src/context/AuthContext.jsx](../web/src/context/AuthContext.jsx).

### Authorization

Authorization is based on permissions assigned to roles. The authorization middleware resolves the user's permissions dynamically from their assigned roles and checks the required permission name.

The frontend mirrors this through `hasPermission` in [web/src/context/AuthContext.jsx](../web/src/context/AuthContext.jsx), the `Can` component in [web/src/components/Can.jsx](../web/src/components/Can.jsx), and permission-guarded route entries in [web/src/app/router.jsx](../web/src/app/router.jsx). This is a UX layer only; backend authorization remains authoritative.

### Query Utilities

The shared query utility in [backend/src/core/utils/query.js](../backend/src/core/utils/query.js) handles pagination, search, filtering, sorting, and filter transforms. Modules define their own allowed query behavior through module-specific configuration objects.

---

## Transaction Architecture

Financial operations that affect multiple documents use MongoDB session-based transactions.

**Why transactions are used:**

Financial mutations (payment creation, allocation updates) must be atomic. A partial write — for example, creating a payment record but failing to update the Purchase's `allocatedAmount` — would leave the database in an inconsistent state. Transactions guarantee that either all operations succeed or none are persisted.

**Current transactional flows:**

- **CustomerPayment creation**: Reads the Order, calculates active payments, checks remaining balance, and creates the payment — all within a single session. Rollback on any failure.
- **SupplierPayment creation**: Creates the payment document, runs the allocation engine against Purchases, and updates `allocatedAmount` and `paymentStatus` on each affected Purchase — all within a single session. The allocation service (`allocation.service.js`) accepts the session parameter and propagates it into all sub-operations.
- **SupplierPayment update (amount change)**: Reconciles allocations and Purchase balances within a transaction to maintain consistency.

**Session propagation:**

The session is started in the service layer and passed explicitly into the allocation engine functions. This ensures that all reads and writes within a transactional flow use the same session, enabling atomicity and rollback.

**Rollback behavior:**

If any step within a transaction throws an error (e.g., overpayment validation, supplier not found, Purchase not found), the entire transaction is rolled back. No partial state is persisted to the database.

**Concurrency protection:**

Transaction isolation prevents race conditions where two concurrent payment requests could both pass the balance check independently before either is written.

**Development Environment Limitation:**

> Local MongoDB may be running as a standalone instance. MongoDB transactions require a replica set. Transaction-dependent operations will fail or must be skipped in a standalone local environment.

Do not claim that transaction tests passed if they were skipped because of this limitation. Do not modify the MongoDB configuration as part of documentation work.

---

## Domain Relationship Architecture

```text
Customer
   │
   ▼
Order ───────────────► CustomerPayment
   │                   (money in, voiding supported)
   │
   └────────────── production lifecycle
                   (pending → in_progress → ready → completed | cancelled)


Supplier
   │
   ▼
Purchase ────────────► SupplierPayment
                          │          (SPECIFIC or GENERAL)
                          ▼
                   Allocation Engine
                   (allocations[], unallocatedAmount)


Employee
   │
   ├──────────────► EmployeeRate
   │                (daily-rate history, effective dates)
   │
   ├──────────────► Attendance + Overtime
   │
   ├──────────────► WeeklyPayroll
   │                (dynamic OPEN calc → CLOSED snapshot)
   │
   └──────────────► EmployeePayment
                    (money out, standalone, type-classified)


Expense
   │
   ▼
Standalone business outflow
(not a supplier payment, not an employee payment)
```

---

## Module Structure

### Current implemented modules

```text
backend/src/modules/
├── auth/                    (implemented)
├── users/                   (implemented)
├── roles/                   (implemented)
├── permissions/             (implemented)
├── expenses/                (implemented — with voiding)
├── customers/               (implemented)
├── orders/                  (implemented — full status lifecycle)
├── customerPayments/        (implemented — void supported, transaction-bounded)
├── employees/               (implemented)
├── employeeRates/           (implemented — daily-rate history)
├── attendances/             (implemented — morning/afternoon, Mon–Sat)
├── overtimes/               (implemented — HALF_DAY / FULL_DAY, 2× rate)
├── weeklyPayrolls/          (implemented — dynamic calc + CLOSED snapshots)
├── employeePayments/        (implemented — type-classified, void supported)
├── suppliers/               (implemented)
├── materials/               (implemented — catalog with categories/units)
├── purchases/               (implemented — structured items, allocation-tracked)
└── supplierPayments/        (implemented — SPECIFIC/GENERAL, allocation engine)
```

### Deferred / planned modules

```text
├── contractors/             (planned)
│   └── contractor           — Contractor profiles
│
└── contracts/               (planned)
    └── contract             — Contracts/deals between workshop and contractors
```

The exact file names within each planned module should follow the existing naming convention used by implemented modules (e.g., `contractor.model.js`, `contractor.service.js`, `contractor.controller.js`, `contractor.routes.js`, `contractor.validation.js`).

---

## Frontend Modules

The implemented frontend modules currently cover:

- Auth: login, logout, invitation acceptance, forgot password, reset password
- Users: list, detail, invite, edit, activate/deactivate, delete/restore
- Roles: list, create, edit, delete
- Permissions: list
- Expenses: list, filter, create, edit, void
- Customers: list, create, edit
- Orders: list, detail, create, edit, status progression

> Note: Frontend coverage for newer backend modules (Suppliers, Purchases, SupplierPayments, CustomerPayments, EmployeePayments) may be partial or pending. The backend is the authoritative implementation.

---

## Module Query Configuration Pattern

The architecture uses a two-level query design:

1. Module query configuration defines what a module allows.
2. The shared query utility defines how the query is executed.

This pattern is used consistently across Expenses, Customers, Orders, Employees, Employee Rates, Attendances, Overtimes, WeeklyPayrolls, EmployeePayments, Suppliers, Materials, Purchases, SupplierPayments, and CustomerPayments.

---

## Logging

The application uses Morgan in development mode and console logging for invitation and password-reset flows.
