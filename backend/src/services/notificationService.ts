import mongoose from 'mongoose';
import nodemailer, { Transporter } from 'nodemailer';
import Notification from '../models/Notification.js';
import { pushToUser } from './sseService.js';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'APPOINTMENT' | 'VERIFICATION' | 'SYSTEM';
  email?: string;
  phone?: string;
  details?: {
    serviceName?: string;
    ownerName?: string;
    clientName?: string;
    date?: string;
    time?: string;
    status?: string;
  };
}

// Configure Nodemailer Transporter
let transporter: Transporter | null = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    // Generate test account on Ethereal Email for development/demo
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`✉️ [EMAIL SERVICE] Using Ethereal Test SMTP: ${testAccount.user}`);
    } catch (err) {
      console.warn('⚠️ [EMAIL SERVICE] Failed to create Ethereal test account. Falling back to console logging.');
      transporter = null;
    }
  }

  return transporter;
};

// Generate HTML Email Layout
const generateEmailHTML = (title: string, message: string, details?: NotificationPayload['details']): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
      <div style="background-color: #4f46e5; padding: 16px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">CareSync Notification</h1>
      </div>
      <div style="padding: 20px; color: #333333;">
        <h2 style="color: #4f46e5; font-size: 18px; margin-top: 0;">${title}</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #4b5563;">${message}</p>
        
        ${
          details
            ? `
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; font-size: 14px; color: #374151; text-transform: uppercase;">Appointment Details</h3>
            <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #4b5563;">
              ${details.serviceName ? `<li style="margin-bottom: 6px;"><strong>Service:</strong> ${details.serviceName}</li>` : ''}
              ${details.ownerName ? `<li style="margin-bottom: 6px;"><strong>Provider:</strong> ${details.ownerName}</li>` : ''}
              ${details.clientName ? `<li style="margin-bottom: 6px;"><strong>Client:</strong> ${details.clientName}</li>` : ''}
              ${details.date ? `<li style="margin-bottom: 6px;"><strong>Date:</strong> ${details.date}</li>` : ''}
              ${details.time ? `<li style="margin-bottom: 6px;"><strong>Time:</strong> ${details.time}</li>` : ''}
              ${details.status ? `<li style="margin-bottom: 6px;"><strong>Status:</strong> <span style="font-weight: bold; color: #4f46e5;">${details.status}</span></li>` : ''}
            </ul>
          </div>
        `
            : ''
        }

        <p style="font-size: 13px; color: #9ca3af; margin-top: 30px; text-align: center;">
          Thank you for using CareSync Appointment Booking Platform.
        </p>
      </div>
    </div>
  `;
};

export const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  // 1. Save in-app notification in database if connected and valid userId
  try {
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(payload.userId)) {
      const saved = await Notification.create({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'APPOINTMENT',
        read: false,
      });
      console.log(`🔔 [IN-APP NOTIFICATION] Saved for user: ${payload.userId}`);

      // Push live SSE event to all connected browser tabs for this user
      pushToUser(payload.userId, 'notification', {
        _id: saved._id.toString(),
        title: saved.title,
        message: saved.message,
        type: saved.type,
        read: false,
        createdAt: saved.createdAt,
      });
    } else {
      // Not in DB — still push SSE so live UI works in demo mode
      pushToUser(payload.userId, 'notification', {
        _id: Date.now().toString(),
        title: payload.title,
        message: payload.message,
        type: payload.type || 'APPOINTMENT',
        read: false,
        createdAt: new Date().toISOString(),
      });
      console.log(`🔔 [IN-APP NOTIFICATION LOG] User: ${payload.userId} | ${payload.title} - ${payload.message}`);
    }
  } catch (dbErr) {
    console.error('❌ [IN-APP NOTIFICATION ERROR] Failed to save to database:', dbErr);
  }

  // 2. Dispatch Email Notification
  if (payload.email) {
    try {
      const mailTransporter = await initTransporter();
      const fromAddress = process.env.SMTP_FROM || '"CareSync Platform" <no-reply@caresync.com>';
      const htmlContent = generateEmailHTML(payload.title, payload.message, payload.details);

      if (mailTransporter) {
        const info = await mailTransporter.sendMail({
          from: fromAddress,
          to: payload.email,
          subject: `[CareSync] ${payload.title}`,
          html: htmlContent,
        });

        console.log(`✉️ [EMAIL SENT] To: ${payload.email} | MessageID: ${info.messageId}`);
        if (nodemailer.getTestMessageUrl(info)) {
          console.log(`🔗 [ETHEREAL PREVIEW URL] ${nodemailer.getTestMessageUrl(info)}`);
        }
      } else {
        console.log(`[EMAIL LOG] To: ${payload.email} | Subject: ${payload.title}\nBody: ${payload.message}`);
      }
    } catch (emailErr) {
      console.error(`❌ [EMAIL ERROR] Failed to send email to ${payload.email}:`, emailErr);
    }
  }

  // 3. Dispatch SMS / WhatsApp Notification (Log / Gateway Integration)
  if (payload.phone) {
    try {
      console.log(`📱 [SMS/WHATSAPP] Sent to ${payload.phone}: "${payload.title} - ${payload.message}"`);
    } catch (smsErr) {
      console.error(`❌ [SMS ERROR] Failed to send SMS to ${payload.phone}:`, smsErr);
    }
  }
};


