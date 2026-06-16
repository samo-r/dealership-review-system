import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getPostLoginPath,
  getRedirectFromLocation,
} from "../../utils/authRedirect";
import PasswordInput from "../common/PasswordInput";

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectFromLocation(location);

  const handleLogin = async (e) => {
    e.preventDefault();

    const trimmedUser = userName.trim();
    if (!trimmedUser || !password) {
      alert("Username and password are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/djangoapp/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName: trimmedUser, password }),
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        alert("Invalid response from server.");
        return;
      }

      const tokens = json.tokens;
      const profile = json.user;

      if (!res.ok || !tokens?.access || !profile?.userName || !profile?.role) {
        const msg =
          json.error?.message ||
          "The user could not be authenticated. Check your credentials and try again.";
        alert(msg);
        return;
      }

      const stored = login({
        access: tokens.access,
        refresh: tokens.refresh,
        user: profile,
      });

      if (!stored) {
        alert("Signed in, but session could not be saved. Please try again.");
        return;
      }

      navigate(getPostLoginPath(profile.role, redirectTo), { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      alert("Unable to authenticate right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath(role, redirectTo)} replace />;
  }

  return (
    <div className="w-full py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Sign in to Autocars UG</h1>
          <p className="mt-3 text-sm text-slate-600">
            Access your dashboard, leave reviews, and manage your dealer profile.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              type="text"
              name="username"
              placeholder="Username"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don’t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="font-semibold text-brand-primary hover:text-brand-dark"
          >
            Register now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
