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

## Orders

Orders are a planned business concept and not yet implemented.

The current planned design is:

- An Order represents a customer’s agreed request for Rihala to manufacture furniture.
- The customer may describe the request through a photo, reference, design idea, or verbal description.
- The final agreed design can initially be captured as an Order description.
- The business expects an agreed amount and expected completion date to be captured on the order in the future.
- Payments are planned as a separate concept and should not be represented as a single paidAmount field on Order in the initial design.

## Workers and Contracts

Worker and contract management are planned future business areas. The current implementation does not yet model these concepts.

## Suppliers and Purchases

Supplier and purchase management are planned future business areas. The current implementation does not yet model these concepts.

## Payments

The payment model is still planned and is not implemented yet.

---

# Security

- Only authenticated users can access protected resources.
- Authorization is enforced through RBAC and explicit permissions.
- Administrative actions require appropriate permissions.
- System roles are protected from modification or deletion in the current implementation.
