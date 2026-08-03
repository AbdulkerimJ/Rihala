# Use Cases

This document captures the major workflows that are currently implemented in the backend, followed by the planned future workflows.

## Implemented use cases

### User login

A user provides an email and password to authenticate. If the credentials are valid and the account is active, the system issues an access token and, for web clients, stores a refresh token in an HttpOnly cookie.

### User logout

A user can log out, which revokes the current refresh token and clears the related cookie for web clients.

### Refresh access token

A client can exchange a valid refresh token for a new access token.

### Password reset

A user can request a password reset. The system creates a verification token, and the reset link is currently logged rather than sent through a production email provider.

### Invite user

An administrator can create an invited user account. The system generates an invitation token and a 4-digit verification code for the new user.

### Accept invitation

The invited user validates the invitation link, provides the invitation verification code, sets a password, and becomes an active user.

### Manage users

Authenticated users with the appropriate permissions can create, view, update, deactivate, activate, soft-delete, and restore users.

### Manage roles

Authenticated users with the appropriate permissions can create, view, update, delete, and assign permissions to roles.

### Manage permissions

Authenticated users with the appropriate permissions can view the available permissions.

### Manage expenses

Authenticated users with the appropriate permissions can create, view, update, filter, search, sort, paginate, and delete expenses.

### Manage customers

Authenticated users with the appropriate permissions can create, view, update, search, sort, paginate, and filter customers.

---

## Planned future use cases

The following workflows are discussed in the business documentation but are not yet implemented.

### Manage employees

Staff can create and update employee profiles, including employment start and end dates.

### Manage employee daily rates

Staff can record a new daily rate for an employee with an effective date, preserving the full rate history. Historical calculations continue to use the rate that was applicable on the relevant date.

### Record attendance

Staff can manually record morning and afternoon attendance (`PRESENT` or `REST`) for an employee on a specific working day (Monday–Saturday, within the employee's employment period).

### Record overtime

Staff can record an overtime event for an employee with a date, duration (`HALF_DAY` or `FULL_DAY`), and an optional note. Overtime is calculated at 2× the applicable daily rate.

### Review weekly attendance

Staff can review an employee's attendance and overtime records for a given Monday–Sunday week and identify any missing required attendance records before settling.

### Settle a week

Staff can finalize a weekly settlement for a specific employee and week (Monday–Sunday). The system calculates normal earnings and overtime earnings, takes into account any financial adjustments, and records the finalized result. The settlement status moves from `OPEN` to `SETTLED`.

### Record an employee payment

Staff can record a payment made to an employee, specifying the employee, payment date, amount, and optional note. The system allocates the payment to outstanding balances using oldest-outstanding-balance-first. Excess payment over the current outstanding balance is recorded as an advance.

### Record a post-settlement adjustment

Staff can record a financial adjustment for an employee after a week has been settled. The adjustment specifies an amount and reason. The original settlement record remains intact; the adjustment affects the employee's current financial position.

### Manage contractors

Staff can create and update contractor profiles.

### Manage contracts

Staff can create and update contracts (agreements/deals) associated with a contractor.

### Manage suppliers

Staff can create and update supplier records.

### Manage purchases

Staff can record and track material purchases associated with suppliers.

### Manage customer orders

Staff can create, update, and track the status of customer furniture orders.

### View dashboard summaries and reports

Authenticated users can view business summaries, expense overviews, employee balance summaries, and other operational statistics.
