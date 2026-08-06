# API Design

This document summarizes the API surface that currently exists in the backend. It is based on the implemented routes and middleware, not on planned modules.

Route permission names match the permission seeds in `admin.seed.js`.

---

## Authentication

### Login

- Method: POST
- Route: `/api/v1/auth/login`
- Authentication: none
- Permission: none
- Purpose: authenticate with email and password and receive an access token
- Body: `email`, `password`

### Refresh Access Token

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

### Forgot Password

- Method: POST
- Route: `/api/v1/auth/forgot-password`
- Authentication: none
- Permission: none
- Purpose: initiate a password reset flow
- Body: `email`

### Reset Password

- Method: POST
- Route: `/api/v1/auth/reset-password`
- Authentication: none
- Permission: none
- Purpose: complete a password reset using a verification token
- Body: `token`, `newPassword`

### Validate Invitation

- Method: GET
- Route: `/api/v1/auth/invitation/validate/:token`
- Authentication: none
- Permission: none
- Purpose: validate an invitation token

### Accept Invitation

- Method: POST
- Route: `/api/v1/auth/invitation/accept`
- Authentication: none
- Permission: none
- Purpose: complete invitation onboarding by setting password and activating the user
- Body: `token`, `code`, `password`, `confirmPassword`

---

## Users

### List Users

- Method: GET
- Route: `/api/v1/users`
- Authentication: required
- Permission: none at the route level; protected by authentication
- Purpose: list active users

### List Deleted Users

- Method: GET
- Route: `/api/v1/users/deleted`
- Authentication: required
- Permission: none at the route level
- Purpose: list soft-deleted users

### Create Invited User

- Method: POST
- Route: `/api/v1/users`
- Authentication: required
- Permission: none at the route level
- Purpose: create a user in invited status and issue an invitation flow
- Body: `name`, `email`, `roles`

### Update User

- Method: PATCH
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: update a user record

### Get User by ID

- Method: GET
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: fetch a single user

### Deactivate User

- Method: PATCH
- Route: `/api/v1/users/:id/deactivate`
- Authentication: required
- Permission: none at the route level
- Purpose: set a user to inactive

### Activate User

- Method: PATCH
- Route: `/api/v1/users/:id/activate`
- Authentication: required
- Permission: none at the route level
- Purpose: set a user to active

### Restore User

- Method: PATCH
- Route: `/api/v1/users/:id/restore`
- Authentication: required
- Permission: none at the route level
- Purpose: restore a soft-deleted user

### Soft Delete User

- Method: DELETE
- Route: `/api/v1/users/:id`
- Authentication: required
- Permission: none at the route level
- Purpose: soft-delete a user

### Assign Roles to User

- Method: POST
- Route: `/api/v1/users/:id/roles`
- Authentication: required
- Permission: `users.assign-role`
- Purpose: assign roles to a user

### Remove Role from User

- Method: DELETE
- Route: `/api/v1/users/:id/roles/:roleId`
- Authentication: required
- Permission: `users.assign-role`
- Purpose: remove a role from a user

---

## Roles

### List Roles

- Method: GET
- Route: `/api/v1/roles`
- Authentication: required
- Permission: `roles.read`
- Purpose: list roles with populated permissions

### Create Role

- Method: POST
- Route: `/api/v1/roles`
- Authentication: required
- Permission: `roles.create`
- Purpose: create a role

### Get Role by ID

- Method: GET
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.read`
- Purpose: fetch a role

### Update Role

- Method: PATCH
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.update`
- Purpose: update role details

### Delete Role

- Method: DELETE
- Route: `/api/v1/roles/:id`
- Authentication: required
- Permission: `roles.delete`
- Purpose: delete a role

### Add Permissions to Role

- Method: POST
- Route: `/api/v1/roles/:id/permissions`
- Authentication: required
- Permission: `roles.assign-permission`
- Purpose: assign permissions to a role

### Remove Permissions from Role

- Method: DELETE
- Route: `/api/v1/roles/:id/permissions`
- Authentication: required
- Permission: `roles.assign-permission`
- Purpose: remove permissions from a role

---

## Permissions

### List Permissions

