import { useState } from "react";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../utils/api";

const ForcePasswordChangeModal = ({ isOpen, onPasswordChanged, userEmail }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return false;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from temporary password");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const response = await API.put("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success(response.data.message || "Password changed successfully!");

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Notify parent component
      onPasswordChanged();
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header - No close button! User MUST change password */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-xl">
          <div className="flex items-center gap-3 text-white">
            <FaExclamationTriangle className="text-3xl" />
            <div>
              <h2 className="text-2xl font-bold">Password Change Required</h2>
              <p className="text-orange-100 text-sm mt-1">
                You must change your password before continuing
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Welcome!</strong> For security reasons, you must change
              your temporary password before accessing the system. This is a
              one-time requirement.
            </p>
          </div>

          {/* Current (Temporary) Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter the password from your email"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showCurrent ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Create a secure password (min 6 characters)"
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500 mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Re-enter your new password"
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                Passwords do not match
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
            )}
          </div>

          {/* Password Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              Password Requirements:
            </p>
            <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Minimum 6 characters</li>
              <li>• Different from your temporary password</li>
              <li>• Something you can remember but others can't guess</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              newPassword !== confirmPassword ||
              newPassword.length < 6
            }
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Changing Password...
              </>
            ) : (
              <>
                <FaLock />
                Change Password & Continue
              </>
            )}
          </button>

          {/* No Cancel Option */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            You cannot skip this step. Please change your password to continue.
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
