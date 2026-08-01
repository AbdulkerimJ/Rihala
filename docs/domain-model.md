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

## Planned future entities

The following concepts are discussed in the business documents but are not implemented in the current backend:

- Order
- Worker
- Contract
- Supplier
- Purchase
- Payment

These should be treated as planned domain concepts rather than implemented entities.
