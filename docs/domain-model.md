# Domain Model

This document reflects the entities that are implemented in the current backend. Planned concepts are explicitly labeled as future/deferred work.

---

## Implemented Entities

### User

Represents an internal system user.

Attributes and behavior currently supported:

- name
- email
- password (hashed, not returned in queries)
- emailVerified
- roles
- status: `active`, `inactive`, `invited`
- deletedAt and deletedBy for soft deletion

Relationships:

- A user may have many roles.
- A user may own refresh tokens and verification tokens.

---

### Role

Represents a set of permissions that can be assigned to users.

Relationships:

- A role may contain many permissions.
- A role may be assigned to many users.

---

### Permission

Represents a named permission such as `users.read` or `expenses.create`.

Relationships:

- Permissions are attached to roles.

---

### RefreshToken

Represents a persisted refresh token for a user.

Important properties:

- user reference
- token hash
- expiration date
- revocation state
- device and network metadata

---

### VerificationToken

Represents a persisted verification token used for password resets or invitation onboarding.

Important properties:

- user reference
- type: `password_reset` or `invitation`
- token hash
- optional verification code hash
- expiration date
- usage state

---

### Expense

Represents a standalone business expense (money paid out by the business, not tied to a supplier purchase or employee payment).

Important fields:

- category (from fixed enum list)
- amount
- description
- date (business date, separate from `createdAt`)
- createdBy (User reference)
- status: `active` or `voided`
- voidReason
- voidedAt
- voidedBy (User reference)

Rules:

- Expenses cannot be hard-deleted.
- Voiding replaces deletion. Voided expenses retain all original financial data.
- A voided expense cannot be updated.
- Category is constrained to the hardcoded list: Transport, Electricity, Rent, Water, Internet, Maintenance, Tools & Equipment, Office Supplies, Marketing, Taxes & Fees, Other.

---

### Customer

Represents a customer of the business.

Important fields:

- name
- phone (normalized to Ethiopian international format, unique)
- email (optional, unique when provided, lowercase)
- address
- notes
- status: `active` or `inactive`

Rules:

- Customers are separate from users and do not have a userId relationship.
- Customers cannot be hard-deleted through the API.
- Inactive customers cannot be used for new Orders.
- Customer financial aggregates (total spent, outstanding balance) are not stored on Customer. They are derived from Orders and CustomerPayments.

---

### Order

Represents a customer's agreed furniture manufacturing request.

Important fields:

- orderNumber (human-readable sequential, e.g., `ORD-1001`, unique)
- customer (Customer reference)
- customerName (snapshot)
- customerPhone (snapshot)
- createdBy (User reference)
- date (required business date, separate from `createdAt`)
- items[] (structured: description, quantity, unit, specifications)
- agreedAmount (manually negotiated)
- expectedCompletionDate
- status: `pending`, `in_progress`, `ready`, `completed`, `cancelled`
- statusHistory[] (audit log: status, changedAt, changedBy)
- notes

Status transitions:

```
pending     → in_progress | cancelled
in_progress → ready       | cancelled
ready       → completed
completed   → (terminal)
cancelled   → (terminal)
```

Rules:

- Orders cannot be hard-deleted.
- Order production status and Customer Payment status are **independent**.
- A `completed` Order does not imply full payment.
- A completed Order may still receive Customer Payments provided there is remaining balance.
- Cancelled Orders cannot receive new Customer Payments.
- Completed and cancelled Orders cannot be further modified.
- `agreedAmount` cannot be reduced below the sum of active Customer Payments.
- An Order cannot transition to `cancelled` if it has active Customer Payments (they must be voided first).
- The customer reference cannot be changed if the Order has any Customer Payment history.

---

### CustomerPayment

Represents money received from a customer against a specific Order.

Important fields:

