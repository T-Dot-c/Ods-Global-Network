import React, { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

function getUserRole(): string | null {
  return localStorage.getItem("userRole");
}

interface PrivateRouteProps {
  requiredRole?: string | string[]; // ✅ allow array or string
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole, children }) => {
  const userRole = getUserRole();

  if (!userRole) {
    console.warn("Access denied: No user role found");
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Super admin can access everything
  if (userRole === "super_admin") {
    return <>{children}</>;
  }

  if (requiredRole) {
    // Convert to array if it's a string
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    if (!allowedRoles.includes(userRole)) {
      console.warn(`Access denied: Role "${userRole}" not in allowed roles [${allowedRoles.join(", ")}]`);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
