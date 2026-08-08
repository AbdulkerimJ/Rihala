# Business Rules

This document records the business rules that are implemented in the current backend. Planned rules are explicitly labeled as future/deferred work.

---

# Implemented Rules

## Authentication and Access

- Every user must authenticate before accessing protected resources.
- Access is controlled through permission-based RBAC.
- Permissions are assigned to roles, and users receive access through their assigned roles.
- Authentication uses JWT access tokens and persisted refresh tokens.
- Password resets and invitation-based onboarding are supported through verification tokens.

---

## Users

- Users may have one of three statuses: active, inactive, or invited.
- Users can be invited without an initial password and later complete onboarding.
- Users may be assigned one or more roles.
- Users may be soft-deleted and restored.
- The system distinguishes system users from customers and from employees.

---

## Expenses

- Expenses represent money spent by the business that is not part of a supplier purchase or employee payment.
- Expenses are recorded with a category, amount, description, and a business `date` (separate from `createdAt`).
- The business does not currently require every expense to be assigned to a specific project or order.
- Expense categories are constrained to a fixed set defined by the implementation:
  - Transport
  - Electricity
  - Rent
  - Water
  - Internet
  - Maintenance
  - Tools & Equipment
  - Office Supplies
  - Marketing
  - Taxes & Fees
  - Other
- Expenses have RBAC protection (`expenses.read`, `expenses.create`, `expenses.update`, `expenses.void`).
- Expenses cannot be hard-deleted through the API.
- The DELETE workflow was replaced by voiding.
- Voiding uses `status: "voided"` on the expense record.
- Voided expenses retain their original financial information.
- Voided expenses require a `voidReason`.
- Voided expenses record `voidedBy` (user reference) and `voidedAt` (timestamp).
- A voided expense cannot be updated.
- Active expenses are the default reporting set (`status: "active"` if no status filter provided).
- Voided expenses remain available for historical and audit queries.
- Amount and business date are protected: a voided expense cannot be updated.
- Amount range filtering and date-range reporting exist.

---

## Customers

- Customers are separate from system users.
- Customers are retained rather than permanently deleted through the API.
- Customer records can be deactivated or reactivated through update operations.
- Customer phone numbers are normalized to the Ethiopian international format.
- Customer email is optional and normalized to lowercase.
- Customer phone and email must remain unique.
- Inactive Customers cannot be used for new Orders.
- Customer order history is derived dynamically from Orders, not stored as aggregates on the Customer.
- Customer does not store financial aggregates such as total spent or outstanding balance.

---

## Orders

- An Order represents a customer's agreed furniture manufacturing request.
- Orders have a human-readable sequential `orderNumber` (e.g., `ORD-1001`).
- Orders require a business `date` (separate from the `createdAt` system timestamp).
- Orders reference a Customer and snapshot `customerName` and `customerPhone` at creation. Once any Customer Payments exist for an Order, its customer reference cannot be changed.
- Orders contain structured `items[]`. Each item has `description`, `quantity`, `unit`, and optional `specifications`. No product catalog or item-level pricing is required.
- `agreedAmount` is manually negotiated and entered at order creation. The `agreedAmount` cannot be updated to a value lower than the total amount of active Customer Payments.
- Orders require an `expectedCompletionDate`.
- Only active Customers can be associated with new Orders.
- Orders cannot be hard-deleted.

### Order Status State Machine

The Order status lifecycle is:

```
pending → in_progress → ready → completed
pending → cancelled
in_progress → cancelled
```

Terminal states (`completed`, `cancelled`) cannot be modified further. An Order cannot transition to `cancelled` if it has active Customer Payments (the payments must be voided first).

- `statusHistory` maintains a full audit log of all status transitions including who changed the status and when.

### Order Status vs. Payment Status

Order production status and Customer Payment status are **independent**.

- `completed` does **not** mean fully paid.
- A completed Order may still have an outstanding customer balance.
- Customer Payments must remain possible after Order completion, provided the Order is not `cancelled` and there is remaining balance.
- Cancelled Orders cannot receive new Customer Payments.

---

## Customer Payments

Customer Payments represent money received from a customer against an existing Order.

### Relationship

```
Customer
   ↓
Order
   ↓
CustomerPayment
```

### Rules

