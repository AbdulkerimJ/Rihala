import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const hasToken =
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("rihala-token"));

  if (!hasToken) {
    return <Navigate replace to="/login" />;
  }

  return children ?? <Outlet />;
}
