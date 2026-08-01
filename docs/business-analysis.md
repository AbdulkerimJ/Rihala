# Business Analysis

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Business Overview

Rihala is being developed for a furniture manufacturing business. The current implementation covers the operational foundation needed for secure access, internal administration, expense tracking, and customer record management.

The business still expects future expansion into more detailed workshop operations such as workforce management, contracts, supplier purchasing, orders, payments, and reporting.

---

# Current Business Goals

The system currently supports the business in:

- organizing internal user access through secure authentication
- managing roles and permissions
- tracking operating expenses
- maintaining customer records

The broader business goal remains to reduce manual record-keeping and improve operational visibility over time.

---

# Stakeholders

## Business Owner

Responsible for managing the business and making operational decisions.

Needs:

- reliable internal access control
- clear visibility into expenses and customer records
- a platform that can grow into broader workshop management

---

## Employees

Employees use the system as internal users. The current backend supports internal user accounts with role-based permissions.

---

## Customers

Customers are business contacts maintained in the system. They are separate from system users and may be associated with future orders.

---

# Current Implementation Scope

Implemented business areas:

- User management
- Authentication and session handling
- Role and permission management
- Operating expense management
- Customer management

Planned business areas:

- worker management
- contract management
- supplier management
- purchase management
- order management
- payment management
- dashboard and reporting

---

# Business Terminology

## Order

An Order represents a customer’s furniture request and is currently a planned business concept rather than an implemented module.

Planned order details include:

- customer
- description
- agreedAmount
- expectedCompletionDate
- status
- notes

The initial design does not require a separate orderDate field; createdAt represents when the order is registered.

---

## Contract

A Contract refers to an agreement with a contractual worker and remains a planned concept for future implementation.

---

## Operating Expense

An operating expense is money spent by the business that is not represented as a material purchase in the current implementation.

---

# Important Business Decisions Already Made

- Expenses represent business spending and are not currently tied to orders or projects.
- Customers are separate from system users.
- Customer records are retained rather than permanently deleted.
- Orders are planned as a future domain concept and are not implemented yet.
- Payments are planned as a separate concept and should not be represented as a single paidAmount field on Order in the initial design.

---

# Open Questions

The following topics still require business clarification or future design work:

- detailed order lifecycle
- worker and contract workflows
- supplier and purchase workflows
- payment model details
- reporting requirements
