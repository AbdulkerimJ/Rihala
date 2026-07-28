# Business Rules

This document contains the rules that govern how the business operates.

---

# Users

- Every user must authenticate before accessing the system.
- Access is controlled using Role-Based Access Control (RBAC).
- Permissions are assigned to roles.
- Users receive permissions through their assigned role.

---

# Workers

## Types

The business has two worker types:

- Regular Worker
- Contract Worker

---

## Regular Workers

- Receive scheduled payments (typically weekly).
- Can receive bonuses.
- Can receive deductions.
- Can receive overtime.
- Can receive partial payments.

---

## Contract Workers

- Payment is negotiated before work begins.
- Can receive bonuses.
- Can receive deductions.
- Cannot receive overtime.
- Can receive partial payments.
- Can work on multiple contracts simultaneously.

---

# Contracts

- A contract belongs to exactly one worker.
- A worker can have multiple contracts.
- Contract payment is agreed before work starts.

Additional rules will be added as the business process becomes clearer.

---

# Suppliers

- Suppliers provide materials.
- Materials may be received before payment is made.
- A purchase may remain unpaid or partially paid.

---

# Purchases

- Purchases record the acquisition of materials.
- Purchases and payments are separate business events.
- Purchases may be:
  - Unpaid
  - Partially Paid
  - Fully Paid

---

# Operating Expenses

Operating expenses represent business costs unrelated to purchasing materials.

Examples include:

- Electricity
- Water
- Internet
- Fuel
- Rent
- Machine Maintenance
- Taxes

---

# Payments

The payment model is intentionally postponed.

Current understanding:

- Customers may pay in installments.
- Workers may receive partial payments.
- Suppliers may receive payments after materials are delivered.

The final payment model will be designed after additional business discovery.

---

# Security

- Only authenticated users can access protected resources.
- Authorization is enforced through RBAC.
- Administrative actions require appropriate permissions.

---

This document should be updated whenever a new business rule is discovered.