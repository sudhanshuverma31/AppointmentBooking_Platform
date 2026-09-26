import { Request, Response } from 'express';
import Report from '../models/Report.js';

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const reporterUserId = req.user!._id;
    const { ownerId, reason, description } = req.body;

    if (!ownerId || !reason || !description) {
      res.status(400).json({ message: 'Owner ID, reason, and description are required' });
      return;
    }

    const report = await Report.create({
      reporterUserId,
      ownerId,
      reason,
      description,
      status: 'PENDING',
    });

    res.status(201).json({
      message: 'Report submitted successfully. Platform administrators will investigate.',
      report,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to submit report' });
  }
};
