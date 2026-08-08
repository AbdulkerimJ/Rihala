# Business Analysis

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Business Overview

Rihala is a furniture manufacturing business management system. The current implementation covers the complete operational foundation needed for secure access, internal administration, expense tracking, customer and order management, employee lifecycle and payroll, supplier and purchase management, and the full set of financial payment domains.

---

# Current Business Goals

The system currently supports the business in:

- organizing internal user access through secure authentication
- managing roles and permissions
- tracking operating expenses (with void support)
- maintaining customer records
- managing customer orders and their production lifecycle
- managing employees, daily rates, attendance, overtime, and weekly payroll
- recording employee payments with type classification
- managing suppliers and material purchases
- recording and allocating supplier payments
- recording customer payments against orders

The broader business goal remains to reduce manual record-keeping and improve operational visibility over time.

---

# Stakeholders

## Business Owner

Responsible for managing the business and making operational decisions.

Needs:

- reliable internal access control
- clear visibility into expenses, payments, and customer orders
- employee compensation and payroll tracking
- supplier purchase and payment tracking
- a platform that can grow into broader workshop management

---

## Internal Staff

Internal staff use the system as system users. The backend supports internal user accounts with role-based permissions.

---

## Customers

Customers are business contacts maintained in the system. They are separate from system users and are associated with Orders. Customer Payments are recorded against Orders.

---

# Current Implementation Scope

## Implemented business areas

- User management
- Authentication and session handling
- Role and permission management
- Operating expense management (with voiding)
- Customer management
- Order management (full lifecycle)
- Customer Payment management (against Orders)
- Employee management
- Employee rate history (daily-rate model)
- Attendance and overtime recording
- Payroll calculation (WeeklyPayroll — dynamic and closed snapshots)
- Employee Payment management (with type classification)
- Supplier management
- Material catalog management
- Purchase management
- Supplier Payment management (with allocation engine)

## Deferred / Not Yet Implemented

- Contractor management
- Contract management
- Dashboard and reporting
- Advanced analytics and AI insights

---

# Business Terminology

## Employee

An Employee is a regular worker employed directly by the workshop. Employees work under an agreed daily rate and are subject to the daily attendance and payroll workflow.

Employees are distinct from system users. An employee is a workshop worker; a system user is someone who logs into the Rihala application.

---

## Contractor

A Contractor is a person who works with the workshop under a negotiated contract/deal rather than through the daily-rate attendance model. Contractors do not participate in the employee attendance, overtime, or payroll workflow.

> **Deferred:** Contractor management is not currently implemented.

---

## Contract

A Contract is an agreement or deal between the workshop and a Contractor. Each contractor may be associated with one or more contracts.

> **Deferred:** Contract management is not currently implemented.

---

## Customer Order

A Customer Order represents a customer's furniture request. Orders are fully implemented.

Implemented order details include:

- customer reference (with identity snapshot: `customerName`, `customerPhone`)
- human-readable sequential `orderNumber`
- business `date` (separate from `createdAt`)
- structured `items[]` (description, quantity, unit, specifications)
- `agreedAmount` — manually negotiated
- `expectedCompletionDate`
- `status` lifecycle: `pending` → `in_progress` → `ready` → `completed` (or `cancelled` from early stages)
- `statusHistory` — full audit log of status transitions
- `notes`

**Important:** Order status (production lifecycle) is independent of Customer Payment status (financial). A `completed` Order may still have an outstanding customer balance. Order completion does **not** imply full payment.

---

## Operating Expense

An operating expense is money spent by the business that is not represented as a supplier purchase, employee payment, or any other specific payment type.

Expenses are standalone business outflow records.

---

## Customer Payment

A Customer Payment represents money received from a customer against an existing Order.

The relationship is:

```
Customer
   ↓
Order
   ↓
CustomerPayment
```

Customer Payments reference the Order, not the Customer directly. Customer identity (`customerName`, `orderNumber`) is snapshotted on creation. There is no customer credit or unallocated-payment system — payments are always made against a specific Order.

---

## Supplier Payment

A Supplier Payment represents money paid to a supplier, either against a specific Purchase (SPECIFIC type) or as a general payment that is automatically allocated to outstanding purchases (GENERAL type).

The relationship is:

```
Supplier
   ↓
Purchase
   ↓
SupplierPayment
```

Supplier credit is not a single global balance on the Supplier. Credit exists only as `unallocatedAmount` on individual GENERAL payment records and is consumed oldest-first by the allocation engine.

---

## Employee Payment

An Employee Payment (module: `employeePayments`) represents actual money given to an employee on a specific date.

The relationship is:

```
Employee
   ↓
EmployeePayment
```

Employee Payments are completely independent from WeeklyPayroll. They record money paid with a type classification:

- `regular`
- `overtime`
- `bonus`
- `advance`
- `other`

Employee Payments do not automatically calculate payroll; they are manual records of actual cash disbursements.

---

# Important Business Decisions Already Made

## General

