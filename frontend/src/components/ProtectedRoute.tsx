import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { validateSession } from "../services/auth";
import "../pages/TeacherLogin.css";

function ProtectedRoute() {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    validateSession()
      .then((result) => {
        if (!mounted) return;
        setAuthenticated(result.success === true);
        setChecking(false);
      })
      .catch(() => {
        if (!mounted) return;
        setAuthenticated(false);
        setChecking(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-card">
          <div className="auth-spinner" />
          <strong>Checking admin session…</strong>
          <span>Please wait.</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Navigate
        to="/teacher/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;