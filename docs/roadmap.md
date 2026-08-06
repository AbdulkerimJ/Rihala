# Rihala Roadmap

> **Project:** Rihala
>
> **Type:** Furniture Workshop Management System
>
> **Status:** Active Development
>
> **Current Version:** MVP (v1.0)

---

# Vision

Rihala aims to become a complete management system for furniture manufacturing businesses. The first version focuses on solving the company's daily operational problems while providing a scalable foundation for future growth.

---

# Current Implementation Status

The current backend includes the following fully implemented modules:

- Foundation infrastructure (Express, MongoDB, validation, error handling, shared query utilities)
- Authentication and refresh-token management
- User lifecycle management, including invited-user onboarding
- Role and permission management
- Expense management (with void support, hardcoded categories)
- Customer management
- Order management (full lifecycle, status state machine, status history)
- Customer Payment management (Order-referenced, balance enforcement, void, transactions)
- Employee management (profiles, employment period)
- Employee rate history (EmployeeRate — daily-rate model, effective dates)
- Attendance recording (morning/afternoon, Mon–Sat)
- Overtime recording (HALF_DAY / FULL_DAY, 2× rate)
- WeeklyPayroll calculation (dynamic open calc → CLOSED snapshots)
- Employee Payment management (EmployeePayment — type-classified, void supported)
- Supplier management (profiles, active/inactive)
- Material catalog management (categories, units)
- Purchase management (structured items, allocation-tracked, paymentStatus)
- Supplier Payment management (SPECIFIC/GENERAL types, Allocation Engine, transactions)

---

# Audit and Hardening Status

```
Module-level audit + hardening
→ completed

Documentation synchronization
→ current task (in progress)

Cross-module consistency audit
→ next phase / pending
```

---

# Phase 0 — Discovery & Planning

**Goal:** Understand the business before writing code.

## Tasks

- [x] Interview business owner
- [x] Identify business problems
- [x] Discover entities
- [x] Define business rules
- [x] Define MVP scope
- [x] Document workflows
- [x] Create project documentation

## Deliverables

- Vision document
- Business analysis
- Requirements
- Domain model
- Initial roadmap

---

# Phase 1 — System Design

**Goal:** Design the system architecture.

## Tasks

- [x] Design module architecture
- [x] Design database collections
- [x] Design REST API
- [x] Design authentication flow
- [x] Design RBAC
- [ ] Create ER diagram
- [ ] Create architecture diagram

## Deliverables

- Architecture document
- API specification
- Database design
- ER Diagram

---

# Phase 2 — Project Setup

**Goal:** Create a production-ready project structure.

## Backend

- [x] Express project
- [x] Module-based architecture
- [x] Environment configuration
- [x] Logger
- [x] Global error handling
- [x] Validation
- [x] Database connection
- [x] Security middleware

## Frontend

- [x] React (Vite)
- [x] Tailwind CSS
- [x] React Router
- [x] Axios
- [x] Folder structure
- [x] Shared components
- [x] Layouts

## Deliverables

- Initial project structure
- Running frontend
- Running backend

---

# Phase 3 — Authentication & Authorization

**Goal:** Secure the application.

## Authentication

- [x] Login
- [x] Logout
- [x] JWT access tokens
- [x] HttpOnly Cookies for web refresh tokens
- [x] Password hashing
- [x] Refresh-token persistence and revocation
- [x] Password reset flow
- [x] Invitation-based onboarding

## Authorization

- [x] RBAC
- [x] Roles
- [x] Permissions
- [x] Protected routes
- [x] Authorization middleware

## Deliverables

- Secure authentication system

---

# Phase 4 — Core Business Modules (MVP)

## Users

- [x] User management
- [x] Roles
- [x] Account status

## Customers

- [x] CRUD
- [x] Customer details
- [x] Status management (active/inactive)
- [ ] Customer history view (frontend)

## Operating Expenses

- [x] Record expenses
- [x] Categorize expenses
- [x] Edit expenses
- [x] Void expenses (replaced hard delete)

## Orders

- [x] Create customer order
- [x] Update customer order
- [x] Order status lifecycle (pending → in_progress → ready → completed / cancelled)
- [x] Status history audit log
- [x] Customer identity snapshot

## Customer Payments

- [x] Record payment against an Order
- [x] Balance enforcement (cannot exceed remaining balance)
- [x] Void payment workflow
- [x] Snapshot customerName and orderNumber
- [x] Transaction-bounded creation

## Employees

