import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const { role } = useParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      
      setTempPassword(data.temporaryPassword);
      setResetComplete(true);
      toast.success('Password reset successful!');
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!resetComplete ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaEnvelope className="text-4xl text-blue-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Forgot Password?
                </h2>
                <p className="text-gray-600 mt-2">
                  Enter your email to reset your password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="your.email@example.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to={`/login/${role}`}
                  className="text-blue-500 hover:text-blue-600 font-semibold flex items-center justify-center gap-2"
                >
                  <FaArrowLeft />
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">✅</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">
                  Password Reset!
                </h2>
                <p className="text-gray-600 mt-2">
                  Your password has been reset successfully
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Your Temporary Password:
                </p>
                <div className="flex items-center justify-between bg-white p-3 rounded border border-green-300">
                  <code className="text-lg font-mono text-green-700">{tempPassword}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast.success('Password copied!');
                    }}
                    className="text-green-600 hover:text-green-700 text-sm font-semibold"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  ⚠️ Please copy this password and change it after logging in
                </p>
              </div>

              <Link
                to={`/login/${role}`}
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;