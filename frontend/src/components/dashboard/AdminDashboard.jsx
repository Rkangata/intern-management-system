import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUserPlus, FaTrash, FaKey, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'hr',
    institution: '',
    course: '',
    yearOfStudy: '',
    department: '',
    subdepartment: '',
  });

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [staffResponse, applicantsResponse] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        ),
        axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/all-applicants`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        )
      ]);

      setUsers(staffResponse.data);
      setAllUsers([...staffResponse.data, ...applicantsResponse.data]);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/create-user`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // ✅ Updated success message
      toast.success(`User created! Login credentials sent to ${response.data.user.email}`);
      
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'hr',
        institution: '',
        course: '',
        yearOfStudy: '',
        department: '',
        subdepartment: '',
      });
      
      setShowCreateForm(false);
      fetchAllUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      toast.success('User deleted successfully');
      fetchAllUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/reset-password`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      // ✅ Updated success message
      toast.success(`Password reset email sent to ${userEmail}`);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleResendCredentials = async (userId, userEmail) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/admin/users/${userId}/resend-credentials`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      
      toast.success(`New credentials sent to ${userEmail}`);
    } catch (error) {
      toast.error('Failed to resend credentials');
    }
  };

  const filteredUsers =
    activeTab === 'all' ? allUsers : allUsers.filter((u) => u.role === activeTab);

  const stats = {
    total: allUsers.length,
    hr: allUsers.filter((u) => u.role === 'hr').length,
    hod: allUsers.filter((u) => u.role === 'hod').length,
    cos: allUsers.filter((u) => u.role === 'chief_of_staff').length,
    ps: allUsers.filter((u) => u.role === 'principal_secretary').length,
    intern: allUsers.filter((u) => u.role === 'intern').length,
    attachee: allUsers.filter((u) => u.role === 'attachee').length,
  };

  // Helper to check if role needs subdepartment
  const needsSubdepartment = (role) => {
    return ['intern', 'attachee', 'hr', 'hod'].includes(role);
  };

  // Helper to get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      hr: 'HR Officer',
      hod: 'Head of Department',
      chief_of_staff: 'Chief of Staff',
      principal_secretary: 'Principal Secretary',
      intern: 'Intern',
      attachee: 'Attachee'
    };
    return roleMap[role] || role.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Super Admin Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Complete system management and control</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Total Users</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">HR Officers</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.hr}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">HODs</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.hod}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Chief of Staff</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{stats.cos}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Prin. Secretary</p>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1">{stats.ps}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Interns</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.intern}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-gray-600 dark:text-gray-400 text-xs">Attachees</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.attachee}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-x-auto">
          <div className="flex">
            {[
              { key: 'all', label: `All (${stats.total})`, color: 'blue' },
              { key: 'hr', label: `HR (${stats.hr})`, color: 'purple' },
              { key: 'hod', label: `HOD (${stats.hod})`, color: 'orange' },
              { key: 'chief_of_staff', label: `COS (${stats.cos})`, color: 'indigo' },
              { key: 'principal_secretary', label: `PS (${stats.ps})`, color: 'pink' },
              { key: 'intern', label: `Interns (${stats.intern})`, color: 'blue' },
              { key: 'attachee', label: `Attachees (${stats.attachee})`, color: 'green' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 font-semibold border-b-2 whitespace-nowrap text-sm ${
                  activeTab === tab.key
                    ? `border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create User Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <FaUserPlus />
            Create New User
          </button>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create New User</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="hr">HR Officer</option>
                    <option value="hod">Head of Department</option>
                    <option value="chief_of_staff">Chief of Staff</option>
                    <option value="principal_secretary">Principal Secretary</option>
                    <option value="intern">Intern</option>
                    <option value="attachee">Attachee</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John"
                  />
                </div>

                {/* Middle Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) =>
                      setFormData({ ...formData, middleName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Michael"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="john.doe@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+254 700 000000"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value, subdepartment: '' })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    <option value="OPCS">Office of the Prime Cabinet Secretary</option>
                    <option value="SDPA">State Department for Parliamentary Affairs</option>
                  </select>
                </div>

                {/* Subdepartment - Only for roles that need it */}
                {needsSubdepartment(formData.role) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subdepartment <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.subdepartment}
                      onChange={(e) => setFormData({ ...formData, subdepartment: e.target.value })}
                      required
                      disabled={!formData.department}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-900"
                    >
                      <option value="">Select Subdepartment</option>
                      {formData.department === 'SDPA' && (
                        <>
                          <option value="ADMIN">Administration</option>
                          <option value="CPPMD">CPPMD</option>
                          <option value="HRMD">HRM&D Division</option>
                          <option value="FINANCE">Finance Unit</option>
                          <option value="ACCOUNTS">Accounts Unit</option>
                          <option value="SCM">SCM Unit</option>
                          <option value="PUBLIC_COMM">Public Communications Unit</option>
                          <option value="ICT">ICT Unit</option>
                        </>
                      )}
                      {formData.department === 'OPCS' && (
                        <>
                          <option value="ADMIN">Administration</option>
                          <option value="POLICY">Policy & Planning</option>
                          <option value="COORDINATION">Coordination</option>
                          <option value="CPPMD">CPPMD</option>
                          <option value="HRMD">HRM&D Division</option>
                          <option value="FINANCE">Finance Unit</option>
                          <option value="ACCOUNTS">Accounts Unit</option>
                          <option value="SCM">SCM Unit</option>
                          <option value="PUBLIC_COMM">Public Communications Unit</option>
                          <option value="ICT">ICT Unit</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {/* Show message for COS/PS */}
                {!needsSubdepartment(formData.role) && formData.role !== 'admin' && (
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ℹ️ {getRoleDisplay(formData.role)} works at department level only. No subdepartment required.
                      </p>
                    </div>
                  </div>
                )}

                {/* Institution, Course, Year - Only for interns/attachees */}
                {(formData.role === 'intern' || formData.role === 'attachee') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Institution <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.institution}
                        onChange={(e) =>
                          setFormData({ ...formData, institution: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="University Name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) =>
                          setFormData({ ...formData, course: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Year of Study <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.yearOfStudy}
                        onChange={(e) =>
                          setFormData({ ...formData, yearOfStudy: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Year</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                        <option value="5">Year 5</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {activeTab === 'all'
                ? 'All Users'
                : `${getRoleDisplay(activeTab)} Users`}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                      {user.institution && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.institution}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'hr'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : user.role === 'hod'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            : user.role === 'chief_of_staff'
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                            : user.role === 'principal_secretary'
                            ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                            : user.role === 'intern'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <div>{user.department || 'Not Set'}</div>
                      {user.subdepartment && user.subdepartment !== 'NONE' && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.subdepartment}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResetPassword(user._id, user.email)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300"
                          title="Reset Password"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => handleResendCredentials(user._id, user.email)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          title="Resend Credentials"
                        >
                          <FaUserPlus />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
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
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No users found in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;