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

### Manage employees

Staff can create, view, update, and list employee profiles, including their employment start and end dates.

### Manage employee rates

Staff can record a new daily rate for an employee with an effective date, preserving the full rate history. Historical calculations continue to use the rate that was applicable on the relevant date.

### Record attendance

Staff can manually record morning and afternoon attendance (`PRESENT`, `ABSENT`, or `PERMISSION`) for an employee on a specific working day (Monday–Saturday, within the employee's employment period).

### Record overtime

Staff can record an overtime event for an employee with a date, duration (`HALF_DAY` or `FULL_DAY`), and an optional note. Overtime is calculated at 2× the applicable daily rate.

### Calculate current payroll

Staff can request a dynamic calculation of an employee's current payroll. The system determines the period based on the employment start date or the last closed payroll, checks attendance completeness, and calculates normal and overtime earnings.

### Inspect payroll completeness

When calculating current payroll, the system identifies any missing required attendance records. Missing attendance blocks the payroll closure process.

### Close employee payroll

Staff can finalize a payroll calculation for a specific employee. The system creates a permanent snapshot of the calculated earnings. The payroll status is recorded as `CLOSED` along with a `closedAt` timestamp.

### Record an employee payment

Staff can record a payment made to an employee, specifying the employee, payment date, amount, and optional note. Payments are independent of the WeeklyPayroll process.

### View payroll history

Authenticated users with the appropriate permissions can view closed payroll records.

### View payment history

Authenticated users with the appropriate permissions can view the history of payments made to employees.

---

## Planned future use cases

The following workflows are discussed in the business documentation but are not yet implemented.

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
