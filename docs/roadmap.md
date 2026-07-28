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

The roadmap is divided into phases. Each phase builds on the previous one to ensure the system grows in a maintainable and professional way.

---

# Phase 0 — Discovery & Planning

**Goal:** Understand the business before writing code.

## Tasks

- [ ] Interview business owner
- [ ] Identify business problems
- [ ] Discover entities
- [ ] Define business rules
- [ ] Define MVP scope
- [ ] Document workflows
- [ ] Create project documentation

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

- [ ] Design module architecture
- [ ] Design database collections
- [ ] Design REST API
- [ ] Design authentication flow
- [ ] Design RBAC
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

- [ ] Express project
- [ ] Module-based architecture
- [ ] Environment configuration
- [ ] Logger
- [ ] Global error handling
- [ ] Validation
- [ ] Database connection
- [ ] Security middleware

## Frontend

- [ ] React (Vite)
- [ ] Tailwind CSS
- [ ] React Router
- [ ] Axios
- [ ] Folder structure
- [ ] Shared components
- [ ] Layouts

## Deliverables

- Initial project structure
- Running frontend
- Running backend

---

# Phase 3 — Authentication & Authorization

**Goal:** Secure the application.

## Authentication

- [ ] Login
- [ ] Logout
- [ ] JWT
- [ ] HttpOnly Cookies
- [ ] Password hashing
- [ ] Session persistence

## Authorization

- [ ] RBAC
- [ ] Roles
- [ ] Permissions
- [ ] Protected routes
- [ ] Authorization middleware

## Deliverables

- Secure authentication system

---

# Phase 4 — Core Business Modules (MVP)

## Users

- [ ] User management
- [ ] Roles
- [ ] Account status

---

## Customers

- [ ] CRUD
- [ ] Customer details
- [ ] Customer history

---

## Orders

- [ ] Create order
- [ ] Update order
- [ ] Order status
- [ ] Order history

---

## Workers

- [ ] Regular workers
- [ ] Contract workers
- [ ] Worker profiles

---

## Contracts

- [ ] Create contract
- [ ] Agreed payment
- [ ] Contract status
- [ ] Multiple contracts per worker

---

## Suppliers

- [ ] CRUD
- [ ] Supplier information

---

## Purchases

- [ ] Material purchases
- [ ] Purchase status
- [ ] Outstanding balance

---

## Operating Expenses

Examples:

- Electricity
- Water
- Rent
- Fuel
- Internet
- Machine Maintenance
- Taxes

---

## Payments

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
