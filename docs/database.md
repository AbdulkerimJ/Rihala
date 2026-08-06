# Database

The current backend uses MongoDB with Mongoose models. The implementation currently persists the following main collections/models.

---

## Implemented Models and Collections

### User

- Model name: `User`
- Purpose: internal system users
- Important fields:
  - name
  - email
  - password (hashed, excluded from default queries)
  - emailVerified
  - roles
  - status (`active`, `inactive`, `invited`)
  - deletedAt
  - deletedBy
- Notes:
  - password is not returned by default in queries
  - soft-delete is implemented through `deletedAt`

---

### Role

- Model name: `Role`
- Purpose: groups permissions for authorization
- Important fields:
  - name
  - permissions
  - isSystemRole
- Notes:
  - system roles are protected from modification or deletion

---

### Permission

- Model name: `Permission`
- Purpose: named authorization permissions
- Important fields:
  - name
  - description

---

### RefreshToken

- Model name: `RefreshToken`
- Purpose: stores persisted refresh tokens for authentication
- Important fields:
  - user
  - tokenHash
  - expiresAt
  - revokedAt
  - lastUsedAt
  - deviceInfo
  - ipAddress
  - userAgent
- Notes:
  - refresh tokens are persisted and can be revoked

---

### VerificationToken

- Model name: `VerificationToken`
- Purpose: stores password-reset and invitation tokens
- Important fields:
  - user
  - type (`password_reset`, `invitation`)
  - tokenHash
  - codeHash
  - codeExpiresAt
  - codeAttempts
  - expiresAt
  - usedAt

---

### Expense

- Model name: `Expense`
- Purpose: standalone business expense records (not tied to a supplier purchase or employee payment)
- Important fields:
  - category (fixed enum: Transport, Electricity, Rent, Water, Internet, Maintenance, Tools & Equipment, Office Supplies, Marketing, Taxes & Fees, Other)
  - amount
  - description
  - date (business date, separate from `createdAt`)
  - createdBy (User reference)
  - status (`active`, `voided`)
  - voidReason
  - voidedAt
  - voidedBy (User reference)
- Notes:
  - category uses the hardcoded constant list
  - expenses cannot be hard-deleted
  - voiding replaces deletion; voided expenses retain original financial data
  - active expenses are the default result set

---

### Customer

- Model name: `Customer`
- Purpose: customer records for the business
- Important fields:
  - name
  - phone (normalized to Ethiopian international format, unique)
  - email (optional, unique when provided, lowercase)
  - address
  - notes
  - status (`active`, `inactive`)
- Notes:
  - phone is normalized and unique
  - email is optional and unique (sparse index)
  - customers are not users and do not have a userId relationship
  - customers cannot be hard-deleted through the API
  - no financial aggregates (total spent, outstanding balance) stored on Customer

---

### Order

- Model name: `Order`
- Purpose: customer furniture manufacturing requests
- Important fields:
  - orderNumber (human-readable sequential, e.g., `ORD-1001`, unique)
  - customer (Customer reference)
  - customerName (snapshot from Customer at creation)
  - customerPhone (snapshot from Customer at creation)
  - createdBy (User reference)
  - date (business date, required, separate from `createdAt`)
  - items[] (orderItemSchema: description, quantity, unit, specifications)
  - agreedAmount (manually entered)
  - expectedCompletionDate
  - status (`pending`, `in_progress`, `ready`, `completed`, `cancelled`)
  - statusHistory[] (status, changedAt, changedBy)
  - notes
- Notes:
  - orders cannot be hard-deleted
  - order status (production lifecycle) is independent of customer payment status
  - `completed` does not imply full payment
  - completed and cancelled orders cannot be further modified
  - customer identity is snapshotted and not affected by later customer data changes

---

### CustomerPayment

- Model name: `CustomerPayment`
- Purpose: money received from a customer against a specific Order
- Important fields:
  - order (Order reference — primary relationship)
  - amount
  - paymentDate
  - customerName (snapshot from Order at creation)
  - orderNumber (snapshot from Order at creation)
  - note
  - status (`active`, `voided`)
  - voidReason
  - voidedAt
  - voidedBy (User reference)
- Notes:
  - references the Order, not the Customer directly
  - amount cannot exceed the Order's remaining unpaid balance
  - only active payments count toward the paid balance
  - no customer credit or unallocated-payment system exists
  - cannot be hard-deleted
  - only `note` can be updated after creation; financial fields are immutable
  - creation uses a MongoDB session transaction

---

### Employee

- Model name: `Employee`
- Purpose: regular workshop workers who participate in the attendance and payroll workflow
- Important fields:
  - name
  - phone
  - employmentStartDate
  - employmentEndDate (optional)
  - status (`active`, `inactive`)
- Notes:
  - employees are separate from system users and from contractors
  - historical records remain accessible after an employee's employment ends

---

### EmployeeRate

- Model name: `EmployeeRate`
- Purpose: records the daily rate for an employee, supporting a full history of rate changes
- Important fields:
  - employee (Employee reference)
  - dailyRate (numeric, e.g., 500 ETB)
  - effectiveDate
  - note (optional)
- Notes:
  - a new record is created each time the daily rate changes
  - the applicable rate for a given date is the most recent record whose effectiveDate is on or before that date
  - historical calculations must not be affected when a new rate is added
  - EmployeeRate is a separate entity from EmployeePayment

---

### Attendance

