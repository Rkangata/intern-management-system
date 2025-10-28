import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllApplications, hodReviewApplication } from '../../utils/api';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaTimes, FaFileExcel, FaFilePdf, FaDownload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const HODDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    console.log('Current HOD User:', user);
  }, [user]);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const { data } = await getAllApplications();

      console.log('=== HOD DASHBOARD DEBUG ===');
      console.log('Logged in HOD:', {
        email: user.email,
        department: user.department,
        subdepartment: user.subdepartment
      });
      console.log('Total applications received:', data.length);
      console.log('All applications:', data.map(app => ({
        id: app._id,
        applicant: app.user?.fullName,
        dept: app.preferredDepartment,
        subdept: app.preferredSubdepartment,
        status: app.status
      })));

      const myDeptApplications = data.filter(app => {
        const deptMatch = app.preferredDepartment === user.department;
        const subdeptMatch = app.preferredSubdepartment === user.subdepartment;
        const match = deptMatch && subdeptMatch;

        console.log(`Application ${app._id}:`, {
          appDept: app.preferredDepartment,
          hodDept: user.department,
          deptMatch,
          appSubdept: app.preferredSubdepartment,
          hodSubdept: user.subdepartment,
          subdeptMatch,
          finalMatch: match
        });

        return match;
      });

      console.log('Filtered applications for this HOD:', myDeptApplications.length);
      console.log('=== END HOD DEBUG ===');

      setApplications(myDeptApplications);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch applications');
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(app => app.user?.role === filters.role);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.user?.fullName?.toLowerCase().includes(searchLower) ||
        app.user?.email?.toLowerCase().includes(searchLower) ||
        app.user?.institution?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(app =>
        new Date(app.createdAt) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(app =>
        new Date(app.createdAt) <= new Date(filters.endDate)
      );
    }

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'name':
          aValue = a.user?.fullName || '';
          bValue = b.user?.fullName || '';
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      role: 'all',
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleReview = async (appId, action) => {
    if (!comments.trim()) {
      toast.error('Please add comments before submitting');
      return;
    }

    setLoading(true);
    try {
      await hodReviewApplication(appId, action, comments);
      toast.success(`Application ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setSelectedApp(null);
      setComments('');
      setExpandedApp(null);
      fetchApplications();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || 'Failed to review application');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = (documentPath, documentName) => {
    const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const fullUrl = `${baseURL}/${documentPath}`;
    window.open(fullUrl, '_blank');
  };

  const toggleExpand = (appId) => {
    setExpandedApp(expandedApp === appId ? null : appId);
    if (selectedApp === appId) {
      setSelectedApp(null);
      setComments('');
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      hr_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      hod_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const statusText = {
      pending: 'Pending',
      hr_review: 'HR Review',
      hod_review: 'For My Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  const filteredStats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status === 'pending' || app.status === 'hr_review').length,
    hodReview: filteredApplications.filter(app => app.status === 'hod_review').length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
    rejected: filteredApplications.filter(app => app.status === 'rejected').length,
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'sortBy' || key === 'sortOrder') return false;
    if (key === 'status' && value === 'all') return false;
    if (key === 'role' && value === 'all') return false;
    return value !== '' && value !== 'all';
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Head of Department Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {user.department} - {user.subdepartment}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{filteredStats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{filteredStats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">For Review</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{filteredStats.hodReview}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{filteredStats.approved}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-300 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{filteredStats.rejected}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or institution..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={() => exportToExcel(filteredApplications, 'hod_applications')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={filteredApplications.length === 0}
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={() => exportToPDF(filteredApplications, 'hod_applications')}
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

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="hod_review">For My Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="intern">Intern</option>
                  <option value="attachee">Attachee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="createdAt">Date Submitted</option>
                    <option value="name">Name</option>
                  </select>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
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
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {applications.length === 0 ? 'No applications for your department yet' : 'No applications match your filters'}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-blue-500 hover:text-blue-600 font-semibold"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app._id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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
                        <span className="font-medium">Institution:</span> {app.user?.institution} |
                        <span className="font-medium ml-2">Course:</span> {app.user?.course} |
                        <span className="font-medium ml-2">Year:</span> {app.user?.yearOfStudy}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.status)}
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {app.user?.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleExpand(app._id)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
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

                {expandedApp === app._id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Application Information</h4>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Department:</span> {app.preferredDepartment}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Subdepartment:</span> {app.preferredSubdepartment || 'N/A'}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Start Date:</span> {new Date(app.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">End Date:</span> {new Date(app.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Submitted:</span> {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Documents</h4>
                        <div className="space-y-2">
                          {[
                            ['Application Letter', app.applicationLetter],
                            ['CV/Resume', app.cv],
                            ['National ID', app.nationalId],
                            ['Transcripts', app.transcripts],
                            ['Recommendation Letter', app.recommendationLetter],
                          ].map(([label, path]) => path && (
                            <button
                              key={label}
                              onClick={() => downloadDocument(path, label)}
                              className="flex items-center gap-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                            >
                              <FaDownload /> Download {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {app.hrComments && (
                      <div className="mb-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">HR Comments:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{app.hrComments}</p>
                        </div>
                      </div>
                    )}

                    {app.hodComments && (
                      <div className="mb-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">My Previous Decision:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{app.hodComments}</p>
                        </div>
                      </div>
                    )}

                    {app.status === 'hod_review' && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        {selectedApp === app._id ? (
                          <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Make Your Decision</h4>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Decision Comments (Required)
                            </label>
                            <textarea
                              value={comments}
                              onChange={(e) => setComments(e.target.value)}
                              rows="4"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Enter your decision and feedback for the applicant..."
                            />

                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleReview(app._id, 'approve')}
                                disabled={loading}
                                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Processing...' : '✓ Approve Application'}
                              </button>
                              <button
                                onClick={() => handleReview(app._id, 'reject')}
                                disabled={loading}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? 'Processing...' : '✗ Reject Application'}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApp(null);
                                  setComments('');
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
                            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                          >
                            Review & Make Decision
                          </button>
                        )}
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