- Method: GET
- Route: `/api/v1/permissions`
- Authentication: required
- Permission: `permissions.read`
- Purpose: list all permissions

---

## Expenses

> Expenses use voiding instead of hard deletion. No DELETE endpoint exists.

### List Expenses

- Method: GET
- Route: `/api/v1/expenses`
- Authentication: required
- Permission: `expenses.read`
- Purpose: list expenses with pagination, search, sorting, and filtering; defaults to `status=active`
- Query parameters: `category`, `from`, `to`, `search`, `sort`, `page`, `limit`, `status`

### Create Expense

- Method: POST
- Route: `/api/v1/expenses`
- Authentication: required
- Permission: `expenses.create`
- Purpose: create an expense
- Body: `category`, `amount`, `description`, `date`

### Get Expense by ID

- Method: GET
- Route: `/api/v1/expenses/:id`
- Authentication: required
- Permission: `expenses.read`
- Purpose: fetch a specific expense

### Update Expense

- Method: PATCH
- Route: `/api/v1/expenses/:id`
- Authentication: required
- Permission: `expenses.update`
- Purpose: update an active expense

### Void Expense

- Method: PATCH
- Route: `/api/v1/expenses/:id/void`
- Authentication: required
- Permission: `expenses.void`
- Purpose: void an expense — sets status to `voided`, records `voidReason`, `voidedBy`, `voidedAt`
- Body: `voidReason`

---

## Customers

### List Customers

- Method: GET
- Route: `/api/v1/customers`
- Authentication: required
- Permission: `customers.read`
- Purpose: list customers with pagination, search, sorting, and filtering
- Query parameters: `status`, `search`, `sort`, `page`, `limit`

### Create Customer

- Method: POST
- Route: `/api/v1/customers`
- Authentication: required
- Permission: `customers.create`
- Purpose: create a customer
- Body: `name`, `phone`, `email`, `address`, `notes`, `status`

### Get Customer by ID

- Method: GET
- Route: `/api/v1/customers/:id`
- Authentication: required
- Permission: `customers.read`
- Purpose: fetch a specific customer

### Update Customer

- Method: PATCH
- Route: `/api/v1/customers/:id`
- Authentication: required
- Permission: `customers.update`
- Purpose: update a customer

---

## Orders

### List Orders

- Method: GET
- Route: `/api/v1/orders`
- Authentication: required
- Permission: `orders.read`
- Purpose: list orders with pagination, search, sorting, and filtering
- Query parameters: `status`, `customer`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Order

- Method: POST
- Route: `/api/v1/orders`
- Authentication: required
- Permission: `orders.create`
- Purpose: create an Order for an active customer; snapshots customer identity; generates sequential orderNumber
- Body: `customer`, `date`, `items[]`, `agreedAmount`, `expectedCompletionDate`, `notes`

### Get Order by ID

- Method: GET
- Route: `/api/v1/orders/:id`
- Authentication: required
- Permission: `orders.read`
- Purpose: fetch a specific order

### Update Order

- Method: PATCH
- Route: `/api/v1/orders/:id`
- Authentication: required
- Permission: `orders.update`
- Purpose: update an order (status, items, dates, etc.); completed/cancelled orders cannot be modified
- Body: `customer` (optional), `date` (optional), `items` (optional), `agreedAmount` (optional), `expectedCompletionDate` (optional), `status` (optional), `notes` (optional)

---

## Customer Payments

> Customer Payments use voiding instead of hard deletion. No DELETE endpoint exists.
> Payments are always made against a specific Order.

### List Customer Payments

- Method: GET
- Route: `/api/v1/customer-payments`
- Authentication: required
- Permission: `customerPayments.read`
- Purpose: list customer payments; defaults to `status=active`
- Query parameters: `order`, `status`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Customer Payment

- Method: POST
- Route: `/api/v1/customer-payments`
- Authentication: required
- Permission: `customerPayments.create`
- Purpose: record a payment against an Order; validates remaining balance; snapshots customerName and orderNumber; transaction-bounded
- Body: `order`, `amount`, `paymentDate`, `note` (optional)

### Get Customer Payment by ID