- Expenses represent business spending and are not tied to orders or projects.
- Customers are separate from system users.
- Customer records are retained rather than permanently deleted.
- Orders snapshot customer identity for historical purposes.
- Customer Payments are recorded against Orders, not against Customers directly.
- No customer credit/unallocated-payment system exists.

## Financial Domain Separation

The system has three distinct payment domains:

1. **CustomerPayment** — money received from customers against Orders
2. **SupplierPayment** — money paid to suppliers (with allocation engine)
3. **EmployeePayment** — money given to employees (with type classification)

These are separate entities with separate routes, permissions, and rules. There is no universal generic Payment entity.

## Historical Financial Integrity

Financial records must not be silently rewritten or physically deleted in a way that destroys historical truth.

- Orders snapshot customer identity at creation.
- CustomerPayment snapshots `customerName` and `orderNumber` at creation.
- EmployeePayment snapshots `employeeName` at creation.
- Financial fields (amount, dates, entity references) are protected from reassignment.
- Expenses, CustomerPayments use `voided` status instead of hard deletion.
- SupplierPayments cannot be hard-deleted; payment history remains auditable.
- EmployeePayments cannot be hard-deleted; void is used instead.

## Terminology

- Use **Employee** for regular workers (not "worker" or "regular worker").
- Use **EmployeePayment** for employee payment records (not the generic "Payment").
- Use **CustomerPayment** for customer payment records (not "Order payment").
- Use **SupplierPayment** for supplier payment records.
- Use **Contractor** for contractual workers (not "contract worker" or "worker").
- Use **Contract** for the agreement with a contractor (not "worker contract").

## Employee Compensation

- Employees are compensated based on a **daily rate**, not a monthly or fixed weekly salary.
- Employees are paid weekly, but the weekly amount is derived from their daily rate and actual attendance.
- Daily rates may change over time. Each rate change is recorded as a new `EmployeeRate` entry with an effective date.
- Historical attendance and overtime calculations must use the rate that was applicable on the relevant date.
- `EmployeePayment` records actual money given and does not auto-calculate payroll from rates.

## Employee Attendance

- Attendance is recorded twice per normal working day: **morning** and **afternoon**.
- Each half-day has one of three statuses: `PRESENT`, `ABSENT`, or `PERMISSION`.
- `ABSENT` and `PERMISSION` are treated as unpaid for the MVP.
- **Derived Paid Days**:
  - `PRESENT + PRESENT` = 1 full day
  - `PRESENT + (ABSENT/PERMISSION)` or `(ABSENT/PERMISSION) + PRESENT` = 0.5 day
  - `(ABSENT/PERMISSION) + (ABSENT/PERMISSION)` = 0 days
- Normal attendance is required Monday–Saturday. Sunday is not a required attendance day.
- Missing attendance records for an active employee during their employment period blocks payroll closure.

## Employment Period

- Employees have an employment start date and potentially an employment end date.
- Only dates within the employee's active employment period require attendance.
- Historical records remain available after an employee leaves.

## Overtime

- Overtime is a separate record from normal attendance.
- Overtime duration is either `HALF_DAY` or `FULL_DAY`.
- The overtime rate is **2× the employee's applicable daily rate**.
- There is one overtime type for the MVP. There are no separate Sunday, night, or other overtime categories.
- Overtime uses the applicable daily rate for the date it occurred.

## Payroll Period

- The payroll period is sequential and continuous.
- It starts on the employee's employment start date (if no previous closed payroll exists) or the day after the latest closed payroll's end date.
- It ends at the current applicable date, limited by the employee's employment end date if one exists.

## WeeklyPayroll

- The current payroll calculation is a dynamic runtime projection.
- There is no persistent `OPEN` WeeklyPayroll database record.
- When an employee's payroll is closed, a permanent historical snapshot is created with `status: "CLOSED"`.
- Total earnings equal normal earnings plus overtime earnings.

## EmployeePayment (standalone)

- An Employee Payment represents actual money given to an employee on a specific date.
- Employee Payments are completely independent from WeeklyPayroll and do not require a WeeklyPayroll reference.
- Employees can receive partial payments.
- Payment type must be specified: `regular`, `overtime`, `bonus`, `advance`, or `other`.
- Only active Employees can receive new EmployeePayments.
- EmployeePayment employee cannot be changed after creation.
- EmployeePayments cannot be hard-deleted; voiding is used instead.

## Post-Payroll Corrections

- Handling post-payroll corrections is not currently defined as a separate domain entity in the codebase.
- `SettlementAdjustment` and similar correction workflows do not exist in the current implementation.

## Out of Scope for Current Phase

- Bonuses and penalties integrated into payroll are intentionally out of scope.
- Contractor payment rules will be designed separately and are not covered here.
- Dashboard and reporting remain future phases.

---

# Open Questions / Deferred

The following topics still require business clarification or future design work:

- contractor payment model
- reporting requirements and dashboard design
- advanced analytics and AI features
