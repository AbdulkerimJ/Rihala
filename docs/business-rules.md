# Business Rules

This document records the business rules that are either implemented today or explicitly planned for future work.

---

# Implemented Rules

## Authentication and access

- Every user must authenticate before accessing protected resources.
- Access is controlled through permission-based RBAC.
- Permissions are assigned to roles, and users receive access through their assigned roles.
- Authentication uses JWT access tokens and persisted refresh tokens.
- Password resets and invitation-based onboarding are supported through verification tokens.

## Users

- Users may have one of three statuses: active, inactive, or invited.
- Users can be invited without an initial password and later complete onboarding.
- Users may be assigned one or more roles.
- Users may be soft-deleted and restored.
- The system distinguishes system users from customers.

## Expenses

- Expenses represent money spent by the business.
- Expenses are recorded with a category, amount, description, and date.
- The business does not currently require every material purchase to be assigned to a specific project or order.
- Expense categories are constrained to a fixed set defined by the implementation.

## Customers

- Customers are separate from system users.
- Customers are retained rather than permanently deleted.
- Customer records can be deactivated or reactivated through update operations.
- Customer phone numbers are normalized to the Ethiopian international format.
- Customer email is optional and normalized to lowercase.
- Customer phone and email must remain unique.

---

# Planned Rules

## Customer Orders

Customer Orders are a planned business concept and not yet implemented.

The current planned design is:

- A Customer Order represents a customer's agreed request for Rihala to manufacture furniture.
- The customer may describe the request through a photo, reference, design idea, or verbal description.
- The final agreed design can initially be captured as a Customer Order description.
- The business expects an agreed amount and expected completion date to be captured on the order.
- Payments are planned as a separate concept and should not be represented as a single paidAmount field on a Customer Order.

---

## Employees

### General

- An **Employee** is a regular worker employed directly by the workshop.
- Employees are separate from system users and separate from contractors.
- Attendance, overtime, and weekly settlement apply to employees only, not to contractors.

### Employment Period

- Each employee has an employment start date.
- Employees may have an employment end date when they leave.
- Only dates within the employee's active employment period are expected to have attendance records.
- Dates before the start date or after the end date are not treated as absences.
- Historical records remain accessible after an employee's employment ends.

### Daily Rate

- Employees are compensated based on a **daily rate** (e.g., 500 ETB/day), not a monthly or weekly salary.
- Daily rates may change over time.
- Each rate change is stored as a new rate record with an effective date.
- Historical attendance and overtime calculations must use the rate that was applicable on the relevant date.
- The system must not overwrite old financial records when a rate changes.

### Attendance

- Attendance is recorded manually by staff.
- Attendance is recorded twice per normal working day: **morning** and **afternoon**.
- Each half-day has one of two statuses: `PRESENT` or `REST`.
- `REST` and absence are treated as the same concept for the MVP.
- The daily paid portion is derived from the two half-day records:
  - `PRESENT + PRESENT` = 1 full day
  - `PRESENT + REST` or `REST + PRESENT` = 0.5 day
  - `REST + REST` = 0 days
- Derived values such as `FULL_DAY` or `HALF_DAY` must not be stored redundantly if they can be derived.
- Normal attendance is required for **Monday–Saturday**.
- Sunday is not a normal attendance day.
- There must be exactly one attendance record per employee per date.
- Attendance must belong to an employee (not a contractor).
- Attendance must not be created for a Sunday as a normal attendance record.
- Attendance dates must fall within the employee's active employment period.

### Missing Attendance

- A missing attendance record for a required day (Mon–Sat, within employment period) does **not** automatically default to absence.
- When calculating a week, missing required attendance must be detected and must block settlement until resolved.
- Unnecessary `PENDING` attendance records must not be created proactively; missing records are detected at review/calculation time.

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

## Weekly Period

- The employee payroll period is **Monday–Sunday**.
- Example: 2026-08-03 (Monday) → 2026-08-09 (Sunday).
- Attendance and overtime belong to the week determined by their actual work date, not the date the record was entered.
- Sunday is part of the weekly period but is an overtime-only day, not a normal attendance day.

---

## Weekly Settlement

- Settlement is calculated **per employee per week**.
- There is no single workshop-wide settlement record.
- Settlement calculation includes:
  - Normal attendance earnings
  - Overtime earnings
  - Applicable previous outstanding balances or financial adjustments
  - Minus payments allocated to the employee
- The settlement preserves the finalized financial result for historical consistency.
- Do not duplicate information that can be derived from the underlying records.

### Settlement Status

- Settlement lifecycle: `OPEN → SETTLED`.
- **OPEN**: The week is still in progress. Attendance, overtime, and payments may be recorded or corrected.
- **SETTLED**: The weekly earning calculation is finalized. A settled week is not reopened for payment adjustments or corrections.
- No additional statuses such as `APPROVED`, `REJECTED`, or `CANCELLED` are used.

---

## Payments

- A payment represents actual money given to an employee.
- Each payment records: employee, payment date, amount, and an optional note.
- The payment date is when the employee actually received the money. It does not determine which week's earnings the payment covers.
- Payments may occur before, during, or after settlement.
- A payment does not reopen a settled week.

### Payment Allocation

- When an employee has multiple outstanding balances, payments are allocated using **oldest outstanding balance first**.
- Example:
  - Week 1 outstanding = 500; Week 2 outstanding = 1,000; Payment = 1,200
  - Allocation: Week 1 → 500 (fully settled), Week 2 → 700 (partially settled)

### Advances

- If a payment exceeds the employee's current total outstanding balance, the excess is treated as an **advance**.
- The advance carries forward and reduces future amounts owed.
- Example: Outstanding = 1,000; Payment = 1,500 → 1,000 settles outstanding; 500 becomes an advance.

---

## Outstanding Balances

- Previous unpaid balances are not merged into the new week's earnings.
- Weekly earnings are kept historically separate.
- Example:
  - Week 1: Earned = 3,000, Paid = 2,000, Outstanding = 1,000
  - Week 2: Earned = 3,500
  - Total currently owed = 4,500 (1,000 from Week 1 + 3,500 from Week 2)

---

## Post-Settlement Corrections

- Settled records are not silently modified.
- Errors discovered after settlement are recorded as explicit **adjustments** with a reason.
- The original settlement record remains historically intact.
- The adjustment affects the employee's current financial position.
- Adjustments may correct attendance errors, overtime errors, rate application errors, or other payroll calculation errors.
- There is no approval workflow for adjustments at this stage.

---

## Contractors

- A **Contractor** is a person who works with the workshop under a negotiated contract/deal.
- Contractors do not use the employee attendance, overtime, or weekly settlement workflow.
- Contractor payment rules will be designed separately.

### Contracts

- A **Contract** is an agreement between the workshop and a contractor.
- Each contractor may be associated with one or more contracts.

---

## Suppliers and Purchases

Supplier and purchase management are planned future business areas. The current implementation does not yet model these concepts.

---

## Payments (general)

The payment model for non-employee transactions (e.g., customer payments, supplier payments) is still planned and not implemented yet.

---

# Out of Scope for Current Phase

- Bonuses and penalties are intentionally excluded from this payroll step.
- Contractor payment rules are not yet designed.

---

# Security

- Only authenticated users can access protected resources.
- Authorization is enforced through RBAC and explicit permissions.
- Administrative actions require appropriate permissions.
- System roles are protected from modification or deletion in the current implementation.
