import { useState, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { login } from "../../utils/api";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaUserGraduate,
  FaUserTie,
  FaUserShield,
  FaUserCog,
} from "react-icons/fa";
import ForcePasswordChangeModal from "../common/ForcePasswordChangeModal";

const Login = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false); // ✅ NEW
  const [userEmail, setUserEmail] = useState(""); // ✅ NEW

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await login({ email, password, role });

      // ✅ UPDATED: Check if user must change password
      if (data.mustChangePassword) {
        // Store user data temporarily
        setUserEmail(data.email);
        setShowForcePasswordChange(true);

        // Store token but don't navigate yet
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
      } else {
        // Normal login flow
        loginUser(data, data.token);
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Get role configuration (title, color, icon)
  const getRoleConfig = () => {
    const configs = {
      intern: {
        title: "Intern",
        bgColor: "bg-blue-100 dark:bg-blue-900",
        buttonColor: "bg-blue-500 hover:bg-blue-600",
        textColor: "text-blue-500 hover:text-blue-600",
        icon: (
          <FaUserGraduate className="text-5xl text-blue-600 dark:text-blue-400" />
        ),
      },
      attachee: {
        title: "Attachee",
        bgColor: "bg-green-100 dark:bg-green-900",
        buttonColor: "bg-green-500 hover:bg-green-600",
        textColor: "text-green-500 hover:text-green-600",
        icon: (
          <FaUserTie className="text-5xl text-green-600 dark:text-green-400" />
        ),
      },
      hr: {
        title: "HR Officer",
        bgColor: "bg-purple-100 dark:bg-purple-900",
        buttonColor: "bg-purple-500 hover:bg-purple-600",
        textColor: "text-purple-500 hover:text-purple-600",
        icon: (
          <FaUserShield className="text-5xl text-purple-600 dark:text-purple-400" />
        ),
      },
      hod: {
        title: "Head of Department",
        bgColor: "bg-orange-100 dark:bg-orange-900",
        buttonColor: "bg-orange-500 hover:bg-orange-600",
        textColor: "text-orange-500 hover:text-orange-600",
        icon: (
          <FaUserCog className="text-5xl text-orange-600 dark:text-orange-400" />
        ),
      },
      chief_of_staff: {
        title: "Chief of Staff",
        bgColor: "bg-indigo-100 dark:bg-indigo-900",
        buttonColor: "bg-indigo-500 hover:bg-indigo-600",
        textColor: "text-indigo-500 hover:text-indigo-600",
        icon: <span className="text-5xl">⭐</span>,
      },
      principal_secretary: {
        title: "Principal Secretary",
        bgColor: "bg-pink-100 dark:bg-pink-900",
        buttonColor: "bg-pink-500 hover:bg-pink-600",
        textColor: "text-pink-500 hover:text-pink-600",
        icon: <span className="text-5xl">🏛️</span>,
      },
      admin: {
        title: "System Administrator",
        bgColor: "bg-gray-100 dark:bg-gray-800",
        buttonColor: "bg-gray-700 hover:bg-gray-800",
        textColor: "text-gray-700 hover:text-gray-800",
        icon: <span className="text-5xl">🔐</span>,
      },
    };
    return configs[role] || configs.intern;
  };

  const config = getRoleConfig();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div
              className={`${config.bgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}
            >
              {config.icon}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              {config.title} Login
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back! Please login to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${config.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="text-center mt-4">
              <Link
                to={`/forgot-password/${role}`}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
          </form>

          {(role === "intern" || role === "attachee") && (
            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to={`/register/${role}`}
                  className={`${config.textColor} font-semibold`}
                >
                  Register here
                </Link>
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Force Password Change Modal */}
      <ForcePasswordChangeModal
        isOpen={showForcePasswordChange}
        userEmail={userEmail}
        onPasswordChanged={() => {
          // After password change, complete login
          const user = JSON.parse(localStorage.getItem("user"));
          const token = localStorage.getItem("token");

          // Update mustChangePassword to false in local storage
          user.mustChangePassword = false;
          localStorage.setItem("user", JSON.stringify(user));

          loginUser(user, token);
          toast.success("Password changed successfully! Redirecting...");
          navigate("/dashboard");
        }}
      />
    </div>
  );
};

export default Login;
