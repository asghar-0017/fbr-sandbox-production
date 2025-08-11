import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

const sendResetEmail = async (email, code) => {
  const mailOptions = {
    from: `Innovative Network <${process.env.EMAIL}>`,
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Your reset code is: ${code}`,
  };

  return await transporter.sendMail(mailOptions);
};



export default sendResetEmail;
