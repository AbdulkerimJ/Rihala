```markdown
# Rihala Roadmap

> **Project:** Rihala
>
> **Type:** Furniture Workshop Management System
>
> **Status:** Planning
>
> **Current Version:** MVP (v1.0)

---

# Vision

Rihala aims to become a complete management system for furniture manufacturing businesses. The first version focuses on solving the company's daily operational problems while providing a scalable foundation for future growth.

The roadmap remains phased, but the current backend implementation already covers the foundation, authentication, access control, expenses, and customers. Future work continues from that base.

---

# Current implementation status

The current backend already includes:

- foundation infrastructure for Express, MongoDB, validation, error handling, and shared query utilities
- authentication and refresh-token management
- user lifecycle management, including invited-user onboarding
- role and permission management
- expense management
- customer management

The remaining roadmap areas are still planned or in progress rather than implemented.

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

## Implemented

### Users

- [x] User management
- [x] Roles
- [x] Account status

### Customers

- [x] CRUD
- [x] Customer details
- [ ] Customer history

### Operating Expenses

- [x] Record expenses
- [x] Categorize expenses
- [x] Edit expenses
- [x] Delete expenses

## Planned next

### Orders

- [ ] Create order
- [ ] Update order
- [ ] Order status
- [ ] Order history

### Workers

- [ ] Regular workers
- [ ] Contract workers
- [ ] Worker profiles

### Contracts

- [ ] Create contract
- [ ] Agreed payment
- [ ] Contract status
- [ ] Multiple contracts per worker

### Suppliers

- [ ] CRUD
- [ ] Supplier information

### Purchases

- [ ] Material purchases
- [ ] Purchase status
- [ ] Outstanding balance

### Payments

> **Deferred**

The payment model will be finalized after the complete business domain is fully understood.

---

# Phase 5 — Dashboard

## Features

- [ ] Monthly expenses
- [ ] Outstanding supplier balances
- [ ] Active contracts
- [ ] Orders in progress
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

- [ ] Validation
- [ ] Logging
- [ ] Error handling
- [ ] Pagination
- [ ] Filtering
- [ ] Searching

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
- [ ] Orders
- [ ] Workers
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
- Worker reports
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
- The business can manage workers.
- Orders can be tracked.
- Supplier purchases can be recorded.
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
```
