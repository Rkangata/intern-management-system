import React from 'react';
import { FaDownload, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const DocumentsSection = ({ application, downloadDocument }) => {
  // Determine if this is an intern or attachee
  const isIntern = application.user?.role === 'intern' || application.applicantRole === 'intern';
  
  // Define all documents for interns (11 documents)
  const internDocuments = [
    { label: 'Appointment Letter', field: application.appointmentLetter },
    { label: 'Degree/Diploma Certificate', field: application.degreeCertificate },
    { label: 'Academic Transcripts', field: application.transcripts },
    { label: 'National ID/Passport', field: application.nationalIdOrPassport },
    { label: 'KRA Pin Certificate', field: application.kraPinCertificate },
    { label: 'Good Conduct Certificate/Receipt', field: application.goodConductCertificate },
    { label: 'Passport Size Photos', field: application.passportPhotos },
    { label: 'Certificate of Good Health (SHIF)', field: application.certificateOfGoodHealth },
    { label: 'Insurance Cover', field: application.insuranceCover },
    { label: 'NSSF Certificate', field: application.nssfCertificate },
    { label: 'Bio-data Form', field: application.biodataForm }
  ];

  // Define all documents for attachees (7 documents)
  const attacheeDocuments = [
    { label: 'Application Letter', field: application.applicationLetter },
    { label: 'CV/Resume', field: application.cv },
    { label: 'National ID/Passport', field: application.nationalIdOrPassport },
    { label: 'Academic Transcripts', field: application.attacheeTranscripts },
    { label: 'Recommendation Letter', field: application.recommendationLetter },
    { label: 'Insurance Cover', field: application.insuranceCover },
    { label: 'Good Conduct Certificate/Receipt', field: application.goodConductCertificate }
  ];

  // Get the appropriate document list
  const documents = isIntern ? internDocuments : attacheeDocuments;
  
  // Separate available and missing documents
  const availableDocuments = documents.filter(doc => doc.field);
  const missingDocuments = documents.filter(doc => !doc.field);

  return (
    <div>
      {/* Header with counter */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 dark:text-white">
          Documents {isIntern ? '(Intern)' : '(Attachee)'}
        </h4>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
          missingDocuments.length === 0
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        }`}>
          {availableDocuments.length} of {documents.length} uploaded
        </span>
      </div>

      {/* Available Documents */}
      {availableDocuments.length > 0 && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FaCheckCircle className="text-green-600 dark:text-green-400 text-sm" />
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              Available Documents ({availableDocuments.length}):
            </p>
          </div>
          {availableDocuments.map((doc) => (
            <button
              key={doc.label}
              onClick={() => downloadDocument(doc.field, doc.label)}
              className="flex items-center gap-2 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm shadow-sm hover:shadow-md"
            >
              <FaDownload className="text-sm" />
              <span className="flex-1 text-left">Download {doc.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Missing Documents Warning */}
      {missingDocuments.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-2">
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 text-sm mt-0.5" />
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
              Missing Documents ({missingDocuments.length}):
            </p>
          </div>
          <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 ml-6">
            {missingDocuments.map((doc) => (
              <li key={doc.label} className="list-disc">
                {doc.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* All Documents Complete Message */}
      {missingDocuments.length === 0 && availableDocuments.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mt-4">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300 font-medium">
              All required documents uploaded ✓
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsSection;