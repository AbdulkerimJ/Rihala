# Business Analysis

## Project

**Name:** Rihala

**Type:** Furniture Workshop Management System

---

# Business Overview

Rihala is being developed for a furniture manufacturing business. The current implementation covers the operational foundation needed for secure access, internal administration, expense tracking, and customer record management.

The business still expects future expansion into more detailed workshop operations such as employee and contractor management, supplier purchasing, orders, payments, and reporting.

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

## Internal Staff

Internal staff use the system as system users. The current backend supports internal user accounts with role-based permissions.

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

- employee management
- contractor management
- contract management
- supplier management
- purchase management
- order management
- payment management
- dashboard and reporting

---

# Business Terminology

## Employee

An Employee is a regular worker employed directly by the workshop. Employees work under an agreed daily rate and are subject to the weekly attendance and settlement workflow.

Employees are distinct from system users. An employee is a workshop worker; a system user is someone who logs into the Rihala application.

---

## Contractor

A Contractor is a person who works with the workshop under a negotiated contract/deal rather than through the daily-rate attendance model. Contractors do not participate in the employee attendance, overtime, or weekly settlement workflow.

---

## Contract

A Contract is an agreement or deal between the workshop and a Contractor. Each contractor may be associated with one or more contracts.

Do not confuse Contract with a customer-facing commitment. Contracts in this system refer specifically to contractor agreements.

---

## Customer Order

A Customer Order represents a customer's furniture request. It is currently a planned business concept rather than an implemented module.

Planned order details include:

- customer
- description
- agreedAmount
- expectedCompletionDate
- status
- notes

The initial design does not require a separate orderDate field; createdAt represents when the order is registered.

---

## Operating Expense

An operating expense is money spent by the business that is not represented as a material purchase in the current implementation.

---

# Important Business Decisions Already Made

## General

- Expenses represent business spending and are not currently tied to orders or projects.
- Customers are separate from system users.
- Customer records are retained rather than permanently deleted.
- Customer Orders are planned as a future domain concept and are not implemented yet.
- Payments are planned as a separate concept and should not be represented as a single paidAmount field on a Customer Order.

## Terminology

- Use **Employee** for regular workers (not "worker" or "regular worker").
- Use **Contractor** for contractual workers (not "contract worker" or "worker").
- Use **Contract** for the agreement with a contractor (not "worker contract").
- Use **Customer Order** when referring to a customer's furniture request to avoid ambiguity with contractor contracts.

## Employee Compensation

- Employees are compensated based on a **daily rate**, not a monthly or fixed weekly salary.
- Employees are paid weekly, but the weekly amount is derived from their daily rate and actual attendance.
- Daily rates may change over time. Each rate change is recorded as a new rate entry with an effective date.
- Historical attendance and overtime calculations must use the rate that was applicable on the relevant date.

## Employee Attendance

- Attendance is recorded twice per normal working day: **morning** and **afternoon**.
- Each half-day has one of two statuses: `PRESENT` or `REST`.
- Rest and absence are treated as the same concept for the MVP.
- The daily paid portion is derived from the two half-day records:
  - `PRESENT + PRESENT` = 1 full day
  - `PRESENT + REST` or `REST + PRESENT` = 0.5 day
  - `REST + REST` = 0 days
- Normal attendance is required Monday–Saturday. Sunday is not a normal attendance day.
- Missing attendance records for an active employee during their employment period should block settlement rather than default to absence.

## Employment Period

- Employees have an employment start date and potentially an employment end date.
- Only dates within the employee's active employment period require attendance.
- Historical records remain available after an employee leaves.

## Overtime

- Overtime is a separate record from normal attendance.
- Overtime duration is either `HALF_DAY` or `FULL_DAY`.
- The overtime rate is **2× the employee's applicable daily rate**.
- There is one overtime type for the MVP. There are no separate Sunday, night, or other overtime categories.
- Overtime uses the applicable daily rate for the date it occurred.

## Weekly Period

- The payroll period is **Monday–Sunday**.
- Attendance and overtime belong to the week determined by their actual work date.

## Weekly Settlement

- Settlement is calculated **per employee per week**.
- There is no single workshop-wide settlement record.
- Settlement status lifecycle: `OPEN → SETTLED`.
- A settled week is not reopened when a later payment is made.
- Post-settlement corrections are handled through adjustments, not by reopening.

## Payments

- A payment represents actual money given to an employee on a specific date.
- Payments are allocated using **oldest outstanding balance first**.
- If a payment exceeds the current outstanding amount, the excess is treated as an **advance** that carries forward.
- Payments may occur before, during, or after settlement.

## Post-Settlement Adjustments

- Settled records are not silently modified.
- Errors discovered after settlement are recorded as explicit adjustments with a reason.
- The adjustment affects the employee's current financial position without altering the original settlement record.

## Out of Scope for Current Phase

- Bonuses and penalties are intentionally out of scope for this payroll implementation step.
- Contractor payment rules will be designed separately and are not covered here.

---

# Open Questions

The following topics still require business clarification or future design work:

- detailed customer order lifecycle
- contractor payment model
- supplier and purchase workflows
- reporting requirements