- Customer Payment references the Order as its primary relationship.
- `customerName` and `orderNumber` are snapshotted at payment creation.
- Payment cannot exceed the Order's remaining unpaid amount (agreedAmount minus sum of active payments).
- Only active (non-voided) payments count toward the paid balance.
- Voided payments do not count toward the balance.
- A fully paid Order (remaining balance = 0) cannot receive another active payment.
- Customer Payments cannot be created for a cancelled Order.
- No customer credit or unallocated-payment system exists.
- If a customer wants to pay before an Order exists, the process is: create the Order first, then record the payment.
- Payment method is not tracked.
- Customer Payment creation uses a transaction boundary for atomicity.
- Customer Payments cannot be hard-deleted.
- Voiding is the only way to remove a payment from the active financial record.
- Voiding requires a `voidReason` and records `voidedBy` and `voidedAt`.
- Financial fields (amount, paymentDate, order reference) cannot be reassigned after creation.
- Only `note` can be updated on an active payment.
- A voided payment cannot be updated.
- RBAC permissions: `customerPayments.read`, `customerPayments.create`, `customerPayments.update`, `customerPayments.void`.

---

## Employees

### General

- An **Employee** is a regular worker employed directly by the workshop.
- Employees are separate from system users and separate from contractors.
- Attendance, overtime, and weekly payroll apply to employees only, not to contractors.
- Employees have `status: active` or `status: inactive`.
- Inactive employees cannot receive new EmployeePayments.
- Historical records (attendance, payroll, payments) remain accessible after an employee becomes inactive.

### Employment Period

- Each employee has an `employmentStartDate`.
- Employees may have an `employmentEndDate` when they leave.
- Only dates within the employee's active employment period are expected to have attendance records.
- Dates before the start date or after the end date are not treated as absences.
- Historical records remain accessible after an employee's employment ends.

### Daily Rate (EmployeeRate)

- Employees are compensated based on a **daily rate** (e.g., 500 ETB/day), not a monthly or weekly salary.
- Daily rates may change over time.
- Each rate change is stored as a new `EmployeeRate` record with an `effectiveDate`.
- Historical attendance and overtime calculations must use the rate that was applicable on the relevant date.
- The system must not overwrite old financial records when a rate changes.
- `EmployeeRate` records are separate from `EmployeePayment` records; the rate model drives payroll calculation, not payment recording.

### Attendance

- Attendance is recorded manually by staff.
- Attendance is recorded twice per normal working day: **morning** and **afternoon**.
- Each half-day has one of three statuses: `PRESENT`, `ABSENT`, or `PERMISSION`.
- `ABSENT` and `PERMISSION` are treated as unpaid for the MVP.
- **Derived Paid Days**:
  - `PRESENT + PRESENT` = 1 full day
  - `PRESENT + (ABSENT/PERMISSION)` or `(ABSENT/PERMISSION) + PRESENT` = 0.5 day
  - `(ABSENT/PERMISSION) + (ABSENT/PERMISSION)` = 0 days
- Derived values such as `FULL_DAY` or `HALF_DAY` must not be stored redundantly if they can be derived.
- Normal attendance is required for **Monday–Saturday**.
- Sunday is not a normal attendance day.
- There must be exactly one attendance record per employee per date.
- Attendance must belong to an employee (not a contractor).
- Attendance must not be created for a Sunday as a normal attendance record.
- Attendance dates must fall within the employee's active employment period.

### Missing Attendance

- A missing attendance record for a required workday (Mon–Sat, within active employment period) does **not** automatically default to absence.
- When closing a payroll, missing required attendance must be detected and must block the payroll closure until resolved.

### Overtime

- Overtime is a separate record from normal attendance.
- An employee may have both a normal attendance record and an overtime record on the same date.
- Overtime must specify the actual date it occurred.
- Overtime duration is either `HALF_DAY` or `FULL_DAY`.
- The overtime rate is **2× the employee's applicable daily rate** for the date.
- Examples with a 500 ETB daily rate:
  - Half-day overtime: 500 × 0.5 × 2 = 500 ETB
  - Full-day overtime: 500 × 1.0 × 2 = 1,000 ETB
- There is one overtime type for the MVP. There are no separate Sunday, night, or other overtime categories.
- An optional note may be recorded (e.g., "Sunday furniture delivery", "Night work", "Urgent order").
- Overtime must use the applicable daily rate for the date it occurred.

---

## WeeklyPayroll

