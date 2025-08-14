"use client";

import { useState } from "react";
import { signIn, signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { useToast } from "./ui/Toast";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ username: email, password });
      push({ message: "Signed in successfully!", tone: "success" });
      onClose();
    } catch (error: any) {
      push({ message: error.message || "Sign in failed", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: { email }
        }
      });
      setMode("confirm");
      push({ message: "Check your email for confirmation code", tone: "info" });
    } catch (error: any) {
      push({ message: error.message || "Sign up failed", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmSignUp({
        username: email,
        confirmationCode: confirmCode
      });
      push({ message: "Account confirmed! Please sign in.", tone: "success" });
      setMode("signin");
      setConfirmCode("");
    } catch (error: any) {
      push({ message: error.message || "Confirmation failed", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      await resendSignUpCode({ username: email });
      push({ message: "Confirmation code resent", tone: "success" });
    } catch (error: any) {
      push({ message: error.message || "Failed to resend code", tone: "danger" });
    }
  }

  return (
    <Modal open onClose={onClose} title={mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Confirm Account"}>
      <div className="p-6">
        {mode === "confirm" ? (
          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter 6-digit code"
                required
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Check your email for the confirmation code
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Confirming..." : "Confirm Account"}
              </Button>
              <Button type="button" variant="outline" onClick={handleResendCode}>
                Resend Code
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
              {mode === "signup" && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                </p>
              )}
            </div>
            
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}