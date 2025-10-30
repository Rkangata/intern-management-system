import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getMyApplications, submitApplication, updateProfile } from '../../utils/api';
import { toast } from 'react-toastify';
import { FaFileUpload, FaUser, FaClipboardList } from 'react-icons/fa';

const InternDashboard = () => {
  const { user, checkAuth } = useContext(AuthContext);
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [applicationData, setApplicationData] = useState({
    startDate: '',
    endDate: '',
    preferredDepartment: '',
    preferredSubdepartment: '',
  });

  // ✅ Role-specific documents initialization
  const [documents, setDocuments] = useState(
    user?.role === 'intern'
      ? {
          appointmentLetter: null,
          degreeCertificate: null,
          transcripts: null,
          nationalIdOrPassport: null,
          kraPinCertificate: null,
          goodConductCertificate: null,
          passportPhotos: null,
          shifCard: null,
          insuranceCover: null,
          nssfCard: null,
          bioDataForm: null,
        }
      : {
          applicationLetter: null,
          cv: null,
          attacheeTranscripts: null,
          recommendationLetter: null,
          attacheeNationalId: null,
          attacheeInsurance: null,
          goodConductCertOrReceipt: null,
        }
  );

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    institution: user?.institution || '',
    course: user?.course || '',
    yearOfStudy: user?.yearOfStudy || '',
    department: user?.department || '',
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await getMyApplications();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to fetch applications');
    }
  };

  const handleApplicationChange = (e) => {
    setApplicationData({ ...applicationData, [e.target.name]: e.target.value });
  };

  const handleDocumentChange = (e) => {
    setDocuments({ ...documents, [e.target.name]: e.target.files[0] });
  };

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('startDate', applicationData.startDate);
      formData.append('endDate', applicationData.endDate);
      formData.append('preferredDepartment', applicationData.preferredDepartment);
      formData.append('preferredSubdepartment', applicationData.preferredSubdepartment);
      formData.append('applicantRole', user.role); // ✅ Important: Send role
      
      // Append all documents
      Object.keys(documents).forEach((key) => {
        if (documents[key]) {
          formData.append(key, documents[key]);
        }
      });

      await submitApplication(formData);
      toast.success('Application submitted successfully!');
      setShowApplicationForm(false);
      fetchApplications();
      
      // Reset form
      setApplicationData({ 
        startDate: '', 
        endDate: '', 
        preferredDepartment: '',
        preferredSubdepartment: '' 
      });
      
      // Reset documents based on role
      const resetDocs = user?.role === 'intern'
        ? {
            appointmentLetter: null,
            degreeCertificate: null,
            transcripts: null,
            nationalIdOrPassport: null,
            kraPinCertificate: null,
            goodConductCertificate: null,
            passportPhotos: null,
            shifCard: null,
            insuranceCover: null,
            nssfCard: null,
            bioDataForm: null,
          }
        : {
            applicationLetter: null,
            cv: null,
            attacheeTranscripts: null,
            recommendationLetter: null,
            attacheeNationalId: null,
            attacheeInsurance: null,
            goodConductCertOrReceipt: null,
          };
      setDocuments(resetDocs);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(profileData).forEach((key) => {
        formData.append(key, profileData[key]);
      });

      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      checkAuth();
    } catch (error) {
      toast.error('Failed to update profile');
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

  // ✅ Get role-specific document fields
  const getDocumentFields = () => {
    if (user?.role === 'intern') {
      return [
        { name: 'appointmentLetter', label: 'Copy of Appointment Letter', required: true },
        { name: 'degreeCertificate', label: 'Bachelor\'s Degree Certificate', required: true },
        { name: 'transcripts', label: 'Transcripts', required: true },
        { name: 'nationalIdOrPassport', label: 'National ID or Passport', required: true },
        { name: 'kraPinCertificate', label: 'KRA PIN Certificate', required: true },
        { name: 'goodConductCertificate', label: 'Valid Certificate of Good Conduct', required: true },
        { name: 'passportPhotos', label: 'Two Colour Passport Photos', required: true },
        { name: 'shifCard', label: 'SHIF Card', required: true },
        { name: 'insuranceCover', label: 'Personal Accident Insurance Cover', required: true },
        { name: 'nssfCard', label: 'NSSF Card', required: true },
        { name: 'bioDataForm', label: 'Duly Filled Personal Bio Data Form', required: true },
      ];
    } else {
      return [
        { name: 'applicationLetter', label: 'Application Letter', required: true },
        { name: 'cv', label: 'CV/Resume', required: true },
        { name: 'attacheeTranscripts', label: 'Academic Transcripts', required: true },
        { name: 'recommendationLetter', label: 'Recommendation Letter', required: true },
        { name: 'attacheeNationalId', label: 'National ID', required: true },
        { name: 'attacheeInsurance', label: 'Insurance Cover', required: true },
        { name: 'goodConductCertOrReceipt', label: 'Certificate of Good Conduct / Receipt', required: true },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.fullName}
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'intern' ? 'Intern' : 'Attachee'} Dashboard
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 font-semibold ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaClipboardList className="inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 px-2 font-semibold ${
                activeTab === 'applications'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaFileUpload className="inline mr-2" />
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 font-semibold ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FaUser className="inline mr-2" />
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {applications.length}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaClipboardList className="text-blue-600 text-2xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {applications.filter((app) => app.status === 'pending' || app.status === 'hr_review' || app.status === 'hod_review').length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <span className="text-2xl">⏳</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Approved</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {applications.filter((app) => app.status === 'approved').length}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <button
                onClick={() => {
                  setShowApplicationForm(true);
                  setActiveTab('applications');
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                + Submit New Application
              </button>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {!showApplicationForm ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">My Applications</h2>
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    + New Application
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <FaFileUpload className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No Applications Yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Submit your first application to get started
                    </p>
                    <button
                      onClick={() => setShowApplicationForm(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Submit Application
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {applications.map((app) => (
                      <div key={app._id} className="bg-white rounded-lg shadow p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {app.preferredDepartment} - {app.preferredSubdepartment}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(app.startDate).toLocaleDateString()} - {new Date(app.endDate).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(app.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Submitted</p>
                            <p className="font-semibold">{new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          {app.hrReviewDate && (
                            <div>
                              <p className="text-gray-600">HR Review</p>
                              <p className="font-semibold">{new Date(app.hrReviewDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {app.hodReviewDate && (
                            <div>
                              <p className="text-gray-600">HOD Review</p>
                              <p className="font-semibold">{new Date(app.hodReviewDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        {app.hrComments && (
                          <div className="mt-4 p-3 bg-blue-50 rounded">
                            <p className="text-sm font-semibold text-blue-800">HR Comments:</p>
                            <p className="text-sm text-gray-700 mt-1">{app.hrComments}</p>
                          </div>
                        )}

                        {app.hodComments && (
                          <div className="mt-4 p-3 bg-purple-50 rounded">
                            <p className="text-sm font-semibold text-purple-800">HOD Comments:</p>
                            <p className="text-sm text-gray-700 mt-1">{app.hodComments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Submit {user?.role === 'intern' ? 'Internship' : 'Attachment'} Application
                  </h2>
                  <button
                    onClick={() => setShowApplicationForm(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleApplicationSubmit} className="space-y-6">
                  {/* Date & Department Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={applicationData.startDate}
                        onChange={handleApplicationChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={applicationData.endDate}
                        onChange={handleApplicationChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredDepartment"
                        value={applicationData.preferredDepartment}
                        onChange={(e) => {
                          setApplicationData({
                            ...applicationData,
                            preferredDepartment: e.target.value,
                            preferredSubdepartment: '',
                          });
                        }}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select Department</option>
                        <option value="OPCS">Office of the Prime Cabinet Secretary</option>
                        <option value="SDPA">State Department for Parliamentary Affairs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subdepartment <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredSubdepartment"
                        value={applicationData.preferredSubdepartment}
                        onChange={handleApplicationChange}
                        required
                        disabled={!applicationData.preferredDepartment}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                      >
                        <option value="">Select Subdepartment</option>
                        {applicationData.preferredDepartment === 'SDPA' && (
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
                        {applicationData.preferredDepartment === 'OPCS' && (
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
                  </div>

                  {/* ✅ Role-Specific Document Uploads */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Required Documents {user?.role === 'intern' ? '(11 documents)' : '(7 documents)'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {getDocumentFields().map((field) => (
                        <div key={field.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="file"
                            name={field.name}
                            accept=".pdf,.doc,.docx,image/*"
                            onChange={handleDocumentChange}
                            required={field.required}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-8 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Update Profile</h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={profileData.middleName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution
                  </label>
                  <input
                    type="text"
                    name="institution"
                    value={profileData.institution}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={profileData.course}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year of Study
                  </label>
                  <select
                    name="yearOfStudy"
                    value={profileData.yearOfStudy}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleProfileChange}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default InternDashboard;