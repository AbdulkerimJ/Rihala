# Database

The current backend uses MongoDB with Mongoose models. The implementation currently persists the following main collections/models:

## Implemented models and collections

### User

- Model name: `User`
- Purpose: internal system users
- Important fields:
  - name
  - email
  - password (hashed)
  - emailVerified
  - roles
  - status (`active`, `inactive`, `invited`)
  - deletedAt
  - deletedBy
- Notes:
  - password is not returned by default in queries
  - soft-delete is implemented through `deletedAt`

### Role

- Model name: `Role`
- Purpose: groups permissions for authorization
- Important fields:
  - name
  - permissions
  - isSystemRole
- Notes:
  - system roles are protected from modification or deletion

### Permission

- Model name: `Permission`
- Purpose: named authorization permissions
- Important fields:
  - name
  - description

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

### Expense

- Model name: `Expense`
- Purpose: business expense records
- Important fields:
  - category
  - amount
  - description
  - date
  - createdBy
- Notes:
  - category uses a fixed enum list

### Customer

- Model name: `Customer`
- Purpose: customer records for the business
- Important fields:
  - name
  - phone
  - email
  - address
  - notes
  - status (`active`, `inactive`)
- Notes:
  - phone is normalized to the Ethiopian international format
  - email is optional and normalized to lowercase
  - phone and email are unique where present
  - customers are not users and do not have a userId relationship

---

## Planned models not yet implemented

The following are discussed in the business documentation but are not implemented in the current backend.

### Employee

- Model name: `Employee`
- Purpose: regular workshop workers who participate in the attendance and weekly settlement workflow
- Planned fields:
  - name
  - contact details
  - employmentStartDate
  - employmentEndDate (optional)
  - status (`active`, `inactive`)
- Notes:
  - employees are separate from system users and from contractors
  - historical records remain accessible after an employee's employment ends

### EmployeeRate

- Model name: `EmployeeRate`
- Purpose: records the daily rate for an employee, supporting a full history of rate changes
- Planned fields:
  - employee (reference)
  - dailyRate (numeric, e.g., 500 ETB)
  - effectiveDate
- Notes:
  - a new record is created each time the daily rate changes
  - the applicable rate for a given date is the most recent record whose effectiveDate is on or before that date
  - historical calculations must not be affected when a new rate is added

### Attendance

- Model name: `Attendance`
- Purpose: records morning and afternoon attendance for an employee on a specific working day
- Planned fields:
  - employee (reference)
  - workDate
  - morningStatus (`PRESENT`, `REST`)
  - afternoonStatus (`PRESENT`, `REST`)
- Notes:
  - one record per employee per date (unique constraint)
  - only created for employees (not contractors)
  - not created for Sunday as a normal attendance record
  - must fall within the employee's employment period
  - the daily paid portion is derived: `PRESENT+PRESENT` = 1.0, `PRESENT+REST` or `REST+PRESENT` = 0.5, `REST+REST` = 0.0

### Overtime

- Model name: `Overtime`
- Purpose: records an overtime event for an employee on a specific date
- Planned fields:
  - employee (reference)
  - workDate
  - duration (`HALF_DAY`, `FULL_DAY`)
  - note (optional)
- Notes:
  - separate from the attendance record; an employee may have both on the same date
  - rate is 2× the applicable employee daily rate for the workDate
  - no distinction between Sunday, night, or other overtime types in the MVP

### WeeklySettlement

- Model name: `WeeklySettlement`
- Purpose: the finalized financial result for one employee for one Monday–Sunday period
- Planned fields:
  - employee (reference)
  - weekStartDate (Monday)
  - weekEndDate (Sunday)
  - status (`OPEN`, `SETTLED`)
  - snapshot of calculated earnings as needed for historical consistency
- Notes:
  - one record per employee per week (unique constraint)
  - settlement is not reopened when a payment is made after the fact
  - post-settlement corrections are handled through SettlementAdjustment records

### SettlementAdjustment

- Model name: `SettlementAdjustment`
- Purpose: records a post-settlement correction or financial adjustment for an employee
- Planned fields:
  - employee (reference)
  - weeklySettlement (reference, optional for traceability)
  - amount (positive for credit, negative for debit)
  - reason
  - createdAt
  - createdBy
- Notes:
  - the original settlement record remains intact
  - the adjustment affects the employee's current financial position

### Payment

- Model name: `Payment`
- Purpose: records actual money given to an employee
- Planned fields:
  - employee (reference)
  - paymentDate
  - amount
  - note (optional)
- Notes:
  - payments are allocated using oldest-outstanding-balance-first
  - excess payment over the current outstanding balance is treated as an advance
  - a payment does not reopen a settled week

### Contractor

- Model name: `Contractor`
- Purpose: contractual workers who work under negotiated deals rather than the daily-rate attendance model
- Planned fields:
  - name
  - contact details
- Notes:
  - contractors do not have attendance, overtime, or weekly settlement records
  - contractor payment rules will be designed separately

### Contract

- Model name: `Contract`
- Purpose: an agreement/deal between the workshop and a contractor
- Planned fields:
  - contractor (reference)
  - description
  - agreedAmount
  - status
- Notes:
  - each contractor may have one or more contracts

### Supplier

- Model name: `Supplier`
- Purpose: suppliers of materials or services
- Planned fields:
  - name
  - contact details

### Purchase

- Model name: `Purchase`
- Purpose: material or service purchases from suppliers
- Planned fields:
  - supplier (reference)
  - amount
  - description
  - date
  - status

### CustomerOrder

- Model name: `CustomerOrder`
- Purpose: a customer's furniture manufacturing request
- Planned fields:
  - customer (reference)
  - description
  - agreedAmount
  - expectedCompletionDate
  - status
  - notes
- Notes:
  - `createdAt` represents when the order is registered; no separate orderDate field is required
  - payments for customer orders are planned as a separate concept

These remain planned domain concepts.
