import { Request, Response } from 'express';
import { Lead } from '../models';
import { AuthRequest } from '../types';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// GET /api/leads
export const getLeads = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      status, source, location, scoreMin, scoreMax,
      tags, sortBy = 'createdAt', sortOrder = 'desc',
      page = 1, limit = 20, search,
    } = req.query as Record<string, any>;

    const filter: Record<string, any> = {};

    // Agents see only their leads; admins see all
    if (req.user!.role !== 'admin') {
      filter.assignedAgent = req.user!._id;
    }

    if (status) filter.status = { $in: status.split(',') };
    if (source) filter.source = { $in: source.split(',') };
    if (location) {
      filter.preferredLocations = { $regex: new RegExp(location, 'i') };
    }
    if (scoreMin || scoreMax) {
      filter.score = {};
      if (scoreMin) filter.score.$gte = Number(scoreMin);
      if (scoreMax) filter.score.$lte = Number(scoreMax);
    }
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) {
      filter.$or = [
        { firstName: { $regex: new RegExp(search, 'i') } },
        { lastName: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } },
      ];
    }

    const sortObj: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedAgent', 'firstName lastName email')
        .populate('interestedIn', 'title address.city price')
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Lead.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: leads,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

// GET /api/leads/search-by-location
export const searchLeadsByLocation = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { location, radius } = req.query;

    if (!location) {
      throw new AppError('Location parameter is required', 400);
    }

    const leads = await Lead.find({
      preferredLocations: { $regex: new RegExp(location as string, 'i') },
      ...(req.user!.role !== 'admin' && { assignedAgent: req.user!._id }),
    })
      .populate('assignedAgent', 'firstName lastName')
      .sort({ score: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: leads,
      meta: { location, totalResults: leads.length },
    });
  }
);

// GET /api/leads/:id
export const getLead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedAgent', 'firstName lastName email phone')
      .populate('interestedIn')
      .populate('notes.author', 'firstName lastName');

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    res.status(200).json({ success: true, data: lead });
  }
);

// POST /api/leads
export const createLead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.body.assignedAgent) {
      req.body.assignedAgent = req.user!._id;
    }

    const lead = await Lead.create(req.body);

    // Auto-calculate score
    lead.recalculateScore();
    await lead.save();

    res.status(201).json({ success: true, data: lead });
  }
);

// PUT /api/leads/:id
export const updateLead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    // Log activity
    lead.activities.push({
      type: 'updated',
      description: `Lead status updated to ${lead.status}`,
      date: new Date(),
    });
    await lead.save();

    res.status(200).json({ success: true, data: lead });
  }
);

// POST /api/leads/:id/notes
export const addNote = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }

    lead.notes.push({
      content: req.body.content,
      author: req.user!._id,
      createdAt: new Date(),
    });

    lead.lastContactDate = new Date();
    await lead.save();

    res.status(201).json({ success: true, data: lead });
  }
);

// DELETE /api/leads/:id
export const deleteLead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      throw new AppError('Lead not found', 404);
    }
    await lead.deleteOne();
    res.status(200).json({ success: true, data: null });
  }
);

// GET /api/leads/stats/overview
export const getLeadStats = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const agentFilter =
      req.user!.role !== 'admin' ? { assignedAgent: req.user!._id } : {};

    const [byStatus, bySource, byLocation, totalThisWeek] = await Promise.all([
      Lead.aggregate([
        { $match: agentFilter },
        { $group: { _id: '$status', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        { $match: agentFilter },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Lead.aggregate([
        { $match: agentFilter },
        { $unwind: '$preferredLocations' },
        { $group: { _id: '$preferredLocations', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Lead.countDocuments({
        ...agentFilter,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: { byStatus, bySource, byLocation, totalThisWeek },
    });
  }
);
