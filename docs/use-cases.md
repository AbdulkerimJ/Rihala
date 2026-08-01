# Use Cases

This document captures the major workflows that are currently implemented in the backend.

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

## Planned future use cases

The following workflows are discussed in the business documentation but are not yet implemented:

- manage workers
- manage contracts
- manage suppliers
- manage purchases
- manage orders
- manage payments
- view dashboard summaries and reports
