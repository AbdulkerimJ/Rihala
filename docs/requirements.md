# Software Requirements Specification (SRS)

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Purpose

Develop a modern management system that helps furniture workshops manage daily operations through a secure, scalable, and easy-to-use application.

---

# Project Scope

The MVP focuses on digitizing the workshop's core business operations.

The system is intended for internal use by the business owner and employees.

---

# Functional Requirements

## Authentication

The system shall:

- Allow users to log in.
- Allow users to log out.
- Protect private routes.
- Support RBAC.

---

## User Management

The system shall:

- Manage user accounts.
- Assign roles.
- Activate or deactivate users.

---

## Customer Management

The system shall:

- Create customers.
- Update customers.
- View customer information.
- Delete customers.

---

## Worker Management

The system shall:

- Manage regular workers.
- Manage contract workers.
- Store worker details.

---

## Contract Management

The system shall:

- Create contracts.
- Update contracts.
- Track contract status.
- Associate contracts with workers.

---

## Supplier Management

The system shall:

- Create suppliers.
- Update suppliers.
- View supplier information.
- Delete suppliers.

---

## Purchase Management

The system shall:

- Record purchases.
- Track purchase status.
- Associate purchases with suppliers.

---

## Operating Expense Management

The system shall:

- Record operating expenses.
- Categorize expenses.
- Edit expenses.
- Delete expenses.

---

## Dashboard

The dashboard shall display business summaries, including:

- Recent activities
- Monthly expenses
- Active workers
- Active contracts
- Business statistics

---

# Non-Functional Requirements

## Performance

- Fast response times.
- Efficient database queries.

---

## Security

- JWT Authentication
- HttpOnly Cookies
- Password hashing
- RBAC
- Input validation

---

## Usability

- Mobile-first interface
- Responsive design
- Simple user experience

---

## Maintainability

- Module-based architecture
- Reusable components
- Clean code
- RESTful API

---

## Scalability

The architecture should support future features, including:

- Inventory
- Production Management
- Reports
- AI Features
- Flutter Mobile App

---

# Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

---

# Future Scope

Features intentionally excluded from the MVP include:

- Inventory Management
- Production Tracking
- Advanced Reports
- AI Insights
- Flutter Mobile Application

These will be implemented in future releases.

---

# Success Criteria

The MVP is successful when the business can:

- Securely access the system.
- Manage customers.
- Manage workers.
- Manage suppliers.
- Record purchases.
- Record operating expenses.
- View business information through the dashboard.

The system should provide a solid foundation for future expansion.