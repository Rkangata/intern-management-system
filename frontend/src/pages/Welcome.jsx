import { Link } from 'react-router-dom';
import {
  FaUserGraduate,
  FaUserTie,
  FaUserShield,
  FaUserCog,
  FaUserCircle,
} from 'react-icons/fa';

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-between">
      {/* HEADER */}
      <header className="py-8 bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/logo.png"
              alt="Government Logo"
              className="h-20 w-20 object-contain"
              onError={(e) => {
                e.target.src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%233b82f6" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-weight="bold">IMS</text></svg>';
              }}
            />
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 leading-tight">
                Office of the Prime Cabinet Secretary
                <br />
                <span className="text-blue-700 font-semibold">
                  Ministry of Foreign Affairs
                </span>
              </h2>
              <p className="text-lg text-gray-700 font-medium">
                State Department for Parliamentary Affairs
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="text-center mt-10 px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
         Internship & Attatchment Management System (IAMS)
        </h1>
        <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
          Streamline your internship and attachment application process through a
          centralized and efficient platform.
        </p>
      </section>

      {/* APPLICANTS SECTION */}
      <section className="mt-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            For Applicants
          </h2>
          <p className="text-gray-600">
            Apply for internship or attachment opportunities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {/* Intern Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-t-xl flex flex-col items-center">
              <FaUserGraduate className="text-6xl mb-4" />
              <h2 className="text-2xl font-bold">Intern</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Apply for internship opportunities and gain valuable work experience.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login/intern"
                  className="block w-full bg-blue-500 hover:bg-blue-600 text-white text-center py-3 rounded-lg font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register/intern"
                  className="block w-full border-2 border-blue-500 text-blue-500 hover:bg-blue-50 text-center py-3 rounded-lg font-semibold"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Attachee Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-t-xl flex flex-col items-center">
              <FaUserTie className="text-6xl mb-4" />
              <h2 className="text-2xl font-bold">Attachee</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center">
                Apply for attachment programs and enhance your professional skills.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login/attachee"
                  className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-lg font-semibold"
                >
                  Login
                </Link>
                <Link
                  to="/register/attachee"
                  className="block w-full border-2 border-green-500 text-green-500 hover:bg-green-50 text-center py-3 rounded-lg font-semibold"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="relative my-16">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-gray-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6 text-gray-500 font-semibold">
            ADMINISTRATIVE ACCESS
          </span>
        </div>
      </div>

      {/* STAFF SECTION */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            For Staff & Management
          </h2>
          <p className="text-gray-600">Review and manage applications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
          {/* HR Officer */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-t-xl flex flex-col items-center">
              <FaUserShield className="text-6xl mb-4" />
              <h2 className="text-2xl font-bold">HR Officer</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center text-sm">
                .
              </p>
              <Link
                to="/login/hr"
                className="block w-full bg-purple-500 hover:bg-purple-600 text-white text-center py-3 rounded-lg font-semibold"
              >
                Staff Login
              </Link>
            </div>
          </div>

          {/* HOD */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-t-xl flex flex-col items-center">
              <FaUserCog className="text-6xl mb-4" />
              <h2 className="text-2xl font-bold">Head of Department</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center text-sm">
                
              </p>
              <Link
                to="/login/hod"
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-semibold"
              >
                HOD Login
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-transform duration-300 hover:-translate-y-2">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-8 rounded-t-xl flex flex-col items-center">
              <FaUserCircle className="text-6xl mb-4" />
              <h2 className="text-2xl font-bold">Admin</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-6 text-center text-sm">
                 
              </p>
              <Link
                to="/login/admin"
                className="block w-full bg-gray-700 hover:bg-gray-800 text-white text-center py-3 rounded-lg font-semibold"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        {/* STAFF NOTE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-3xl mx-auto mt-8 mb-20">
          <p className="text-sm text-blue-800 text-center">
            <strong>Note for Staff:</strong> If you don't have login credentials, contact the
            system administrator at{' '}
            <a href="mailto:admin@ims.com" className="underline font-semibold">
              admin@ims.com
            </a>
          </p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="bg-white py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Easy Application</h3>
            <p className="text-gray-600">
              Submit your internship or attachment application in just a few clicks.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Track Progress</h3>
            <p className="text-gray-600">
              Get real-time updates on your application status and approvals.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Quick Approval</h3>
            <p className="text-gray-600">
              A streamlined approval process ensures minimal delays and transparency.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-200 py-6">
        <div className="container mx-auto text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Intern Management System. All rights reserved.</p>
          <p className="text-xs mt-2 text-gray-400">
            Designed and maintained by the ICT Department.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
