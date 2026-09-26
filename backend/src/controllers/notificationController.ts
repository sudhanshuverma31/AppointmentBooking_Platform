import { Request, Response } from 'express';
import Notification from '../models/Notification.js';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { id } = req.params;

    if (id === 'all') {
      await Notification.updateMany({ userId, read: false }, { read: true });
      res.json({ message: 'All notifications marked as read' });
      return;
    }

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};