- "WeeklyPayroll" is the module/concept name; it does not enforce a literal seven-day Monday–Sunday period.
- The payroll period is calculated dynamically for an individual employee.
- **Start Date:**
  - If the employee has no previous closed payroll, the period starts on their `employmentStartDate`.
  - If the employee has a previous closed payroll, the period starts the day after the latest closed payroll's end date.
- **End Date:**
  - The current period ends at the current applicable date, limited by the employee's `employmentEndDate` if one exists.
- Payroll periods are continuous and sequential.

---

## Payroll Calculation and Closing

- Payroll calculation is a dynamic runtime projection. There is no persistent `OPEN` WeeklyPayroll database record.
- The API may return `status: "OPEN"` to represent that the current period calculation is not finalized.
- When an employee's payroll is closed:
  - Earnings are calculated based on normal earnings (attendance × historical applicable rates) and overtime earnings.
  - Total earnings = normal earnings + overtime earnings.
  - A historical snapshot is created as a persistent database record.
  - The record receives `status: "CLOSED"` and records the `closedAt` timestamp.
  - The closed payroll becomes a permanent part of the payroll history.

---

## Employee Payments

- An **EmployeePayment** represents actual money given to an employee.
- Each payment records: employee reference, `employeeName` snapshot, `paymentDate`, `amount`, `type`, and an optional `note`.
- Payment types are: `regular`, `overtime`, `bonus`, `advance`, `other`.
- Only active Employees can receive new EmployeePayments.
- Employee cannot be changed after payment creation.
- `employeeName` snapshot preserves historical identity even if the employee becomes inactive later.
- EmployeePayments are completely independent from WeeklyPayroll.
- EmployeePayments do not require a WeeklyPayroll reference and are not part of the WeeklyPayroll document.
- Employees can receive partial payments.
- Amount and payment date are protected from casual historical rewriting.
- EmployeePayments cannot be hard-deleted; voiding is the expected workflow.
- EmployeePayment financial logic remains separate from standalone Expenses.
- RBAC permissions: `employeePayments.read`, `employeePayments.create`, `employeePayments.update`, `employeePayments.void`.

---

## Suppliers

- Suppliers represent companies or individuals who supply materials or services.
- Suppliers have a `name`, `phone`, optional `address`, optional `note`, and `status` (`active` or `inactive`).
- Supplier phone is normalized to the Ethiopian international format and must be unique.
- Inactive suppliers cannot receive new Supplier Payments.
- Suppliers cannot be hard-deleted through the API.
- RBAC permissions: `suppliers.read`, `suppliers.create`, `suppliers.update`.

---

## Materials

- Materials represent catalog items that can be purchased.
- Materials have a `name`, `category`, `unit`, and `status` (`active` or `inactive`).
- Material name must be unique.
- Material categories: `MDF`, `Wood`, `Fabric`, `Nails`, `Paint`, `Adhesives`, `Hardware`, `Chemicals`, `Other`.
- Material units: `piece`, `kg`, `meter`, `liter`, `roll`.
- RBAC permissions: `materials.read`, `materials.create`, `materials.update`.

---

## Purchases

- A Purchase represents a material purchase from a Supplier.
- Purchases have a sequential `purchaseNumber`, supplier reference, business `date`, structured `items[]`, optional `note`, `totalAmount`, `allocatedAmount`, and `paymentStatus`.
- Purchase items reference a Material catalog entry and snapshot `materialName` and `materialCategory`.
- Each purchase item records `quantity`, `unit`, `unitPrice`, and `subtotal`.
- `totalAmount` is the sum of item subtotals.
- `allocatedAmount` is backend-controlled and updated by the Supplier Payment Allocation Engine.
- `paymentStatus` is derived: `UNPAID`, `PARTIALLY_PAID`, or `PAID`.
- `remainingAmount` is available as a virtual field (`totalAmount - allocatedAmount`).
- Purchases cannot be hard-deleted.
- RBAC permissions: `purchases.read`, `purchases.create`, `purchases.update`.

---

## Supplier Payments

Supplier Payments represent money paid to a Supplier. The Supplier Payment Allocation Engine automatically distributes payments against outstanding Purchases.

### Relationship

```
Supplier
   ↓
Purchase
   ↓
SupplierPayment
```

### Payment Types