- Model name: `Attendance`
- Purpose: records morning and afternoon attendance for an employee on a specific working day
- Important fields:
  - employee (Employee reference)
  - workDate
  - morningStatus (`PRESENT`, `REST`)
  - afternoonStatus (`PRESENT`, `REST`)
- Notes:
  - one record per employee per date (unique constraint)
  - only created for employees (not contractors)
  - dates must fall within the employee's employment period
  - the daily paid portion is derived: `PRESENT+PRESENT` = 1.0, `PRESENT+REST` or `REST+PRESENT` = 0.5, `REST+REST` = 0.0

---

### Overtime

- Model name: `Overtime`
- Purpose: records an overtime event for an employee on a specific date
- Important fields:
  - employee (Employee reference)
  - workDate
  - duration (`HALF_DAY`, `FULL_DAY`)
  - note (optional)
- Notes:
  - separate from the attendance record; an employee may have both on the same date
  - rate is 2× the applicable employee daily rate for the workDate
  - no distinction between Sunday, night, or other overtime types in the MVP

---

### WeeklyPayroll

- Model name: `WeeklyPayroll`
- Purpose: finalized financial result for one employee for a dynamically calculated period
- Important fields:
  - employee (Employee reference)
  - startDate
  - endDate
  - normalEarnings
  - overtimeEarnings
  - totalEarnings
  - status (`CLOSED`)
  - closedAt
- Notes:
  - there is no persistent `OPEN` record in the database; the `OPEN` state is returned dynamically
  - closing creates a permanent historical snapshot
  - missing required attendance blocks payroll closure

---

### EmployeePayment

- Model name: `EmployeePayment`
- Purpose: records actual money given to an employee on a specific date
- Important fields:
  - employee (Employee reference)
  - employeeName (snapshot at creation)
  - amount
  - paymentDate
  - type (`regular`, `overtime`, `bonus`, `advance`, `other`)
  - note (optional)
- Notes:
  - payments are independent of WeeklyPayroll
  - only active employees can receive new EmployeePayments
  - employee cannot be changed after creation
  - employeeName snapshot preserves historical identity
  - cannot be hard-deleted; voiding is used instead
  - financial fields are protected from reassignment after creation

---

### Supplier

- Model name: `Supplier`
- Purpose: suppliers of materials or services to the workshop
- Important fields:
  - name
  - phone (normalized, unique)
  - address (optional)
  - note (optional)
  - status (`active`, `inactive`)
- Notes:
  - inactive suppliers cannot receive new Supplier Payments
  - cannot be hard-deleted through the API

---

### Material

- Model name: `Material`
- Purpose: catalog of purchasable materials
- Important fields:
  - name (unique)
  - category (`MDF`, `Wood`, `Fabric`, `Nails`, `Paint`, `Adhesives`, `Hardware`, `Chemicals`, `Other`)
  - unit (`piece`, `kg`, `meter`, `liter`, `roll`)
  - status (`active`, `inactive`)

---

### Purchase

- Model name: `Purchase`
- Purpose: material purchases from suppliers, tracked for payment allocation
- Important fields:
  - purchaseNumber (human-readable sequential, unique)
  - supplier (Supplier reference)
  - date (business date)
  - items[] (purchaseItemSchema: material, materialName snapshot, materialCategory snapshot, quantity, unit, unitPrice, subtotal)
  - note (optional)
  - totalAmount (sum of item subtotals)
  - allocatedAmount (backend-controlled by Supplier Payment Allocation Engine)
  - paymentStatus (`UNPAID`, `PARTIALLY_PAID`, `PAID`)
- Virtuals:
  - remainingAmount = totalAmount − allocatedAmount (included in JSON/Object output)
- Notes:
  - `allocatedAmount` and `paymentStatus` are managed exclusively by the allocation engine, not by direct client input
  - cannot be hard-deleted

---

### SupplierPayment

- Model name: `SupplierPayment`
- Purpose: money paid to a supplier, with automatic allocation to outstanding purchases
- Important fields:
  - paymentReference (unique)
  - type (`SPECIFIC`, `GENERAL`)
  - supplier (Supplier reference)
  - amount
  - unallocatedAmount (backend-controlled; supplier credit remainder on GENERAL payments)
  - date (business date)
  - note (optional)
  - allocations[] (allocationSchema: purchase reference, amount — backend-controlled)
- Notes:
  - `SPECIFIC` payments target a single Purchase; overpayment is rejected
  - `GENERAL` payments are auto-allocated to outstanding Purchases oldest-first; remainder is `unallocatedAmount`
  - supplier credit is not a global balance on the Supplier entity
  - `allocations` and `unallocatedAmount` are backend-controlled; manual submission is not accepted
  - cannot be hard-deleted; payment history must remain auditable
  - creation and amount reconciliation use MongoDB session transactions

---

## Deferred / Planned Models

The following are discussed in the business documentation but are not yet implemented.

### Contractor

- Model name: `Contractor` (planned)
- Purpose: contractual workers who work under negotiated deals rather than the daily-rate attendance model
- Planned fields:
  - name
  - contact details
- Notes:
  - contractors do not have attendance, overtime, or weekly payroll records
  - contractor payment rules will be designed separately

### Contract

- Model name: `Contract` (planned)
- Purpose: an agreement/deal between the workshop and a contractor
- Planned fields:
  - contractor (reference)
  - description
  - agreedAmount
  - status
- Notes:
  - each contractor may have one or more contracts
