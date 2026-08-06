# Software Requirements Specification (SRS)

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Purpose

Develop a modern management system that helps furniture workshops manage daily operations through a secure, scalable, and easy-to-use application.

---

# Project Scope

The current implementation covers the complete backend foundation for internal administration, business operations, financial payment domains, employee management, and supplier/purchase management. The system is intended for internal use by the business owner and staff.

---

# Functional Requirements

## Implemented

### Authentication

The system currently supports:

- email/password login
- logout with refresh-token revocation
- JWT access tokens
- persisted refresh tokens
- password reset through verification tokens
- invitation-based user onboarding
- authentication middleware for protected routes

### User Management

The system currently supports:

- creating invited users
- activating and deactivating users
- soft-deleting and restoring users
- assigning and removing roles
- viewing users and user details

### Role and Permission Management

The system currently supports:

- managing roles
- managing permissions
- assigning permissions to roles
- enforcing permission-based authorization

### Expense Management

The system currently supports:

- recording expenses with category, amount, description, and business date
- updating active expenses
- viewing expenses
- voiding expenses (with reason, voidedBy, voidedAt)
- fixed expense category enumeration (Transport, Electricity, Rent, Water, Internet, Maintenance, Tools & Equipment, Office Supplies, Marketing, Taxes & Fees, Other)
- pagination, search, sorting, filtering, date-range filtering, and amount-range filtering
- active expenses as the default result set
- voided expenses accessible for historical/audit queries
- no hard deletion of expense records

### Customer Management

The system currently supports:

- creating customers
- updating customers
- viewing customer information
- customer phone normalization for Ethiopian numbers
- customer status management (active/inactive)
- preventing inactive customers from being used for new Orders
- no hard deletion of customer records

### Order Management

The system currently supports:

- capturing customer furniture requests as Orders
- human-readable sequential order numbers (e.g., `ORD-1001`)
- required business `date` separate from `createdAt` system timestamp
- customer identity snapshots (`customerName`, `customerPhone`)
- structured `items[]` with description, quantity, unit, and optional specifications
- manually negotiated `agreedAmount`
- `expectedCompletionDate`
- order status lifecycle: `pending` → `in_progress` → `ready` → `completed` (or `cancelled`)
- status history audit log
- PATCH-based status progression (no separate status-change endpoint)
- no hard deletion of Order records

### Customer Payment Management

The system currently supports:

- recording payments received from a customer against a specific Order
- snapshotting `customerName` and `orderNumber` at creation
- preventing payment that exceeds the Order's remaining unpaid balance
- preventing payment on a cancelled Order
- preventing payment on a fully paid Order
- voiding payments (with reason, voidedBy, voidedAt)
- updating the `note` field on active payments
- listing payments (defaulting to `status: "active"`)
- no hard deletion of CustomerPayment records
- transaction-bounded payment creation for atomicity

### Employee Management

The system currently supports:

- managing employee profiles (name, contact details, employment start and end dates, status)
- maintaining a history of daily-rate changes per employee (`EmployeeRate`)
- recording and tracking daily attendance (morning and afternoon half-day records, Mon–Sat)
- recording overtime with date, duration (`HALF_DAY` / `FULL_DAY`), and optional note (2× daily rate)
- dynamically calculating current WeeklyPayroll based on attendance, overtime, and a continuous period (since employment start or last closure)
- identifying missing required attendance that blocks payroll closure
- closing payroll to create a permanent historical snapshot with `status: "CLOSED"`

### Employee Payment Management

The system currently supports:

- recording actual payments made to employees (`EmployeePayment`)
- payment type classification: `regular`, `overtime`, `bonus`, `advance`, `other`
- snapshotting `employeeName` at creation
- enforcing that only active employees can receive new payments
- tracking payment history independently from WeeklyPayroll
- filtering payments by employee, date range, and payment type
- voiding employee payments (with void permission)
- no hard deletion of EmployeePayment records

### Supplier Management

The system currently supports:

- creating and updating supplier profiles (name, phone, address, note, status)
- active/inactive supplier status
- phone normalization for suppliers
- listing and viewing suppliers
- no hard deletion of supplier records

### Material Management

The system currently supports:

- creating and updating material catalog entries (name, category, unit, status)
- material categories: MDF, Wood, Fabric, Nails, Paint, Adhesives, Hardware, Chemicals, Other
- material units: piece, kg, meter, liter, roll
- active/inactive material status
- listing and viewing materials

### Purchase Management

The system currently supports:

- recording material purchases from suppliers
- human-readable sequential purchase numbers
- structured `items[]` referencing the material catalog (with quantity, unit, unitPrice, subtotal)
- material name and category snapshots on purchase items
- `totalAmount` calculated from item subtotals
- `allocatedAmount` and `paymentStatus` managed by the allocation engine
- `remainingAmount` virtual field
- listing and viewing purchases
- no hard deletion of Purchase records

### Supplier Payment Management

The system currently supports:

- recording SPECIFIC payments (for a single Purchase)
- recording GENERAL payments (auto-allocated to outstanding Purchases, oldest-first)
- unique `paymentReference` per payment
- the Supplier Payment Allocation Engine:
  - automatic allocation of GENERAL payments to outstanding Purchases
  - allocation of existing supplier credit to new Purchases
  - reconciliation when payment amounts change
  - prevention of overpayment on Purchases
- `unallocatedAmount` tracking (supplier credit) on GENERAL payments
- `allocations[]` sub-documents linking payments to Purchases
- transaction-bounded payment operations
- listing and viewing supplier payments
- no hard deletion of SupplierPayment records

---

## Planned

### Contractor Management

Planned future functionality includes:

- managing contractor profiles
- associating contractors with contracts/agreements

### Contract Management

Planned future functionality includes:

- creating and updating contracts
- tracking contract status
- associating contracts with contractors

### Dashboard

Planned future functionality includes:

- business summaries
- expense reports
- recent activity
- operational statistics

---

# Non-Functional Requirements

## Performance

- Fast response times.
- Efficient database queries.

## Security

- JWT authentication
- HttpOnly cookies for web refresh tokens
- password hashing
- permission-based RBAC
- input validation (Zod)

## Usability

- mobile-first interface
- responsive design
- simple user experience

## Maintainability

- module-based architecture
- reusable query utilities
- clean code
- RESTful API

## Scalability

The architecture should support future features including inventory, production management, reports, AI features, and a mobile application.

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Zod (validation)

---

# Future Scope

Features intentionally excluded from the current implementation include:

- contractor and contract management
- inventory management
- production tracking
- advanced reporting
- AI insights
- Flutter mobile application

These remain future releases.

---

# Success Criteria

The current backend is successful when it can:

- secure internal access to the application
- manage users and roles responsibly
- support expense tracking with void-based integrity
- maintain customer records and orders
- record customer payments against orders with balance enforcement
- track employee attendance, payroll, and payments
- record supplier purchases and payments with automatic allocation
- provide a solid foundation for the planned workshop modules
