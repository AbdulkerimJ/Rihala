# API Design

This document summarizes the API surface that currently exists in the backend. It is based on the implemented routes and middleware, not on planned modules.

## Authentication

### Login

- Method: POST
- Route: `/api/v1/auth/login`
- Authentication: none
- Permission: none
- Purpose: authenticate with email and password and receive an access token
- Body: `email`, `password`

### Refresh access token

- Method: POST
- Route: `/api/v1/auth/refresh`
- Authentication: none
- Permission: none
- Purpose: issue a new access token using a refresh token
- Body: `refreshToken` or cookie-based refresh token

### Logout

- Method: POST
- Route: `/api/v1/auth/logout`
- Authentication: none
- Permission: none
- Purpose: revoke a refresh token and clear the cookie for web clients

### Forgot password

- Method: POST
- Route: `/api/v1/auth/forgot-password`
- Authentication: none
- Permission: none
- Purpose: initiate a password reset flow
- Body: `email`

### Reset password

- Method: POST
- Route: `/api/v1/auth/reset-password`
- Authentication: none
- Permission: none
- Purpose: complete a password reset using a verification token
- Body: `token`, `newPassword`

### Validate invitation

- Method: GET
- Route: `/api/v1/auth/invitation/validate/:token`
- Authentication: none
- Permission: none
- Purpose: validate an invitation token

### Accept invitation

- Method: POST
- Route: `/api/v1/auth/invitation/accept`
- Authentication: none
- Permission: none
- Purpose: complete invitation onboarding by setting password and activating the user
- Body: `token`, `code`, `password`, `confirmPassword`

## Users

### List users

- Method: GET
- Route: `/api/v1/users`
- Authentication: required
- Permission: none at the route level; protected by authentication
- Purpose: list active users

### List deleted users

- Method: GET
- Route: `/api/v1/users/deleted`
- Authentication: required
- Permission: none at the route level
- Purpose: list soft-deleted users

### Create invited user

- Method: POST
- Route: `/api/v1/users`
- Authentication: required
- Permission: none at the route level
- Purpose: create a user in invited status and issue an invitation flow
- Body: `name`, `email`, `roles`

### Update user

- Method: PATCH
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: update a user record

### Get user by id

- Method: GET
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: fetch a single user

### Deactivate user

- Method: PATCH
- Route: `/api/v1/users/:id/deactivate`
- Authentication: required
- Permission: none at the route level
- Purpose: set a user to inactive

### Activate user

- Method: PATCH
- Route: `/api/v1/users/:id/activate`
- Authentication: required
- Permission: none at the route level
- Purpose: set a user to active

### Restore user

- Method: PATCH
- Route: `/api/v1/users/:id/restore`
- Authentication: required
- Permission: none at the route level
- Purpose: restore a soft-deleted user

### Soft delete user

- Method: DELETE
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: soft-delete a user

### Assign roles to user

- Method: POST
- Route: `/api/v1/users/:id/roles`
- Authentication: required
- Permission: `users.assign-role`
- Purpose: assign roles to a user

### Remove role from user

- Method: DELETE
- Route: `/api/v1/users/:id/roles/:roleId`
- Authentication: required
- Permission: `users.assign-role`
- Purpose: remove a role from a user

## Roles

### List roles

- Method: GET
- Route: `/api/v1/roles`
- Authentication: required
- Permission: `roles.read`
- Purpose: list roles with populated permissions

### Create role

- Method: POST
- Route: `/api/v1/roles`
- Authentication: required
- Permission: `roles.create`
- Purpose: create a role

### Get role by id

- Method: GET
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.read`
- Purpose: fetch a role

### Update role

- Method: PATCH
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.update`
- Purpose: update role details

### Delete role