- Method: GET
- Route: `/api/v1/customer-payments/:id`
- Authentication: required
- Permission: `customerPayments.read`
- Purpose: fetch a specific customer payment

### Update Customer Payment

- Method: PATCH
- Route: `/api/v1/customer-payments/:id`
- Authentication: required
- Permission: `customerPayments.update`
- Purpose: update only the `note` field of an active payment; voided payments cannot be updated
- Body: `note`

### Void Customer Payment

- Method: PATCH
- Route: `/api/v1/customer-payments/:id/void`
- Authentication: required
- Permission: `customerPayments.void`
- Purpose: void an active customer payment; records `voidReason`, `voidedBy`, `voidedAt`
- Body: `voidReason`

---

## Employees

### List Employees

- Method: GET
- Route: `/api/v1/employees`
- Authentication: required
- Permission: `employees.read`
- Purpose: list employees with pagination, search, sorting, and filtering
- Query parameters: `status`, `search`, `sort`, `page`, `limit`

### Create Employee

- Method: POST
- Route: `/api/v1/employees`
- Authentication: required
- Permission: `employees.create`
- Purpose: create an employee
- Body: `name`, `phone`, `employmentStartDate`, `employmentEndDate` (optional), `status` (optional)

### Get Employee by ID

- Method: GET
- Route: `/api/v1/employees/:id`
- Authentication: required
- Permission: `employees.read`
- Purpose: fetch a specific employee

### Update Employee

- Method: PATCH
- Route: `/api/v1/employees/:id`
- Authentication: required
- Permission: `employees.update`
- Purpose: update an employee's information
- Body: `name` (optional), `phone` (optional), `employmentStartDate` (optional), `employmentEndDate` (optional), `status` (optional)

---

## Employee Rates

### List Employee Rates

- Method: GET
- Route: `/api/v1/employee-rates`
- Authentication: required
- Permission: `employeeRates.read`
- Purpose: list employee rates with pagination, search, sorting, and filtering
- Query parameters: `employee`, `search`, `sort`, `page`, `limit`

### Create Employee Rate

- Method: POST
- Route: `/api/v1/employee-rates`
- Authentication: required
- Permission: `employeeRates.create`
- Purpose: record a new daily rate for an employee
- Body: `employee`, `dailyRate`, `effectiveDate`, `note` (optional)

### Get Employee Rate by ID

- Method: GET
- Route: `/api/v1/employee-rates/:id`
- Authentication: required
- Permission: `employeeRates.read`
- Purpose: fetch a specific employee rate record

---

## Attendances

### List Attendances

- Method: GET
- Route: `/api/v1/attendances`
- Authentication: required
- Permission: `attendances.read`
- Purpose: list attendance records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `workDate`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Attendance

- Method: POST
- Route: `/api/v1/attendances`
- Authentication: required
- Permission: `attendances.create`
- Purpose: record a day's attendance for an employee
- Body: `employee`, `workDate`, `morningStatus`, `afternoonStatus`

### Get Attendance by ID

- Method: GET
- Route: `/api/v1/attendances/:id`
- Authentication: required
- Permission: `attendances.read`
- Purpose: fetch a specific attendance record

### Update Attendance

- Method: PATCH
- Route: `/api/v1/attendances/:id`
- Authentication: required
- Permission: `attendances.update`
- Purpose: update an existing attendance record
- Body: `morningStatus` (optional), `afternoonStatus` (optional)

---

## Overtimes

### List Overtimes

- Method: GET
- Route: `/api/v1/overtimes`
- Authentication: required
- Permission: `overtimes.read`
- Purpose: list overtime records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `workDate`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Overtime

- Method: POST
- Route: `/api/v1/overtimes`
- Authentication: required
- Permission: `overtimes.create`
- Purpose: record overtime for an employee
- Body: `employee`, `workDate`, `duration`, `note` (optional)

### Get Overtime by ID

- Method: GET
- Route: `/api/v1/overtimes/:id`
- Authentication: required
- Permission: `overtimes.read`
- Purpose: fetch a specific overtime record

### Update Overtime

