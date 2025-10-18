import { useState, useEffect } from 'react';
import { getDepartments, getSubdepartments, setUserDepartment } from '../../utils/api';
import { toast } from 'react-toastify';

const DepartmentSelectionModal = ({ user, onComplete }) => {
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubdept, setSelectedSubdept] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchSubdepartments(selectedDept);
    } else {
      setSubdepartments([]);
      setSelectedSubdept('');
    }
  }, [selectedDept]);

  const fetchDepartments = async () => {
    try {
      const { data } = await getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error('Failed to load departments');
    }
  };

  const fetchSubdepartments = async (deptCode) => {
    try {
      const { data } = await getSubdepartments(deptCode);
      setSubdepartments(data);
      if (data.length === 0) {
        setSelectedSubdept('NONE'); // For departments without subdepartments
      }
    } catch (error) {
      toast.error('Failed to load subdepartments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDept) {
      toast.error('Please select a department');
      return;
    }

    if (subdepartments.length > 0 && !selectedSubdept) {
      toast.error('Please select a subdepartment');
      return;
    }

    setLoading(true);
    try {
      await setUserDepartment(selectedDept, selectedSubdept);
      toast.success('Department set successfully!');
      onComplete();
    } catch (error) {
      toast.error('Failed to set department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Select Your Department</h2>
          <p className="text-gray-600 mt-2">
            Hello {user.fullName}! Please select the department you'll be working with.
          </p>
          <p className="text-sm text-blue-600 mt-1 font-semibold">
            {user.role === 'hr'
              ? 'This will be your primary department (you can access all departments)'
              : 'This is a one-time setup'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {subdepartments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subdepartment *
              </label>
              <select
                value={selectedSubdept}
                onChange={(e) => setSelectedSubdept(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Subdepartment</option>
                {subdepartments.map((subdept) => (
                  <option key={subdept.code} value={subdept.code}>
                    {subdept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> You can only set this once. Make sure you select the correct department.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Setting Department...' : 'Confirm Selection'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentSelectionModal;
