const nodemailer = require("nodemailer");

// ========================================================
// 📧 EMAIL TRANSPORTER CONFIGURATION - ✅ FIXED
// ========================================================
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("⚠️ Email not configured - emails will not be sent");
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail', // ✅ FIX 1: Use 'service' instead of manual host/port
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // ✅ FIX 2: Add these security options
    tls: {
      rejectUnauthorized: false
    },
    // ✅ FIX 3: Increase timeout
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
  });
};

// Test email configuration on startup
const transporter = createTransporter();
if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error("❌ Email service error:", error.message);
      console.log("💡 Troubleshooting tips:");
      console.log("1. Verify EMAIL_USER and EMAIL_PASSWORD in .env");
      console.log("2. Ensure you're using a Gmail App Password (not regular password)");
      console.log("3. Check if 2-Factor Authentication is enabled on Gmail");
    } else {
      console.log("✅ Email service ready");
      console.log("📧 Emails will be sent from:", process.env.EMAIL_USER);
    }
  });
}

// ========================================================
// 📧 EMAIL TEMPLATES
// ========================================================
const emailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      line-height: 1.6; 
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .password-box {
      background: white;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .password {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      background: #fbbf24;
      color: #92400e;
      border-radius: 20px;
      font-weight: bold;
    }
    .info-box {
      background: white;
      padding: 15px;
      border-left: 4px solid #667eea;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

// ========================================================
// 📧 SEND WELCOME EMAIL (FOR SELF-REGISTERED USERS)
// ========================================================
const sendWelcomeEmail = async (user) => {
  if (!transporter) {
    console.log("⚠️ Email transporter not configured");
    console.log("Email would be sent to:", user.email);
    return;
  }

  const content = `
    <div class="header">
      <h1>🎉 Welcome to IMS!</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>Welcome to the <strong>Intern Management System</strong> for the Office of the Prime Cabinet Secretary and State Department for Parliamentary Affairs.</p>
      <p>Your account has been successfully created as a <strong>${
        user.role === "intern" ? "Intern" : "Attachee"
      }</strong>.</p>
      
      <h3>📋 Next Steps:</h3>
      <ul>
        <li>Complete your profile information</li>
        <li>Submit your application</li>
        <li>Upload required documents</li>
        <li>Track your application status</li>
      </ul>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> Please keep your login credentials safe. You can change your password anytime from your profile settings.
      </div>
      
      <p>If you have any questions, please contact the HR department.</p>
      
      <p>Best regards,<br>
      <strong>IMS Team</strong><br>
      Office of the Prime Cabinet Secretary</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Welcome to Intern Management System",
      html: emailTemplate(content),
    });
    console.log("✅ Welcome email sent to:", user.email);
  } catch (error) {
    console.error("❌ Failed to send welcome email:", error.message);
    throw error; // ✅ Throw error so calling code knows it failed
  }
};

// ========================================================
// 📧 SEND ACCOUNT CREATED EMAIL (ADMIN CREATES USER)
// ========================================================
const sendAccountCreatedEmail = async (user, temporaryPassword, createdBy) => {
  if (!transporter) {
    console.log("⚠️ Email transporter not configured");
    console.log("Email would be sent to:", user.email);
    console.log("Temporary password:", temporaryPassword);
    return;
  }

  const roleNames = {
    hr: "HR Officer",
    hod: "Head of Department",
    chief_of_staff: "Chief of Staff",
    principal_secretary: "Principal Secretary",
    intern: "Intern",
    attachee: "Attachee",
  };

  const content = `
    <div class="header">
      <h1>🔐 Your Account Has Been Created</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>An account has been created for you in the <strong>Intern Management System</strong>.</p>
      
      <p><strong>Your Role:</strong> ${roleNames[user.role] || user.role}</p>
      ${
        user.department
          ? `<p><strong>Department:</strong> ${user.department}</p>`
          : ""
      }
      ${
        user.subdepartment && user.subdepartment !== "NONE"
          ? `<p><strong>Subdepartment:</strong> ${user.subdepartment}</p>`
          : ""
      }
      
      <h3>🔑 Login Credentials</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      
      <div class="password-box">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Your Temporary Password:</p>
        <div class="password">${temporaryPassword}</div>
      </div>
      
      <div class="warning">
        <strong>🔒 Security Notice:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li>This is a temporary password</li>
          <li>Please change it immediately after your first login</li>
          <li>Do not share this password with anyone</li>
          <li>Keep this email secure or delete it after changing your password</li>
        </ul>
      </div>
      
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login/${
    user.role
  }" class="button">
        Login to Your Account
      </a>
      
      <h3>📋 What's Next?</h3>
      <ol>
        <li>Click the login button above</li>
        <li>Enter your email and temporary password</li>
        <li>Change your password in profile settings</li>
        <li>Complete your profile (if needed)</li>
      </ol>
      
      <p>If you have any questions or did not expect this email, please contact the system administrator.</p>
      
      <p>Best regards,<br>
      <strong>IMS Admin Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>If you have any issues, please contact your administrator.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Your IMS Account - Login Credentials",
      html: emailTemplate(content),
    });
    console.log("✅ Account created email sent to:", user.email);
  } catch (error) {
    console.error("❌ Failed to send account created email:", error.message);
    throw error;
  }
};