- Method: PATCH
- Route: `/api/v1/overtimes/:id`
- Authentication: required
- Permission: `overtimes.update`
- Purpose: update an overtime record
- Body: `duration` (optional), `note` (optional)

---

## Weekly Payrolls

### List Weekly Payrolls

- Method: GET
- Route: `/api/v1/weekly-payrolls`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: list closed weekly payrolls with pagination, search, sorting, and filtering
- Query parameters: `employee`, `from`, `to`, `status`, `search`, `sort`, `page`, `limit`

### Get Weekly Payroll by ID

- Method: GET
- Route: `/api/v1/weekly-payrolls/:id`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: fetch a specific closed weekly payroll

### Get Current Payroll Calculation

- Method: GET
- Route: `/api/v1/weekly-payrolls/employees/:employeeId/current`
- Authentication: required
- Permission: `weeklyPayrolls.read`
- Purpose: dynamically calculate the current, unclosed payroll period for an employee

### Close Weekly Payroll

- Method: POST
- Route: `/api/v1/weekly-payrolls/employees/:employeeId/close`
- Authentication: required
- Permission: `weeklyPayrolls.close`
- Purpose: finalize the current payroll period and create a permanent CLOSED snapshot

---

## Employee Payments

> Employee Payments use voiding instead of hard deletion. No DELETE endpoint exists.
> Route: `/api/v1/employee-payments` (not `/api/v1/payments`)
> Permission namespace: `employeePayments.*` (not `payments.*`)

### List Employee Payments

- Method: GET
- Route: `/api/v1/employee-payments`
- Authentication: required
- Permission: `employeePayments.read`
- Purpose: list employee payment records with pagination, search, sorting, and filtering
- Query parameters: `employee`, `from`, `to`, `type`, `search`, `sort`, `page`, `limit`

### Create Employee Payment

- Method: POST
- Route: `/api/v1/employee-payments`
- Authentication: required
- Permission: `employeePayments.create`
- Purpose: record a payment to an active employee; snapshots `employeeName`
- Body: `employee`, `amount`, `paymentDate`, `type`, `note` (optional)

### Get Employee Payment by ID

- Method: GET
- Route: `/api/v1/employee-payments/:id`
- Authentication: required
- Permission: `employeePayments.read`
- Purpose: fetch a specific employee payment record

### Update Employee Payment

- Method: PATCH
- Route: `/api/v1/employee-payments/:id`
- Authentication: required
- Permission: `employeePayments.update`
- Purpose: update an employee payment record (note, type, amount, paymentDate)
- Body: `amount` (optional), `paymentDate` (optional), `type` (optional), `note` (optional)

---

## Suppliers

### List Suppliers

- Method: GET
- Route: `/api/v1/suppliers`
- Authentication: required
- Permission: `suppliers.read`
- Purpose: list suppliers with pagination, search, sorting, and filtering
- Query parameters: `status`, `search`, `sort`, `page`, `limit`

### Create Supplier

- Method: POST
- Route: `/api/v1/suppliers`
- Authentication: required
- Permission: `suppliers.create`
- Purpose: create a supplier
- Body: `name`, `phone`, `address` (optional), `note` (optional), `status` (optional)

### Get Supplier by ID

- Method: GET
- Route: `/api/v1/suppliers/:id`
- Authentication: required
- Permission: `suppliers.read`
- Purpose: fetch a specific supplier

### Update Supplier

- Method: PATCH
- Route: `/api/v1/suppliers/:id`
- Authentication: required
- Permission: `suppliers.update`
- Purpose: update a supplier's information

---

## Materials

### List Materials

- Method: GET
- Route: `/api/v1/materials`
- Authentication: required
- Permission: `materials.read`
- Purpose: list materials with pagination, search, sorting, and filtering
- Query parameters: `category`, `status`, `search`, `sort`, `page`, `limit`

### Create Material

- Method: POST
- Route: `/api/v1/materials`
- Authentication: required
- Permission: `materials.create`
- Purpose: create a material catalog entry
- Body: `name`, `category`, `unit`, `status` (optional)

### Get Material by ID

- Method: GET
- Route: `/api/v1/materials/:id`
- Authentication: required
- Permission: `materials.read`
- Purpose: fetch a specific material

