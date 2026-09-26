import { Request, Response } from 'express';
import VerificationRequest from '../models/VerificationRequest.js';
import Owner from '../models/Owner.js';
import { verifyIdentityWithKYCProvider } from '../services/kycService.js';

export const submitVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    const { identityType, licenseNumber, documentType, additionalNotes } = req.body;
    let businessDocUrl = '';

    if (req.file) {
      businessDocUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.businessDocUrl) {
      businessDocUrl = req.body.businessDocUrl;
    }

    if (!identityType) {
      res.status(400).json({ message: 'Identity type selection is required' });
      return;
    }

    // 1. Run KYC provider verification interface
    const kycResult = await verifyIdentityWithKYCProvider(owner.fullName);

    // 2. Save / update Owner KYC details
    owner.kycStatus = kycResult.kycStatus;
    owner.kycProvider = kycResult.kycProvider;
    owner.kycReferenceId = kycResult.kycReferenceId;
    owner.verificationStatus = 'PENDING';
    owner.verificationReason = 'Verification request submitted. Under admin review.';
    await owner.save();

    // 3. Create VerificationRequest document for Admin review
    const verificationReq = await VerificationRequest.create({
      ownerId: owner._id,
      identityType,
      kycReferenceId: kycResult.kycReferenceId,
      businessDocUrl: businessDocUrl || '',
      licenseNumber: licenseNumber || '',
      documentType: documentType || 'Business License / Registration',
      additionalNotes: additionalNotes || '',
      status: 'PENDING',
    });

    res.status(201).json({
      message: 'Verification documents and identity details submitted successfully for review',
      verificationStatus: owner.verificationStatus,
      kycReferenceId: kycResult.kycReferenceId,
      verificationReq,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to submit verification request' });
  }
};

export const getVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const owner = req.owner;
    if (!owner) {
      res.status(404).json({ message: 'Owner profile not found' });
      return;
    }

    const verificationRequests = await VerificationRequest.find({ ownerId: owner._id })
      .sort({ createdAt: -1 });

    res.json({
      verificationStatus: owner.verificationStatus,
      verificationReason: owner.inactiveReason || owner.verificationReason,
      kycStatus: owner.kycStatus,
      kycProvider: owner.kycProvider,
      kycReferenceId: owner.kycReferenceId,
      verifiedAt: owner.verifiedAt,
      requests: verificationRequests,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch verification status' });
  }
};
