# Domain Model

This document reflects the entities that are implemented in the current backend. Planned concepts are explicitly labeled as future work.

## Implemented entities

### User

Represents an internal system user.

Attributes and behavior currently supported:

- name
- email
- password (hashed)
- emailVerified
- roles
- status: active, inactive, invited
- deletedAt and deletedBy for soft deletion

Relationships:

- A user may have many roles.
- A user may own refresh tokens and verification tokens.

### Role

Represents a set of permissions that can be assigned to users.

Relationships:

- A role may contain many permissions.
- A role may be assigned to many users.

### Permission

Represents a named permission such as `users.read` or `expenses.create`.

Relationships:

- Permissions are attached to roles.

### RefreshToken

Represents a persisted refresh token for a user.

Important properties:

- user reference
- token hash
- expiration date
- revocation state
- device and network metadata

### VerificationToken

Represents a persisted verification token used for password resets or invitation onboarding.

Important properties:

- user reference
- type: `password_reset` or `invitation`
- token hash
- optional verification code hash
- expiration date
- usage state

### Expense

Represents a business expense.

Important fields:

- category
- amount
- description
- date
- createdBy

### Customer

Represents a customer of the business.

Important fields:

- name
- phone
- email
- address
- notes
- status: active or inactive

Customers are separate from users and do not have a userId relationship.

### Employee

Represents a regular worker employed directly by the workshop.

Important fields:

- name
- contact details
- employmentStartDate
- employmentEndDate (optional)
- status: active or inactive

An employee is separate from a system user and separate from a contractor. Employees participate in the daily-rate attendance and payroll workflow.

### EmployeeRate

Represents a daily rate record for an employee, including a history of rate changes.

Important fields:

- employee reference
- dailyRate (e.g., 500 ETB)
- effectiveDate

A new rate record is created each time the daily rate changes. Historical attendance and overtime calculations use the rate that was applicable on the relevant date.

### Attendance

Represents a single day's attendance record for an employee.

Important fields:

- employee reference
- workDate
- morningStatus: `PRESENT` or `REST`
- afternoonStatus: `PRESENT` or `REST`

Constraints:

- One record per employee per date.
- Only created for employees (not contractors).
- Must fall within the employee's employment period.

The daily paid portion is derived from the two status fields:

- `PRESENT + PRESENT` = 1 full day
- `PRESENT + REST` or `REST + PRESENT` = 0.5 day
- `REST + REST` = 0 days

### Overtime

Represents an overtime record for an employee on a specific date.

Important fields:

- employee reference
- workDate
- duration: `HALF_DAY` or `FULL_DAY`
- note (optional)

Overtime is separate from attendance. An employee may have both an attendance record and an overtime record on the same date. The overtime rate is 2× the applicable daily rate.

### WeeklyPayroll

Represents a finalized financial result for one employee for a dynamically calculated period.

Important fields:

- employee reference
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

### Payment

Represents actual money given to an employee on a specific date.

Important fields:

- employee reference
- paymentDate
- amount
- note (optional)

Payments are independent of `WeeklyPayroll` and simply record money paid.

---

## Planned future entities

The following concepts are discussed in the business documents but are not implemented in the current backend.

### Contractor

Represents a person who works with the workshop under a negotiated contract/deal.

Planned fields:

- name
- contact details

Contractors do not participate in the employee attendance, overtime, or weekly settlement workflow. Contractor payment rules will be designed separately.

### Contract

Represents an agreement between the workshop and a contractor.

Planned fields:

- contractor reference
- description
- agreedAmount
- status

Each contractor may be associated with one or more contracts.

### Supplier

Represents a supplier of materials or services.

Planned fields:

- name
- contact details

### Purchase

Represents a material purchase from a supplier.

Planned fields:

- supplier reference
- amount
- description
- date
- status

### CustomerOrder

Represents a customer's furniture manufacturing request.

Planned fields:

- customer reference
- description
- agreedAmount
- expectedCompletionDate
- status
- notes

`createdAt` represents when the order is registered; a separate orderDate field is not required in the initial design.

These should be treated as planned domain concepts rather than implemented entities.
