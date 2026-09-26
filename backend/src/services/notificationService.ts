import Notification from '../models/Notification.js';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type?: 'APPOINTMENT' | 'VERIFICATION' | 'SYSTEM';
  email?: string;
  phone?: string;
}

export const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
    // 1. Save in-app notification
    await Notification.create({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'APPOINTMENT',
      read: false,
    });

    // 2. Log / dispatch Email Notification
    if (payload.email) {
      console.log(`[EMAIL SERVICE] Sending Email to ${payload.email}:`);
      console.log(`Subject: ${payload.title}\nBody: ${payload.message}\n---`);
    }

    // 3. Log / dispatch WhatsApp Notification
    if (payload.phone) {
      console.log(`[WHATSAPP BIZ API] Sending WhatsApp message to ${payload.phone}:`);
      console.log(`Message: ${payload.title} - ${payload.message}\n---`);
    }
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};