- **SPECIFIC** payments: associated with a single Purchase. The payment amount cannot exceed the remaining balance on that Purchase.
- **GENERAL** payments: automatically allocated to outstanding Purchases (oldest-first). Any remainder becomes `unallocatedAmount` (supplier credit).

### Allocation Engine Rules

- Supplier credit is **not** a single global balance stored on the Supplier.
- Credit exists only as `unallocatedAmount` on individual GENERAL payment records.
- Credit is automatically consumed oldest-first when new Purchases are created.
- Manual allocations are not accepted from clients; `allocations` and `unallocatedAmount` are backend-controlled values.
- Specific payment increases cannot overpay the corresponding Purchase.
- Specific payments must precisely match the Supplier of the associated Purchase; mismatch throws a ValidationError.
- Purchase and payment allocation operations use transaction boundaries and strict concurrency write-locks (`$currentDate`) to serialize conflicting requests.
- If a payment's amount is decreased below the currently allocated total, allocations are automatically reduced (newest-first).
- If a GENERAL payment's amount is increased, the difference is automatically allocated to outstanding Purchases.
- If a SPECIFIC payment's amount is increased, the difference is applied to the associated Purchase's remaining balance.

### Integrity Rules

- Supplier Payments cannot be hard-deleted.
- Payment history must remain auditable.
- `paymentReference` is unique per payment.
- RBAC permissions: `supplierPayments.read`, `supplierPayments.create`, `supplierPayments.update`, `supplierPayments.void`.

---

## Historical Financial Integrity (Project-Wide)

> **Financial records must not be silently rewritten or physically deleted in a way that destroys historical truth.**

This principle is enforced across all financial domains:

- Order snapshots (`customerName`, `customerPhone`) are written at creation and are not overwritten by subsequent customer data changes.
- CustomerPayment snapshots (`customerName`, `orderNumber`) are written at creation and cannot be changed.
- EmployeePayment snapshots (`employeeName`) are written at creation and cannot be changed.
- SupplierPayment history is maintained; allocations are tracked on the payment record.
- Expense voiding preserves the original financial information.
- Immutable financial fields (amount, business dates, entity references) are protected from reassignment after creation.
- Void and cancellation workflows replace hard deletion across all financial entities.

---

## Transaction Architecture

Financial operations that affect multiple documents use MongoDB session-based transactions:

- **CustomerPayment creation**: The active payment sum, remaining balance check, and payment document creation all occur within a single session transaction. If any step fails, the entire operation is rolled back.
- **SupplierPayment creation and update**: Payment creation, allocation across purchases, and purchase `allocatedAmount`/`paymentStatus` updates all occur within a single transaction boundary. The allocation service receives the session and propagates it into all sub-operations.
- **SupplierPayment Voiding**: Voiding reverses all purchase allocations and clears unallocated credit within a transaction, preserving the payment record.
- **Concurrency Locks**: Financial calculations involving shared resource limits (e.g. `unallocatedAmount`, `Purchase.allocatedAmount`) explicitly acquire `$currentDate` write-locks inside the transaction prior to performing mathematical validations to safely reject conflicting parallel requests.
- **Rollback behavior**: If any operation within a transaction fails (e.g., overpayment validation, purchase not found), the entire transaction is rolled back and no partial state is persisted.

### Development Limitation

> Local MongoDB may be running as a standalone instance. MongoDB transactions require a replica set. Transaction-dependent tests or operations may be skipped or unavailable in a standalone local environment.

Do not claim that transaction tests passed if they were skipped because of this limitation.

---

## Security

- Only authenticated users can access protected resources.
- Authorization is enforced through RBAC and explicit permissions.
- Administrative actions require appropriate permissions.
- System roles are protected from modification or deletion in the current implementation.

---

# Deferred / Planned Rules

## Contractors

- A **Contractor** is a person who works with the workshop under a negotiated contract/deal.
- Contractors do not use the employee attendance, overtime, or weekly settlement workflow.
- Contractor payment rules will be designed separately.

### Contracts

- A **Contract** is an agreement between the workshop and a contractor.
- Each contractor may be associated with one or more contracts.

---

## Dashboard and Reporting

Dashboard and reporting modules are planned for a future phase and are not currently implemented.

---

# Out of Scope for Current Phase

- Bonuses and penalties integrated into payroll.
- Contractor and contract management.
- Dashboard and reporting features.
