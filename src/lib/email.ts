import nodemailer from 'nodemailer';

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (data: EmailPayload) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@example.com',
    ...data,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw new Error('Could not send email.');
  }
};