- Method: DELETE
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.delete`
- Purpose: delete a role

### Add permissions to role

- Method: POST
- Route: `/api/v1/roles/:id/permissions`
- Authentication: required
- Permission: `roles.assign-permission`
- Purpose: assign permissions to a role

### Remove permissions from role

- Method: DELETE
- Route: `/api/v1/roles/:id/permissions`
- Authentication: required
- Permission: `roles.assign-permission`
- Purpose: remove permissions from a role

## Permissions

### List permissions

- Method: GET
- Route: `/api/v1/permissions`
- Authentication: required
- Permission: `permissions.read`
- Purpose: list all permissions

## Expenses

### List expenses

- Method: GET
- Route: `/api/v1/expenses`
- Authentication: required
- Permission: `expenses.read`
- Purpose: list expenses with pagination, search, sorting, and filtering
- Query parameters: `category`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create expense

- Method: POST
- Route: `/api/v1/expenses`
- Authentication: required
- Permission: `expenses.create`
- Purpose: create an expense
- Body: `category`, `amount`, `description`, `date`

### Get expense by id

- Method: GET
- Route: `/api/v1/expenses/:id`
- Authentication: required
- Permission: `expenses.read`
- Purpose: fetch a specific expense

### Update expense

- Method: PATCH
- Route: `/api/v1/expenses/:id`
- Authentication: required
- Permission: `expenses.update`
- Purpose: update an expense

### Delete expense

- Method: DELETE
- Route: `/api/v1/expenses/:id`
- Authentication: required
- Permission: `expenses.delete`
- Purpose: delete an expense

## Customers

### List customers

- Method: GET
- Route: `/api/v1/customers`
- Authentication: required
- Permission: `customers.read`
- Purpose: list customers with pagination, search, sorting, and filtering
- Query parameters: `status`, `search`, `sort`, `page`, `limit`

### Create customer

- Method: POST
- Route: `/api/v1/customers`
- Authentication: required
- Permission: `customers.create`
- Purpose: create a customer
- Body: `name`, `phone`, `email`, `address`, `notes`, `status`

### Get customer by id

- Method: GET
- Route: `/api/v1/customers/:id`
- Authentication: required
- Permission: `customers.read`
- Purpose: fetch a specific customer

### Update customer

- Method: PATCH
- Route: `/api/v1/customers/:id`
- Authentication: required
- Permission: `customers.update`
- Purpose: update a customer

## Employees

### List employees

- Method: GET
- Route: `/api/v1/employees`
- Authentication: required
- Permission: `employees.read`
- Purpose: list employees with pagination, search, sorting, and filtering
- Query parameters: `status`, `search`, `sort`, `page`, `limit`

### Create employee

- Method: POST
- Route: `/api/v1/employees`
- Authentication: required
- Permission: `employees.create`
- Purpose: create an employee
- Body: `name`, `phone`, `employmentStartDate`, `employmentEndDate` (optional), `status` (optional)

### Get employee by id

- Method: GET
- Route: `/api/v1/employees/:id`
- Authentication: required
- Permission: `employees.read`
- Purpose: fetch a specific employee

### Update employee

- Method: PATCH
- Route: `/api/v1/employees/:id`
- Authentication: required
- Permission: `employees.update`
- Purpose: update an employee's information
- Body: `name` (optional), `phone` (optional), `employmentStartDate` (optional), `employmentEndDate` (optional), `status` (optional)

## Employee Rates

### List employee rates

- Method: GET
- Route: `/api/v1/employee-rates`
- Authentication: required
- Permission: `employeeRates.read`
- Purpose: list employee rates with pagination, search, sorting, and filtering
- Query parameters: `employee`, `search`, `sort`, `page`, `limit`

### Create employee rate

- Method: POST
- Route: `/api/v1/employee-rates`
- Authentication: required
- Permission: `employeeRates.create`
- Purpose: record a new daily rate for an employee
- Body: `employee`, `dailyRate`, `effectiveDate`, `note` (optional)

### Get employee rate by id

- Method: GET
- Route: `/api/v1/employee-rates/:id`
- Authentication: required
- Permission: `employeeRates.read`
- Purpose: fetch a specific employee rate record

## Attendances

### List attendances

- Method: GET
- Route: `/api/v1/attendances`
- Authentication: required
- Permission: `attendances.read`
- Purpose: list attendance records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `workDate`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create attendance

- Method: POST
- Route: `/api/v1/attendances`
- Authentication: required
- Permission: `attendances.create`
- Purpose: record a day's attendance for an employee
- Body: `employee`, `workDate`, `morningStatus`, `afternoonStatus`

### Get attendance by id

- Method: GET
- Route: `/api/v1/attendances/:id`
- Authentication: required
- Permission: `attendances.read`
- Purpose: fetch a specific attendance record

### Update attendance

- Method: PATCH
- Route: `/api/v1/attendances/:id`
- Authentication: required
- Permission: `attendances.update`
- Purpose: update an existing attendance record
- Body: `morningStatus` (optional), `afternoonStatus` (optional)

## Overtimes

### List overtimes

- Method: GET
- Route: `/api/v1/overtimes`
- Authentication: required
- Permission: `overtimes.read`
- Purpose: list overtime records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `workDate`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create overtime

- Method: POST
- Route: `/api/v1/overtimes`
- Authentication: required
- Permission: `overtimes.create`
- Purpose: record overtime for an employee
- Body: `employee`, `workDate`, `duration`, `note` (optional)

### Get overtime by id

- Method: GET
- Route: `/api/v1/overtimes/:id`
- Authentication: required
- Permission: `overtimes.read`
- Purpose: fetch a specific overtime record

### Update overtime

- Method: PATCH
- Route: `/api/v1/overtimes/:id`
- Authentication: required
- Permission: `overtimes.update`
- Purpose: update an overtime record
- Body: `duration` (optional), `note` (optional)

## WeeklyPayrolls

### List weekly payrolls

- Method: GET
- Route: `/api/v1/weekly-payrolls`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: list closed weekly payrolls with pagination, search, sorting, and filtering
- Query parameters: `employee`, `from`, `to`, `status`, `search`, `sort`, `page`, `limit`

### Get weekly payroll by id

- Method: GET
- Route: `/api/v1/weekly-payrolls/:id`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: fetch a specific closed weekly payroll

### Get current payroll calculation

- Method: GET
- Route: `/api/v1/weekly-payrolls/employees/:employeeId/current`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: dynamically calculate the current, unclosed payroll period for an employee

### Close weekly payroll

- Method: POST
- Route: `/api/v1/weekly-payrolls/employees/:employeeId/close`
- Authentication: required
- Permission: `weeklyPayrolls.close`
- Purpose: finalize the current payroll period and create a permanent CLOSED snapshot

## Payments

### List payments

- Method: GET
- Route: `/api/v1/payments`
- Authentication: required
- Permission: `payments.read`
- Purpose: list payment records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create payment

- Method: POST
- Route: `/api/v1/payments`
- Authentication: required
- Permission: `payments.create`
- Purpose: record a payment to an employee
- Body: `employee`, `amount`, `paymentDate`, `note` (optional)

### Get payment by id

- Method: GET
- Route: `/api/v1/payments/:id`
- Authentication: required
- Permission: `payments.read`
- Purpose: fetch a specific payment record

### Update payment

- Method: PATCH
- Route: `/api/v1/payments/:id`
- Authentication: required
- Permission: `payments.update`
- Purpose: update a payment record
- Body: `employee` (optional), `amount` (optional), `paymentDate` (optional), `note` (optional)

### Delete payment

- Method: DELETE
- Route: `/api/v1/payments/:id`
- Authentication: required
- Permission: `payments.delete`
- Purpose: delete a payment record