- order (Order reference — primary relationship)
- amount
- paymentDate
- customerName (snapshot from Order at creation)
- orderNumber (snapshot from Order at creation)
- note
- status: `active` or `voided`
- voidReason
- voidedAt
- voidedBy (User reference)

Rules:

- CustomerPayment references the Order as its authoritative relationship.
- Amount cannot exceed the Order's remaining unpaid balance (agreedAmount minus sum of active payments).
- Only active (non-voided) payments count toward the paid balance.
- A fully paid Order cannot receive another active payment.
- Cancelled Orders cannot receive new payments.
- CustomerPayments cannot be hard-deleted.
- Voiding is the only way to remove a payment from the active financial record.
- Financial fields (amount, paymentDate, order) cannot be changed after creation. Only `note` can be updated.
- Customer Payment creation uses a MongoDB session transaction for atomicity.
- No customer credit or unallocated-payment system exists.

---

### Employee

Represents a regular worker employed directly by the workshop.

Important fields:

- name
- phone
- employmentStartDate
- employmentEndDate (optional)
- status: `active` or `inactive`

An employee is separate from a system user and from a contractor. Employees participate in the daily-rate attendance and payroll workflow.

---

### EmployeeRate

Represents a daily rate record for an employee, supporting a full history of rate changes.

Important fields:

- employee (Employee reference)
- dailyRate (numeric, e.g., 500 ETB)
- effectiveDate
- note (optional)

Rules:

- A new EmployeeRate record is created each time the daily rate changes.
- Historical attendance and overtime calculations use the rate that was applicable on the relevant date (the most recent rate whose `effectiveDate` is on or before that date).
- EmployeeRate is a separate entity from EmployeePayment.

---

### Attendance

Represents a single day's attendance record for an employee.

Important fields:

- employee (Employee reference)
- workDate
- morningStatus: `PRESENT`, `ABSENT`, or `PERMISSION`
- afternoonStatus: `PRESENT`, `ABSENT`, or `PERMISSION`

Constraints:

- One record per employee per date.
- Only created for employees (not contractors).
- Must fall within the employee's employment period.

The daily paid portion is derived from the two status fields:

- `PRESENT + PRESENT` = 1 full day
- `PRESENT + ABSENT/PERMISSION` or `ABSENT/PERMISSION + PRESENT` = 0.5 day
- `ABSENT/PERMISSION + ABSENT/PERMISSION` = 0 days

---

### Overtime

Represents an overtime record for an employee on a specific date.

Important fields:

- employee (Employee reference)
- workDate
- duration: `HALF_DAY` or `FULL_DAY`
- note (optional)

Overtime is separate from attendance. An employee may have both an attendance record and an overtime record on the same date. The overtime rate is 2× the applicable daily rate.

---

### WeeklyPayroll

Represents a finalized financial result for one employee for a dynamically calculated period.

Important fields:

- employee (Employee reference)
- startDate
- endDate
- normalEarnings
- overtimeEarnings
- totalEarnings
- status: `CLOSED`
- closedAt

Constraints:

- The payroll period is sequential and continuous (calculated from the employment start date or the last closed payroll).
- Missing required attendance blocks payroll closure.
- There is no persistent `OPEN` state in the database; `OPEN` is only returned dynamically during calculations.
- Closing creates a permanent snapshot of the calculated earnings.

---

### EmployeePayment

Represents actual money given to an employee on a specific date.

Important fields:

- employee (Employee reference)
- employeeName (snapshot)
- amount
- paymentDate
- type: `regular`, `overtime`, `bonus`, `advance`, or `other`
- note (optional)

Rules:

- EmployeePayments are independent of WeeklyPayroll and simply record money paid.
- Only active employees can receive new EmployeePayments.
- Employee cannot be changed after creation.
- employeeName snapshot preserves historical identity.
- EmployeePayments cannot be hard-deleted; voiding is used instead.
- Financial fields (amount, paymentDate, employee) are protected from reassignment after creation.

---

### Supplier

