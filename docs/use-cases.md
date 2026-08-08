# Use Cases

This document captures the major workflows that are currently implemented in the backend, followed by the planned future workflows.

---

## Implemented Use Cases

### User Login

A user provides an email and password to authenticate. If the credentials are valid and the account is active, the system issues an access token and, for web clients, stores a refresh token in an HttpOnly cookie.

### User Logout

A user can log out, which revokes the current refresh token and clears the related cookie for web clients.

### Refresh Access Token

A client can exchange a valid refresh token for a new access token.

### Password Reset

A user can request a password reset. The system creates a verification token, and the reset link is currently logged rather than sent through a production email provider.

### Invite User

An administrator can create an invited user account. The system generates an invitation token and a 4-digit verification code for the new user.

### Accept Invitation

The invited user validates the invitation link, provides the invitation verification code, sets a password, and becomes an active user.

### Manage Users

Authenticated users with the appropriate permissions can create, view, update, deactivate, activate, soft-delete, and restore users.

### Manage Roles

Authenticated users with the appropriate permissions can create, view, update, delete, and assign permissions to roles.

### Manage Permissions

Authenticated users with the appropriate permissions can view the available permissions.

### Manage Expenses

Authenticated users with the appropriate permissions can create, view, update, and filter expenses. Expenses can be voided (with a reason) instead of deleted. Voided expenses remain accessible for audit queries.

### Manage Customers

Authenticated users with the appropriate permissions can create, view, update, search, sort, paginate, and filter customers by status. Inactive customers cannot be used for new Orders.

### Manage Orders

Authenticated users with the appropriate permissions can create Orders for active customers. Orders snapshot customer identity. Orders track items, agreed amount, expected completion date, and status. Status can be progressed through the valid lifecycle. Completed or cancelled Orders cannot be further modified.

### Record a Customer Payment

Staff record a payment received from a customer against a specific Order. The system validates that the payment does not exceed the Order's remaining unpaid balance and that the Order is not cancelled or fully paid. Customer identity and Order number are snapshotted. The operation uses a transaction boundary for atomicity.

### Void a Customer Payment

Staff can void an active Customer Payment by providing a void reason. Voided payments are retained for audit but no longer count toward the Order's paid balance.

### Manage Employees

Staff can create, view, update, and list employee profiles, including their employment start and end dates.

### Manage Employee Rates

Staff can record a new daily rate for an employee with an effective date, preserving the full rate history. Historical calculations continue to use the rate that was applicable on the relevant date. EmployeeRate is a separate entity from EmployeePayment.

### Record Attendance

Staff can manually record morning and afternoon attendance (`PRESENT`, `ABSENT`, or `PERMISSION`) for an employee on a specific working day (Monday–Saturday, within the employee's employment period).

### Record Overtime

Staff can record an overtime event for an employee with a date, duration (`HALF_DAY` or `FULL_DAY`), and an optional note. Overtime is calculated at 2× the applicable daily rate.

### Calculate Current Payroll

Staff can request a dynamic calculation of an employee's current payroll period. The system determines the period based on the employment start date or the last closed payroll, checks attendance completeness, and calculates normal and overtime earnings.

### Inspect Payroll Completeness

When calculating current payroll, the system identifies any missing required attendance records. Missing attendance blocks the payroll closure process.

### Close Employee Payroll

Staff can finalize a payroll calculation for a specific employee. The system creates a permanent snapshot of the calculated earnings with `status: "CLOSED"` and a `closedAt` timestamp.

### Record an Employee Payment

Staff can record a payment made to an employee, specifying the employee, payment date, amount, payment type (`regular`, `overtime`, `bonus`, `advance`, `other`), and optional note. EmployeePayments are independent of the WeeklyPayroll process. Only active employees can receive new EmployeePayments. Employee name is snapshotted at creation.

### Void an Employee Payment

Staff with the `employeePayments.void` permission can void an EmployeePayment. EmployeePayments cannot be hard-deleted.

### View Payroll History

Authenticated users with the appropriate permissions can view closed payroll records.

### View Employee Payment History

Authenticated users with the appropriate permissions can view the history of EmployeePayments, filterable by employee, date range, and payment type.

### Manage Suppliers

Staff can create, view, update, and list supplier profiles. Suppliers have active/inactive status. Inactive suppliers cannot receive new Supplier Payments.

### Manage Materials

Staff can create, view, update, and list material catalog entries. Materials have categories and units.

### Record a Purchase

Staff can record a material purchase from a supplier. The purchase contains structured items referencing the material catalog, with quantity, unit price, and subtotal per item. The total amount is calculated from item subtotals.

### Record a Supplier Payment (SPECIFIC)

Staff record a payment associated with a specific Purchase. The payment amount cannot exceed the remaining balance on that Purchase. The Supplier Payment Allocation Engine allocates the payment to the Purchase and updates its `allocatedAmount` and `paymentStatus`. The operation uses a transaction boundary.

### Record a Supplier Payment (GENERAL)

Staff record a general payment for a supplier. The Supplier Payment Allocation Engine automatically allocates the payment to outstanding Purchases in oldest-first order. Any remainder becomes `unallocatedAmount` (supplier credit). The operation uses a transaction boundary.

### Apply Supplier Credit to New Purchases

When a new Purchase is created for a supplier with existing unallocated credit (from previous GENERAL payments), the allocation engine automatically applies the oldest credit first to reduce the new Purchase's outstanding balance.

### Update a Supplier Payment

Staff can update the date, note, or amount of a Supplier Payment. Amount changes trigger automatic reconciliation: decreases reduce existing allocations, increases allocate the additional amount to outstanding Purchases. All reconciliation uses a transaction boundary.

---

## Planned Future Use Cases

The following workflows are discussed in the business documentation but are not yet implemented.

### Manage Contractors

Staff can create and update contractor profiles.

### Manage Contracts

Staff can create and update contracts (agreements/deals) associated with a contractor.

### View Dashboard Summaries and Reports

Authenticated users can view business summaries, expense overviews, employee balance summaries, and other operational statistics.
