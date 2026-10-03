import { Request, Response } from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { addSseClient, removeSseClient } from '../services/sseService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'care_sync_super_secret_jwt_key_2026';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (mongoose.connection.readyState === 1 && userId && mongoose.Types.ObjectId.isValid(userId)) {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      const unreadCount = await Notification.countDocuments({ userId, read: false });

      res.json({ notifications, unreadCount });
      return;
    }

    res.json({ notifications: [], unreadCount: 0 });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const id = String(req.params.id);

    if (mongoose.connection.readyState !== 1 || !userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      res.json({ message: 'Marked as read (mock mode)' });
      return;
    }

    if (id === 'all') {
      await Notification.updateMany({ userId, read: false }, { read: true });
      res.json({ message: 'All notifications marked as read' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid notification ID' });
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

/**
 * SSE endpoint — GET /notifications/stream?token=<jwt>
 *
 * EventSource cannot send custom headers, so the JWT token is passed as a
 * query parameter and verified here before opening the stream.
 */
export const streamNotifications = async (req: Request, res: Response): Promise<void> => {
  const tokenParam = req.query.token as string | undefined;

  if (!tokenParam) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  let userId: string;
  try {
    const decoded = jwt.verify(tokenParam, JWT_SECRET) as { userId: string };
    // Verify user still exists in DB (skip if DB disconnected — demo mode)
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('_id');
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }
    }
    userId = decoded.userId;
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }

  // ── Set SSE response headers ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable Nginx buffering
  res.flushHeaders();

  // ── Send initial "connected" event ────────────────────────────────────────
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, ts: Date.now() })}\n\n`);

  // ── Register this client ──────────────────────────────────────────────────
  addSseClient(userId, res);

  // ── Heartbeat every 25 seconds to prevent proxy timeout ──────────────────
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  // ── Clean up when client disconnects ─────────────────────────────────────
  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(userId, res);
  });
};
