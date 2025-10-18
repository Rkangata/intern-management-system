import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getAllApplications, hrReviewApplication } from '../../utils/api';
import { toast } from 'react-toastify';
import { FaSearch, FaFilter, FaTimes, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import DepartmentSelector from '../common/DepartmentSelector';

const HRDashboard = () => {
  const { user } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedHODDept, setSelectedHODDept] = useState({ department: '', subdepartment: '' });

  const [filters, setFilters] = useState({
    status: 'all',
    department: '',
    subdepartment: '',
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
      setApplications(data);
    } catch (error) {
      toast.error('Failed to fetch applications');
    }
  };

  const applyFilters = () => {
    let filtered = [...applications];

    if (filters.status !== 'all') filtered = filtered.filter(app => app.status === filters.status);
    if (filters.department)
      filtered = filtered.filter(app =>
        app.preferredDepartment?.toLowerCase().includes(filters.department.toLowerCase())
      );
    if (filters.subdepartment)
      filtered = filtered.filter(app =>
        app.preferredSubdepartment?.toLowerCase().includes(filters.subdepartment.toLowerCase())
      );
    if (filters.role !== 'all') filtered = filtered.filter(app => app.user?.role === filters.role);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.user?.fullName?.toLowerCase().includes(s) ||
        app.user?.email?.toLowerCase().includes(s) ||
        app.user?.institution?.toLowerCase().includes(s) ||
        app.preferredDepartment?.toLowerCase().includes(s)
      );
    }
    if (filters.startDate)
      filtered = filtered.filter(app => new Date(app.createdAt) >= new Date(filters.startDate));
    if (filters.endDate)
      filtered = filtered.filter(app => new Date(app.createdAt) <= new Date(filters.endDate));

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (filters.sortBy) {
        case 'name':
          aValue = a.user?.fullName || '';
          bValue = b.user?.fullName || '';
          break;
        case 'department':
          aValue = a.preferredDepartment || '';
          bValue = b.preferredDepartment || '';
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      return filters.sortOrder === 'asc'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    setFilteredApplications(filtered);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilters = () =>
    setFilters({
      status: 'all',
      department: '',
      subdepartment: '',
      role: 'all',
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

  const handleForwardToHOD = async (appId) => {
    if (!comments.trim()) return toast.error('Please add comments before forwarding');
    if (!selectedHODDept.department || !selectedHODDept.subdepartment)
      return toast.error('Please select HOD department and subdepartment');

    setLoading(true);
    try {
      await hrReviewApplication(appId, comments);
      toast.success('Application forwarded to HOD successfully!');
      setSelectedApp(null);
      setComments('');
      setSelectedHODDept({ department: '', subdepartment: '' });
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to forward application');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      hr_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      hod_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    const labels = {
      pending: 'Pending',
      hr_review: 'HR Review',
      hod_review: 'HOD Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const filteredStats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(app => app.status === 'pending').length,
    hodReview: filteredApplications.filter(app => app.status === 'hod_review').length,
    approved: filteredApplications.filter(app => app.status === 'approved').length,
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (['sortBy', 'sortOrder'].includes(key)) return false;
    if (['status', 'role'].includes(key) && val === 'all') return false;
    return val !== '' && val !== 'all';
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">HR Officer Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Review and process intern/attachee applications
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            ['Total Applications', filteredStats.total, 'text-gray-800 dark:text-white'],
            ['Pending Review', filteredStats.pending, 'text-yellow-600'],
            ['With HOD', filteredStats.hodReview, 'text-purple-600'],
            ['Approved', filteredStats.approved, 'text-green-600'],
          ].map(([label, count, color], i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-gray-600 dark:text-gray-300 text-sm">{label}</p>
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
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={() => exportToExcel(filteredApplications, 'hr_applications')}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={filteredApplications.length === 0}
            >
              <FaFileExcel /> Excel
            </button>
            <button
              onClick={() => exportToPDF(filteredApplications, 'hr_applications')}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
        </div>

        {/* Applications */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div key={app._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {app.user?.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {app.user?.email} | {app.user?.phoneNumber}
                  </p>
                </div>
                {getStatusBadge(app.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
