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

## Planned models not yet implemented

The following are discussed in the business documentation but are not implemented in the current backend:

- Worker
- Contract
- Supplier
- Purchase
- Order
- Payment

These remain planned domain concepts.
