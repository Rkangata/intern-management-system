const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.log('Email service error:', error);
  } else {
    console.log('Email service ready');
  }
});

// Send welcome email on registration
const sendWelcomeEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Welcome to Intern Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to IMS!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName}!</h2>
            <p>Thank you for registering as a <strong>${user.role}</strong> in our Intern Management System.</p>
            <p>Your account has been successfully created. You can now:</p>
            <ul>
              <li>Submit internship/attachment applications</li>
              <li>Upload required documents</li>
              <li>Track your application status</li>
              <li>Update your profile information</li>
            </ul>
            <p>Get started by logging into your account:</p>
            <a href="http://localhost:5173/login/${user.role}" class="button">Login to Dashboard</a>
            <p><strong>Account Details:</strong></p>
            <ul>
              <li>Email: ${user.email}</li>
              <li>Institution: ${user.institution}</li>
              <li>Course: ${user.course}</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 Intern Management System. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

// Send application submission confirmation
const sendApplicationSubmittedEmail = async (user, application) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Application Submitted Successfully',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #fbbf24; color: #92400e; border-radius: 20px; font-weight: bold; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Application Received!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Your application has been successfully submitted and is now under review.</p>
            <div class="info-box">
              <p><strong>Application Details:</strong></p>
              <ul>
                <li><strong>Department:</strong> ${application.preferredDepartment}</li>
                <li><strong>Start Date:</strong> ${new Date(application.startDate).toLocaleDateString()}</li>
                <li><strong>End Date:</strong> ${new Date(application.endDate).toLocaleDateString()}</li>
                <li><strong>Status:</strong> <span class="status-badge">Pending Review</span></li>
                <li><strong>Submitted:</strong> ${new Date(application.createdAt).toLocaleString()}</li>
              </ul>
            </div>
            <p><strong>What happens next?</strong></p>
            <ol>
              <li>HR Officer will review your application</li>
              <li>If approved by HR, it will be forwarded to the Head of Department</li>
              <li>HOD will make the final decision</li>
              <li>You'll receive email notifications at each step</li>
            </ol>
            <p>You can track your application status anytime:</p>
            <a href="http://localhost:5173/dashboard" class="button">View Dashboard</a>
            <p><em>Please allow 3-5 business days for initial review.</em></p>
          </div>
          <div class="footer">
            <p>© 2025 Intern Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Application submitted email sent to:', user.email);
  } catch (error) {
    console.error('Error sending application email:', error);
  }
};

// Send HR review notification
const sendHRReviewEmail = async (user, application, hrComments) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Application Forwarded to HOD',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: #8b5cf6; color: white; border-radius: 20px; font-weight: bold; }
          .comment-box { background: #ede9fe; padding: 15px; border-left: 4px solid #8b5cf6; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Good news! Your application has been reviewed by HR and forwarded to the Head of Department for final approval.</p>
            <p><strong>Current Status:</strong> <span class="status-badge">HOD Review</span></p>
            <div class="comment-box">
              <p><strong>HR Comments:</strong></p>
              <p>${hrComments || 'No additional comments.'}</p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Head of Department will review your application</li>
              <li>Final decision will be communicated via email</li>
              <li>This usually takes 2-3 business days</li>
            </ul>
            <a href="http://localhost:5173/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2025 Intern Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('HR review email sent to:', user.email);
  } catch (error) {
    console.error('Error sending HR review email:', error);
  }
};

// Send final decision email (approved/rejected)
const sendFinalDecisionEmail = async (user, application, approved, hodComments) => {
  const status = approved ? 'approved' : 'rejected';
  const statusColor = approved ? '#10b981' : '#ef4444';
  const statusBg = approved ? '#d1fae5' : '#fee2e2';
  const emoji = approved ? '🎉' : '😔';

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Application ${approved ? 'Approved' : 'Rejected'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-badge { display: inline-block; padding: 8px 16px; background: ${statusBg}; color: ${statusColor}; border-radius: 20px; font-weight: bold; }
          .comment-box { background: ${statusBg}; padding: 15px; border-left: 4px solid ${statusColor}; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: ${statusColor}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} Application ${approved ? 'Approved' : 'Rejected'}</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            ${approved ? `
              <p>Congratulations! Your application for ${application.preferredDepartment} has been <strong>approved</strong>!</p>
              <p><strong>Status:</strong> <span class="status-badge">✅ Approved</span></p>
              <div class="comment-box">
                <p><strong>HOD Feedback:</strong></p>
                <p>${hodComments || 'Approved without additional comments.'}</p>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You will be contacted by HR for onboarding details</li>
                <li>Please prepare required documents for your first day</li>
                <li>Start Date: ${new Date(application.startDate).toLocaleDateString()}</li>
              </ul>
              <p>We look forward to having you join our team!</p>
            ` : `
              <p>Thank you for your interest. Unfortunately, your application for ${application.preferredDepartment} has not been approved at this time.</p>
              <p><strong>Status:</strong> <span class="status-badge">❌ Not Approved</span></p>
              <div class="comment-box">
                <p><strong>HOD Feedback:</strong></p>
                <p>${hodComments || 'Application did not meet requirements at this time.'}</p>
              </div>
              <p><strong>What you can do:</strong></p>
              <ul>
                <li>Review the feedback provided</li>
                <li>You may reapply after addressing the concerns</li>
                <li>Consider applying to different departments</li>
                <li>Continue building your skills and experience</li>
              </ul>
              <p>We encourage you to apply again in the future. Best of luck!</p>
            `}
            <a href="http://localhost:5173/dashboard" class="button">View Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2025 Intern Management System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Final decision email (${status}) sent to:`, user.email);
  } catch (error) {
    console.error('Error sending decision email:', error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendApplicationSubmittedEmail,
  sendHRReviewEmail,
  sendFinalDecisionEmail,
};