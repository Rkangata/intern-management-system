import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getAllApplications, getAnalytics } from "../../utils/api";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaEye,
  FaChartLine,
  FaClipboardList,
} from "react-icons/fa";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";

const COSPSDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedApp, setExpandedApp] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [subdepartmentFilter, setSubdepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchApplications();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [
    applications,
    searchTerm,
    statusFilter,
    subdepartmentFilter,
    roleFilter,
    startDate,
    endDate,
  ]);

  const fetchApplications = async () => {
    try {
      const { data } = await getAllApplications();
      setApplications(data);
    } catch (error) {
      toast.error("Failed to fetch applications");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Failed to fetch analytics");
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.user?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          app.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.user?.institution
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Subdepartment filter
    if (subdepartmentFilter) {
      filtered = filtered.filter(
        (app) => app.preferredSubdepartment === subdepartmentFilter
      );
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((app) => app.user?.role === roleFilter);
    }

    // Date range
    if (startDate) {
      filtered = filtered.filter(
        (app) => new Date(app.createdAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(
        (app) => new Date(app.createdAt) <= new Date(endDate)
      );
    }

    setFilteredApplications(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSubdepartmentFilter("");
    setRoleFilter("");
    setStartDate("");
    setEndDate("");
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      hr_review:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      hod_review:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    const statusText = {
      pending: "Pending",
      hr_review: "HR Review",
      hod_review: "HOD Review",
      approved: "Approved",
      rejected: "Rejected",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}
      >
        {statusText[status]}
      </span>
    );
  };

  const getRoleTitle = () => {
    return user?.role === "chief_of_staff"
      ? "Chief of Staff"
      : "Principal Secretary";
  };

  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter((app) =>
      ["pending", "hr_review", "hod_review"].includes(app.status)
    ).length,
    approved: filteredApplications.filter((app) => app.status === "approved")
      .length,
    rejected: filteredApplications.filter((app) => app.status === "rejected")
      .length,
    interns: filteredApplications.filter((app) => app.user?.role === "intern")
      .length,
    attachees: filteredApplications.filter(
      (app) => app.user?.role === "attachee"
    ).length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {getRoleTitle()} Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {user?.fullName} - {user?.department} Department
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  exportToExcel(
                    filteredApplications,
                    `${user?.department}_applications`
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                disabled={filteredApplications.length === 0}
              >
                <FaFileExcel />
                Excel
              </button>
              <button
                onClick={() =>
                  exportToPDF(
                    filteredApplications,
                    `${user?.department}_applications`
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                disabled={filteredApplications.length === 0}
              >
                <FaFilePdf />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-2 font-semibold ${
                activeTab === "overview"
                  ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <FaClipboardList className="inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`py-4 px-2 font-semibold ${
                activeTab === "applications"
                  ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <FaEye className="inline mr-2" />
              Applications
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-2 font-semibold ${
                activeTab === "analytics"
                  ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              <FaChartLine className="inline mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Applications
                </p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Pending
                </p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                  {stats.pending}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Approved
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.approved}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Rejected
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {stats.rejected}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Interns
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats.interns}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Attachees
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.attachees}
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Department Overview</h3>
              <p className="text-indigo-100 mb-4">
                You have view-only access to all applications in the{" "}
                {user?.department} department across all subdepartments.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Your Department</p>
                  <p className="font-bold text-lg">{user?.department}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Access Level</p>
                  <p className="font-bold text-lg">View Only</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Coverage</p>
                  <p className="font-bold text-lg">All Subdepts</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-sm text-indigo-100">Role</p>
                  <p className="font-bold text-lg">
                    {user?.role === "chief_of_staff" ? "COS" : "PS"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="hr_review">HR Review</option>
                  <option value="hod_review">HOD Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                {/* Subdepartment Filter */}
                <select
                  value={subdepartmentFilter}
                  onChange={(e) => setSubdepartmentFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Subdepartments</option>
                  <option value="ADMIN">Administration</option>
                  <option value="CPPMD">CPPMD</option>
                  <option value="HRMD">HRM&D Division</option>
                  <option value="FINANCE">Finance Unit</option>
                  <option value="ACCOUNTS">Accounts Unit</option>
                  <option value="SCM">SCM Unit</option>
                  <option value="PUBLIC_COMM">
                    Public Communications Unit
                  </option>
                  <option value="ICT">ICT Unit</option>
                </select>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Roles</option>
                  <option value="intern">Interns</option>
                  <option value="attachee">Attachees</option>
                </select>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <FaTimes />
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                  <FaClipboardList className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    No Applications Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ||
                    statusFilter ||
                    subdepartmentFilter ||
                    roleFilter
                      ? "Try adjusting your filters"
                      : "No applications in your department yet"}
                  </p>
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                          {app.user?.fullName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {app.user?.email} • {app.user?.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {app.preferredDepartment} -{" "}
                          {app.preferredSubdepartment}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(app.status)}
                        <button
                          onClick={() =>
                            setExpandedApp(
                              expandedApp === app._id ? null : app._id
                            )
                          }
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        >
                          <FaEye className="text-xl" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Role</p>
                        <p className="font-semibold text-gray-800 dark:text-white capitalize">
                          {app.user?.role}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Institution
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {app.user?.institution}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Submitted
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Duration
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {new Date(app.startDate).toLocaleDateString()} -{" "}
                          {new Date(app.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Expanded View */}
                    {expandedApp === app._id && (
                      <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-4">
                        {/* Documents */}
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                            Documents
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(app)
                              .filter(
                                ([key, value]) =>
                                  value &&
                                  (key.includes("Letter") ||
                                    key.includes("Certificate") ||
                                    key.includes("Card") ||
                                    key === "cv" ||
                                    key === "transcripts" ||
                                    key === "nationalId" ||
                                    key.includes("Id") ||
                                    key.includes("Insurance") ||
                                    key.includes("Photos") ||
                                    key.includes("Form") ||
                                    key.includes("Conduct"))
                              )
                              .map(([key, value]) => (
                                <a
                                  key={key}
                                  href={`${
                                    import.meta.env.VITE_API_URL ||
                                    "http://localhost:5000"
                                  }/${value}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm"
                                >
                                  <FaFilePdf />
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </a>
                              ))}
                          </div>
                        </div>

                        {/* Comments */}
                        {(app.hrComments || app.hodComments) && (
                          <div className="space-y-2">
                            {app.hrComments && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                  HR Comments:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {app.hrComments}
                                </p>
                              </div>
                            )}
                            {app.hodComments && (
                              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                                  HOD Comments:
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {app.hodComments}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Only Notice */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            ℹ️ You have view-only access. This application is
                            managed by HR and HOD.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Department Analytics - {user?.department}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {analytics.total || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Total Applications
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {analytics.approvalRate || 0}%
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Approval Rate
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {analytics.statusCounts?.pending || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Pending Review
                  </p>
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Applications by Status
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {analytics.statusCounts?.pending || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Pending
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {analytics.statusCounts?.hr_review || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      HR Review
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {analytics.statusCounts?.hod_review || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      HOD Review
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {analytics.statusCounts?.approved || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Approved
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {analytics.statusCounts?.rejected || 0}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Rejected
                    </p>
                  </div>
                </div>
              </div>

              {/* Subdepartment Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                  Applications by Subdepartment
                </h4>
                <div className="space-y-2">
                  {Object.entries(analytics.departmentCounts || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([subdept, count]) => (
                      <div
                        key={subdept}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="font-medium text-gray-800 dark:text-white">
                          {subdept}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {count} applications
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default COSPSDashboard;
