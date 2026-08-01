# Software Requirements Specification (SRS)

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Purpose

Develop a modern management system that helps furniture workshops manage daily operations through a secure, scalable, and easy-to-use application.

---

# Project Scope

The current implementation focuses on the backend foundation for internal administration and business operations. The system is intended for internal use by the business owner and employees.

---

# Functional Requirements

## Implemented

### Authentication

The system currently supports:

- email/password login
- logout with refresh-token revocation
- JWT access tokens
- persisted refresh tokens
- password reset through verification tokens
- invitation-based user onboarding
- authentication middleware for protected routes

### User Management

The system currently supports:

- creating invited users
- activating and deactivating users
- soft-deleting and restoring users
- assigning and removing roles
- viewing users and user details

### Role and Permission Management

The system currently supports:

- managing roles
- managing permissions
- assigning permissions to roles
- enforcing permission-based authorization

### Expense Management

The system currently supports:

- recording expenses
- updating expenses
- viewing expenses
- deleting expenses
- defining fixed expense categories
- pagination, search, sorting, filtering, and date-range filtering

### Customer Management

The system currently supports:

- creating customers
- updating customers
- viewing customer information
- customer phone normalization for Ethiopian numbers
- customer status management

---

## Planned

### Worker Management

Planned future functionality includes:

- managing regular workers
- managing contract workers
- storing worker details

### Contract Management

Planned future functionality includes:

- creating and updating contracts
- tracking contract status
- associating contracts with workers

### Supplier Management

Planned future functionality includes:

- creating and updating suppliers
- viewing supplier information

### Purchase Management

Planned future functionality includes:

- recording purchases
- tracking purchase status
- associating purchases with suppliers

### Order Management

Planned future functionality includes:

- capturing customer furniture requests as orders
- storing agreed amounts and expected completion dates
- tracking order status

### Payment Management

Planned future functionality includes:

- separate payment tracking for business transactions

### Dashboard

Planned future functionality includes:

- business summaries
- expense reports
- recent activity
- operational statistics

---

# Non-Functional Requirements

## Performance

- Fast response times.
- Efficient database queries.

## Security

- JWT authentication
- HttpOnly cookies for web refresh tokens
- password hashing
- permission-based RBAC
- input validation

## Usability

- mobile-first interface
- responsive design
- simple user experience

## Maintainability

- module-based architecture
- reusable query utilities
- clean code
- RESTful API

## Scalability

The architecture should support future features including inventory, production management, reports, AI features, and a mobile application.

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

---

# Future Scope

Features intentionally excluded from the current implementation include:

- inventory management
- production tracking
- advanced reporting
- AI insights
- Flutter mobile application

These remain future releases.

---

# Success Criteria

The current backend is successful when it can:

- secure internal access to the application
- manage users and roles responsibly
- support expense tracking
- maintain customer records
- provide a solid foundation for the planned workshop modules
