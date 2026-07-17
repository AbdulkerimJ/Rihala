# Rihala

Rihala is a monorepo foundation for a furniture workshop management system.

## Install

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Install web dependencies:

   ```bash
   cd web
   npm install
   ```

3. Copy the example environment files and adjust values as needed:
   - `backend/.env.example` -> `backend/.env`
   - `web/.env.example` -> `web/.env`

## Run

- Start the backend in development mode:

  ```bash
  cd backend
  npm run dev
  ```

- Start the web app in development mode:

  ```bash
  cd web
  npm run dev
  ```

- Start the backend in production mode:

  ```bash
  cd backend
  npm run start
  ```

## Workspace Layout

- `backend/` - Express and MongoDB REST API foundation
- `web/` - Vite and React application foundation
- `docs/` - Architecture and planning notes

## Notes

- Business features are intentionally not implemented yet.
- The repository is prepared for module-based extension.
