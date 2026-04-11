// ResetPasswordModal component for changing user password from profile page
import { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, Loader, CheckCircle } from "lucide-react";
import { verifyOldPassword, changePassword, getCurrentUser } from "../../config/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ResetPasswordModal({ isOpen, onClose }: ResetPasswordModalProps) {
  const [step, setStep] = useState<"verify-old" | "set-new">("verify-old");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerifyOldPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!oldPassword) {
        setError("Please enter your old password");
        setLoading(false);
        return;
      }

      const currentUser = getCurrentUser();
      if (!currentUser?.email) {
        setError("No user email found");
        setLoading(false);
        return;
      }

      await verifyOldPassword(currentUser.email, oldPassword);
      setStep("set-new");
      setOldPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to verify password");
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

      await changePassword(newPassword);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setStep("verify-old");
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setStep("verify-old");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-900 border border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-500" />
            {step === "verify-old" ? "Verify Old Password" : "Set New Password"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "verify-old"
              ? "Enter your current password to proceed"
              : "Create a new password for your account"}
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-400">Password updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {step === "verify-old" && (
          <form onSubmit={handleVerifyOldPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Old Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-11 pr-11 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {showOldPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
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
                Verify
              </Button>
            </div>
          </form>
        )}

        {step === "set-new" && (
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
                onClick={() => {
                  setStep("verify-old");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                }}
                disabled={loading}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader className="w-4 h-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
