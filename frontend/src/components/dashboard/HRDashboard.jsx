import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getAllApplications, hrReviewApplication } from "../../utils/api";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaFileExcel,
  FaFilePdf,
  FaDownload,
  FaEye,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaUserPlus, // ✅ NEW: Added user plus icon
} from "react-icons/fa";
import { exportToExcel, exportToPDF } from "../../utils/exportUtils";
import SendOfferEmailModal from "../common/SendOfferEmailModal";
import CreateUserModal from "../common/CreateUserModal"; // ✅ NEW IMPORT

const HRDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedHODDept, setSelectedHODDept] = useState({
    department: "",
    subdepartment: "",
  });

  // State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedOfferApp, setSelectedOfferApp] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false); // ✅ NEW: Create user modal state

  const [filters, setFilters] = useState({
    status: "all",
    department: "",
    subdepartment: "",
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
      setApplications(data);
    } catch (error) {
      toast.error("Failed to fetch applications");
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== "all")
      filtered = filtered.filter((app) => app.status === filters.status);
    if (filters.department)
      filtered = filtered.filter((app) =>
        app.preferredDepartment
          ?.toLowerCase()
          .includes(filters.department.toLowerCase())
      );
    if (filters.subdepartment)
      filtered = filtered.filter((app) =>
        app.preferredSubdepartment
          ?.toLowerCase()
          .includes(filters.subdepartment.toLowerCase())
      );
    if (filters.role !== "all")
      filtered = filtered.filter((app) => app.user?.role === filters.role);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.user?.fullName?.toLowerCase().includes(s) ||
          app.user?.email?.toLowerCase().includes(s) ||
          app.user?.institution?.toLowerCase().includes(s) ||
          app.preferredDepartment?.toLowerCase().includes(s)
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
        case "department":
          aValue = a.preferredDepartment || "";
          bValue = b.preferredDepartment || "";
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
      department: "",
      subdepartment: "",
      role: "all",
      search: "",
      startDate: "",
      endDate: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });

  const handleForwardToHOD = async (appId) => {
    if (!comments.trim())
      return toast.error("Please add comments before forwarding");
    if (!selectedHODDept.department || !selectedHODDept.subdepartment)
      return toast.error("Please select HOD department and subdepartment");

    setLoading(true);
    try {
      await hrReviewApplication(
        appId,
        comments,
        selectedHODDept.department,
        selectedHODDept.subdepartment
      );
      toast.success("Application forwarded to HOD successfully!");
      setSelectedApp(null);
      setComments("");
      setSelectedHODDept({ department: "", subdepartment: "" });
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to forward application"
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = (documentPath, documentName) => {
    // Get the base URL for the backend
    const baseURL =
      import.meta.env.VITE_API_URL?.replace("/api", "") ||
      "http://localhost:5000";
    const fullUrl = `${baseURL}/${documentPath}`;

    // Open in new tab to download
    window.open(fullUrl, "_blank");
  };

  const toggleExpand = (appId) => {
    setExpandedApp(expandedApp === appId ? null : appId);
  };

  // ✅ UPDATED: Added new status
  const getStatusBadge = (status) => {
    const colors = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      hr_review:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      hod_review:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      hr_final_review:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300", // ✅ NEW
      approved:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    const labels = {
      pending: "Pending",
      hr_review: "HR Review",
      hod_review: "HOD Review",
      hr_final_review: "Ready for Offer", // ✅ NEW
      approved: "Approved",
      rejected: "Rejected",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // ✅ UPDATED: Added new status count
  const filteredStats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter((app) => app.status === "pending")
      .length,
    hodReview: filteredApplications.filter((app) => app.status === "hod_review")
      .length,
    hrFinalReview: filteredApplications.filter(
      (app) => app.status === "hr_final_review"
    ).length, // ✅ NEW
    approved: filteredApplications.filter((app) => app.status === "approved")
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
            HR Officer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review and process intern/attachee applications
          </p>
        </div>
      </div>

      {/* ✅ NEW: Create User Button - Added after header */}
      <div className="container mx-auto px-4 py-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          <FaUserPlus />
          Create Intern/Attachee Account
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* ✅ UPDATED: Stats with new card */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {[
            [
              "Total Applications",
              filteredStats.total,
              "text-gray-800 dark:text-white",
            ],
            ["Pending Review", filteredStats.pending, "text-yellow-600"],
            ["With HOD", filteredStats.hodReview, "text-purple-600"],
            ["Ready for Offer", filteredStats.hrFinalReview, "text-indigo-600"], // ✅ NEW
            ["Approved", filteredStats.approved, "text-green-600"],
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
                placeholder="Search by name, email, institution, or department..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={() =>
                exportToExcel(filteredApplications, "hr_applications")
              }
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={filteredApplications.length === 0}
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={() =>
                exportToPDF(filteredApplications, "hr_applications")
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
                  <option value="pending">Pending</option>
                  <option value="hr_review">HR Review</option>
                  <option value="hod_review">HOD Review</option>
                  <option value="hr_final_review">Ready for Offer</option>{" "}
                  {/* ✅ NEW */}
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
                    <option value="department">Department</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No applications found
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
                        {app.user?.course} |
                        <span className="font-medium ml-2">Year:</span>{" "}
                        {app.user?.yearOfStudy}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {app.user?.role?.toUpperCase()}
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
                            {app.preferredSubdepartment || "N/A"}
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

                      {/* Documents */}
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                          Documents
                        </h4>
                        <div className="space-y-2">
                          {[
                            ["Application Letter", app.applicationLetter],
                            ["CV/Resume", app.cv],
                            ["National ID", app.nationalId],
                            ["Transcripts", app.transcripts],
                            ["Recommendation Letter", app.recommendationLetter],
                          ].map(
                            ([label, path]) =>
                              path && (
                                <button
                                  key={label}
                                  onClick={() => downloadDocument(path, label)}
                                  className="flex items-center gap-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                                >
                                  <FaDownload /> Download {label}
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Previous Comments */}
                    {(app.hrComments || app.hodComments) && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">
                          Review History
                        </h4>
                        {app.hrComments && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-3">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                              HR Comments:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {app.hrComments}
                            </p>
                          </div>
                        )}
                        {app.hodComments && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                              HOD Comments:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {app.hodComments}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Actions */}
                    {(app.status === "pending" ||
                      app.status === "hr_review") && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        {selectedApp === app._id ? (
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">
                              Forward to HOD
                            </h4>

                            {/* HOD Department Selection */}
                            <div className="mb-4 space-y-4">
                              {/* Department */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Select HOD Department{" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={selectedHODDept.department}
                                  onChange={(e) =>
                                    setSelectedHODDept({
                                      department: e.target.value,
                                      subdepartment: "",
                                    })
                                  }
                                  required
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="">Select Department</option>
                                  <option value="OPCS">
                                    Office of the Prime Cabinet Secretary
                                  </option>
                                  <option value="SDPA">
                                    State Department for Parliamentary Affairs
                                  </option>
                                </select>
                              </div>

                              {/* Subdepartment - Only show if department is selected */}
                              {selectedHODDept.department && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select HOD Subdepartment{" "}
                                    <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                    value={selectedHODDept.subdepartment}
                                    onChange={(e) =>
                                      setSelectedHODDept({
                                        ...selectedHODDept,
                                        subdepartment: e.target.value,
                                      })
                                    }
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  >
                                    <option value="">
                                      Select Subdepartment
                                    </option>
                                    {selectedHODDept.department === "SDPA" && (
                                      <>
                                        <option value="ADMIN">
                                          Administration
                                        </option>
                                        <option value="CPPMD">CPPMD</option>
                                        <option value="HRMD">
                                          HRM&D Division
                                        </option>
                                        <option value="FINANCE">
                                          Finance Unit
                                        </option>
                                        <option value="ACCOUNTS">
                                          Accounts Unit
                                        </option>
                                        <option value="SCM">SCM Unit</option>
                                        <option value="PUBLIC_COMM">
                                          Public Communications Unit
                                        </option>
                                        <option value="ICT">ICT Unit</option>
                                      </>
                                    )}
                                    {selectedHODDept.department === "OPCS" && (
                                      <>
                                        <option value="ADMIN">
                                          Administration
                                        </option>
                                        <option value="POLICY">
                                          Policy & Planning
                                        </option>
                                        <option value="COORDINATION">
                                          Coordination
                                        </option>
                                      </>
                                    )}
                                  </select>
                                </div>
                              )}
                            </div>

                            {/* Comments */}
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Add Your Comments (Required)
                            </label>
                            <textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              rows="4"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Enter your review comments for the HOD..."
                            />

                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleForwardToHOD(app._id)}
                                disabled={
                                  loading ||
                                  !selectedHODDept.department ||
                                  !selectedHODDept.subdepartment
                                }
                                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? "Forwarding..." : "Forward to HOD"}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(null);
                                  setComments("");
                                  setSelectedHODDept({
                                    department: "",
                                    subdepartment: "",
                                  });
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
                            Review & Forward to HOD
                          </button>
                        )}
                      </div>
                    )}

                    {/* ✅ NEW: Send Offer Email Button - Only show for hr_final_review status */}
                    {app.status === "hr_final_review" && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">🎉</div>
                            <div>
                              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                HOD Approved - Ready for Offer Email
                              </h4>
                              <p className="text-sm text-green-800 dark:text-green-400">
                                This application has been approved by the HOD.
                                You can now send the final offer email to the
                                applicant.
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedOfferApp(app);
                            setShowOfferModal(true);
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <FaPaperPlane />
                          Send Offer Email & Approve Application
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ NEW: Send Offer Email Modal */}
      <SendOfferEmailModal
        isOpen={showOfferModal}
        onClose={() => {
          setShowOfferModal(false);
          setSelectedOfferApp(null);
        }}
        application={selectedOfferApp}
        onSuccess={() => {
          fetchApplications();
        }}
      />

      {/* ✅ NEW: Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={() => {
          // Optionally refresh list or show success
          toast.success("User account created successfully!");
        }}
      />
    </div>
  );
};

export default HRDashboard;
