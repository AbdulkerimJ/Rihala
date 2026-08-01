# Architecture

## Overview

The backend currently follows a modular Express application structure. Requests enter the Express app, pass through shared middleware, and are handled by a module-specific controller/service/model flow.

The web frontend follows a matching feature-slice structure. Each domain module owns its API wrapper, pages, and supporting components, while shared layout, auth state, and UI primitives live in top-level frontend folders.

```text
Express
  ↓
Routes
  ↓
Middleware
  ├── Authentication
  ├── Authorization
  └── Validation
  ↓
Controllers
  ↓
Services
  ↓
Mongoose Models
  ↓
MongoDB
```

## Main architecture layers

### Routes

Routes are mounted in [backend/src/app.js](../backend/src/app.js) under versioned API prefixes such as `/api/v1/auth` and `/api/v1/users`.

On the frontend, routes are declared in [web/src/app/router.jsx](../web/src/app/router.jsx) and split into auth routes and protected application routes under [web/src/layouts/AuthLayout.jsx](../web/src/layouts/AuthLayout.jsx) and [web/src/layouts/DashboardLayout.jsx](../web/src/layouts/DashboardLayout.jsx).

### Middleware

Shared middleware is implemented in:

- [backend/src/core/middleware/authenticate.js](../backend/src/core/middleware/authenticate.js) for JWT authentication
- [backend/src/core/middleware/authorize.js](../backend/src/core/middleware/authorize.js) for permission-based authorization
- [backend/src/core/middleware/validate.js](../backend/src/core/middleware/validate.js) for request validation

### Controllers and services

Each module follows a controller-service pattern. Controllers receive validated requests and return responses. Services contain the business logic and interact with the persistence layer.

### Models and persistence

The backend uses Mongoose models for persistence. Database connectivity is handled by [backend/src/core/database/mongodb.js](../backend/src/core/database/mongodb.js).

## Shared infrastructure

### Error handling

Centralized error handling is implemented in [backend/src/core/middleware/errorHandler.js](../backend/src/core/middleware/errorHandler.js) and [backend/src/core/middleware/notFoundHandler.js](../backend/src/core/middleware/notFoundHandler.js).

### Async handling

The shared wrapper in [backend/src/core/utils/catchAsync.js](../backend/src/core/utils/catchAsync.js) ensures async controller errors are passed to the error middleware.

### Validation

Request validation is implemented with Zod schemas and the shared validation middleware.

### Authentication

Authentication uses JWT access tokens and persisted refresh tokens. The current implementation also supports password reset and invitation-based onboarding through verification tokens.

The frontend keeps the access token in memory only. Web refresh tokens stay in HttpOnly cookies, and the Axios client in [web/src/api/axios.js](../web/src/api/axios.js) automatically attaches the bearer access token when present. A refresh attempt is made on 401 responses and during app bootstrap in [web/src/context/AuthContext.jsx](../web/src/context/AuthContext.jsx).

### Authorization

Authorization is based on permissions assigned to roles. The authorization middleware resolves the user’s permissions dynamically from their assigned roles and checks the required permission name.

The frontend mirrors this through `hasPermission` in [web/src/context/AuthContext.jsx](../web/src/context/AuthContext.jsx), the `Can` component in [web/src/components/Can.jsx](../web/src/components/Can.jsx), and permission-guarded route entries in [web/src/app/router.jsx](../web/src/app/router.jsx). This is a UX layer only; backend authorization remains authoritative.

### Query utilities

The shared query utility in [backend/src/core/utils/query.js](../backend/src/core/utils/query.js) handles pagination, search, filtering, sorting, and filter transforms. Modules define their own allowed query behavior through module-specific configuration objects.

The frontend uses the same query capabilities in list pages for expenses, customers, and orders, and keeps list filters in component state rather than introducing a separate global state library.

## Frontend modules

The implemented frontend modules currently cover:

- Auth: login, logout, invitation acceptance, forgot password, reset password
- Users: list, detail, invite, edit, activate/deactivate, delete/restore
- Roles: list, create, edit, delete
- Permissions: list
- Expenses: list, filter, create, edit, delete
- Customers: list, create, edit
- Orders: list, detail, create, edit, status progression

### Logging

The application uses Morgan in development mode and console logging for invitation and password-reset flows.

## Module query configuration pattern

The architecture uses a two-level query design:

1. Module query configuration defines what a module allows.
2. The shared query utility defines how the query is executed.

This pattern is currently used by Expenses and Customers.
