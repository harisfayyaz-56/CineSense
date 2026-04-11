// EmailVerification component for email verification after signup
import { useState, useEffect } from "react";
import { Film, Mail, Loader, CheckCircle, AlertCircle, Send, ArrowLeft } from "lucide-react";
import { getCurrentUser, resendVerificationEmail, markEmailAsVerified, isUserEmailVerified, signOutUser } from "../../config/authService";

interface EmailVerificationProps {
  onVerificationComplete?: () => void;
  onBack?: () => void;
}

export function EmailVerification({ onVerificationComplete, onBack }: EmailVerificationProps) {
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecks, setVerificationChecks] = useState(0);

  useEffect(() => {
    const initializeEmailVerification = async () => {
      try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
          setError("No user found. Please sign in again.");
          setLoading(false);
          return;
        }

        setUserEmail(currentUser.email || "");

        // Check if already verified
        const verified = await isUserEmailVerified();
        if (verified) {
          setIsVerified(true);
          // Mark as verified in Firestore
          await markEmailAsVerified(currentUser.uid);
          setTimeout(() => {
            onVerificationComplete?.();
          }, 2000);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load email verification");
      } finally {
        setLoading(false);
      }
    };

    initializeEmailVerification();
  }, [onVerificationComplete]);

  // Auto-check verification status every 3 seconds
  useEffect(() => {
    if (isVerified || !userEmail) return;

    const checkInterval = setInterval(async () => {
      try {
        setVerifying(true);
        const verified = await isUserEmailVerified();

        if (verified) {
          setIsVerified(true);
          const currentUser = getCurrentUser();
          if (currentUser) {
            await markEmailAsVerified(currentUser.uid);
          }
          setVerificationChecks((prev) => prev + 1);
        }
      } catch (err: any) {
        console.error("Verification check error:", err);
      } finally {
        setVerifying(false);
      }
    }, 3000);

    return () => clearInterval(checkInterval);
  }, [userEmail]);

  // Auto-complete after verification
  useEffect(() => {
    if (isVerified) {
      const timer = setTimeout(() => {
        onVerificationComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVerified, onVerificationComplete]);

  const handleResendEmail = async () => {
    setError("");
    setResending(true);

    try {
      await resendVerificationEmail();
      setResendSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = async () => {
    try {
      await signOutUser();
      onBack?.();
    } catch (err: any) {
      setError("Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-zinc-400">Initializing email verification...</p>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-2xl mb-4 animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-zinc-400">Your email has been successfully verified</p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-400">Verification Complete</p>
                <p className="text-sm text-green-300">{userEmail}</p>
              </div>
            </div>

            <p className="text-zinc-400 text-center">
              Redirecting you to the dashboard in a moment...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl mb-4">
            <Film className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-zinc-400">Confirm your email to complete registration</p>
        </div>

        {/* Email Verification Card */}
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {resendSuccess && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">Verification email resent successfully!</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email Info */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Verification email sent to:</p>
                  <p className="text-lg font-semibold text-purple-300">{userEmail}</p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-white">What to do next:</h3>
              <ol className="space-y-2 text-zinc-400 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    1
                  </span>
                  <span>Check your email inbox (including spam folder)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    2
                  </span>
                  <span>Click the verification link in the email</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    3
                  </span>
                  <span>Return to this page - we check automatically every few seconds</span>
                </li>
              </ol>
            </div>

            {/* Verification Status */}
            <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg">
              {verifying ? (
                <>
                  <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                  <span className="text-sm text-zinc-300">Checking verification status...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-zinc-300">Waiting for email verification...</span>
                </>
              )}
            </div>

            {/* Resend Button */}
            <div className="pt-2 space-y-3">
              <p className="text-sm text-zinc-400">Didn't receive the email?</p>
              <button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
              >
                {resending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>

              {/* Go Back Button */}
              <button
                onClick={handleGoBack}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Use Different Email
              </button>
            </div>

            {/* Login Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
              <p className="text-xs text-blue-300">
                You can continue once you verify your email. We'll redirect you automatically.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-6">
          This step ensures your email is valid and you own this account
        </p>
      </div>
    </div>
  );
}
