"use client";

import { useState } from "react";
import { signIn, signUp, confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { push } = useToast();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ username: email, password });
      push({ message: "Welcome back!", tone: "success" });
      router.push("/");
    } catch (error) {
      const err = error as { name?: string; message?: string };
      if (err.name === "UserNotConfirmedException") {
        setMode("confirm");
        push({ message: "Please confirm your email first", tone: "warning" });
      } else {
        push({ message: err.message || "Sign in failed", tone: "danger" });
      }
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
          userAttributes: { 
            email,
            name
          }
        }
      });
      setMode("confirm");
      push({ message: "Account created! Check your email for confirmation code", tone: "success" });
    } catch (error) {
      const err = error as { message?: string };
      push({ message: err.message || "Sign up failed", tone: "danger" });
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
      push({ message: "Email confirmed! You can now sign in", tone: "success" });
      setMode("signin");
      setConfirmCode("");
    } catch (error) {
      const err = error as { message?: string };
      push({ message: err.message || "Confirmation failed", tone: "danger" });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    try {
      await resendSignUpCode({ username: email });
      push({ message: "New confirmation code sent to your email", tone: "success" });
    } catch (error) {
      const err = error as { message?: string };
      push({ message: err.message || "Failed to resend code", tone: "danger" });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 items-center justify-center">
          <div className="max-w-md text-white">
            <a href="/landing" className="inline-block mb-6">
              <h1 className="text-4xl font-bold">ChillScheduler</h1>
            </a>
            <p className="text-xl mb-8 text-emerald-100">
              Automate your AI tasks with powerful scheduling
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-semibold">AI-Powered Automation</p>
                  <p className="text-sm text-emerald-100">Schedule prompts to run automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-semibold">Real-time Monitoring</p>
                  <p className="text-sm text-emerald-100">Track execution history and results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-300 mt-0.5" />
                <div>
                  <p className="font-semibold">Cloud Native</p>
                  <p className="text-sm text-emerald-100">Built on AWS for reliability and scale</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
          <a href="/landing" className="absolute top-8 left-8 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2">
            ← Back to Home
          </a>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create account" : "Confirm email"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {mode === "signin" 
                  ? "Sign in to manage your scheduled jobs" 
                  : mode === "signup"
                  ? "Get started with ChillScheduler"
                  : "Enter the code we sent to your email"}
              </p>
            </div>

            {mode === "confirm" ? (
              <form onSubmit={handleConfirm} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmation Code
                  </label>
                  <input
                    type="text"
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Check your email ({email}) for the verification code
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Button type="submit" disabled={loading} className="w-full py-3">
                    {loading ? "Confirming..." : "Confirm Email"}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="w-full text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    Didn&apos;t receive code? Resend
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="w-full text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-6">
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="inline w-4 h-4 mr-1" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                      placeholder="John Doe"
                      required={mode === "signup"}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="inline w-4 h-4 mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                    placeholder="you@example.com"
                    required
                    autoFocus={mode === "signin"}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Lock className="inline w-4 h-4 mr-1" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  {mode === "signup" && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Must be at least 8 characters with uppercase, lowercase, numbers, and symbols
                    </p>
                  )}
                </div>

                {mode === "signin" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                      Forgot password?
                    </a>
                  </div>
                )}
                
                <Button type="submit" disabled={loading} className="w-full py-3 flex items-center justify-center gap-2">
                  {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                  >
                    {mode === "signin" ? "Sign up" : "Sign in"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}