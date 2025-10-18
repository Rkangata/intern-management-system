// =========================
// 📦 API SERVICE CONFIG
// =========================
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach JWT token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTH API ==========
export const register = (formData) =>
  API.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const login = (credentials) => API.post('/auth/login', credentials);

export const getProfile = () => API.get('/auth/me');

export const updateProfile = (formData) =>
  API.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const setUserDepartment = (department, subdepartment) =>
  API.put('/auth/set-department', { department, subdepartment });

// ========== DEPARTMENT API ==========
export const getDepartments = () => API.get('/departments');
export const getSubdepartments = (departmentCode) =>
  API.get(`/departments/${departmentCode}/subdepartments`);

// ========== APPLICATION API ==========
export const submitApplication = (formData) =>
  API.post('/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyApplications = () => API.get('/applications/my-applications');

export const getAllApplications = (status) => {
  const url = status ? `/applications?status=${status}` : '/applications';
  return API.get(url);
};

export const getApplication = (id) => API.get(`/applications/${id}`);

export const hrReviewApplication = (id, comments) =>
  API.put(`/applications/${id}/hr-review`, { comments });

export const hodReviewApplication = (id, action, comments) =>
  API.put(`/applications/${id}/hod-review`, { action, comments });

export const updateApplication = (id, formData) =>
  API.put(`/applications/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ========== ANALYTICS API ==========
export const getAnalytics = () => API.get('/applications/analytics/stats');

// Export the base instance
export default API;

// =========================
// 📊 EXPORT UTILITIES (Excel & PDF)
// =========================

// Export multiple applications to Excel
export const exportToExcel = (applications, filename = 'applications') => {
  const excelData = applications.map((app, index) => ({
    '#': index + 1,
    'Full Name': app.user?.fullName || 'N/A',
    'Email': app.user?.email || 'N/A',
    'Phone': app.user?.phoneNumber || 'N/A',
    'Role': app.user?.role?.toUpperCase() || 'N/A',
    'Institution': app.user?.institution || 'N/A',
    'Course': app.user?.course || 'N/A',
    'Department': app.preferredDepartment || 'N/A',
    'Start Date': new Date(app.startDate).toLocaleDateString(),
    'End Date': new Date(app.endDate).toLocaleDateString(),
    'Status': app.status.replace('_', ' ').toUpperCase(),
    'Submitted': new Date(app.createdAt).toLocaleDateString(),
    'HR Comments': app.hrComments || '-',
    'HOD Comments': app.hodComments || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 30 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

// Export single application to Excel
export const exportMyApplicationToExcel = (application, user) => {
  const excelData = [
    { Field: 'Applicant Name', Value: user.fullName },
    { Field: 'Email', Value: user.email },
    { Field: 'Phone', Value: user.phoneNumber },
    { Field: 'Role', Value: user.role.toUpperCase() },
    { Field: 'Institution', Value: user.institution },
    { Field: 'Course', Value: user.course },
    { Field: 'Year of Study', Value: user.yearOfStudy },
    { Field: '', Value: '' },
    { Field: 'Preferred Department', Value: application.preferredDepartment },
    { Field: 'Start Date', Value: new Date(application.startDate).toLocaleDateString() },
    { Field: 'End Date', Value: new Date(application.endDate).toLocaleDateString() },
    { Field: 'Status', Value: application.status.replace('_', ' ').toUpperCase() },
    { Field: 'Submitted On', Value: new Date(application.createdAt).toLocaleDateString() },
    { Field: '', Value: '' },
    { Field: 'HR Comments', Value: application.hrComments || 'No comments yet' },
    { Field: 'HOD Comments', Value: application.hodComments || 'No comments yet' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'My Application');
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `my_application_${timestamp}.xlsx`);
};

// Export multiple applications to PDF
export const exportToPDF = (applications, filename = 'applications') => {
  const doc = new jsPDF('landscape');
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('Intern Management System - Applications Report', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Applications: ${applications.length}`, 14, 27);

  const tableData = applications.map((app, index) => [
    index + 1,
    app.user?.fullName || 'N/A',
    app.user?.email || 'N/A',
    app.user?.role?.toUpperCase() || 'N/A',
    app.user?.institution || 'N/A',
    app.preferredDepartment || 'N/A',
    new Date(app.startDate).toLocaleDateString(),
    app.status.replace('_', ' ').toUpperCase(),
    new Date(app.createdAt).toLocaleDateString(),
  ]);

  doc.autoTable({
    head: [['#', 'Name', 'Email', 'Role', 'Institution', 'Department', 'Start Date', 'Status', 'Submitted']],
    body: tableData,
    startY: 32,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${timestamp}.pdf`);
};

// Export analytics to PDF
export const exportAnalyticsToPDF = (analytics) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text('Analytics Report', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

  let yPos = 45;
  doc.setFontSize(14);
  doc.text('Summary Statistics', 14, yPos);
  yPos += 10;

  const summaryData = [
    ['Total Applications', analytics.total],
    ['Pending', analytics.statusCounts.pending],
    ['HR Review', analytics.statusCounts.hr_review],
    ['HOD Review', analytics.statusCounts.hod_review],
    ['Approved', analytics.statusCounts.approved],
    ['Rejected', analytics.statusCounts.rejected],
    ['Approval Rate', `${analytics.approvalRate}%`],
    ['Interns', analytics.roleCounts.intern],
    ['Attachees', analytics.roleCounts.attachee],
  ];

  doc.autoTable({
    body: summaryData,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 11 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 }, 1: { halign: 'right', cellWidth: 40 } },
  });

  yPos = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.text('Top Departments', 14, yPos);
  yPos += 10;

  const deptData = Object.entries(analytics.departmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([dept, count]) => [dept, count]);

  doc.autoTable({
    head: [['Department', 'Applications']],
    body: deptData,
    startY: yPos,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });

  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`analytics_report_${timestamp}.pdf`);
};
