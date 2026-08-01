# Architecture

## Overview

The backend currently follows a modular Express application structure. Requests enter the Express app, pass through shared middleware, and are handled by a module-specific controller/service/model flow.

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

### Authorization

Authorization is based on permissions assigned to roles. The authorization middleware resolves the user’s permissions dynamically from their assigned roles and checks the required permission name.

### Query utilities

The shared query utility in [backend/src/core/utils/query.js](../backend/src/core/utils/query.js) handles pagination, search, filtering, sorting, and filter transforms. Modules define their own allowed query behavior through module-specific configuration objects.

### Logging

The application uses Morgan in development mode and console logging for invitation and password-reset flows.

## Module query configuration pattern

The architecture uses a two-level query design:

1. Module query configuration defines what a module allows.
2. The shared query utility defines how the query is executed.

This pattern is currently used by Expenses and Customers.