Represents a supplier of materials or services.

Important fields:

- name
- phone (normalized, unique)
- address (optional)
- note (optional)
- status: `active` or `inactive`

Rules:

- Inactive suppliers cannot receive new Supplier Payments.
- Suppliers cannot be hard-deleted through the API.

---

### Material

Represents a material catalog entry.

Important fields:

- name (unique)
- category: `MDF`, `Wood`, `Fabric`, `Nails`, `Paint`, `Adhesives`, `Hardware`, `Chemicals`, `Other`
- unit: `piece`, `kg`, `meter`, `liter`, `roll`
- status: `active` or `inactive`

---

### Purchase

Represents a material purchase from a Supplier.

Important fields:

- purchaseNumber (human-readable sequential, unique)
- supplier (Supplier reference)
- date (business date)
- items[] (material reference, materialName snapshot, materialCategory snapshot, quantity, unit, unitPrice, subtotal)
- note (optional)
- totalAmount (sum of item subtotals)
- allocatedAmount (backend-controlled, updated by Supplier Payment Allocation Engine)
- paymentStatus: `UNPAID`, `PARTIALLY_PAID`, or `PAID`
- remainingAmount (virtual: totalAmount − allocatedAmount)

Rules:

- Purchases cannot be hard-deleted.
- `allocatedAmount` and `paymentStatus` are managed exclusively by the allocation engine.

---

### SupplierPayment

Represents money paid to a Supplier, with automatic allocation to outstanding Purchases.

Important fields:

- paymentReference (unique)
- type: `SPECIFIC` or `GENERAL`
- supplier (Supplier reference)
- amount
- unallocatedAmount (backend-controlled; represents supplier credit on GENERAL payments)
- date (business date)
- status: `active` or `voided`
- voidReason, voidedBy, voidedAt
- note (optional)
- allocations[] (purchase reference, amount — backend-controlled)

Rules:

- **SPECIFIC**: associated with a single Purchase; cannot overpay the Purchase.
- **GENERAL**: automatically allocated to outstanding Purchases oldest-first; any remainder is `unallocatedAmount`.
- `allocations` and `unallocatedAmount` are backend-controlled; manual allocation from clients is not accepted.
- Supplier credit is not a single global balance on the Supplier entity.
- Credit exists only as `unallocatedAmount` on individual GENERAL payment records.
- SupplierPayments cannot be hard-deleted; they use a voiding workflow to reverse financial impact while preserving audit history.
- Payment, voiding, and allocation operations use MongoDB session transactions and concurrency write-locks.

---

## Domain Relationship Overview

```
Customer
   │
   ▼
Order ───────────────► CustomerPayment
   │
   └────────────── production lifecycle (status state machine)


Supplier
   │
   ▼
Purchase ────────────► SupplierPayment
                          │
                          ▼
                   Allocation Engine
                   (allocations[], unallocatedAmount)


Employee
   │
   ├──────────────► EmployeeRate
   │                (daily-rate history, drives payroll calc)
   │
   ├──────────────► Attendance + Overtime
   │                (attendance records + overtime records)
   │
   ├──────────────► WeeklyPayroll
   │                (dynamic open calc → CLOSED snapshot)
   │
   └──────────────► EmployeePayment
                    (standalone money-given records, independent of payroll)


Expense
   │
   ▼
Standalone business outflow
(not tied to supplier, customer, or employee)
```

---

## Deferred / Planned Future Entities

The following concepts are discussed in the business documents but are not yet implemented in the current backend.

### Contractor

Represents a person who works with the workshop under a negotiated contract/deal.

Planned fields:

- name
- contact details

Contractors do not participate in the employee attendance, overtime, or weekly payroll workflow. Contractor payment rules will be designed separately.

### Contract

Represents an agreement between the workshop and a contractor.

Planned fields:

- contractor reference
- description
- agreedAmount
- status

Each contractor may be associated with one or more contracts.
