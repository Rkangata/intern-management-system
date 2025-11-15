import { useState } from "react";
import { FaTimes, FaUserPlus, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../utils/api";

const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    role: "intern",
    institution: "",
    course: "",
    yearOfStudy: "",
    department: "",
    subdepartment: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset subdepartment when department changes
      ...(name === "department" && { subdepartment: "" }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phoneNumber
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.institution || !formData.course || !formData.yearOfStudy) {
      toast.error("Please fill in institution details");
      return;
    }

    if (!formData.department || !formData.subdepartment) {
      toast.error("Please select department and subdepartment");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/hr/create-user", formData);

      toast.success(response.data.message);

      // Show temp password in development
      if (response.data.temporaryPassword) {
        toast.info(`Temporary Password: ${response.data.temporaryPassword}`, {
          autoClose: 10000,
        });
      }

      // Reset form
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        role: "intern",
        institution: "",
        course: "",
        yearOfStudy: "",
        department: "",
        subdepartment: "",
      });

      // Notify parent and close
      onUserCreated();
      onClose();
    } catch (error) {
      console.error("Create user error:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-t-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <FaUserPlus className="text-3xl" />
              <div>
                <h2 className="text-2xl font-bold">Create New User Account</h2>
                <p className="text-purple-100 text-sm mt-1">
                  Create intern or attachee accounts for your department
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              type="button"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 max-h-[70vh] overflow-y-auto"
        >
          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              📧 <strong>Credentials will be sent via email.</strong> The user
              will receive a temporary password and must change it on first
              login. They will NOT see a registration button on the landing
              page.
            </p>
          </div>

          {/* User Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              {["intern", "attachee"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: type }))
                  }
                  className={`p-4 border-2 rounded-lg font-semibold transition-all ${
                    formData.role === type
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Middle Name (Optional)
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0712345678"
                  required
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institution <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="University/College name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Computer Science"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year of Study <span className="text-red-500">*</span>
                </label>
                <select
                  name="yearOfStudy"
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                  <option value="Year 5">Year 5</option>
                  <option value="Year 6">Year 6</option>
                </select>
              </div>
            </div>
          </div>

          {/* Department Placement */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              Department Placement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subdepartment <span className="text-red-500">*</span>
                </label>
                <select
                  name="subdepartment"
                  value={formData.subdepartment}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={!formData.department}
                >
                  <option value="">
                    {formData.department
                      ? "Select Subdepartment"
                      : "Select Department First"}
                  </option>
                  {formData.department === "SDPA" && (
                    <>
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
                    </>
                  )}
                  {formData.department === "OPCS" && (
                    <>
                      <option value="ADMIN">Administration</option>
                      <option value="POLICY">Policy & Planning</option>
                      <option value="COORDINATION">Coordination</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <FaUserPlus />
                  Create User Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
