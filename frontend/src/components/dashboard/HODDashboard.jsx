import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getAllApplications, hodReviewApplication } from "../../utils/api";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";
import DocumentsSection from '../common/DocumentsSection'; // ✅ ADDED IMPORT

const HODDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: "all",
    role: "all",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const { data } = await getAllApplications();

      console.log("=== HOD DASHBOARD DEBUG ===");
      console.log("Logged in HOD:", {
        email: user.email,
        department: user.department,
        subdepartment: user.subdepartment,
      });
      console.log("Total applications received:", data.length);
      console.log(
        "Applications:",
        data.map((app) => ({
          id: app._id,
          dept: app.preferredDepartment,
          subdept: app.preferredSubdepartment,
          status: app.status,
        }))
      );

      setApplications(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch applications");
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== "all")
      filtered = filtered.filter((app) => app.status === filters.status);
    if (filters.role !== "all")
      filtered = filtered.filter((app) => app.applicantRole === filters.role);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.user?.fullName?.toLowerCase().includes(s) ||
          app.user?.email?.toLowerCase().includes(s) ||
          app.user?.institution?.toLowerCase().includes(s)
      );
    }
    if (filters.startDate)
      filtered = filtered.filter(
        (app) => new Date(app.createdAt) >= new Date(filters.startDate)
      );
    if (filters.endDate)
      filtered = filtered.filter(
        (app) => new Date(app.createdAt) <= new Date(filters.endDate)
      );

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case "name":
          aValue = a.user?.fullName || "";
          bValue = b.user?.fullName || "";
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      return filters.sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({
      status: "all",
      role: "all",
      search: "",
      startDate: "",
      endDate: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });

  const handleReview = async (appId, action) => {
    if (!comments.trim()) {
      toast.error("Please add comments before submitting");
      return;
    }

    setLoading(true);
    try {
      await hodReviewApplication(appId, action, comments);
      toast.success(
        `Application ${
          action === "approve" ? "approved" : "rejected"
        } successfully!`
      );
      setSelectedApp(null);
      setComments("");
      setExpandedApp(null);
      fetchApplications();
    } catch (error) {
      console.error("Review error:", error);
      toast.error(
        error.response?.data?.message || "Failed to review application"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = (documentPath, documentName) => {
    const baseURL =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";
    const fullUrl = `${baseURL}/${documentPath}`;
    window.open(fullUrl, "_blank");
  };

  const toggleExpand = (appId) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  // ✅ UPDATED: Added hr_final_review status
  const getStatusBadge = (status) => {
    const statusColors = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      hr_review:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      hod_review:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      hr_final_review:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };

    const statusText = {
      pending: "Pending",
      hr_review: "HR Review",
      hod_review: "For My Review",
      hr_final_review: "With HR for Offer",
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

  const filteredStats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter((app) => app.status === "hod_review")
      .length,
    approved: filteredApplications.filter(
      (app) => app.status === "approved" || app.status === "hr_final_review"
    ).length,
    rejected: filteredApplications.filter((app) => app.status === "rejected")
      .length,
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (["sortBy", "sortOrder"].includes(key)) return false;
    if (["status", "role"].includes(key) && val === "all") return false;
    return val !== "" && val !== "all";
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            HOD Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review applications for {user.department} - {user.subdepartment}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            [
              "Total Applications",
              filteredStats.total,
              "text-gray-800 dark:text-white",
            ],
            ["Pending Review", filteredStats.pending, "text-purple-600"],
            ["Approved", filteredStats.approved, "text-green-600"],
            ["Rejected", filteredStats.rejected, "text-red-600"],
          ].map(([label, count, color], i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {label}
              </p>
              <p className={`text-3xl font-bold mt-2 ${color}`}>{count}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or institution..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={() =>
                exportToExcel(filteredApplications, "hod_applications")
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={filteredApplications.length === 0}
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={() =>
                exportToPDF(filteredApplications, "hod_applications")
              }
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              disabled={filteredApplications.length === 0}
            >
              <FaFilePdf /> PDF
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaFilter /> Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-sm font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="hod_review">Pending My Review</option>
                  <option value="hr_final_review">With HR for Offer</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="intern">Intern</option>
                  <option value="attachee">Attachee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="createdAt">Date</option>
                    <option value="name">Name</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleFilterChange("sortOrder", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No applications found for your department
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Department: {user.department} | Subdepartment:{" "}
                {user.subdepartment}
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div
                key={app._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                {/* Application Header */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {app.user?.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {app.user?.email} | {app.user?.phoneNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        <span className="font-medium">Institution:</span>{" "}
                        {app.user?.institution} |
                        <span className="font-medium ml-2">Course:</span>{" "}
                        {app.user?.course}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full capitalize">
                        {app.applicantRole}
                      </span>
                    </div>
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleExpand(app._id)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    {expandedApp === app._id ? (
                      <>
                        <FaChevronUp /> Hide Details
                      </>
                    ) : (
                      <>
                        <FaChevronDown /> View Details
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Details */}
                {expandedApp === app._id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                    {/* Application Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                          Application Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Department:</span>{" "}
                            {app.preferredDepartment}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Subdepartment:</span>{" "}
                            {app.preferredSubdepartment}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Start Date:</span>{" "}
                            {new Date(app.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">End Date:</span>{" "}
                            {new Date(app.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Submitted:</span>{" "}
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Documents - REPLACED WITH DocumentsSection */}
                      <DocumentsSection 
                        application={app}
                        downloadDocument={downloadDocument}
                      />
                    </div>

                    {/* HR Comments */}
                    {app.hrComments && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                          HR Comments
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {app.hrComments}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Review Actions - Only for hod_review status */}
                    {app.status === "hod_review" && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        {selectedApp === app._id ? (
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                              Make Your Decision
                            </h4>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Add Your Comments (Required)
                            </label>
                            <textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              rows="4"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Enter your review comments..."
                            />

                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleReview(app._id, "approve")}
                                disabled={loading}
                                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaCheckCircle />
                                {loading
                                  ? "Processing..."
                                  : "Approve Application"}
                              </button>
                              <button
                                onClick={() => handleReview(app._id, "reject")}
                                disabled={loading}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <FaTimesCircle />
                                {loading
                                  ? "Processing..."
                                  : "Reject Application"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(null);
                                  setComments("");
                                }}
                                className="bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedApp(app._id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                          >
                            Review & Make Decision
                          </button>
                        )}
                      </div>
                    )}

                    {/* Show status message for other statuses */}
                    {app.status === "hr_final_review" && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                        <p className="text-sm text-indigo-800 dark:text-indigo-300">
                          ✅ You approved this application. It's now with HR for
                          sending the final offer email.
                        </p>
                      </div>
                    )}

                    {app.status === "approved" && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-300">
                          ✅ Application fully approved. Offer email sent to
                          applicant.
                        </p>
                      </div>
                    )}

                    {app.status === "rejected" && app.hodComments && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                          Your Decision Comments:
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-400">
                          {app.hodComments}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HODDashboard;