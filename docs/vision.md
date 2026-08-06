# Rihala Vision

## Purpose

Rihala is a workshop management system designed to help furniture manufacturing businesses manage daily operations. The system covers a solid backend foundation for authentication, access control, expense management, customer and order management, financial payment domains, employee management, and supplier/purchase operations.

The long-term goal is to replace paper-based records and scattered spreadsheets with a centralized system that supports customers, orders, employees, contractors, purchases, expenses, payments, and business reporting.

---

## Current Direction

The implemented backend currently supports:

- secure authentication and session management
- user and role administration
- permission-based authorization
- expense recording and voiding
- customer record management
- order management (full lifecycle, status state machine)
- customer payment management (Order-referenced, balance enforcement, void)
- employee management (profiles, daily-rate history, attendance, overtime)
- weekly payroll calculation and closure
- employee payment management (type-classified, independent of payroll)
- supplier management
- material catalog management
- purchase management (structured items, payment allocation tracking)
- supplier payment management (SPECIFIC/GENERAL types, allocation engine)

The following areas remain deferred / not yet implemented:

- contractor management
- contract management
- dashboard and reporting

---

## Long-term Vision

Rihala aims to become a complete ERP-like solution for furniture manufacturers.

Future versions may include:

- inventory management
- production tracking
- customer CRM capabilities
- mobile app support (Flutter)
- reports and analytics
- AI-powered insights