// ========================================================
// 📧 SEND PASSWORD RESET EMAIL
// ========================================================
const sendPasswordResetEmail = async (user, temporaryPassword) => {
  if (!transporter) {
    console.log("⚠️ Email transporter not configured");
    console.log("Email would be sent to:", user.email);
    console.log("Temporary password:", temporaryPassword);
    return;
  }

  const content = `
    <div class="header">
      <h1>🔄 Password Reset Request</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>We received a request to reset your password for the <strong>Intern Management System</strong>.</p>
      
      <h3>🔑 Your New Temporary Password</h3>
      <div class="password-box">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Temporary Password:</p>
        <div class="password">${temporaryPassword}</div>
      </div>
      
      <div class="warning">
        <strong>🔒 Important Security Steps:</strong>
        <ol style="margin: 10px 0 0 0;">
          <li><strong>Login immediately</strong> with this temporary password</li>
          <li><strong>Change your password</strong> in your profile settings</li>
          <li><strong>Choose a strong password</strong> (minimum 6 characters)</li>
          <li><strong>Do not share</strong> your password with anyone</li>
        </ol>
      </div>
      
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login/${
    user.role
  }" class="button">
        Login Now
      </a>
      
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>⚠️ Didn't request this?</strong><br>
        If you did not request a password reset, please contact your administrator immediately. Your account may be compromised.
      </div>
      
      <p>This temporary password will remain valid until you change it.</p>
      
      <p>Best regards,<br>
      <strong>IMS Security Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>For security issues, contact your system administrator immediately.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset - IMS Account",
      html: emailTemplate(content),
    });
    console.log("✅ Password reset email sent to:", user.email);
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    throw error;
  }
};

// ========================================================
// 📧 SEND APPLICATION SUBMITTED EMAIL
// ========================================================
const sendApplicationSubmittedEmail = async (user, application) => {
  if (!transporter) return;

  const content = `
    <div class="header">
      <h1>✅ Application Submitted Successfully</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>Your application has been successfully submitted to the <strong>Intern Management System</strong>.</p>
      
      <h3>📋 Application Details</h3>
      <ul>
        <li><strong>Department:</strong> ${application.preferredDepartment}</li>
        <li><strong>Subdepartment:</strong> ${
          application.preferredSubdepartment || "N/A"
        }</li>
        <li><strong>Start Date:</strong> ${new Date(
          application.startDate
        ).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(
          application.endDate
        ).toLocaleDateString()}</li>
        <li><strong>Status:</strong> Pending Review</li>
      </ul>
      
      <p>Your application is now being reviewed by the HR department. You will receive notifications as your application progresses through the review process.</p>
      
      <a href="${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard" class="button">
        View Application Status
      </a>
      
      <p>Thank you for your interest in joining our team!</p>
      
      <p>Best regards,<br>
      <strong>HR Department</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Application Submitted - IMS",
      html: emailTemplate(content),
    });
    console.log("✅ Application submitted email sent to:", user.email);
  } catch (error) {
    console.error(
      "❌ Failed to send application submitted email:",
      error.message
    );
  }
};

