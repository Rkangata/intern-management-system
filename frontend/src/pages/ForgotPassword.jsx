import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import API from '../utils/api'; // ✅ Use the configured API instance

const ForgotPassword = () => {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ FIXED: Use API instance which has correct baseURL
      const response = await API.post('/auth/forgot-password', { email });
      
      console.log('Password reset response:', response.data);
      
      setResetComplete(true);
      toast.success(response.data.message || 'Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to reset password. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {!resetComplete ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-blue-100 dark:bg-blue-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="text-4xl text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your email to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to={role ? `/login/${role}` : '/'}
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-2"
                >
                  <FaArrowLeft />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="bg-green-100 dark:bg-green-900 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-4xl text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Check Your Email!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  We've sent a password reset email to your address
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <p className="text-blue-800 dark:text-blue-300 font-semibold mb-2">
                    📧 Email Sent Successfully
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 text-sm">
                    We've sent a temporary password to <strong>{email}</strong>. 
                    Please check your inbox (and spam folder) and use the temporary password to log in.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                  <strong>⚠️ Important:</strong> After logging in with your temporary password, 
                  please change it immediately in your profile settings for security.
                </p>
              </div>

              <div className="space-y-4">
                <Link
                  to={role ? `/login/${role}` : '/'}
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 rounded-lg font-semibold transition-colors"
                >
                  Return to Login
                </Link>
                
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <p>Didn't receive the email?</p>
                  <button
                    onClick={() => {
                      setResetComplete(false);
                      setEmail('');
                    }}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-semibold mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;