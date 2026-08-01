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
