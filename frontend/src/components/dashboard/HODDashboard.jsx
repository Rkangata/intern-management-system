import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllApplications, hodReviewApplication } from '../../utils/api';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaTimes, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

const HODDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter states
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
    fetchApplications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applications, filters]);

  const fetchApplications = async () => {
    try {
      const { data } = await getAllApplications();
      // Filter by HOD's department and subdepartment
      const myDeptApplications = data.filter(app => 
        app.preferredDepartment === user.department && 
        app.preferredSubdepartment === user.subdepartment
      );
      setApplications(myDeptApplications);
    } catch (error) {
      toast.error('Failed to fetch applications');
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(app => app.user?.role === filters.role);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.user?.fullName?.toLowerCase().includes(searchLower) ||
        app.user?.email?.toLowerCase().includes(searchLower) ||
        app.user?.institution?.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
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

    // Sort
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
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to review application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      hr_review: 'bg-blue-100 text-blue-800',
      hod_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const statusText = {
      pending: 'Pending',
      hr_review: 'HR Review',
      hod_review: 'HOD Review',
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
    pending: filteredApplications.filter(app => app.status === 'pending').length,
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Head of Department Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {user.department} - {user.subdepartment}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Applications</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{filteredStats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{filteredStats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">For Review</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{filteredStats.hodReview}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{filteredStats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{filteredStats.rejected}</p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or institution..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Export Buttons */}
            <button
              onClick={() => exportToExcel(filteredApplications, 'hod_applications')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={filteredApplications.length === 0}
            >
              <FaFileExcel />
              Excel
            </button>
            <button
              onClick={() => exportToPDF(filteredApplications, 'hod_applications')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              disabled={filteredApplications.length === 0}
            >
              <FaFilePdf />
              PDF
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FaFilter />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-500 px-2 py-0.5 rounded-full text-sm font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <FaTimes />
                Clear
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="hod_review">For My Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="intern">Intern</option>
                  <option value="attachee">Attachee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <div className="flex gap-2">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="createdAt">Date Submitted</option>
                    <option value="name">Name</option>
                  </select>
                  <button
                    onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">
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
              <div key={app._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {app.user?.fullName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {app.user?.email} | {app.user?.phoneNumber}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {app.user?.institution} - {app.user?.course}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-semibold">
                      {app.user?.role?.toUpperCase()}
                    </span>
                  </div>
                  {getStatusBadge(app.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Department</p>
                    <p className="font-semibold">{app.preferredDepartment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Subdepartment</p>
                    <p className="font-semibold">{app.preferredSubdepartment || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Start Date</p>
                    <p className="font-semibold">{new Date(app.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Submitted</p>
                    <p className="font-semibold">{new Date(app.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Documents:</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`http://localhost:5000/${app.applicationLetter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      📄 Application Letter
                    </a>
                    <a
                      href={`http://localhost:5000/${app.cv}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      📄 CV
                    </a>
                    <a
                      href={`http://localhost:5000/${app.nationalId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                    >
                      🆔 National ID
                    </a>
                    {app.transcripts && (
                      <a
                        href={`http://localhost:5000/${app.transcripts}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        📊 Transcripts
                      </a>
                    )}
                    {app.recommendationLetter && (
                      <a
                        href={`http://localhost:5000/${app.recommendationLetter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        ✉️ Recommendation
                      </a>
                    )}
                  </div>
                </div>

                {app.hrComments && (
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-semibold text-blue-800">HR Comments:</p>
                    <p className="text-sm text-gray-700 mt-1">{app.hrComments}</p>
                  </div>
                )}

                {app.hodComments && (
                  <div className="mb-4 p-3 bg-purple-50 rounded">
                    <p className="text-sm font-semibold text-purple-800">HOD Decision:</p>
                    <p className="text-sm text-gray-700 mt-1">{app.hodComments}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {app.status === 'hod_review' && (
                  <div>
                    {selectedApp === app._id ? (
                      <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Decision Comments (Required)
                        </label>
                        <textarea
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          rows="3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Enter your decision and feedback..."
                        />
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleReview(app._id, 'approve')}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Processing...' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleReview(app._id, 'reject')}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                          >
                            {loading ? 'Processing...' : '✗ Reject'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApp(null);
                              setComments('');
                            }}
                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedApp(app._id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Review & Decide
                      </button>
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