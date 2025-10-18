import { useState, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { login } from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await login({ email, password, role });
      loginUser(data, data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    const roles = {
      intern: 'Intern',
      attachee: 'Attachee',
      hr: 'HR Officer',
      hod: 'Head of Department'
    };
    return roles[role] || 'User';
  };

  const getRoleColor = () => {
    const colors = {
      intern: 'blue',
      attachee: 'green',
      hr: 'purple',
      hod: 'orange'
    };
    return colors[role] || 'blue';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`bg-${getRoleColor()}-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {getRoleTitle()} Login
            </h2>
            <p className="text-gray-600 mt-2">
              Welcome back! Please login to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-${getRoleColor()}-500 hover:bg-${getRoleColor()}-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center mt-4">
              <Link
                to={`/forgot-password/${role}`}
                className="text-sm text-blue-500 hover:text-blue-600 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          {(role === 'intern' || role === 'attachee') && (
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link
                  to={`/register/${role}`}
                  className={`text-${getRoleColor()}-500 hover:text-${getRoleColor()}-600 font-semibold`}
                >
                  Register here
                </Link>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;