# Rihala

Rihala is a monorepo for a furniture workshop management system. The current backend already implements authentication, user and role management, permissions, expense tracking, and customer management. The remaining major business areas are still planned rather than implemented.

## Current backend scope

Implemented modules:

- Auth
- Users
- Roles
- Permissions
- Expenses
- Customers

Planned modules:

- Employees (attendance, overtime, daily rates, weekly settlements, adjustments)
- Contractors
- Contracts
- Suppliers
- Purchases
- Customer Orders
- Payments
- Dashboard and reporting

## Current web scope

The web app currently implements the authenticated frontend for:

- Authentication and invitation onboarding
- Users
- Roles
- Permissions
- Expenses
- Customers
- Orders

The web app uses an access-token-in-memory plus refresh-token-in-HttpOnly-cookie pattern. Permission-aware navigation and actions are driven by the permissions returned by the backend, but the backend remains the source of truth for authorization.

## Install

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Install web dependencies:

   ```bash
   cd web
   npm install
   ```

3. Copy the example environment files and adjust values as needed:
   - `backend/.env.example` -> `backend/.env`
   - `web/.env.example` -> `web/.env`

## Run

- Start the backend in development mode:

  ```bash
  cd backend
  npm run dev
  ```

- Start the web app in development mode:

  ```bash
  cd web
  npm run dev
  ```

- Start the backend in production mode:

  ```bash
  cd backend
  npm run start
  ```

## Workspace Layout

- `backend/` - Express and MongoDB REST API implementation
- `web/` - Vite and React application foundation
- `docs/` - Product, business, architecture, and API documentation

## Notes

- The source code is the source of truth for what is currently implemented.
- Documentation in this repository distinguishes implemented features from planned future work.
