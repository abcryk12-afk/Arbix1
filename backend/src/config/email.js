const nodemailer = require('nodemailer');

// Email configuration using Gmail SMTP
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 465,
  secure: process.env.EMAIL_SECURE === 'true', // Use SSL
  auth: {
    user: process.env.EMAIL_USER || 'wanum01234@gmail.com',
    pass: process.env.EMAIL_PASS || 'sxat uuht hngw vfwc' // App password
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email service connection failed:', error);
  } else {
    console.log('Email service is ready to send messages');
  }
});

/**
 * Send email using Nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: 'Arbix Platform <wanum01234@gmail.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send OTP verification email
 * @param {string} to - Recipient email
 * @param {string} otp - One-time password
 * @param {string} userName - User name (optional)
 */
const sendOTPEmail = async (to, otp, userName = 'User') => {
  const subject = 'Arbix - Email Verification OTP';
  const text = `Hello ${userName},

Your verification code for Arbix is: ${otp}

This code will expire in 10 minutes. Please do not share this code with anyone.

If you didn't request this code, please ignore this email.

Best regards,
Arbix Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Arbix</h1>
        <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">Automated Arbitrage Platform</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 20px;">Email Verification</h2>
        <p style="color: #475569; margin: 0 0 20px;">Hello ${userName},</p>
        
        <p style="color: #475569; margin: 0 0 20px;">Your verification code for Arbix is:</p>
        
        <div style="background-color: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #1e293b; letter-spacing: 5px;">${otp}</span>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">This code will expire in 10 minutes. Please do not share this code with anyone.</p>
        
        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">If you didn't request this code, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">Best regards,<br>Arbix Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, text, html });
};

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetLink - Password reset link
 * @param {string} userName - User name (optional)
 */
const sendPasswordResetEmail = async (to, resetLink, userName = 'User') => {
  const subject = 'Arbix - Password Reset Request';
  const text = `Hello ${userName},

You requested to reset your password for your Arbix account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.

Best regards,
Arbix Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Arbix</h1>
        <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">Automated Arbitrage Platform</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 20px;">Password Reset</h2>
        <p style="color: #475569; margin: 0 0 20px;">Hello ${userName},</p>
        
        <p style="color: #475569; margin: 0 0 20px;">You requested to reset your password for your Arbix account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #3b82f6; word-break: break-all; font-size: 12px;">${resetLink}</p>
        
        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">Best regards,<br>Arbix Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, text, html });
};

/**
 * Send welcome email after successful registration
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} referralCode - User's referral code
 */
const sendWelcomeEmail = async (to, userName, referralCode) => {
  const subject = 'Welcome to Arbix - Your Account is Ready!';
  const text = `Hello ${userName},

Welcome to Arbix! Your account has been successfully created.

Your referral code: ${referralCode}
Your referral link: https://arbix.com/join?ref=${referralCode}

Start your investment journey with us and earn through automated arbitrage trading and our referral program.

If you have any questions, feel free to contact our support team.

Best regards,
Arbix Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Arbix!</h1>
        <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">Your Account is Ready</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 20px;">Hello ${userName},</h2>
        
        <p style="color: #475569; margin: 0 0 20px;">Welcome to Arbix! Your account has been successfully created and you're ready to start your investment journey.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 10px;">Your Referral Information</h3>
          <p style="color: #475569; margin: 5px 0;"><strong>Referral Code:</strong> <span style="color: #3b82f6;">${referralCode}</span></p>
          <p style="color: #475569; margin: 5px 0;"><strong>Referral Link:</strong></p>
          <p style="color: #3b82f6; word-break: break-all; font-size: 12px;">https://arbix.com/join?ref=${referralCode}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://arbix.com/dashboard" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin: 20px 0;">If you have any questions, feel free to contact our support team.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">Best regards,<br>Arbix Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, text, html });
};

/**
 * Send withdrawal notification email
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {number} amount - Withdrawal amount
 * @param {string} status - Withdrawal status (approved/rejected)
 * @param {string} reason - Reason for rejection (optional)
 */
const sendWithdrawalNotification = async (to, userName, amount, status, reason = '') => {
  const subject = `Arbix - Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  const isApproved = status === 'approved';
  
  const text = `Hello ${userName},

Your withdrawal request of $${amount.toFixed(2)} has been ${status}.

${isApproved ? 'The funds have been processed and should appear in your wallet soon.' : `Reason: ${reason}`}

If you have any questions, please contact our support team.

Best regards,
Arbix Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: #1e293b; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Arbix</h1>
        <p style="color: #94a3b8; margin: 5px 0 0; font-size: 14px;">Withdrawal Update</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #1e293b; margin: 0 0 20px;">Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
        <p style="color: #475569; margin: 0 0 20px;">Hello ${userName},</p>
        
        <div style="background-color: ${isApproved ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isApproved ? '#d1fae5' : '#fecaca'}; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #475569; margin: 0 0 10px;">Your withdrawal request of:</p>
          <p style="color: ${isApproved ? '#059669' : '#dc2626'}; font-size: 24px; font-weight: bold; margin: 0;">$${amount.toFixed(2)}</p>
          <p style="color: ${isApproved ? '#059669' : '#dc2626'}; font-weight: bold; margin: 10px 0 0;">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        </div>
        
        ${!isApproved && reason ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #dc2626; margin: 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        ` : ''}
        
        <p style="color: #475569; margin: 20px 0;">${isApproved ? 'The funds have been processed and should appear in your wallet soon.' : 'If you believe this is an error, please contact our support team.'}</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0;">Best regards,<br>Arbix Team</p>
        </div>
      </div>
    </div>
  `;

  return await sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendWithdrawalNotification
};
