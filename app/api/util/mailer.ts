import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.USER_EMAIL!,
    pass: process.env.USER_PASSWORD!,
  },
  tls: {
    rejectUnauthorized: false,
  },
});