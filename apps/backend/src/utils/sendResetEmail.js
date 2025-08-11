import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Creates a nodemailer transporter for sending emails
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends a password reset email with the provided code
 * @param {string} email - Recipient email address
 * @param {string} code - 6-digit reset code
 * @returns {Promise} Email sending result
 */
const sendResetEmail = async (email, code) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `FBR Integration System <${process.env.EMAIL}>`,
      to: email,
      subject: 'Password Reset Request - FBR Integration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">FBR Integration System</h2>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h3 style="color: #333;">Password Reset Request</h3>
            <p style="color: #666; line-height: 1.6;">
              You have requested to reset your password. Please use the following code to complete the reset process:
            </p>
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h2 style="color: #667eea; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h2>
            </div>
            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated message from the FBR Integration System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `Password Reset Code: ${code}\n\nThis code will expire in 10 minutes. If you didn't request this reset, please ignore this email.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', email);
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default sendResetEmail; 