// ========================================================
// 📧 SEND HR REVIEW EMAIL
// ========================================================
const sendHRReviewEmail = async (user, application, hrComments) => {
  if (!transporter) return;

  const content = `
    <div class="header">
      <h1>📝 Application Under Review</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>Your application has been reviewed by the HR department and has been forwarded to the Head of Department for final approval.</p>
      
      <h3>📋 Application Status Update</h3>
      <ul>
        <li><strong>Status:</strong> HOD Review</li>
        <li><strong>Reviewed By:</strong> HR Department</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      
      ${
        hrComments
          ? `
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>HR Comments:</strong><br>
          <p style="margin: 10px 0 0 0;">${hrComments}</p>
        </div>
      `
          : ""
      }
      
      <p>Your application is now with the Head of Department for final review. You will be notified once a decision has been made.</p>
      
      <a href="${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard" class="button">
        Track Application
      </a>
      
      <p>Best regards,<br>
      <strong>HR Department</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: "Application Update - Under HOD Review",
      html: emailTemplate(content),
    });
    console.log("✅ HR review email sent to:", user.email);
  } catch (error) {
    console.error("❌ Failed to send HR review email:", error.message);
  }
};

// ========================================================
// 📧 SEND FINAL DECISION EMAIL
// ========================================================
const sendFinalDecisionEmail = async (
  user,
  application,
  approved,
  hodComments
) => {
  if (!transporter) return;

  const content = `
    <div class="header">
      <h1>${
        approved ? "🎉 Application Approved!" : "📋 Application Decision"
      }</h1>
    </div>
    <div class="content">
      <h2>Hello ${user.fullName}!</h2>
      <p>A decision has been made regarding your ${user.role} application.</p>
      
      <div style="background: ${
        approved ? "#dcfce7" : "#fee2e2"
      }; border-left: 4px solid ${
    approved ? "#16a34a" : "#dc2626"
  }; padding: 20px; margin: 20px 0; border-radius: 4px; text-align: center;">
        <h2 style="margin: 0; color: ${approved ? "#16a34a" : "#dc2626"};">
          ${approved ? "✅ APPROVED" : "❌ NOT APPROVED"}
        </h2>
      </div>
      
      <h3>📋 Application Details</h3>
      <ul>
        <li><strong>Department:</strong> ${application.preferredDepartment}</li>
        <li><strong>Subdepartment:</strong> ${
          application.preferredSubdepartment || "N/A"
        }</li>
        <li><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      
      ${
        hodComments
          ? `
        <div style="background: #f3f4f6; border-left: 4px solid #6b7280; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <strong>Comments from Head of Department:</strong><br>
          <p style="margin: 10px 0 0 0;">${hodComments}</p>
        </div>
      `
          : ""
      }
      
      ${
        approved
          ? `
        <h3>🎊 Congratulations!</h3>
        <p>Your application has been approved. The HR department will contact you shortly with further instructions regarding:</p>
        <ul>
          <li>Start date confirmation</li>
          <li>Required documentation</li>
          <li>Orientation schedule</li>
          <li>Department contact information</li>
        </ul>
      `
          : `
        <h3>📋 Next Steps</h3>
        <p>We appreciate your interest in joining our team. While your application was not approved at this time, we encourage you to:</p>
        <ul>
          <li>Review the feedback provided</li>
          <li>Apply again in the future</li>
          <li>Contact HR if you have questions</li>
        </ul>
      `
      }
      
      <a href="${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/dashboard" class="button">
        View Application
      </a>
      
      <p>${
        approved
          ? "We look forward to working with you!"
          : "Thank you for your interest and best of luck in your future endeavors."
      }</p>
      
      <p>Best regards,<br>
      <strong>${
        approved ? "HR Department & Management Team" : "HR Department"
      }</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      ${
        approved
          ? "<p>For urgent matters, please contact the HR department.</p>"
          : ""
      }
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: `Application ${approved ? "Approved" : "Decision"} - IMS`,
      html: emailTemplate(content),
    });
    console.log(
      `✅ Final decision email sent to: ${user.email} (${
        approved ? "Approved" : "Not Approved"
      })`
    );
  } catch (error) {
    console.error("❌ Failed to send final decision email:", error.message);
  }
};

// ========================================================
// 📧 EXPORTS
// ========================================================
module.exports = {
  sendWelcomeEmail,
  sendAccountCreatedEmail,
  sendPasswordResetEmail,
  sendApplicationSubmittedEmail,
  sendHRReviewEmail,
  sendFinalDecisionEmail,
};