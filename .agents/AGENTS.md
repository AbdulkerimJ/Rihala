# Rihala Frontend Permissions Standard

Any agent working on the Rihala frontend must strictly adhere to this 4-Layer Permission Architecture.

## 1. Route-Level Protection
- Every top-level page route in `web/src/app/router.jsx` MUST be wrapped in `<RequirePermission permission="feature.read">`.

## 2. Navigation Protection
- Every navigation item in `web/src/layouts/DashboardLayout.jsx` (`navGroups`) MUST include the `permission: "feature.read"` property so the sidebar link hides itself if unauthorized.

## 3. UI Component Rendering
- Wrap all action buttons (Create, Update, Delete) and sensitive UI elements inside the `<Can permission="feature.action">` component.
- Example: `<Can permission="users.delete"><Button>Delete</Button></Can>`

## 4. API Fetching
- When using React Query's `useQuery` for sub-resources, always pass the `enabled` flag tied to the `can()` hook to prevent unauthorized network requests.
- Example: `enabled: can('roles.read')`