- [x] Employee profiles (name, contact, employment period)
- [x] Employee daily-rate records with effective dates (EmployeeRate)
- [x] Attendance recording (morning + afternoon, Mon–Sat)
- [x] Overtime recording (HALF_DAY / FULL_DAY, 2× rate)
- [x] WeeklyPayroll calculation (dynamic continuous periods)
- [x] Payroll closure (permanent CLOSED snapshot)
- [x] Employee Payment recording (EmployeePayment — type-classified)
- [x] Employee Payment void workflow

## Suppliers and Purchasing

- [x] Supplier management (profiles, active/inactive)
- [x] Material catalog management (categories, units)
- [x] Purchase management (structured items, totalAmount, paymentStatus)
- [x] Supplier Payment management (SPECIFIC / GENERAL)
- [x] Supplier Payment Allocation Engine (auto-allocation, credit, reconciliation)
- [x] Transaction-bounded payment operations

## Contractors

> **Deferred**

- [ ] Contractor profiles
- [ ] Contract (agreement/deal) management

---

# Phase 5 — Dashboard

## Features

- [ ] Monthly expenses
- [ ] Outstanding employee balances
- [ ] Customer orders in progress
- [ ] Supplier payment summaries
- [ ] Recent activities
- [ ] Quick statistics

---

# Phase 6 — UI/UX

## Mobile First

- [ ] Responsive layout
- [ ] Mobile navigation
- [ ] Tablet optimization
- [ ] Desktop optimization

## Components

- [ ] Forms
- [ ] Tables
- [ ] Cards
- [ ] Dialogs
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states

---

# Phase 7 — Quality

## Backend

- [x] Validation (Zod)
- [x] Logging (Morgan)
- [x] Error handling (centralized)
- [x] Pagination
- [x] Filtering
- [x] Searching

## Frontend

- [ ] Form validation
- [ ] API error handling
- [ ] Reusable hooks
- [ ] Reusable components

---

# Phase 8 — Testing

## Backend

- [ ] Unit tests
- [ ] Integration tests

> Note: Transaction-dependent tests require a MongoDB replica set. Local standalone MongoDB instances do not support multi-document transactions. Tests that depend on transactions may be skipped in the local development environment.

## Frontend

- [ ] Component tests
- [ ] User flow tests

---

# Phase 9 — Docker

## Learn Docker

- [ ] Docker fundamentals
- [ ] Images
- [ ] Containers
- [ ] Volumes
- [ ] Networks

## Project

- [ ] Backend container
- [ ] Frontend container
- [ ] MongoDB container
- [ ] Docker Compose

---

# Phase 10 — Deployment

## Backend

- [ ] Deploy API

## Frontend

- [ ] Deploy React app

## Database

- [ ] MongoDB Atlas

## Deliverables

- Public production application

---

# Phase 11 — CI/CD

## GitHub Actions

- [ ] Lint
- [ ] Build
- [ ] Test
- [ ] Automatic deployment

---

# Phase 12 — Flutter Mobile App

Reuse the same REST API.

## Features

- [ ] Authentication
- [ ] Dashboard
- [ ] Customer Orders
- [ ] Employees
- [ ] Purchases
- [ ] Expenses
- [ ] Offline improvements

---

# Future Versions

## Inventory

- Stock management
- Material tracking
- Low-stock alerts

---

## Production Management

- Production stages
- Progress tracking
- Scheduling

---

## Customer CRM

- Customer history
- Quotations
- Follow-ups

---

## Reports

- Profit & Loss
- Expense reports
- Employee reports
- Contractor reports
- Supplier reports
- Sales reports

---

## Notifications

- Payment reminders
- Due dates
- Contract completion
- Purchase reminders

---

## AI Features

- Business insights
- Expense analysis
- Profit prediction
- Smart recommendations
- Demand forecasting

---

## Advanced Security

- Two-factor authentication
- Audit logs
- Activity history
- Device management

---

## DevOps

- Kubernetes
- Monitoring
- Performance metrics
- Centralized logging
- Backups
- Auto scaling

---

# Success Criteria

The MVP is considered successful when:

- Users can securely log in.
- The business can manage customers.
- Customer orders can be tracked through their full production lifecycle.
- Customer payments can be recorded against orders with balance enforcement.
- The business can manage employees (attendance, overtime, weekly payroll, employee payments).
- Supplier purchases can be recorded.
- Supplier payments can be recorded and auto-allocated.
- Operating expenses can be managed.
- Core business information is available from the dashboard.
- The system is responsive and usable on both desktop and mobile browsers.

---

# Guiding Principles

- Business first, technology second.
- Keep the MVP simple.
- Build for extensibility.
- Prefer clean architecture over shortcuts.
- Write maintainable, modular code.
- Document important architectural decisions.
- Use modern software engineering practices.
- Solve real business problems, not hypothetical ones.
- Financial records must not be silently rewritten or physically deleted in a way that destroys historical truth.
