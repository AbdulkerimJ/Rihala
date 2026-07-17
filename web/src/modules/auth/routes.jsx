import { LoginPage } from "./pages/LoginPage.jsx";
import { LogoutPage } from "./pages/LogoutPage.jsx";

export const authRoutes = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/logout",
    element: <LogoutPage />,
  },
];
