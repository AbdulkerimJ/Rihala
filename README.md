# Rihala

Rihala is a monorepo for a furniture workshop management system. The system implements a comprehensive suite of features including authentication, user and role management, permissions, expense tracking, HR and payroll management, contracting, purchasing, and customer orders.

## Current backend scope

The REST API implements the following modules:

- Auth
- Users, Roles, and Permissions
- Customers, Orders, and Customer Payments
- Expenses
- Employees (Attendances, Overtimes, Employee Rates, Employee Payments, Weekly Payrolls)
- Contractors, Contracts, Contract Completions, and Contractor Payments
- Suppliers, Materials, Purchases, and Supplier Payments
- Tasks and Task Types

## Current web scope

The web app implements the authenticated frontend for all of the backend modules:

- Authentication and invitation onboarding
- Dashboard and reporting
- Users, Roles, and Permissions
- Customers, Orders, and Customer Payments
- Expenses
- Employees, Attendances, Overtimes, Employee Payments, and Weekly Payrolls
- Contractors, Contracts, Contract Completions, and Contractor Payments
- Suppliers, Materials, Purchases, and Supplier Payments
- Tasks and Task Types

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
