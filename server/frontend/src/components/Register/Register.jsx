import { djangoApiUrl } from "../../utils/djangoApi";
import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getPostLoginPath,
  getRedirectFromLocation,
} from "../../utils/authRedirect";
import PasswordInput from "../common/PasswordInput";

const Register = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, role, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = getRedirectFromLocation(location);

  const handleRegister = async (e) => {
    e.preventDefault();

    const trimmedUser = userName.trim();
    if (!trimmedUser || !password || !email.trim() || !firstName.trim() || !lastName.trim()) {
      alert("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(djangoApiUrl("/djangoapp/register/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: trimmedUser,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
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
        alert(json.error?.message || "Registration failed.");
        return;
      }

      const stored = login({
        access: tokens.access,
        refresh: tokens.refresh,
        user: profile,
      });

      if (!stored) {
        alert("Account created, but session could not be saved. Please sign in.");
        return;
      }

      navigate(getPostLoginPath(profile.role, redirectTo), { replace: true });
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Unable to register at this time. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={getPostLoginPath(role, redirectTo)} replace />;
  }

  return (
    <div className="w-full py-16">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-lg">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary">
            Create your account
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Register for Autocars UG</h1>
          <p className="mt-2 text-sm text-slate-600">
            Register to leave reviews, manage dealership listings, and access your dashboard.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleRegister}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                type="text"
                placeholder="First name"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                type="text"
                placeholder="Last name"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              type="text"
              placeholder="Username"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email address"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>

          <PasswordInput
            label="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Registering..." : "Register"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;