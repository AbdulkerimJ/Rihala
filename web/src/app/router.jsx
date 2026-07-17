import { createBrowserRouter } from "react-router-dom";

import { MainLayout } from "../shared/layouts/MainLayout.jsx";
import { NotFoundPage } from "../shared/components/NotFoundPage.jsx";
import { ProtectedRoute } from "../shared/components/ProtectedRoute.jsx";
import { authRoutes } from "../modules/auth/index.js";
import { dashboardRoute } from "../modules/dashboard/index.js";
import { expensesRoute } from "../modules/expenses/index.js";
import { workersRoute } from "../modules/workers/index.js";
import { workerPaymentsRoute } from "../modules/worker-payments/index.js";

export const router = createBrowserRouter([
  ...authRoutes,
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      dashboardRoute,
      expensesRoute,
      workersRoute,
      workerPaymentsRoute,
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
