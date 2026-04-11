// ForgotPasswordModal component for resetting password without login
import React, { useState, useEffect } from "react";
import { Lock, Mail, Eye, EyeOff, AlertCircle, Loader, CheckCircle, ArrowLeft } from "lucide-react";
import {
  sendPasswordReset,
  verifyResetCode,
  confirmPasswordResetWithCode,
} from "../../config/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledEmail?: string; // Email from login form for security
}

export function ForgotPasswordModal({ isOpen, onClose, prefilledEmail }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<"email" | "verify-email" | "code" | "password">(prefilledEmail ? "verify-email" : "email");
  const [email, setEmail] = useState(prefilledEmail || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Auto-send email if prefilled
  useEffect(() => {
    if (prefilledEmail && isOpen && !emailSent) {
      handleAutoSendReset(prefilledEmail);
    }
  }, [isOpen, prefilledEmail]);

  const handleAutoSendReset = async (emailToSend: string) => {
    setError("");
    setLoading(true);

    try {
      if (!emailToSend) {
        setError("Email is required");
        setLoading(false);
        return;
      }

      await sendPasswordReset(emailToSend);
      setVerifiedEmail(emailToSend);
      setStep("code");
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email) {
        setError("Please enter your email address");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      await sendPasswordReset(email);
      setVerifiedEmail(email);
      setStep("code");
      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!code) {
        setError("Please enter the reset code");
        setLoading(false);
        return;
      }

      // Verify the code
      await verifyResetCode(code);
      setStep("password");
    } catch (err: any) {
      setError(err.message || "Invalid or expired reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!newPassword || !confirmPassword) {
        setError("Please fill in all fields");
        setLoading(false);
        return;
      }

      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long");
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      await confirmPasswordResetWithCode(code, newPassword);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");

      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setStep(prefilledEmail ? "verify-email" : "email");
      setEmail(prefilledEmail || "");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
      setVerifiedEmail("");
      setEmailSent(false);
    }
  };

  const handleBack = () => {
    if (step === "verify-email") {
      setStep("email");
      setCode("");
      setError("");
      setEmailSent(false);
    } else if (step === "code") {
      if (prefilledEmail) {
        setStep("verify-email");
      } else {
        setStep("email");
      }
      setCode("");
      setError("");
      setEmailSent(false);
    } else if (step === "password") {
      setStep("code");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-500" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "email"
              ? "Enter your email to receive a reset code"
              : step === "verify-email"
              ? `Verification code sent to ${verifiedEmail || email}`
              : step === "code"
              ? "Enter the code we sent to your email"
              : "Create a new password for your account"}
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">Password reset successfully! Redirecting to login...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendResetEmail} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Send Code
              </Button>
            </div>
          </form>
        )}

        {step === "verify-email" && (
          <div className="space-y-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300 font-medium">
                📧 Reset code sent to: <span className="font-semibold">{email}</span>
              </p>
              <p className="text-xs text-purple-300/80 mt-2">
                Check your email for a password reset link with a verification code. Please copy the code from the email and enter it below.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep("code")}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === "code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Verification Code
              </label>
              <p className="text-xs text-zinc-400 mb-3">
                Check your email for the reset code sent to <span className="font-semibold">{verifiedEmail || email}</span>
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                maxLength={50}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono text-center"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-11 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-11 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-400">✓ Passwords match</p>
            )}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">✗ Passwords do not match</p>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