### Update Material

- Method: PATCH
- Route: `/api/v1/materials/:id`
- Authentication: required
- Permission: `materials.update`
- Purpose: update a material's information

---

## Purchases

### List Purchases

- Method: GET
- Route: `/api/v1/purchases`
- Authentication: required
- Permission: `purchases.read`
- Purpose: list purchases with pagination, search, sorting, and filtering
- Query parameters: `supplier`, `paymentStatus`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Purchase

- Method: POST
- Route: `/api/v1/purchases`
- Authentication: required
- Permission: `purchases.create`
- Purpose: create a purchase with structured items; triggers credit allocation if supplier has unallocated credit
- Body: `supplier`, `date`, `items[]`, `note` (optional)

### Get Purchase by ID

- Method: GET
- Route: `/api/v1/purchases/:id`
- Authentication: required
- Permission: `purchases.read`
- Purpose: fetch a specific purchase

### Update Purchase

- Method: PATCH
- Route: `/api/v1/purchases/:id`
- Authentication: required
- Permission: `purchases.update`
- Purpose: update a purchase; amount changes trigger allocation reconciliation
- Body: `date` (optional), `items` (optional), `note` (optional)

---

## Supplier Payments

> Supplier Payments cannot be hard-deleted. No DELETE endpoint exists.
> `allocations` and `unallocatedAmount` are backend-controlled; do not submit them in requests.

### List Supplier Payments

- Method: GET
- Route: `/api/v1/supplier-payments`
- Authentication: required
- Permission: `supplierPayments.read`
- Purpose: list supplier payment records with pagination, search, sorting, and filtering
- Query parameters: `supplier`, `type`, `from`, `to`, `search`, `sort`, `page`, `limit`

### Create Supplier Payment

- Method: POST
- Route: `/api/v1/supplier-payments`
- Authentication: required
- Permission: `supplierPayments.create`
- Purpose: create a SPECIFIC or GENERAL supplier payment; allocation engine runs automatically within a transaction
- Body: `supplier`, `type`, `amount`, `date`, `note` (optional), `paymentReference` (optional), `purchaseId` (required if type=SPECIFIC)

### Get Supplier Payment by ID

- Method: GET
- Route: `/api/v1/supplier-payments/:id`
- Authentication: required
- Permission: `supplierPayments.read`
- Purpose: fetch a specific supplier payment

### Update Supplier Payment

- Method: PATCH
- Route: `/api/v1/supplier-payments/:id`
- Authentication: required
- Permission: `supplierPayments.update`
- Purpose: update supplier payment date, note, or amount; amount changes trigger allocation reconciliation within a transaction
- Body: `date` (optional), `note` (optional), `amount` (optional)

---

## Permission Reference

The following is the complete current permission namespace as defined in the permission seed:

| Namespace             | Permissions                                                  |
|-----------------------|--------------------------------------------------------------|
| `users.*`             | read, create, update, delete, restore, assign-role           |
| `roles.*`             | read, create, update, delete, assign-permission              |
| `permissions.*`       | read                                                         |
| `expenses.*`          | read, create, update, void                                   |
| `customers.*`         | read, create, update                                         |
| `orders.*`            | read, create, update                                         |
| `employees.*`         | read, create, update                                         |
| `employeeRates.*`     | read, create, update                                         |
| `attendances.*`       | read, create, update                                         |
| `overtimes.*`         | read, create, update                                         |
| `weeklyPayrolls.*`    | read, close                                                  |
| `employeePayments.*`  | read, create, update, void                                   |
| `suppliers.*`         | read, create, update                                         |
| `materials.*`         | read, create, update                                         |
| `purchases.*`         | read, create, update                                         |
| `supplierPayments.*`  | read, create, update, void                                   |
| `customerPayments.*`  | read, create, update, void                                   |

**Notes:**
- `expenses.delete` no longer exists; voiding replaced hard deletion.
- `payments.*` no longer exists; the employee payment namespace is `employeePayments.*`.
- No `delete` permission exists for CustomerPayments, SupplierPayments, or EmployeePayments; hard deletion was not implemented for these financial domains.
