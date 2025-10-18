import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserPlus, FaTrash, FaKey, FaCopy, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import DepartmentSelector from '../common/DepartmentSelector';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'hr',
    institution: '',
    course: '',
    yearOfStudy: '',
    department: '',
    subdepartment: '',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data: staffData } = await API.get('/admin/users');
      const { data: applicants } = await API.get('/admin/all-applicants');
      setUsers(staffData);
      setAllUsers([...staffData, ...applicants]);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/admin/create-user', formData);
      toast.success('User created successfully!');
      setGeneratedPassword(data.temporaryPassword);
      setFormData({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'hr',
        institution: '',
        course: '',
        yearOfStudy: '',
        department: '',
        subdepartment: '',
      });
      fetchAllUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      fetchAllUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const { data } = await API.put(`/admin/users/${userId}/reset-password`);
      toast.success('Password reset successfully!');
      alert(`New Password: ${data.newPassword}\n\nPlease copy and send to the user.`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const filteredUsers =
    activeTab === 'all' ? allUsers : allUsers.filter((u) => u.role === activeTab);

  const stats = {
    total: allUsers.length,
    hr: allUsers.filter((u) => u.role === 'hr').length,
    hod: allUsers.filter((u) => u.role === 'hod').length,
    intern: allUsers.filter((u) => u.role === 'intern').length,
    attachee: allUsers.filter((u) => u.role === 'attachee').length,
  };

  const requiresAdditionalFields =
    formData.role === 'intern' || formData.role === 'attachee';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Complete system management and control</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/analytics"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <FaChartLine />
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">HR Officers</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.hr}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">HODs</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.hod}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Interns</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.intern}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Attachees</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.attachee}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 font-semibold border-b-2 ${
                activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              All Users ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('hr')}
              className={`px-6 py-4 font-semibold border-b-2 ${
                activeTab === 'hr' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-600'
              }`}
            >
              HR ({stats.hr})
            </button>
            <button
              onClick={() => setActiveTab('hod')}
              className={`px-6 py-4 font-semibold border-b-2 ${
                activeTab === 'hod' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-600'
              }`}
            >
              HOD ({stats.hod})
            </button>
            <button
              onClick={() => setActiveTab('intern')}
              className={`px-6 py-4 font-semibold border-b-2 ${
                activeTab === 'intern' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600'
              }`}
            >
              Interns ({stats.intern})
            </button>
            <button
              onClick={() => setActiveTab('attachee')}
              className={`px-6 py-4 font-semibold border-b-2 ${
                activeTab === 'attachee' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-600'
              }`}
            >
              Attachees ({stats.attachee})
            </button>
          </div>
        </div>

        {/* Create User Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setGeneratedPassword('');
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaUserPlus />
            Create New User
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New User</h2>

            {generatedPassword && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold mb-2">
                  ✅ User Created Successfully!
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-green-700">
                    <strong>Temporary Password:</strong> {generatedPassword}
                  </p>
                  <button
                    onClick={() => copyToClipboard(generatedPassword)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <FaCopy />
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Please copy this password and send it to the user securely.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="hr">HR Officer</option>
                    <option value="hod">Head of Department</option>
                    <option value="intern">Intern</option>
                    <option value="attachee">Attachee</option>
                  </select>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+254 700 000000"
                  />
                </div>

                {/* Extra fields for interns/attachees */}
                {requiresAdditionalFields && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) =>
                          setFormData({ ...formData, institution: e.target.value })
                        }
                        required={requiresAdditionalFields}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="University Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) =>
                          setFormData({ ...formData, course: e.target.value })
                        }
                        required={requiresAdditionalFields}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year of Study *
                      </label>
                      <select
                        value={formData.yearOfStudy}
                        onChange={(e) =>
                          setFormData({ ...formData, yearOfStudy: e.target.value })
                        }
                        required={requiresAdditionalFields}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Year</option>
                        {[1, 2, 3, 4, 5].map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* DepartmentSelector */}
                <div className="md:col-span-2">
                  <DepartmentSelector
                    selectedDepartment={formData.department}
                    selectedSubdepartment={formData.subdepartment}
                    onDepartmentChange={(value) =>
                      setFormData({
                        ...formData,
                        department: value,
                        subdepartment: '',
                      })
                    }
                    onSubdepartmentChange={(value) =>
                      setFormData({ ...formData, subdepartment: value })
                    }
                    required={true}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setGeneratedPassword('');
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              {activeTab === 'all'
                ? 'All Users'
                : `${activeTab.toUpperCase()} Users`}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      {user.institution && (
                        <div className="text-xs text-gray-500">{user.institution}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'hr'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'hod'
                            ? 'bg-orange-100 text-orange-800'
                            : user.role === 'intern'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{user.department || 'Not Set'}</div>
                      {user.subdepartment && user.subdepartment !== 'NONE' && (
                        <div className="text-xs text-gray-500">{user.subdepartment}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Reset Password"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;