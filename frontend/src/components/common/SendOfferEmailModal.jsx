import { useState } from "react";
import { toast } from "react-toastify";
import { FaEnvelope, FaTimes, FaPaperPlane } from "react-icons/fa";
import API from "../../utils/api";

const SendOfferEmailModal = ({ isOpen, onClose, application, onSuccess }) => {
  const [offerMessage, setOfferMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Default template message
  const defaultMessage = `Dear ${application?.user?.fullName || "Applicant"},

We are delighted to offer you a position as ${
    application?.applicantRole === "intern" ? "an Intern" : "an Attachee"
  } in the ${application?.preferredDepartment} - ${
    application?.preferredSubdepartment
  } department.

Your placement will commence on ${
    application?.startDate
      ? new Date(application.startDate).toLocaleDateString()
      : "[Start Date]"
  } and conclude on ${
    application?.endDate
      ? new Date(application.endDate).toLocaleDateString()
      : "[End Date]"
  }.

Please ensure you bring the following documents on your first day:
• National ID or Passport
• Original academic certificates and transcripts
• Certificate of Good Conduct
• KRA PIN Certificate (for interns)
• Insurance documents

We kindly request that you confirm your acceptance of this offer by replying to this email within 5 working days.

Should you have any questions or require clarification, please do not hesitate to contact our HR department.

We look forward to welcoming you to our team!`;

  const handleSendOffer = async () => {
    if (!offerMessage.trim()) {
      toast.error("Please enter an offer message");
      return;
    }

    setLoading(true);
    try {
      await API.put(`/applications/${application._id}/hr-final-review`, {
        offerMessage: offerMessage.trim(),
      });

      toast.success("Offer email sent successfully! Application approved.");
      setOfferMessage("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Send offer error:", error);
      toast.error(
        error.response?.data?.message || "Failed to send offer email"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = () => {
    setOfferMessage(defaultMessage);
  };

  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full">
              <FaEnvelope className="text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Send Offer Email</h2>
              <p className="text-blue-100 text-sm">
                Final approval and notification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Application Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
              Application Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400">Applicant:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {application.user?.fullName}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Email:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {application.user?.email}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Role:</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {application.applicantRole}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Department:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {application.preferredDepartment} -{" "}
                  {application.preferredSubdepartment}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Start Date:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(application.startDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">End Date:</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(application.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* HOD Comments */}
          {application.hodComments && (
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                HOD Comments
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {application.hodComments}
              </p>
            </div>
          )}

          {/* Offer Message */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Offer Message <span className="text-red-500">*</span>
              </label>
              <button
                onClick={handleUseTemplate}
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
              >
                Use Template
              </button>
            </div>
            <textarea
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              rows="12"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Enter your offer message to the applicant. Include start date, required documents, and next steps..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This message will be included in the offer email sent to the
              applicant.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                  Important
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-400 space-y-1">
                  <li>
                    • This will send an official offer email to the applicant
                  </li>
                  <li>
                    • The application status will be changed to "Approved"
                  </li>
                  <li>• This action cannot be undone</li>
                  <li>• Please review the message carefully before sending</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSendOffer}
              disabled={loading || !offerMessage.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPaperPlane />
              {loading
                ? "Sending Offer Email..."
                : "Send Offer Email & Approve"}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendOfferEmailModal;
