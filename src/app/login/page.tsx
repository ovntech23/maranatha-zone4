"use client";

import React, { useActionState, startTransition } from "react";
import { loginUser } from "@/app/actions";

const initialState = {
  error: null as string | null,
  success: false,
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      try {
        const res = await loginUser(prevState, formData);
        if (res?.error) {
          return { error: res.error, success: false };
        }
        if (res?.success) {
          // Redirection is handled on the client or automatically by middleware refresh
          window.location.href = "/";
          return { error: null, success: true };
        }
        return prevState;
      } catch (err: any) {
        console.error("Client login interaction failed:", err);
        return { error: "Failed to connect to authentication service. Please check your connection.", success: false };
      }
    },
    initialState
  );

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">⛪</div>
          <h1 className="login-title">Maranatha Bible Church</h1>
          <p className="login-subtitle">Zone 4 · Cell Management System</p>
        </div>

        <form action={formAction} className="login-form">
          {state.error && (
            <div className="login-error-banner">
              <span>⚠️</span>
              <span>{state.error}</span>
            </div>
          )}

          <div className="login-field">
            <label className="field-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="login-input"
              placeholder="admin@maranatha.org"
              disabled={isPending || state.success}
            />
          </div>

          <div className="login-field">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="login-input"
              placeholder="••••••••"
              disabled={isPending || state.success}
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isPending || state.success}
          >
            {state.success ? (
              <span>Signing in...</span>
            ) : isPending ? (
              <>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Access System</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
