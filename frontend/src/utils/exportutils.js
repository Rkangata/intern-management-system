import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export applications to Excel
export const exportToExcel = (applications, filename = 'applications') => {
  // Prepare data for Excel
  const excelData = applications.map((app, index) => ({
    '#': index + 1,
    'Full Name': app.user?.fullName || 'N/A',
    'Email': app.user?.email || 'N/A',
    'Phone': app.user?.phoneNumber || 'N/A',
    'Role': app.user?.role?.toUpperCase() || 'N/A',
    'Institution': app.user?.institution || 'N/A',
    'Course': app.user?.course || 'N/A',
    'Department': app.preferredDepartment || 'N/A',
    'Subdepartment': app.preferredSubdepartment || 'N/A',
    'Start Date': new Date(app.startDate).toLocaleDateString(),
    'End Date': new Date(app.endDate).toLocaleDateString(),
    'Status': app.status.replace('_', ' ').toUpperCase(),
    'Submitted': new Date(app.createdAt).toLocaleDateString(),
    'HR Comments': app.hrComments || '-',
    'HOD Comments': app.hodComments || '-',
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const columnWidths = [
    { wch: 5 },  // #
    { wch: 20 }, // Full Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 10 }, // Role
    { wch: 25 }, // Institution
    { wch: 20 }, // Course
    { wch: 15 }, // Department
    { wch: 15 }, // Subdepartment
    { wch: 12 }, // Start Date
    { wch: 12 }, // End Date
    { wch: 15 }, // Status
    { wch: 12 }, // Submitted
    { wch: 30 }, // HR Comments
    { wch: 30 }, // HOD Comments
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

  // Generate file
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);
};

// Export single application to Excel (for interns/attachees)
export const exportMyApplicationToExcel = (application, user) => {
  const excelData = [
    { Field: 'Applicant Name', Value: user.fullName },
    { Field: 'Email', Value: user.email },
    { Field: 'Phone Number', Value: user.phoneNumber },
    { Field: 'Role', Value: user.role.toUpperCase() },
    { Field: 'Institution', Value: user.institution },
    { Field: 'Course', Value: user.course },
    { Field: 'Year of Study', Value: user.yearOfStudy },
    { Field: '', Value: '' },
    { Field: 'Preferred Department', Value: application.preferredDepartment },
    { Field: 'Preferred Subdepartment', Value: application.preferredSubdepartment || 'N/A' },
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

// Export applications to PDF
export const exportToPDF = (applications, filename = 'applications') => {
  const doc = new jsPDF('landscape');

  // Add title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text('Intern Management System - Applications Report', 14, 15);

  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
  doc.text(`Total Applications: ${applications.length}`, 14, 27);

  // Prepare table data
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

  // Add table
  doc.autoTable({
    head: [['#', 'Name', 'Email', 'Role', 'Institution', 'Department', 'Start Date', 'Status', 'Submitted']],
    body: tableData,
    startY: 32,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { top: 32 },
  });

  // Add footer
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

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`${filename}_${timestamp}.pdf`);
};

// Export single application to PDF (for interns/attachees)
export const exportMyApplicationToPDF = (application, user) => {
  const doc = new jsPDF();

  // Add header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255);
  doc.setFontSize(22);
  doc.text('Application Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Intern Management System', 105, 30, { align: 'center' });

  // Reset text color
  doc.setTextColor(40);
  let yPos = 55;

  // Personal Information
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Personal Information', 14, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${user.fullName}`, 14, yPos);
  yPos += 7;
  doc.text(`Email: ${user.email}`, 14, yPos);
  yPos += 7;
  doc.text(`Phone: ${user.phoneNumber}`, 14, yPos);
  yPos += 7;
  doc.text(`Role: ${user.role.toUpperCase()}`, 14, yPos);
  yPos += 7;
  doc.text(`Institution: ${user.institution}`, 14, yPos);
  yPos += 7;
  doc.text(`Course: ${user.course}`, 14, yPos);
  yPos += 7;
  doc.text(`Year of Study: ${user.yearOfStudy}`, 14, yPos);
  yPos += 15;

  // Application Details
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Application Details', 14, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Preferred Department: ${application.preferredDepartment}`, 14, yPos);
  yPos += 7;
  doc.text(`Subdepartment: ${application.preferredSubdepartment || 'N/A'}`, 14, yPos);
  yPos += 7;
  doc.text(`Start Date: ${new Date(application.startDate).toLocaleDateString()}`, 14, yPos);
  yPos += 7;
  doc.text(`End Date: ${new Date(application.endDate).toLocaleDateString()}`, 14, yPos);
  yPos += 7;
  
  // Status with color
  const statusText = application.status.replace('_', ' ').toUpperCase();
  doc.setFont(undefined, 'bold');
  
  if (application.status === 'approved') {
    doc.setTextColor(16, 185, 129);
  } else if (application.status === 'rejected') {
    doc.setTextColor(239, 68, 68);
  } else {
    doc.setTextColor(251, 191, 36);
  }
  
  doc.text(`Status: ${statusText}`, 14, yPos);
  doc.setTextColor(40);
  doc.setFont(undefined, 'normal');
  yPos += 7;
  
  doc.text(`Submitted: ${new Date(application.createdAt).toLocaleDateString()}`, 14, yPos);
  yPos += 15;

  // Comments
  if (application.hrComments || application.hodComments) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Review Comments', 14, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');

    if (application.hrComments) {
      doc.setFont(undefined, 'bold');
      doc.text('HR Comments:', 14, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      
      const hrLines = doc.splitTextToSize(application.hrComments, 180);
      doc.text(hrLines, 14, yPos);
      yPos += hrLines.length * 7 + 5;
    }

    if (application.hodComments) {
      doc.setFont(undefined, 'bold');
      doc.text('HOD Comments:', 14, yPos);
      doc.setFont(undefined, 'normal');
      yPos += 7;
      
      const hodLines = doc.splitTextToSize(application.hodComments, 180);
      doc.text(hodLines, 14, yPos);
    }
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    105,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );

  // Save PDF
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`my_application_${timestamp}.pdf`);
};

// Export analytics to PDF
export const exportAnalyticsToPDF = (analytics) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Analytics Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 28, { align: 'center' });

  let yPos = 45;

  // Summary Statistics
  doc.setFontSize(14);
  doc.setTextColor(40);
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
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 40 }
    }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // Top Departments
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
    styles: { fontSize: 10 }
  });

  // Save
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`analytics_report_${timestamp}.pdf`);
};